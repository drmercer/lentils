/**
 * Checks the given filesystem permission (read or write) for the given path, requesting it if needed.
 *
 * **USES UNSTABLE DENO API**
 *
 * @param name The permission to request.
 * @param path The path to request access to.
 * @returns Whether permission was granted.
 */
export async function userGrantsFsPermission(name: "read"|"write", path: string): Promise<boolean> {
  return (await Deno.permissions.request({name, path})).state === "granted";
}
