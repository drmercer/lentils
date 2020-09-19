export function error2Markdown(err: Error): string {
  const message = err.message?.trim();
  return (message ? labeledCodeBlock('Error message', message) : '') +
    (err.stack ? labeledCodeBlock('Call stack', cleanCallStack(err.stack)) : '');
}

export function cleanCallStack(stack: string): string {
  return stack
    .split('\n')
    .slice(0, 10)
    .join('\n');
}

export function labeledCodeBlock(label: string, blockText: string) {
  return `
${label}:

\`\`\`
${blockText}
\`\`\`
`;
}
