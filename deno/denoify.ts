import { walk } from "https://deno.land/std@0.77.0/fs/mod.ts";
import { dirname, relative } from "https://deno.land/std@0.77.0/path/mod.ts";

async function hasPermission(name: "read"|"write", path: string): Promise<boolean> {
  return (await Deno.permissions.request({name, path})).state === "granted";
}

const mapPath = "./denoify-map.json";

if (!hasPermission("read", dirname(mapPath))) {
  console.error(`Error: permission is needed to read the denoify map file '${mapPath}'`)
}

const map = JSON.parse(await Deno.readTextFile(mapPath));
Deno.chdir(dirname(mapPath));

// TODO actually support multiple mappings
const fromDir = Object.keys(map)[0];
const toDir = map[fromDir];

if (!hasPermission("read", fromDir)) {
  console.error(`Error: permission is needed to read the fromDir '${fromDir}'`);
  Deno.exit(1);
}
if (!hasPermission("write", toDir)) {
  console.error(`Error: permission is needed to write the toDir '${toDir}'`);
  Deno.exit(1);
}

await Deno.mkdir(toDir, {recursive: true});
await Deno.remove(toDir, {recursive: true});
await Deno.mkdir(toDir, {recursive: true});
Deno.chdir(fromDir);

function shouldTransform(path: string) {
  return path.endsWith('.ts') &&
    !path.endsWith('.d.ts') &&
    !path.endsWith('.spec.ts');
}

async function transform(fromPath: string, toPath: string) {
  console.log(`Transforming ${fromPath} to ${toPath}`);
  const original = await Deno.readTextFile(fromPath);
  const transformed = original.replace(/^(import [\s\S]*?)(['"];)$/gm, '$1.ts$2');
  await Deno.writeTextFile(toPath, transformed);
}

for await (const entry of walk(fromDir)) {
  if (entry.isFile && shouldTransform(entry.path)) {
    const fromPath = entry.path;
    const toPath = toDir + relative(fromDir, fromPath);
    const toSubdir = dirname(toPath);

    await Deno.mkdir(toSubdir, {recursive: true});
    await transform(fromPath, toPath);
  }
}

// TODO support watch mode

console.log("Done");
