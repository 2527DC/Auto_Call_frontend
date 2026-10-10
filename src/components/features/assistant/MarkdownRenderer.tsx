'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: { type: 'code' | 'text'; lang?: string; text: string }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: content.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'text',
      text: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      text: content.substring(lastIndex),
    });
  }

  const renderTextSegment = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={lineIdx} className="font-bold text-sm text-title dark:text-[#f5f3ff] mt-3 mb-1">
            {renderInlineMarkdown(trimmed.substring(4))}
          </h4>
        );
      }
      // Heading 2
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={lineIdx} className="font-bold text-base text-title dark:text-[#f5f3ff] mt-3 mb-1.5 border-b border-input-border-color dark:border-white/10 pb-1">
            {renderInlineMarkdown(trimmed.substring(3))}
          </h3>
        );
      }
      // Heading 1
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={lineIdx} className="font-extrabold text-base text-title dark:text-[#f5f3ff] mt-4 mb-2">
            {renderInlineMarkdown(trimmed.substring(2))}
          </h2>
        );
      }

      // Bullet List item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs text-slate-700 dark:text-[#c4b5fd] my-0.5 leading-relaxed">
            {renderInlineMarkdown(trimmed.substring(2))}
          </li>
        );
      }

      // Numbered List item
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-1 text-xs text-slate-700 dark:text-[#c4b5fd] my-1 leading-relaxed">
            <span className="font-semibold text-primary shrink-0">{numMatch[1]}.</span>
            <span>{renderInlineMarkdown(numMatch[2])}</span>
          </div>
        );
      }

      // Empty line / paragraph break
      if (!trimmed) {
        return <div key={lineIdx} className="h-1.5" />;
      }

      // Regular text paragraph
      return (
        <p key={lineIdx} className="text-xs text-slate-700 dark:text-[#c4b5fd] leading-relaxed my-1">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (inlineText: string): React.ReactNode => {
    // Regex for inline code `...`, bold **...**, italics *...*, and links [text](url)
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    const tokens = inlineText.split(tokenRegex);

    return tokens.map((token, tokenIdx) => {
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code
            key={tokenIdx}
            className="bg-slate-200/70 dark:bg-white/10 text-primary px-1 py-0.5 rounded font-mono text-[11px] border border-input-border-color dark:border-white/10"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return (
          <strong key={tokenIdx} className="font-bold text-title dark:text-[#f5f3ff]">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return <em key={tokenIdx}>{token.slice(1, -1)}</em>;
      }
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a
            key={tokenIdx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return token;
    });
  };

  return (
    <div className="space-y-1">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return (
            <div key={pIdx} className="my-2 rounded-lg bg-slate-900 text-slate-100 p-2.5 text-xs font-mono relative overflow-x-auto border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
                <span>{part.lang}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(part.text, pIdx)}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  {copiedIndex === pIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap">{part.text}</pre>
            </div>
          );
        }
        return <React.Fragment key={pIdx}>{renderTextSegment(part.text)}</React.Fragment>;
      })}
    </div>
  );
};
