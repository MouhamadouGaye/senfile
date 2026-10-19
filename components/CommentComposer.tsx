"use client";

import { useState } from "react";
import styles from "./comment-composer.module.css";

type Props = {
  quotedText: string;
  position: { x: number; y: number };
  onSubmit: (content: string) => void;
  onClose: () => void;
};

export default function CommentComposer({ quotedText, position, onSubmit, onClose }: Props) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      onSubmit(content.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.popover}
        style={{ top: position.y, left: position.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {quotedText && <div className={styles.quote}>“{quotedText.slice(0, 120)}”</div>}
        <textarea
          className={styles.textarea}
          placeholder="Votre suggestion…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>
            Annuler
          </button>
          <button className={styles.submit} onClick={submit} disabled={submitting || !content.trim()}>
            Commenter
          </button>
        </div>
      </div>
    </>
  );
}
