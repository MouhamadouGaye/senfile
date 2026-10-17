"use client";

import { X, Plus } from "lucide-react";
import { POSTER_TEMPLATES, PosterTemplate } from "./posterTemplates";
import styles from "./templatepicker.module.css";

type Props = {
  onPick: (template: PosterTemplate | null) => void;
  onClose: () => void;
};

export default function TemplatePickerModal({ onPick, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Choisissez un point de départ</div>
            <div className={styles.subtitle}>
              16 modèles modernes, entièrement modifiables — ou partez d'une
              page vierge.
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.grid}>
          <button className={styles.blankCard} onClick={() => onPick(null)}>
            <Plus size={22} />
            <span className={styles.blankLabel}>Page vierge</span>
          </button>

          {POSTER_TEMPLATES.map((tpl, i) => (
            <button
              key={tpl.id}
              className={styles.card}
              style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
              onClick={() => onPick(tpl)}
            >
              <div
                className={styles.cardPreview}
                style={{ background: tpl.accent }}
              >
                <span className={styles.cardPreviewBar} />
                <span className={styles.cardPreviewBar} />
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{tpl.name}</span>
                <span className={styles.cardCategory}>{tpl.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
