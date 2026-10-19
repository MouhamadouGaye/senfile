"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Editor as TiptapEditor } from "@tiptap/react";
import { api, Comment, Role } from "@/lib/api";
import Toolbar from "@/components/Toolbar";
import Editor from "@/components/Editor";
import OutlinePanel from "@/components/OutlinePanel";
import CommentsPanel from "@/components/CommentsPanel";
import CommentComposer from "@/components/CommentComposer";
import CommentDetailModal from "@/components/CommentDetailModal";
import ShareModal from "@/components/ShareModal";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import ObjectsLayer, { type Ghost } from "@/components/ObjectLayer";
import type { Margins } from "@/components/MarginRuler";
import {
  PageObject,
  ShapeKind,
  SHAPE_MIME,
  splitContent,
  pageHeightFor,
  objectFromSpec,
  placeCentered,
  clientToPage,
  loadImageSize,
  PAGE_W,
} from "@/lib/objets";
import {
  ArrowLeft,
  PanelLeft,
  MessageSquare,
  MessageSquarePlus,
  Eye,
  Download,
  Share2,
  Check,
  Loader2,
  AlertCircle,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Maximize,
} from "lucide-react";
import selectionStyles from "@/components/selection-bubble.module.css";
import styles from "./editorpage.module.css";

type SaveState = "saved" | "saving" | "error" | "idle";
type Payload = { title?: string; content?: any };

const getPage = () =>
  document.querySelector<HTMLElement>("[data-page-surface]");

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>(null);
  const [role, setRole] = useState<Role>("owner");
  const [isPublic, setIsPublic] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(
    null,
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<Payload | null>(null);

  const [outlineVisible, setOutlineVisible] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [detailCommentId, setDetailCommentId] = useState<string | null>(null);
  const [composer, setComposer] = useState<{
    quotedText: string;
    position: { x: number; y: number };
  } | null>(null);
  const [selectionBubble, setSelectionBubble] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [objects, setObjects] = useState<PageObject[]>([]);
  const objectsRef = useRef<PageObject[]>([]);
  const editorJsonRef = useRef<any>(null);
  const [margins, setMargins] = useState<Margins>({ left: 72, right: 72 });
  const marginsRef = useRef<Margins>({ left: 72, right: 72 });

  const [zoom, setZoom] = useState(1);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [, bump] = useState(0);
  const pastRef = useRef<PageObject[][]>([]);
  const futureRef = useRef<PageObject[][]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewObjects, setPreviewObjects] = useState<PageObject[]>([]);
  const [autoPrint, setAutoPrint] = useState(false);

  const isReadOnly = role === "viewer";

  /* ------------------------------ loading ------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const [doc, me] = await Promise.all([
          api.getDocument(params.id),
          api.me(),
        ]);
        const m = doc.content?.margins;
        if (m && Number.isFinite(m.left) && Number.isFinite(m.right)) {
          marginsRef.current = { left: m.left, right: m.right };
          setMargins({ left: m.left, right: m.right });
        }
        const { doc: d, objects: objs } = splitContent(doc.content);
        setContent(d);
        editorJsonRef.current = d;
        objectsRef.current = objs;
        setObjects(objs);
        setTitle(doc.title);
        setRole(doc.role || "owner");
        setIsPublic(doc.is_public || false);
        setCurrentUserId(me.id);
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  useEffect(() => {
    if (window.innerWidth <= 720) setOutlineVisible(false);
  }, []);

  useEffect(() => {
    api
      .listComments(params.id)
      .then(setComments)
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (!editorInstance) return;
    function onSel() {
      const { from, to } = editorInstance!.state.selection;
      if (from === to) return setSelectionBubble(null);
      try {
        const c = editorInstance!.view.coordsAtPos(to);
        setSelectionBubble({ x: c.left, y: c.top - 10 });
      } catch {
        setSelectionBubble(null);
      }
    }
    editorInstance.on("selectionUpdate", onSel);
    return () => {
      editorInstance.off("selectionUpdate", onSel);
    };
  }, [editorInstance]);

  /* ------------------------------- saving ------------------------------- */
  const flushSave = useCallback(async () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    const payload = pendingPayloadRef.current;
    if (!payload || isReadOnly) return;
    pendingPayloadRef.current = null;
    try {
      await api.updateDocument(params.id, payload);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [params.id, isReadOnly]);

  const scheduleSave = useCallback(
    (payload: Payload) => {
      if (isReadOnly) return;
      setSaveState("saving");
      pendingPayloadRef.current = { ...pendingPayloadRef.current, ...payload };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => flushSave(), 800);
    },
    [isReadOnly, flushSave],
  );

  function handleTitleChange(v: string) {
    setTitle(v);
    scheduleSave({ title: v });
  }

  function pushContent() {
    scheduleSave({
      content: {
        ...editorJsonRef.current,
        objects: objectsRef.current,
        margins: marginsRef.current,
      },
    });
  }
  function handleContentUpdate(json: any) {
    editorJsonRef.current = json;
    pushContent();
  }
  function applyObjects(next: PageObject[]) {
    objectsRef.current = next;
    setObjects(next);
    pushContent();
  }
  function handleMarginsChange(next: Margins) {
    marginsRef.current = next;
    setMargins(next);
    pushContent();
  }

  /* ------------------------ undo / redo (objects) ------------------------ */
  function snapshot() {
    pastRef.current.push(objectsRef.current);
    if (pastRef.current.length > 100) pastRef.current.shift();
    futureRef.current = [];
    bump((n) => n + 1);
  }
  function undo() {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(objectsRef.current);
    applyObjects(prev);
    bump((n) => n + 1);
  }
  function redo() {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(objectsRef.current);
    applyObjects(next);
    bump((n) => n + 1);
  }
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest?.(
          ".ProseMirror,input,textarea,[contenteditable='true']",
        )
      )
        return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "z") {
        e.preventDefault();
        if (e.shiftKey) redoRef.current();
        else undoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && k === "y") {
        e.preventDefault();
        redoRef.current();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ------------------------ placing objects (exact) ------------------------ */
  const nextZ = () =>
    objectsRef.current.reduce((m, o) => Math.max(m, o.z), 0) + 1;

  /** Centre of the visible part of the sheet, in page coordinates. */
  function viewCenter() {
    const page = getPage();
    if (!page) return { x: PAGE_W / 2, y: 300 };
    const sc = document
      .querySelector("[data-canvas-scroll]")
      ?.getBoundingClientRect();
    const cx = sc ? (sc.left + sc.right) / 2 : window.innerWidth / 2;
    const cy = sc
      ? (Math.max(sc.top, 0) + Math.min(sc.bottom, window.innerHeight)) / 2
      : window.innerHeight / 2;
    const n = (objectsRef.current.length % 6) * 18;
    const p = clientToPage(page, cx, cy);
    return { x: p.x + n, y: p.y + n };
  }

  function addAt(
    spec: Parameters<typeof objectFromSpec>[0],
    at?: { x: number; y: number },
  ) {
    snapshot();
    const o = placeCentered(objectFromSpec(spec, nextZ()), at ?? viewCenter());
    applyObjects([...objectsRef.current, o]);
  }

  function addImage(src: string, w: number, h: number) {
    addAt({ kind: "image", src, w, h });
  }
  function addShape(shape: ShapeKind, square = false) {
    addAt({ kind: "shape", shape, square });
  }

  async function uploadAndPlace(file: File, at?: { x: number; y: number }) {
    try {
      const asset = await api.uploadImage(file);
      const src = api.fileUrl(asset.url);
      const { w, h } = await loadImageSize(src);
      addAt({ kind: "image", src, w, h }, at);
    } catch {
      alert("Échec de l'envoi de l'image");
    }
  }
  const uploadRef = useRef(uploadAndPlace);
  uploadRef.current = uploadAndPlace;

  // Ctrl+V with an image in the clipboard
  useEffect(() => {
    const h = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) =>
        x.type.startsWith("image/"),
      );
      if (!f || isReadOnly) return;
      e.preventDefault();
      uploadRef.current(f);
    };
    window.addEventListener("paste", h);
    return () => window.removeEventListener("paste", h);
  }, [isReadOnly]);

  /* ---------------------- drag & drop onto the page ---------------------- */
  function acceptsDrag(e: React.DragEvent) {
    const t = Array.from(e.dataTransfer.types);
    return !isReadOnly && (t.includes(SHAPE_MIME) || t.includes("Files"));
  }

  function onDragOver(e: React.DragEvent) {
    if (!acceptsDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const page = getPage();
    if (!page) return;
    const p = clientToPage(page, e.clientX, e.clientY);
    const isShape = Array.from(e.dataTransfer.types).includes(SHAPE_MIME);
    const w = isShape ? 240 : 260;
    const h = isShape ? 140 : 190;
    setGhost({ x: p.x - w / 2, y: p.y - h / 2, w, h });
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setGhost(null);
  }

  async function onDrop(e: React.DragEvent) {
    setGhost(null);
    if (!acceptsDrag(e)) return;
    e.preventDefault();
    const page = getPage();
    if (!page) return;
    const p = clientToPage(page, e.clientX, e.clientY);

    const raw = e.dataTransfer.getData(SHAPE_MIME);
    if (raw) {
      try {
        const { shape, square } = JSON.parse(raw);
        addAt({ kind: "shape", shape, square: !!square }, p);
      } catch {}
      return;
    }
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    for (let i = 0; i < files.length; i++) {
      await uploadAndPlace(files[i], { x: p.x + i * 28, y: p.y + i * 28 });
    }
  }

  /* --------------------------- preview / export --------------------------- */
  function snapshotHtml(): string {
    const dom = editorInstance?.view.dom as HTMLElement | undefined;
    if (!dom) return "";
    const clone = dom.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(
        ".column-resize-handle, .ProseMirror-gapcursor, .ProseMirror-separator, .ProseMirror-widget",
      )
      .forEach((el) => el.remove());
    clone.querySelectorAll("[data-placeholder]").forEach((el) => {
      el.removeAttribute("data-placeholder");
      el.classList.remove("is-editor-empty");
    });
    clone
      .querySelectorAll(".selectedCell, .ProseMirror-selectednode")
      .forEach((el) =>
        el.classList.remove("selectedCell", "ProseMirror-selectednode"),
      );
    clone
      .querySelectorAll("[contenteditable]")
      .forEach((el) => el.removeAttribute("contenteditable"));
    return clone.innerHTML;
  }

  async function openPreview(print: boolean) {
    await flushSave();
    setPreviewHtml(snapshotHtml());
    setPreviewObjects([...objectsRef.current]);
    setAutoPrint(print);
    setPreviewOpen(true);
  }

  /* ------------------------------- comments ------------------------------- */
  function openComposerFromSelection() {
    if (!editorInstance) return;
    const { from, to } = editorInstance.state.selection;
    if (from === to)
      return alert("Sélectionnez d'abord le passage à commenter.");
    const quotedText = editorInstance.state.doc.textBetween(from, to, " ");
    const c = editorInstance.view.coordsAtPos(to);
    setSelectionBubble(null);
    setComposer({
      quotedText,
      position: {
        x: Math.min(c.left, window.innerWidth - 300),
        y: c.bottom + 8,
      },
    });
  }

  async function submitComment(text: string) {
    if (!editorInstance) return;
    const created = await api.createComment(
      params.id,
      composer?.quotedText || null,
      text,
    );
    editorInstance.chain().setCommentMark(created.id).run();
    setComposer(null);
    setComments((p) => [...p, created]);
    setCommentsVisible(true);
  }

  async function handleResolve(c: Comment, resolved: boolean) {
    const u = await api.resolveComment(params.id, c.id, resolved);
    setComments((p) => p.map((x) => (x.id === c.id ? u : x)));
  }

  async function handleDelete(c: Comment) {
    await api.deleteComment(params.id, c.id);
    editorInstance?.chain().unsetCommentMarkById(c.id).run();
    setComments((p) => p.filter((x) => x.id !== c.id));
    setDetailCommentId(null);
  }

  function handleCanvasClick(e: React.MouseEvent) {
    const t = (e.target as HTMLElement).closest("[data-comment-id]");
    const id = t?.getAttribute("data-comment-id");
    if (id) setDetailCommentId(id);
  }

  if (loading)
    return <div className={styles.loading}>Chargement du document…</div>;

  const saveLabel: Record<SaveState, string> = {
    idle: "",
    saving: "Enregistrement…",
    saved: "Enregistré",
    error: "Échec de l'enregistrement",
  };
  const saveIcon: Record<SaveState, JSX.Element | null> = {
    idle: null,
    saving: <Loader2 size={13} className={styles.spinIcon} />,
    saved: <Check size={13} />,
    error: <AlertCircle size={13} />,
  };

  const unresolved = comments.filter((c) => !c.resolved).length;
  const detailComment = comments.find((c) => c.id === detailCommentId) || null;
  const canDeleteDetail =
    !!detailComment &&
    (role === "owner" || detailComment.author.id === currentUserId);

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <Link href="/dashboard" className={styles.back}>
          <ArrowLeft size={15} />{" "}
          <span className={styles.backLabel}>Documents</span>
        </Link>
        <button
          className={styles.sideToggle}
          onClick={() => setOutlineVisible((v) => !v)}
          title="Afficher/masquer la structure"
        >
          <PanelLeft size={16} />
        </button>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          aria-label="Titre du document"
          readOnly={isReadOnly}
        />
        {isReadOnly && (
          <span className={styles.readOnlyBadge}>Lecture seule</span>
        )}
        <span className={styles.saveStatus} data-state={saveState}>
          {saveIcon[saveState]} {saveLabel[saveState]}
        </span>
        <button
          className={styles.iconBtn}
          onClick={() => setCommentsVisible((v) => !v)}
          title="Suggestions"
        >
          <MessageSquare size={16} />
          {unresolved > 0 && ` (${unresolved})`}
        </button>
        {role === "owner" && (
          <button
            className={styles.shareBtn}
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={14} />{" "}
            <span className={styles.btnLabel}>Partager</span>
          </button>
        )}
        <button className={styles.glance} onClick={() => openPreview(false)}>
          <Eye size={14} /> <span className={styles.btnLabel}>Aperçu</span>
        </button>
        <button className={styles.exportBtn} onClick={() => openPreview(true)}>
          <Download size={14} />{" "}
          <span className={styles.btnLabel}>Exporter</span>
        </button>
      </div>

      <Toolbar
        editor={editorInstance}
        onComment={openComposerFromSelection}
        readOnly={isReadOnly}
        onAddImage={addImage}
        onAddShape={addShape}
      />

      <div className={styles.body}>
        {editorInstance && (
          <OutlinePanel
            editor={editorInstance}
            visible={outlineVisible}
            onClose={() => setOutlineVisible(false)}
          />
        )}

        <div
          className={styles.canvasArea}
          data-canvas-scroll
          onClick={handleCanvasClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <Editor
            content={content}
            onReady={setEditorInstance}
            onUpdate={handleContentUpdate}
            editable={!isReadOnly}
            margins={margins}
            onMarginsChange={handleMarginsChange}
            minHeight={pageHeightFor(objects)}
            zoom={zoom}
          >
            {(scale) => (
              <ObjectsLayer
                objects={objects}
                onChange={applyObjects}
                onSnapshot={snapshot}
                editable={!isReadOnly}
                zoom={scale}
                ghost={ghost}
              />
            )}
          </Editor>
        </div>

        <CommentsPanel
          comments={comments}
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          onOpen={setDetailCommentId}
        />
      </div>

      {!isReadOnly && (
        <div className={styles.fab}>
          <button
            onClick={undo}
            disabled={!pastRef.current.length}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!futureRef.current.length}
            title="Rétablir (Ctrl+Maj+Z)"
          >
            <Redo2 size={16} />
          </button>
          <span className={styles.fabSep} />
          <button
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            title="Réduire"
          >
            <Minus size={16} />
          </button>
          <span className={styles.fabLabel}>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(2)))}
            title="Agrandir"
          >
            <Plus size={16} />
          </button>
          <button onClick={() => setZoom(1)} title="Ajuster à l'écran">
            <Maximize size={15} />
          </button>
        </div>
      )}

      {selectionBubble && !composer && (
        <button
          className={selectionStyles.bubble}
          style={{ top: selectionBubble.y, left: selectionBubble.x }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={openComposerFromSelection}
        >
          <MessageSquarePlus size={14} /> Commenter
        </button>
      )}

      {composer && (
        <CommentComposer
          quotedText={composer.quotedText}
          position={composer.position}
          onSubmit={submitComment}
          onClose={() => setComposer(null)}
        />
      )}

      {detailComment && (
        <CommentDetailModal
          comment={detailComment}
          canDelete={canDeleteDetail}
          onResolve={(r) => handleResolve(detailComment, r)}
          onDelete={() => handleDelete(detailComment)}
          onClose={() => setDetailCommentId(null)}
        />
      )}

      {shareOpen && (
        <ShareModal
          documentId={params.id}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
          onClose={() => setShareOpen(false)}
        />
      )}

      {previewOpen && (
        <PdfPreviewModal
          title={title}
          html={previewHtml}
          objects={previewObjects}
          margins={margins}
          autoPrint={autoPrint}
          onClose={() => {
            setPreviewOpen(false);
            setAutoPrint(false);
          }}
        />
      )}
    </div>
  );
}
