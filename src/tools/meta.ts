// 15 browser-based utility tools. Metadata is server-safe (no client code) so
// it can power the /tools index, sitemap and per-tool metadata.

export type ToolMeta = {
  slug: string
  name: string
  description: string
  emoji: string
  category: string
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'password-generator',
    name: 'Password Generator',
    description:
      'Create strong, random passwords with custom length and character sets.',
    emoji: '🔑',
    category: 'Security',
  },
  {
    slug: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Turn any text or link into a scannable QR code, instantly.',
    emoji: '🔳',
    category: 'Sharing',
  },
  {
    slug: 'file-hash',
    name: 'File & Text Checksum',
    description:
      'Compute SHA-256 / SHA-1 hashes of files or text to verify integrity.',
    emoji: '🧮',
    category: 'Security',
  },
  {
    slug: 'base64',
    name: 'Base64 Encode / Decode',
    description: 'Encode text to Base64 or decode it back, in your browser.',
    emoji: '🔤',
    category: 'Encoding',
  },
  {
    slug: 'url-encode',
    name: 'URL Encode / Decode',
    description: 'Percent-encode or decode URLs and query strings.',
    emoji: '🔗',
    category: 'Encoding',
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate cryptographically random v4 UUIDs in bulk.',
    emoji: '🆔',
    category: 'Generators',
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Pretty-print, minify and validate JSON.',
    emoji: '📦',
    category: 'Developer',
  },
  {
    slug: 'word-counter',
    name: 'Word & Character Counter',
    description: 'Count words, characters, sentences and reading time.',
    emoji: '📝',
    category: 'Text',
  },
  {
    slug: 'case-converter',
    name: 'Text Case Converter',
    description:
      'Convert text between UPPER, lower, Title, camelCase and more.',
    emoji: '🔠',
    category: 'Text',
  },
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder paragraphs, sentences or words.',
    emoji: '📃',
    category: 'Generators',
  },
  {
    slug: 'color-converter',
    name: 'Color Converter',
    description: 'Convert between HEX, RGB and HSL and preview the color.',
    emoji: '🎨',
    category: 'Design',
  },
  {
    slug: 'timestamp',
    name: 'Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates.',
    emoji: '🕒',
    category: 'Developer',
  },
  {
    slug: 'slug-generator',
    name: 'Slug Generator',
    description: 'Turn any title into a clean, URL-safe slug.',
    emoji: '🐌',
    category: 'Text',
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Previewer',
    description: 'Write Markdown and see a live rendered preview.',
    emoji: '⬇️',
    category: 'Developer',
  },
  {
    slug: 'text-diff',
    name: 'Text Diff Checker',
    description: 'Compare two blocks of text and highlight line differences.',
    emoji: '🔍',
    category: 'Developer',
  },
]

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug)
}
