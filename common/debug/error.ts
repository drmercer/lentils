export function error2Markdown(err: Error): string {
  const message = err.message?.trim();
  return (message ? labeledCodeBlock('Error message', message) : '') +
    (err.stack ? labeledCodeBlock('Call stack', err.stack) : '');
}

export function labeledCodeBlock(label: string, blockText: string) {
  return `
${label}:

\`\`\`
${blockText}
\`\`\`
`;
}
