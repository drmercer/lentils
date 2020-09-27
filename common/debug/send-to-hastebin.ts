export async function hastebin(text: string, ext = 'md') {
  const res = await fetch("https://hastebin.com/documents", {
    method: "POST",
    body: text,
  });
  const json = await res.json();
  return `https://hastebin.com/${json.key}.${ext}`;
}
