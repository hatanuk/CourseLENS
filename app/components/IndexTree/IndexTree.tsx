'use client';

import { useState } from 'react';
import { IndexNode } from '@/app/data/structures';
import styles from './IndexTree.module.css';

interface IndexTreeProps {
  nodes: IndexNode[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

function TreeNode({
  node,
  selectedIds,
  onToggle,
}: {
  node: IndexNode;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={styles.node} style={{ marginLeft: node.level * 16 }}>
      <div className={styles.nodeRow}>
        {hasChildren ? (
          <button className={styles.expander} onClick={() => setExpanded(!expanded)}>
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className={styles.expanderPlaceholder} />
        )}
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={selectedIds.has(node.id)}
            onChange={() => onToggle(node.id)}
          />
          <span>{node.title}</span>
        </label>
      </div>
      {hasChildren && expanded && (
        <div className={styles.children}>
          {node.children!.map(child => (
            <TreeNode key={child.id} node={child} selectedIds={selectedIds} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function IndexTree({ nodes, selectedIds, onToggle }: IndexTreeProps) {
  return (
    <div className={styles.tree}>
      {nodes.map(node => (
        <TreeNode key={node.id} node={node} selectedIds={selectedIds} onToggle={onToggle} />
      ))}
    </div>
  );
}
