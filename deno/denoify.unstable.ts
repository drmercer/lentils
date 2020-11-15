import { walk } from "https://deno.land/std@0.77.0/fs/walk.ts";
import { dirname, relative } from "https://deno.land/std@0.77.0/path/mod.ts";
import { userGrantsFsPermission } from "./permission.unstable.ts";

export interface Config {
  map: {
    [fromDir: string]: string;
  };
  headerTextPath?: string;
  headerText?: string;
}

if (import.meta.main) {
  const configPath = "./denoify.config.json";
  const configDir = dirname(configPath);

  if (!userGrantsFsPermission("read", configDir)) {
    console.error(`Error: permission is needed to read the denoify map file '${configPath}'`)
  }

  const config: Config = JSON.parse(await Deno.readTextFile(configPath));

  // To make sure we resolve the config's relative paths correctly
  Deno.chdir(configDir);

  //Load config
  const map = config.map;
  const headerText: string = await loadHeaderText(config);

  // Go!
  for (const fromDir of Object.keys(map)) {
    await transformDir(
      fromDir,
      map[fromDir],
      async (fromPath: string, toPath: string) => {
        const original = await Deno.readTextFile(fromPath);
        const transformed = headerText + original.replace(/^(import [\s\S]*?(?:[^\.]..|[^tj].|[^s]))(['"];)$/gm, '$1.ts$2');
        await Deno.writeTextFile(toPath, transformed);
        // TODO(someday) source maps?
      },
    );
  }
}

async function loadHeaderText(config: Config): Promise<string> {
  let rawText;
  if (config.headerTextPath) {
    rawText = await Deno.readTextFile(config.headerTextPath)
  } else if (config.headerText) {
    rawText = config.headerText;
  } else {
    // No header
    return '';
  }
  return rawText.trim() + '\n\n';
}

/**
 * Recursively traverses the fromDir, transforming all TS files (other than .d.ts and .spec.ts files)
 * to use Deno-like import extensions, and outputs the result to toDir.
 *
 * **USES UNSTABLE DENO APIS**
 *
 * @param fromDir
 * @param toDir
 */
export async function transformDir(fromDir: string, toDir: string, transformFile: (fromPath: string, toPath: string) => Promise<void>) {

  if (!userGrantsFsPermission("read", fromDir)) {
    console.error(`Error: permission is needed to read the fromDir '${fromDir}'`);
    Deno.exit(1);
  }
  if (!userGrantsFsPermission("write", toDir)) {
    console.error(`Error: permission is needed to write the toDir '${toDir}'`);
    Deno.exit(1);
  }

  await Deno.mkdir(toDir, {recursive: true});
  await Deno.remove(toDir, {recursive: true});
  await Deno.mkdir(toDir, {recursive: true});

  for await (const entry of walk(fromDir)) {
    if (entry.isFile && shouldTransform(entry.path)) {
      const fromPath = entry.path;
      const toPath = toDir + relative(fromDir, fromPath);
      const toSubdir = dirname(toPath);

      await Deno.mkdir(toSubdir, {recursive: true});
      console.log(`Transforming ${fromPath} to ${toPath}`);
      await transformFile(fromPath, toPath);
    }
  }
}

function shouldTransform(path: string) {
  // TODO read these from denoify.config.json
  return path.endsWith('.ts') &&
    !path.endsWith('.d.ts') &&
    !path.endsWith('.spec.ts');
}

// TODO watch mode?

console.log("Done");
