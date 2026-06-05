/**
 * Simple callout support:
 * :::important
 * text
 * :::
 * Maps to <div class="callout callout-important">
 */
import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = {
  important: { label: 'Важно', icon: '⚠️' },
  reference: { label: 'Ориентир', icon: '📐' },
  gost: { label: 'ГОСТ / ОИВ', icon: '📋' },
  warning: { label: 'Предупреждение', icon: '🚨' },
  note: { label: 'Примечание', icon: 'ℹ️' },
};

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      const type = node.name;
      const info = CALLOUT_TYPES[type];
      if (!info) return;

      node.data = node.data || {};
      node.data.hName = 'div';
      node.data.hProperties = {
        className: [`callout`, `callout-${type}`],
      };

      // Prepend label
      node.children.unshift({
        type: 'paragraph',
        children: [
          {
            type: 'strong',
            children: [{ type: 'text', value: `${info.icon} ${info.label}` }],
          },
        ],
        data: { hProperties: { className: ['callout-label'] } },
      });
    });

    // Also handle blockquote-based callouts: > [!important] text
    visit(tree, 'blockquote', (node) => {
      const first = node.children?.[0];
      if (first?.type !== 'paragraph') return;
      const text = first.children?.[0];
      if (text?.type !== 'text') return;
      const match = text.value.match(/^\[!(important|reference|gost|warning|note)\]\s*/i);
      if (!match) return;
      const type = match[1].toLowerCase();
      const info = CALLOUT_TYPES[type];
      if (!info) return;

      text.value = text.value.slice(match[0].length);
      node.data = node.data || {};
      node.data.hName = 'div';
      node.data.hProperties = { className: ['callout', `callout-${type}`] };
    });
  };
}
