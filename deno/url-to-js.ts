const str = Deno.args[0] ?? prompt('What is the URL?');

function jsStr(str: string): string {
  return `'${str.replace("'", "\\'")}'`;
}

const url = new URL(str);

console.log(`const url = new URL(${jsStr(url.origin + url.pathname)});`);

url.searchParams.forEach((value, key) => {
  console.log(`url.searchParams.set(${jsStr(key)}, ${jsStr(value)});`);
});
