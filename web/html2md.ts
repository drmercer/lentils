export function html2md(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return `# Not implemented yet... ${document.querySelectorAll('*').length} elements`;
}
