"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn('prose prose-invert prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Headings
          h1: ({ children }) => <h1 className="text-[11pt] font-bold uppercase tracking-tight mb-2 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-[10.5pt] font-bold uppercase tracking-tight mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-[10pt] font-bold uppercase tracking-tight mb-1.5 mt-2">{children}</h3>,
          
          // Paragraphs
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-2 font-medium"
            >
              {children}
            </a>
          ),
          
          // Emphasis
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          
          // Code
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="bg-muted/50 px-1 py-0.5 rounded-sm text-[9pt] font-mono text-primary">
                {children}
              </code>
            ) : (
              <code className="block bg-muted/30 p-2 rounded-sm text-[9pt] font-mono overflow-x-auto border border-border/50">
                {children}
              </code>
            )
          },
          
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          
          // Images - resized for inline logos
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt} 
              className="inline-block h-6 w-auto object-contain align-middle mx-0.5 my-0.5"
            />
          ),

          // Horizontal rule
          hr: () => <hr className="border-t border-border/30 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
