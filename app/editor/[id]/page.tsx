"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Editor as TiptapEditor } from "@tiptap/react";
import { api, Comment, Role, User } from "@/lib/api";
import Toolbar from "@/components/Toolbar";
import Editor from "@/components/Editor";
import OutlinePanel from "@/components/OutlinePanel";
import CommentsPanel from "@/components/CommentsPanel";
import CommentComposer from "@/components/CommentComposer";
import CommentDetailModal from "@/components/CommentDetailModal";
import ShareModal from "@/components/ShareModal";
import PdfPreviewModal from "@/components/PdfPreviewModal";
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
} from "lucide-react";
import selectionStyles from "@/components/selection-bubble.module.css";
import styles from "./editorpage.module.css";
import {
  makeImage,
  makeShape,
  PageObject,
  ShapeKind,
  splitContent,
} from "@/lib/objets";
import ObjectsLayer from "@/components/ObjectLayer";
import type { Margins } from "@/components/MarginRuler";
import type { JSONContent } from "@tiptap/core";

type SaveState = "saved" | "saving" | "error" | "idle";

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
  const pendingPayloadRef = useRef<{ title?: string; content?: any } | null>(
    null,
  );

  const [outlineVisible, setOutlineVisible] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailCommentId, setDetailCommentId] = useState<string | null>(null);
  const [composer, setComposer] = useState<{
    quotedText: string;
    position: { x: number; y: number };
  } | null>(null);
  const [selectionBubble, setSelectionBubble] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [previewDoc, setPreviewDoc] = useState<PageObject[]>([]);

  // state
  const [objects, setObjects] = useState<PageObject[]>([]);
  const objectsRef = useRef<PageObject[]>([]);
  const editorJsonRef = useRef<any>(null);

  const [margins, setMargins] = useState<Margins>({ left: 72, right: 72 });
  const marginsRef = useRef<Margins>({ left: 72, right: 72 });
  const [autoPrint, setAutoPrint] = useState(false);
  const [username, setUsername] = useState<String>("");

  const isReadOnly = role === "viewer";

  useEffect(() => {
    (async () => {
      try {
        const [doc, me] = await Promise.all([
          api.getDocument(params.id),
          api.me(),
        ]);

        const m = doc.content?.margins;
        if (m && Number.isFinite(m.left) && Number.isFinite(m.right)) {
          marginsRef.current = m;
          setMargins(m);
        }

        const { doc: d, objects: objs } = splitContent(doc.content);
        setContent(d);
        editorJsonRef.current = d;
        objectsRef.current = objs;
        setObjects(objs);
        setTitle(doc.title);
        // setContent(doc.content);
        setRole(doc.role || "owner");
        setIsPublic(doc.is_public || false);
        setCurrentUserId(me.id);
        setUsername(me.name);
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  useEffect(() => {
    // Sur mobile, le document seul suffit par défaut : on masque la structure
    // pour laisser toute la place à l'écriture.
    if (typeof window !== "undefined" && window.innerWidth <= 720) {
      setOutlineVisible(false);
    }

    if (typeof window !== "undefined" && window.innerWidth <= 720) {
      setOutlineVisible(false);
    }
  }, []);

  useEffect(() => {
    api
      .listComments(params.id)
      .then(setComments)
      .catch(() => {});
  }, [params.id]);

  // Bulle flottante "💬" qui apparaît automatiquement dès qu'une sélection
  // de texte non vide existe — plus rapide que d'aller chercher un bouton
  // dans la barre d'outils à chaque suggestion.
  useEffect(() => {
    if (!editorInstance) return;
    function onSelectionUpdate() {
      const { from, to } = editorInstance!.state.selection;
      if (from === to) {
        setSelectionBubble(null);
        return;
      }
      try {
        const coords = editorInstance!.view.coordsAtPos(to);
        setSelectionBubble({ x: coords.left, y: coords.top - 10 });
      } catch {
        setSelectionBubble(null);
      }
    }
    editorInstance.on("selectionUpdate", onSelectionUpdate);
    return () => {
      editorInstance.off("selectionUpdate", onSelectionUpdate);
    };
  }, [editorInstance]);

  const scheduleSave = useCallback(
    (payload: { title?: string; content?: any }) => {
      if (isReadOnly) return;
      setSaveState("saving");
      pendingPayloadRef.current = { ...pendingPayloadRef.current, ...payload };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        flushSave();
      }, 800);
    },
    [params.id, isReadOnly],
  );

  // Force l'envoi immédiat de la sauvegarde en attente : indispensable
  // avant un export/aperçu, sinon le serveur (qui lit la base de données)
  // peut encore avoir l'ancienne position d'une image ou d'une forme
  // glissée à l'instant — le debounce de 800ms n'aurait pas encore eu le
  // temps de partir.
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

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave({ title: value });
  }

  // function handleContentUpdate(json: any) {
  //   scheduleSave({ content: json });
  // }

  function pushContent() {
    scheduleSave({
      content: {
        ...editorJsonRef.current,
        objects: objectsRef.current,
        margins: marginsRef.current,
      },
    });
  }

  function handleMarginsChange(next: Margins) {
    marginsRef.current = next;
    setMargins(next);
    pushContent();
  }
  function handleContentUpdate(json: any) {
    editorJsonRef.current = json;
    pushContent();
  }
  function handleObjectsChange(next: PageObject[]) {
    objectsRef.current = next;
    setObjects(next);
    pushContent();
  }

  const nextZ = () =>
    objectsRef.current.reduce((m, o) => Math.max(m, o.z), 0) + 1;

  const PAGE_W = 794;
  const PAGE_H = 1123;
  const SAFE = 30;

  function spawnPoint(w: number, h: number) {
    const page = document.querySelector(
      "[data-page-surface]",
    ) as HTMLElement | null;
    if (!page) return { x: 80, y: 80 };
    const s = parseFloat(page.dataset.scale || "1") || 1;
    const pr = page.getBoundingClientRect();
    const scroller = page.closest("[data-canvas-scroll]") as HTMLElement | null;
    const sr = scroller?.getBoundingClientRect();

    const visTop = Math.max(0, (Math.max(0, sr?.top ?? 0) - pr.top) / s);
    const visBottom = Math.min(
      pr.height / s,
      (Math.min(window.innerHeight, sr?.bottom ?? window.innerHeight) -
        pr.top) /
        s,
    );

    const n = (objectsRef.current.length % 6) * 18;
    let y = visTop + (visBottom - visTop - h) / 2 + n;
    const idx = Math.max(
      0,
      Math.floor((visTop + (visBottom - visTop) / 2) / PAGE_H),
    );
    const lo = idx * PAGE_H + SAFE;
    const hi = (idx + 1) * PAGE_H - SAFE - h;
    y = Math.max(lo, Math.min(y, Math.max(lo, hi)));

    return { x: Math.max(20, (PAGE_W - w) / 2 + n), y: Math.round(y) };
  }

  function addImage(src: string, nw: number, nh: number) {
    const w = Math.min(360, nw),
      h = (w * nh) / nw;
    const p = spawnPoint(w, h);
    handleObjectsChange([
      ...objectsRef.current,
      makeImage(src, p.x, p.y, w, h, nextZ()),
    ]);
  }

  function addShape(kind: ShapeKind, square = false) {
    const p = spawnPoint(240, 140);
    handleObjectsChange([
      ...objectsRef.current,
      makeShape(kind, p.x, p.y, nextZ(), square),
    ]);
  }

  // async function handleExportPdf() {
  //   await flushSave();
  //   api.exportPdf(params.id, title).catch((e) => alert(e.message));
  // }

  // async function handleOpenPreview() {
  //   await flushSave();
  //   setPreviewOpen(true);
  // }
  // async function openPreview(print: boolean) {
  //   await flushSave();
  //   // Live snapshot of the text, straight from the editor
  //   setPreviewDoc(editorInstance?.getJSON() ?? editorJsonRef.current ?? null);
  //   setAutoPrint(print);
  //   setPreviewOpen(true);
  // }
  const [previewHtml, setPreviewHtml] = useState("");

  /** Copie propre du DOM réel de l'éditeur (même rendu que l'écran). */
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
    setPreviewDoc([...objectsRef.current]);
    setAutoPrint(print);
    setPreviewOpen(true);
  }
  const handleOpenPreview = () => openPreview(false);
  const handleExportPdf = () => openPreview(true);

  function openComposerFromSelection() {
    if (!editorInstance) return;
    const { from, to } = editorInstance.state.selection;
    if (from === to) {
      alert("Sélectionnez d'abord le passage à commenter.");
      return;
    }
    const quotedText = editorInstance.state.doc.textBetween(from, to, " ");
    const coords = editorInstance.view.coordsAtPos(to);
    setSelectionBubble(null);
    setComposer({
      quotedText,
      position: {
        x: Math.min(coords.left, window.innerWidth - 300),
        y: coords.bottom + 8,
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
    setComments((prev) => [...prev, created]);
    setCommentsVisible(true);
  }

  function openCommentDetail(commentId: string) {
    setDetailCommentId(commentId);
  }

  async function handleResolve(comment: Comment, resolved: boolean) {
    const updated = await api.resolveComment(params.id, comment.id, resolved);
    setComments((prev) => prev.map((c) => (c.id === comment.id ? updated : c)));
  }

  async function handleDelete(comment: Comment) {
    await api.deleteComment(params.id, comment.id);
    editorInstance?.chain().unsetCommentMarkById(comment.id).run();
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    setDetailCommentId(null);
  }

  // Clic sur un passage surligné dans le document : ouvre directement le
  // popup de détail de la suggestion correspondante (comme un clic sur la
  // puce dans le panneau de droite).
  function handleCanvasClick(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest("[data-comment-id]");
    if (target) {
      const id = target.getAttribute("data-comment-id");
      if (id) openCommentDetail(id);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement du document…</div>;
  }

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

  const detailComment = comments.find((c) => c.id === detailCommentId) || null;
  const canDeleteDetail =
    !!detailComment &&
    (role === "owner" || detailComment.author.id === currentUserId);

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <Link href="/dashboard" className={styles.back}>
          <ArrowLeft size={15} />
          Documents
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
          {comments.filter((c) => !c.resolved).length > 0 &&
            ` (${comments.filter((c) => !c.resolved).length})`}
        </button>
        {role === "owner" && (
          <button
            className={styles.shareBtn}
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={14} /> Partager
          </button>
        )}
        <button className={styles.glance} onClick={handleOpenPreview}>
          <Eye size={14} /> Aperçu
        </button>
        <button className={styles.exportBtn} onClick={handleExportPdf}>
          <Download size={14} /> Exporter
        </button>
        <h3 className={styles.userName}>{username}</h3>
      </div>

      {/* <Toolbar
        editor={editorInstance}
        onComment={openComposerFromSelection}
        readOnly={isReadOnly}
      /> */}

      <Toolbar
        editor={editorInstance}
        onComment={openComposerFromSelection}
        readOnly={isReadOnly}
        onAddImage={addImage}
        onAddShape={addShape}
      />

      <div className={styles.body}>
        {editorInstance && (
          <OutlinePanel editor={editorInstance} visible={outlineVisible} />
        )}

        <div className={styles.canvasArea} onClick={handleCanvasClick}>
          <Editor
            content={content}
            onReady={setEditorInstance}
            onUpdate={handleContentUpdate}
            editable={!isReadOnly}
            margins={margins}
            onMarginsChange={handleMarginsChange}
          >
            <ObjectsLayer
              objects={objects}
              onChange={handleObjectsChange}
              editable={!isReadOnly}
            />
          </Editor>
        </div>

        <CommentsPanel
          comments={comments}
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          onOpen={openCommentDetail}
        />
      </div>

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
          onResolve={(resolved) => handleResolve(detailComment, resolved)}
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
          objects={previewDoc}
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
