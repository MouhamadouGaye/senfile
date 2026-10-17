"use client";

import { useState } from "react";
import { GripVertical, Type, Diamond, ImageIcon, Eye, EyeOff, Lock, Unlock, Trash2, X } from "lucide-react";
import { PosterElement } from "@/lib/api";
import styles from "./layers-panel.module.css";

type Props = {
  elements: PosterElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onReorderDrag: (draggedId: string, targetId: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
};

const ICONS: Record<PosterElement["type"], React.ElementType> = {
  text: Type,
  shape: Diamond,
  image: ImageIcon,
};

export default function LayersPanel({
  elements,
  selectedId,
  onSelect,
  onReorder,
  onReorderDrag,
  onToggleVisible,
  onToggleLock,
  onDelete,
  onClose,
}: Props) {
  const ordered = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (draggedId && draggedId !== targetId) {
      onReorderDrag(draggedId, targetId);
    }
    setDraggedId(null);
    setOverId(null);
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Calques</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer les calques">
            <X size={16} />
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <p className={styles.empty}>Ajoutez du texte, une forme ou une image pour commencer.</p>
      ) : (
        <div className={styles.list}>
          {ordered.map((el, i) => {
            const Icon = ICONS[el.type];
            return (
              <div
                key={el.id}
                className={styles.row}
                data-selected={el.id === selectedId || undefined}
                data-dragover={overId === el.id || undefined}
                draggable
                onDragStart={() => setDraggedId(el.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== el.id) setOverId(el.id);
                }}
                onDragLeave={() => setOverId((cur) => (cur === el.id ? null : cur))}
                onDrop={() => handleDrop(el.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverId(null);
                }}
              >
                <span className={styles.gripHandle} title="Glisser pour réordonner">
                  <GripVertical size={14} />
                </span>
                <button className={styles.mainBtn} onClick={() => onSelect(el.id)}>
                  <span className={styles.icon}>
                    <Icon size={12} />
                  </span>
                  <span className={styles.label}>
                    {el.name ||
                      (el.type === "text" ? el.text?.slice(0, 18) || "Texte" : el.type === "shape" ? el.shapeType : "Image")}
                  </span>
                </button>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => onReorder(el.id, "up")} disabled={i === 0} title="Monter">
                    ↑
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => onReorder(el.id, "down")}
                    disabled={i === ordered.length - 1}
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => onToggleVisible(el.id)}
                    title={el.visible === false ? "Afficher" : "Masquer"}
                  >
                    {el.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => onToggleLock(el.id)}
                    title={el.locked ? "Déverrouiller" : "Verrouiller"}
                  >
                    {el.locked ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>
                  <button className={`${styles.iconBtn} ${styles.deleteIcon}`} onClick={() => onDelete(el.id)} title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
