"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import { useTheme } from "next-themes"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MarkdownRendererProps {
  content: string
}

// Simple syntax highlighting function
const highlightCode = (code: string, language: string, isDark: boolean) => {
  const colors = isDark
    ? {
        keyword: "#ff79c6",
        string: "#f1fa8c",
        comment: "#6272a4",
        number: "#bd93f9",
        operator: "#ff79c6",
        function: "#50fa7b",
      }
    : {
        keyword: "#d73a49",
        string: "#032f62",
        comment: "#6a737d",
        number: "#005cc5",
        operator: "#d73a49",
        function: "#6f42c1",
      }

  const keywords = {
    javascript: [
      "const",
      "let",
      "var",
      "function",
      "return",
      "if",
      "else",
      "for",
      "while",
      "class",
      "import",
      "export",
      "from",
      "async",
      "await",
      "try",
      "catch",
    ],
    typescript: [
      "const",
      "let",
      "var",
      "function",
      "return",
      "if",
      "else",
      "for",
      "while",
      "class",
      "import",
      "export",
      "from",
      "async",
      "await",
      "try",
      "catch",
      "interface",
      "type",
      "extends",
      "implements",
    ],
    python: [
      "def",
      "class",
      "import",
      "from",
      "return",
      "if",
      "else",
      "elif",
      "for",
      "while",
      "try",
      "except",
      "with",
      "as",
      "lambda",
      "yield",
    ],
    java: [
      "public",
      "private",
      "protected",
      "class",
      "interface",
      "extends",
      "implements",
      "return",
      "if",
      "else",
      "for",
      "while",
      "try",
      "catch",
      "finally",
    ],
    css: [
      "color",
      "background",
      "margin",
      "padding",
      "border",
      "width",
      "height",
      "display",
      "position",
      "flex",
      "grid",
    ],
    html: ["div", "span", "p", "h1", "h2", "h3", "body", "head", "html", "script", "style", "link"],
  }

  // Escape HTML first
  let highlightedCode = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

  // Apply highlighting in order to avoid conflicts
  const langKeywords = keywords[language as keyof typeof keywords] || []

  // 1. Highlight comments first (they should override everything else)
  highlightedCode = highlightedCode.replace(
    /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    `<span style="color: ${colors.comment}">$1</span>`,
  )

  // 2. Highlight strings (but not inside comments)
  highlightedCode = highlightedCode.replace(
    /(?<!<span[^>]*>.*?)(["'`])((?:\\.|(?!\1)[^\\])*?)\1(?![^<]*<\/span>)/g,
    `<span style="color: ${colors.string}">$1$2$1</span>`,
  )

  // 3. Highlight numbers (but not inside strings or comments)
  highlightedCode = highlightedCode.replace(
    /(?<!<span[^>]*>.*?)\b(\d+\.?\d*)\b(?![^<]*<\/span>)/g,
    `<span style="color: ${colors.number}">$1</span>`,
  )

  // 4. Highlight keywords (but not inside strings or comments)
  langKeywords.forEach((keyword) => {
    const regex = new RegExp(`(?<!<span[^>]*>.*?)\\b${keyword}\\b(?![^<]*<\\/span>)`, "g")
    highlightedCode = highlightedCode.replace(
      regex,
      `<span style="color: ${colors.keyword}; font-weight: 600">${keyword}</span>`,
    )
  })

  return highlightedCode
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { theme } = useTheme()
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  return (
    <ReactMarkdown
      className="prose prose-sm dark:prose-invert max-w-none"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          const codeString = String(children).replace(/\n$/, "")
          const language = match ? match[1] : "text"

          if (!inline && match) {
            const highlightedCode = highlightCode(codeString, language, theme === "dark")

            return (
              <div className="relative group my-4">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{language}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(codeString)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    {copiedCode === codeString ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className="!mt-0 !rounded-t-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg overflow-x-auto">
                  <code
                    className="block p-4 text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    {...props}
                  />
                </pre>
              </div>
            )
          }

          return (
            <code
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700"
              {...props}
            >
              {children}
            </code>
          )
        },
        pre({ children }) {
          return <div className="not-prose">{children}</div>
        },
        h1({ children }) {
          return (
            <h1 className="text-xl font-semibold mb-4 mt-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              {children}
            </h1>
          )
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold mb-3 mt-5 text-gray-900 dark:text-gray-100">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold mb-2 mt-4 text-gray-900 dark:text-gray-100">{children}</h3>
        },
        p({ children }) {
          return <p className="mb-3 text-gray-800 dark:text-gray-200 leading-relaxed">{children}</p>
        },
        ul({ children }) {
          return <ul className="mb-4 ml-6 space-y-1 text-gray-800 dark:text-gray-200 list-disc">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-4 ml-6 space-y-1 text-gray-800 dark:text-gray-200 list-decimal">{children}</ol>
        },
        li({ children }) {
          return <li className="text-sm leading-relaxed">{children}</li>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-r italic">
              <div className="text-gray-700 dark:text-gray-300">{children}</div>
            </blockquote>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">{children}</table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
        },
        th({ children }) {
          return (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700">
              {children}
            </td>
          )
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {children}
            </a>
          )
        },
        strong({ children }) {
          return <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
        },
        em({ children }) {
          return <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
        },
        hr() {
          return <hr className="my-6 border-gray-200 dark:border-gray-700" />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
