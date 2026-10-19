"use client";

import { useState } from "react";
import { Comment } from "@/lib/api";
import { initials } from "@/lib/utils";
import styles from "./comments-panel.module.css";

type Props = {
  comments: Comment[];
  visible: boolean;
  onClose: () => void;
  onOpen: (commentId: string) => void;
};

export default function CommentsPanel({ comments, visible, onClose, onOpen }: Props) {
  const [showResolved, setShowResolved] = useState(false);

  if (!visible) return null;

  const list = comments.filter((c) => showResolved || !c.resolved);

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Suggestions</h2>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer le panneau">
          ×
        </button>
      </div>

      <label className={styles.toggleResolved}>
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        Afficher les résolues
      </label>

      {list.length === 0 ? (
        <p className={styles.empty}>
          Sélectionnez du texte dans le document : une bulle « 💬 » apparaît pour laisser une
          suggestion.
        </p>
      ) : (
        <div className={styles.chipList}>
          {list.map((c) => (
            <button
              key={c.id}
              className={styles.chip}
              data-resolved={c.resolved || undefined}
              onClick={() => onOpen(c.id)}
              title={c.content}
            >
              <span className={styles.avatar}>{initials(c.author.name)}</span>
              <span className={styles.chipText}>{(c.quoted_text || c.content).slice(0, 34)}…</span>
              <span className={styles.dot} data-resolved={c.resolved || undefined} />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
