"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ImageIcon,
  Table as TableIcon,
  BarChart3,
  RectangleHorizontal,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  ArrowRight,
  MessageSquare,
  Shapes,
  MessageSquarePlus,
  Columns,
  Rows,
  Combine,
  Trash2,
  Palette,
  MoreHorizontal,
  Undo2,
  Redo2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ShapeKind } from "@/lib/objets";
import styles from "./toolbar.module.css";
import ChartModal from "./ChartModal";
import StyleDropdown from "./StyleDropdown";
import FontFamilyControl from "./FontFamilyControl";
import FontSizeControl from "./FontSizeControl";
import ColorPicker from "./ColorPicker";

type Props = {
  editor: Editor | null;
  onComment?: () => void;
  readOnly?: boolean;
  onAddImage?: (src: string, w: number, h: number) => void;
  onAddShape?: (kind: ShapeKind, square?: boolean) => void;
};

type Align = "left" | "center" | "right" | "justify";
type ShapeChoice = ShapeKind | "square" | "circle";

const CELL_COLORS = [
  "#f3f2ef",
  "#e8e4fb",
  "#fdf0d5",
  "#fbe3e3",
  "#e3f3ea",
  "#dfeaf5",
  "#4b3f72",
  "#b8902e",
];

const ICON_SIZE = 17;

const SHAPES: { id: ShapeChoice; label: string; Icon: typeof Square }[] = [
  { id: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { id: "square", label: "Carré", Icon: Square },
  { id: "circle", label: "Cercle", Icon: Circle },
  { id: "triangle", label: "Triangle", Icon: Triangle },
  { id: "diamond", label: "Losange", Icon: Diamond },
  { id: "star", label: "Étoile", Icon: Star },
  { id: "arrow", label: "Flèche", Icon: ArrowRight },
  { id: "bubble", label: "Bulle", Icon: MessageSquare },
];

function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

function loadSize(src: string) {
  return new Promise<{ w: number; h: number }>((res) => {
    const i = new window.Image();
    i.onload = () =>
      res({ w: i.naturalWidth || 300, h: i.naturalHeight || 200 });
    i.onerror = () => res({ w: 300, h: 200 });
    i.src = src;
  });
}

function Tool(p: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`${styles.btn} ${p.danger ? styles.btnDanger : ""}`}
      data-active={p.active}
      onClick={p.onClick}
      disabled={p.disabled}
      title={p.title}
      aria-label={p.title}
    >
      {p.children}
    </button>
  );
}

export default function Toolbar({
  editor,
  onComment,
  readOnly,
  onAddImage,
  onAddShape,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cellColorOpen, setCellColorOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!editor) return <div className={styles.bar} />;

  if (readOnly) {
    return (
      <div className={styles.bar}>
        <span className={styles.readOnlyNote}>
          Lecture seule — vous pouvez commenter, pas modifier le texte.
        </span>
        {onComment && (
          <Tool title="Commenter la sélection" onClick={onComment}>
            <MessageSquarePlus size={ICON_SIZE} />
          </Tool>
        )}
      </div>
    );
  }

  function setAlign(a: Align) {
    editor!.chain().focus().setTextAlign(a).run();
  }
  const isAlign = (a: Align) => editor!.isActive({ textAlign: a });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const asset = await api.uploadImage(file);
      const src = api.fileUrl(asset.url);
      const { w, h } = await loadSize(src);
      onAddImage?.(src, w, h);
    } catch {
      alert("Échec de l'envoi de l'image");
    } finally {
      setUploading(false);
    }
  }

  async function insertChart(svgDataUrl: string) {
    const { w, h } = await loadSize(svgDataUrl);
    onAddImage?.(svgDataUrl, w, h);
    setChartOpen(false);
  }

  function insertShape(t: ShapeChoice) {
    if (t === "square") onAddShape?.("rectangle", true);
    else if (t === "circle") onAddShape?.("ellipse", true);
    else onAddShape?.(t);
    setShapesOpen(false);
    setMobileMenuOpen(false);
  }

  function insertTable() {
    editor!
      .chain()
      .focus()
      .insertTable({ rows: 4, cols: 4, withHeaderRow: true })
      .run();
    setMobileMenuOpen(false);
  }

  const inTable = editor.isActive("table");

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
      hidden
      onChange={handleImagePick}
    />
  );
  const chartModal = chartOpen && (
    <ChartModal onInsert={insertChart} onClose={() => setChartOpen(false)} />
  );

  /* ------------------------------ mobile ------------------------------ */
  if (isMobile) {
    return (
      <div className={styles.mobileBar}>
        <div className={styles.mobileRow}>
          <StyleDropdown editor={editor} />
          <Tool
            title="Gras"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={ICON_SIZE} />
          </Tool>
          <Tool
            title="Italique"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={ICON_SIZE} />
          </Tool>
          {onComment && (
            <Tool title="Commenter la sélection" onClick={onComment}>
              <MessageSquarePlus size={ICON_SIZE} />
            </Tool>
          )}
          <button
            className={styles.moreBtn}
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Plus d'outils"
          >
            <MoreHorizontal size={ICON_SIZE} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <button
              className={styles.mobileMenuItem}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo2 size={16} /> Annuler
            </button>
            <button
              className={styles.mobileMenuItem}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo2 size={16} /> Rétablir
            </button>
            <button
              className={styles.mobileMenuItem}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon size={16} /> {uploading ? "Envoi…" : "Image"}
            </button>
            <button className={styles.mobileMenuItem} onClick={insertTable}>
              <TableIcon size={16} /> Tableau
            </button>
            <button
              className={styles.mobileMenuItem}
              onClick={() => {
                setChartOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <BarChart3 size={16} /> Graphique
            </button>
            {SHAPES.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={styles.mobileMenuItem}
                onClick={() => insertShape(id)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
            <button
              className={styles.mobileMenuItem}
              data-active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={16} /> Souligné
            </button>
            <button
              className={styles.mobileMenuItem}
              data-active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List size={16} /> Liste
            </button>
            {(["left", "center", "right"] as Align[]).map((a) => (
              <button
                key={a}
                className={styles.mobileMenuItem}
                data-active={isAlign(a)}
                onClick={() => setAlign(a)}
              >
                {a === "left" ? (
                  <AlignLeft size={16} />
                ) : a === "center" ? (
                  <AlignCenter size={16} />
                ) : (
                  <AlignRight size={16} />
                )}{" "}
                {a === "left" ? "Gauche" : a === "center" ? "Centre" : "Droite"}
              </button>
            ))}
          </div>
        )}

        {fileInput}
        {chartModal}
      </div>
    );
  }

  /* ------------------------------ desktop ------------------------------ */
  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <Tool
          title="Annuler"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Rétablir"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={ICON_SIZE} />
        </Tool>
      </div>

      <div className={styles.divider} />
      <StyleDropdown editor={editor} />
      <div className={styles.divider} />
      <FontFamilyControl editor={editor} />
      <div className={styles.divider} />
      <FontSizeControl editor={editor} />
      <div className={styles.divider} />

      <div className={styles.group}>
        <Tool
          title="Gras"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Italique"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Souligné"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={ICON_SIZE} />
        </Tool>
        <ColorPicker editor={editor} />
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <Tool
          title="Aligner à gauche"
          active={isAlign("left")}
          onClick={() => setAlign("left")}
        >
          <AlignLeft size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Centrer"
          active={isAlign("center")}
          onClick={() => setAlign("center")}
        >
          <AlignCenter size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Aligner à droite"
          active={isAlign("right")}
          onClick={() => setAlign("right")}
        >
          <AlignRight size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Justifier"
          active={isAlign("justify")}
          onClick={() => setAlign("justify")}
        >
          <AlignJustify size={ICON_SIZE} />
        </Tool>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <Tool
          title="Liste à puces"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={ICON_SIZE} />
        </Tool>
        <Tool
          title="Liste numérotée"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={ICON_SIZE} />
        </Tool>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <Tool
          title="Insérer une image"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <ImageIcon size={ICON_SIZE} />
        </Tool>
        {fileInput}
        <Tool title="Insérer un tableau" onClick={insertTable}>
          <TableIcon size={ICON_SIZE} />
        </Tool>
        <Tool title="Insérer un graphique" onClick={() => setChartOpen(true)}>
          <BarChart3 size={ICON_SIZE} />
        </Tool>

        <div style={{ position: "relative" }}>
          <Tool
            title="Formes"
            onClick={() => setShapesOpen((o) => !o)}
            active={shapesOpen}
          >
            <Shapes size={ICON_SIZE} />
          </Tool>
          {shapesOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                zIndex: 80,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4,
                padding: 8,
                background: "#fff",
                border: "1px solid #e6e3ee",
                borderRadius: 10,
                boxShadow: "0 10px 30px rgba(30,20,70,.18)",
              }}
            >
              {SHAPES.map(({ id, label, Icon }) => (
                <Tool key={id} title={label} onClick={() => insertShape(id)}>
                  <Icon size={ICON_SIZE} />
                </Tool>
              ))}
            </div>
          )}
        </div>
      </div>

      {onComment && (
        <>
          <div className={styles.divider} />
          <Tool title="Commenter la sélection" onClick={onComment}>
            <MessageSquarePlus size={ICON_SIZE} />
          </Tool>
        </>
      )}

      {inTable && (
        <>
          <div className={styles.divider} />
          <div className={`${styles.group} ${styles.tableControls}`}>
            <span className={styles.tableLabel}>Tableau</span>
            <Tool
              title="Ajouter une colonne"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <Columns size={ICON_SIZE} />
            </Tool>
            <Tool
              title="Ajouter une ligne"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <Rows size={ICON_SIZE} />
            </Tool>
            <Tool
              title="Supprimer la colonne"
              onClick={() => editor.chain().focus().deleteColumn().run()}
            >
              <Columns size={ICON_SIZE} style={{ opacity: 0.5 }} />
            </Tool>
            <Tool
              title="Supprimer la ligne"
              onClick={() => editor.chain().focus().deleteRow().run()}
            >
              <Rows size={ICON_SIZE} style={{ opacity: 0.5 }} />
            </Tool>
            <div style={{ position: "relative" }}>
              <Tool
                title="Couleur de la cellule"
                onClick={() => setCellColorOpen((o) => !o)}
              >
                <Palette size={ICON_SIZE} />
              </Tool>
              {cellColorOpen && (
                <div className={styles.cellColorPopover}>
                  {CELL_COLORS.map((c) => (
                    <button
                      key={c}
                      className={styles.cellColorSwatch}
                      style={{ background: c }}
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .setCellAttribute("backgroundColor", c)
                          .run();
                        setCellColorOpen(false);
                      }}
                      aria-label={`Couleur de cellule ${c}`}
                    />
                  ))}
                  <button
                    className={styles.cellColorReset}
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .setCellAttribute("backgroundColor", null)
                        .run();
                      setCellColorOpen(false);
                    }}
                  >
                    Aucune
                  </button>
                </div>
              )}
            </div>
            <Tool
              title="Fusionner les cellules"
              onClick={() => editor.chain().focus().mergeCells().run()}
            >
              <Combine size={ICON_SIZE} />
            </Tool>
            <Tool
              title="Supprimer le tableau"
              danger
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash2 size={ICON_SIZE} />
            </Tool>
          </div>
        </>
      )}

      {chartModal}
    </div>
  );
}
