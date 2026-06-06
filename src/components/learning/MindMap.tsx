import { useState } from 'react';

export interface MindNode {
  id: string;
  label: string;
  href?: string;
  children?: MindNode[];
  color?: string;
  icon?: string;
}

interface Props {
  root: MindNode;
  compact?: boolean;
}

const COLORS = [
  { bg: 'bg-wine-100 dark:bg-wine-950/40', border: 'border-wine-400', text: 'text-wine-800 dark:text-wine-300' },
  { bg: 'bg-blue-100 dark:bg-blue-950/40', border: 'border-blue-400', text: 'text-blue-800 dark:text-blue-300' },
  { bg: 'bg-green-100 dark:bg-green-950/40', border: 'border-green-400', text: 'text-green-800 dark:text-green-300' },
  { bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-400', text: 'text-amber-800 dark:text-amber-300' },
  { bg: 'bg-purple-100 dark:bg-purple-950/40', border: 'border-purple-400', text: 'text-purple-800 dark:text-purple-300' },
  { bg: 'bg-teal-100 dark:bg-teal-950/40', border: 'border-teal-400', text: 'text-teal-800 dark:text-teal-300' },
];

function NodeEl({ node, depth, colorIdx, expanded, onToggle }: {
  node: MindNode;
  depth: number;
  colorIdx: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const c = COLORS[colorIdx % COLORS.length];

  const inner = (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all
      ${depth === 0
        ? 'text-sm font-bold bg-wine-700 text-white border-wine-700 shadow-md'
        : `${c.bg} ${c.border} ${c.text}`}
      ${hasChildren ? 'cursor-pointer hover:shadow-sm' : ''}
      ${node.href ? 'hover:underline' : ''}`}
    >
      {node.icon && <span>{node.icon}</span>}
      {node.label}
      {hasChildren && (
        <span className="opacity-60">{isOpen ? '▾' : '▸'}</span>
      )}
    </span>
  );

  return (
    <div className={`flex flex-col ${depth > 0 ? 'ml-4 sm:ml-6' : ''}`}>
      <div
        className="flex items-center"
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {depth > 0 && (
          <span className="mr-2 text-stone-300 dark:text-stone-600 flex-shrink-0 text-xs">──</span>
        )}
        {node.href
          ? <a href={node.href}>{inner}</a>
          : inner}
      </div>

      {hasChildren && isOpen && (
        <div className="mt-1.5 border-l-2 border-stone-200 dark:border-stone-700 ml-2 pl-2 space-y-1.5 mt-2">
          {node.children!.map((child, i) => (
            <NodeEl
              key={child.id}
              node={child}
              depth={depth + 1}
              colorIdx={depth === 0 ? i : colorIdx}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindMap({ root, compact = false }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Start with root and first level expanded
    const s = new Set<string>([root.id]);
    root.children?.forEach(c => s.add(c.id));
    return s;
  });

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    const all = new Set<string>();
    function collect(n: MindNode) {
      all.add(n.id);
      n.children?.forEach(collect);
    }
    collect(root);
    setExpanded(all);
  }

  function collapseAll() {
    setExpanded(new Set([root.id]));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 text-xs">
        <button onClick={expandAll} className="btn-ghost text-xs py-1">Развернуть всё</button>
        <button onClick={collapseAll} className="btn-ghost text-xs py-1">Свернуть</button>
      </div>
      <div className={`rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4 ${compact ? '' : 'p-6'} overflow-x-auto`}>
        <NodeEl
          node={root}
          depth={0}
          colorIdx={0}
          expanded={expanded}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}
