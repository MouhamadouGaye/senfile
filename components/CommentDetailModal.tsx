"use client";

import { Comment } from "@/lib/api";
import { initials } from "@/lib/utils";
import styles from "./commentdetail.module.css";

type Props = {
  comment: Comment;
  canDelete: boolean;
  onResolve: (resolved: boolean) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function CommentDetailModal({ comment, canDelete, onResolve, onDelete, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.authorRow}>
          <span className={styles.avatar}>{initials(comment.author.name)}</span>
          <div>
            <div className={styles.authorName}>{comment.author.name}</div>
            <div className={styles.date}>{new Date(comment.created_at).toLocaleString("fr-FR")}</div>
          </div>
        </div>

        {comment.quoted_text && <div className={styles.quote}>“{comment.quoted_text}”</div>}

        <p className={styles.content}>{comment.content}</p>

        <div className={styles.actions}>
          <button className={styles.resolveBtn} onClick={() => onResolve(!comment.resolved)}>
            {comment.resolved ? "Rouvrir" : "Marquer comme résolu"}
          </button>
          {canDelete && (
            <button className={styles.deleteBtn} onClick={onDelete}>
              Supprimer
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
