import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(value: string, query: string) {
  const tokens = query.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!tokens.length) return value;

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const normalizedTokens = new Set(tokens.map((token) => token.toLocaleLowerCase('es')));

  return value.split(matcher).map((part, index) => {
    if (!part) return null;
    return normalizedTokens.has(part.toLocaleLowerCase('es'))
      ? <mark className="docs-md-mark" key={`${part}-${index}`}>{part}</mark>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function highlightChildren(children: ReactNode, query: string): ReactNode {
  if (!query.trim()) return children;

  return Children.map(children, (child) => {
    if (typeof child === 'string') return highlightText(child, query);
    if (Array.isArray(child)) return highlightChildren(child, query);
    if (isValidElement(child)) {
      if (child.type === 'code') return child;
      const props = child.props as { children?: ReactNode };
      if (!props.children) return child;
      return cloneElement(child as ReactElement<{ children?: ReactNode }>, {
        children: highlightChildren(props.children, query),
      });
    }
    return child;
  });
}

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (isValidElement(children)) return getTextContent((children.props as { children?: ReactNode }).children);
  return '';
}

function getCellAlign(children: ReactNode) {
  const value = getTextContent(children).trim();
  if (/^\d+$/.test(value)) return 'center';
  if (/^`?\d{3}`?$/.test(value)) return 'center';
  if (/^(si|sí|no|ok|draft|active|inactive|portrait|landscape)$/i.test(value)) return 'center';
  return 'left';
}

function markdownComponents(query: string) {
  return {
    h1: ({ children }: { children?: ReactNode }) => <Typography component="h1" className="docs-md-h1">{highlightChildren(children, query)}</Typography>,
    h2: ({ children }: { children?: ReactNode }) => <Typography component="h2" className="docs-md-h2">{highlightChildren(children, query)}</Typography>,
    h3: ({ children }: { children?: ReactNode }) => <Typography component="h3" className="docs-md-h3">{highlightChildren(children, query)}</Typography>,
    p: ({ children }: { children?: ReactNode }) => <Typography component="p" className="docs-md-p">{highlightChildren(children, query)}</Typography>,
    ul: ({ children }: { children?: ReactNode }) => <Box component="ul" className="docs-md-list">{children}</Box>,
    ol: ({ children }: { children?: ReactNode }) => <Box component="ol" className="docs-md-list">{children}</Box>,
    li: ({ children }: { children?: ReactNode }) => <Typography component="li" className="docs-md-li">{highlightChildren(children, query)}</Typography>,
    hr: () => <Divider className="docs-md-divider" />,
    table: ({ children }: { children?: ReactNode }) => (
      <TableContainer component={Paper} variant="outlined" className="docs-md-tableWrap">
        <Table size="small" className="docs-md-table">{children}</Table>
      </TableContainer>
    ),
    thead: ({ children }: { children?: ReactNode }) => <TableHead>{children}</TableHead>,
    tbody: ({ children }: { children?: ReactNode }) => <TableBody>{children}</TableBody>,
    tr: ({ children }: { children?: ReactNode }) => <TableRow>{children}</TableRow>,
    th: ({ children }: { children?: ReactNode }) => <TableCell align={getCellAlign(children)} component="th">{highlightChildren(children, query)}</TableCell>,
    td: ({ children }: { children?: ReactNode }) => <TableCell align={getCellAlign(children)}>{highlightChildren(children, query)}</TableCell>,
    a: ({ href, children }: { href?: string; children?: ReactNode }) => href?.startsWith('/')
      ? <RouterLink to={href} className="docs-md-link">{children}</RouterLink>
      : <a href={href} className="docs-md-link">{children}</a>,
    code: ({ className, children }: { className?: string; children?: ReactNode }) => className
      ? <code className={className}>{children}</code>
      : <code className="docs-md-inlineCode">{children}</code>,
    pre: ({ children }: { children?: ReactNode }) => <pre className="docs-md-pre">{children}</pre>,
    blockquote: ({ children }: { children?: ReactNode }) => <aside className="docs-md-callout">{children}</aside>,
  };
}

type DocumentationMarkdownProps = {
  content: string;
  query?: string;
};

export function DocumentationMarkdown({ content, query = '' }: DocumentationMarkdownProps) {
  const normalizedContent = content.replace(/^#\s+.*(?:\r?\n)+/, '');

  return (
    <ReactMarkdown components={markdownComponents(query)} remarkPlugins={[remarkGfm]}>
      {normalizedContent}
    </ReactMarkdown>
  );
}
