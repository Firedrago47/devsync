export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop();

  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
      return 'cpp';
    case 'java':
      return 'java';
    case 'md':
      return 'markdown';
    case 'txt':
      return 'plaintext';
    default:
      return 'plaintext';
  }
}