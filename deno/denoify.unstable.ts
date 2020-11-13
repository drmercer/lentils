import { walk } from "https://deno.land/std@0.77.0/fs/mod.ts";
import { dirname, relative } from "https://deno.land/std@0.77.0/path/mod.ts";
import { userGrantsFsPermission } from "./permission.unstable.ts";

if (import.meta.main) {
  const configPath = "./denoify.config.json";
  const configDir = dirname(configPath);

  if (!userGrantsFsPermission("read", configDir)) {
    console.error(`Error: permission is needed to read the denoify map file '${configPath}'`)
  }

  const settings = JSON.parse(await Deno.readTextFile(configPath));
  const map = settings.map;

  // To make sure we resolve the map's relative paths correctly
  Deno.chdir(configDir);

  for (const fromDir of Object.keys(map)) {
    await transformDir(fromDir, map[fromDir]);
  }
}

export async function transformDir(fromDir: string, toDir: string) {

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
  Deno.chdir(fromDir);

  for await (const entry of walk(fromDir)) {
    if (entry.isFile && shouldTransform(entry.path)) {
      const fromPath = entry.path;
      const toPath = toDir + relative(fromDir, fromPath);
      const toSubdir = dirname(toPath);

      await Deno.mkdir(toSubdir, {recursive: true});
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

async function transformFile(fromPath: string, toPath: string) {
  console.log(`Transforming ${fromPath} to ${toPath}`);
  const original = await Deno.readTextFile(fromPath);
  const transformed = original.replace(/^(import [\s\S]*?)(['"];)$/gm, '$1.ts$2');
  await Deno.writeTextFile(toPath, transformed);
  // TODO(someday) source maps?
}

// TODO watch mode?

console.log("Done");
