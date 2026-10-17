"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers, Undo2, Redo2 } from "lucide-react";
import { api, PosterElement } from "@/lib/api";
import PosterCanvas from "@/components/poster/PosterCanvas";
import PosterToolbar from "@/components/poster/PosterToolbar";
import LayersPanel from "@/components/poster/LayersPanel";
import TemplatePickerModal from "@/components/poster/TemplatePickerModal";
import PosterPreviewModal from "@/components/poster/PosterPreviewModal";
import { PosterTemplate } from "@/components/poster/posterTemplates";
import styles from "./posterpage.module.css";

type SaveState = "saved" | "saving" | "error" | "idle";
const MOBILE_BREAKPOINT = 860;
const MAX_HISTORY = 50;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isMobileViewport() {
  return (
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
}

export default function PosterPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(1100);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [elements, setElements] = useState<PosterElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [removingBackground, setRemovingBackground] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [scale, setScale] = useState(1);
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<PosterElement[][]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistoryRef = useRef(false);

  // --- Chargement initial ---
  useEffect(() => {
    (async () => {
      try {
        const poster = await api.getPoster(params.id);
        setTitle(poster.title);
        setWidth(poster.width);
        setHeight(poster.height);
        setBackgroundColor(poster.background_color || "#ffffff");
        const initialElements = poster.elements || [];
        setElements(initialElements);
        historyRef.current = [initialElements];
        historyIndexRef.current = 0;
        if (initialElements.length === 0 && searchParams.get("new") === "1") {
          setTemplatePickerOpen(true);
        }
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router]);

  // --- Mise à l'échelle responsive : le canvas (souvent plus large que
  // l'écran) est réduit pour tenir sur mobile, sans jamais dépasser 100%
  // de sa taille réelle sur desktop. ---
  useEffect(() => {
    function computeScale() {
      const available = window.innerWidth - (isMobileViewport() ? 32 : 96);
      setScale(Math.min(1, available / width));
    }
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [width]);

  // Sur mobile, le panneau de calques s'affiche par-dessus (overlay) plutôt
  // qu'en permanence à côté du canvas : masqué par défaut pour laisser toute
  // la place à la composition.
  useEffect(() => {
    if (isMobileViewport()) setLayersOpen(false);
  }, []);

  const scheduleSave = useCallback(
    (payload: {
      title?: string;
      elements?: PosterElement[];
      background_color?: string;
    }) => {
      setSaveState("saving");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await api.updatePoster(params.id, payload);
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      }, 800);
    },
    [params.id],
  );

  function pushHistory(next: PosterElement[]) {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
    } else {
      const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
      trimmed.push(next);
      if (trimmed.length > MAX_HISTORY) trimmed.shift();
      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
    }
    setHistoryState({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
  }

  function persistElements(next: PosterElement[]) {
    setElements(next);
    pushHistory(next);
    scheduleSave({ elements: next });
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const prev = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setElements(prev);
    setSelectedId(null);
    scheduleSave({ elements: prev });
    setHistoryState({ canUndo: historyIndexRef.current > 0, canRedo: true });
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const next = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setElements(next);
    setSelectedId(null);
    scheduleSave({ elements: next });
    setHistoryState({
      canUndo: true,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave({ title: value });
  }

  function handleBackgroundChange(color: string) {
    setBackgroundColor(color);
    scheduleSave({ background_color: color });
  }

  function nextZIndex() {
    return elements.reduce((max, e) => Math.max(max, e.zIndex), 0) + 1;
  }

  function applyTemplate(template: PosterTemplate | null) {
    setTemplatePickerOpen(false);
    if (!template) return;
    persistElements(template.elements.map((e) => ({ ...e, id: uid() })));
  }

  function addText() {
    const el: PosterElement = {
      id: uid(),
      type: "text",
      x: width / 2 - 120,
      y: height / 2 - 20,
      width: 240,
      height: 48,
      rotation: 0,
      zIndex: nextZIndex(),
      text: "Votre texte",
      fontSize: 28,
      color: "#1c1b22",
      fontFamily: "'Source Serif 4', serif",
      align: "center",
      fontWeight: 600,
    };
    persistElements([...elements, el]);
    setSelectedId(el.id);
  }

  function addShape(shapeType: "rectangle" | "circle" | "line") {
    const size =
      shapeType === "line"
        ? { width: 220, height: 4 }
        : { width: 180, height: 180 };
    const el: PosterElement = {
      id: uid(),
      type: "shape",
      x: width / 2 - size.width / 2,
      y: height / 2 - size.height / 2,
      ...size,
      rotation: 0,
      zIndex: nextZIndex(),
      shapeType,
      fill: shapeType === "line" ? "transparent" : "#4b3f72",
      borderColor: "#4b3f72",
      borderWidth: 3,
    };
    persistElements([...elements, el]);
    setSelectedId(el.id);
  }

  async function addImage(file: File) {
    const asset = await api.uploadImage(file);
    const el: PosterElement = {
      id: uid(),
      type: "image",
      x: width / 2 - 150,
      y: height / 2 - 100,
      width: 300,
      height: 200,
      rotation: 0,
      zIndex: nextZIndex(),
      src: api.fileUrl(asset.url),
    };
    persistElements([...elements, el]);
    setSelectedId(el.id);
  }

  async function fillShapeImage(file: File) {
    if (!selectedId) return;
    const asset = await api.uploadImage(file);
    updateElement(selectedId, { fillImage: api.fileUrl(asset.url) } as any);
  }

  function updateElement(id: string, patch: Partial<PosterElement>) {
    persistElements(
      elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }

  function deleteElement(id: string) {
    persistElements(elements.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateElement(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const copy: PosterElement = {
      ...el,
      id: uid(),
      x: el.x + 24,
      y: el.y + 24,
      zIndex: nextZIndex(),
    };
    persistElements([...elements, copy]);
    setSelectedId(copy.id);
  }

  function reorderElement(id: string, direction: "up" | "down") {
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === id);
    const swapIdx = direction === "up" ? idx + 1 : idx - 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const az = a.zIndex;
    a.zIndex = b.zIndex;
    b.zIndex = az;
    persistElements(sorted);
  }

  function reorderByDrag(draggedId: string, targetId: string) {
    const sortedDesc = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    const draggedIdx = sortedDesc.findIndex((e) => e.id === draggedId);
    const targetIdx = sortedDesc.findIndex((e) => e.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const next = [...sortedDesc];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, moved);

    const total = next.length;
    const withNewZ = next.map((el, i) => ({ ...el, zIndex: total - i }));
    persistElements(withNewZ);
  }

  function toggleVisible(id: string) {
    updateElement(id, {
      visible:
        elements.find((e) => e.id === id)?.visible === false ? true : false,
    });
  }

  function toggleLock(id: string) {
    updateElement(id, { locked: !elements.find((e) => e.id === id)?.locked });
  }

  async function removeBackground() {
    const el = elements.find((e) => e.id === selectedId);
    if (!el || el.type !== "image" || !el.src) return;
    setRemovingBackground(true);
    try {
      const sourceResponse = await fetch(el.src);
      if (!sourceResponse.ok)
        throw new Error("Impossible de récupérer l'image source");
      const sourceBlob = await sourceResponse.blob();

      const { removeBackground: removeBg } =
        await import("@imgly/background-removal");
      const resultBlob = await removeBg(sourceBlob);
      const file = new File([resultBlob], "sans-fond.png", {
        type: "image/png",
      });
      const asset = await api.uploadImage(file);
      updateElement(el.id, { src: api.fileUrl(asset.url) });
    } catch (e: any) {
      console.error("Échec du retrait d'arrière-plan :", e);
      alert(
        "Le retrait d'arrière-plan a échoué : " +
          (e?.message || "erreur inconnue"),
      );
    } finally {
      setRemovingBackground(false);
    }
  }

  // --- Raccourcis clavier : Suppr/Retour arrière pour l'élément
  // sélectionné, Ctrl/Cmd+Z pour annuler, Ctrl/Cmd+Maj+Z pour rétablir. ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditingText =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA");

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        !isEditingText
      ) {
        e.preventDefault();
        deleteElement(selectedId);
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "z" &&
        !isEditingText
      ) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, elements]);

  if (loading) {
    return <div className={styles.loading}>Chargement de l'affiche…</div>;
  }

  const saveLabel: Record<SaveState, string> = {
    idle: "",
    saving: "Enregistrement…",
    saved: "Enregistré",
    error: "Échec de l'enregistrement",
  };

  const selected = elements.find((e) => e.id === selectedId) || null;

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <Link href="/dashboard" className={styles.back}>
          <ArrowLeft size={15} />
          <span className={styles.backLabel}>Documents</span>
        </Link>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          aria-label="Titre de l'affiche"
        />
        <span className={styles.saveStatus} data-state={saveState}>
          {saveLabel[saveState]}
        </span>

        <button
          className={styles.iconOnlyBtn}
          onClick={undo}
          disabled={!historyState.canUndo}
          title="Annuler"
        >
          <Undo2 size={16} />
        </button>
        <button
          className={styles.iconOnlyBtn}
          onClick={redo}
          disabled={!historyState.canRedo}
          title="Rétablir"
        >
          <Redo2 size={16} />
        </button>
        <button
          className={styles.iconOnlyBtn}
          onClick={() => setLayersOpen((o) => !o)}
          title="Afficher/masquer les calques"
        >
          <Layers size={16} />
        </button>
        <button
          className={styles.templateBtn}
          onClick={() => setTemplatePickerOpen(true)}
        >
          Modèles
        </button>
      </div>

      <PosterToolbar
        selected={selected}
        backgroundColor={backgroundColor}
        onBackgroundChange={handleBackgroundChange}
        onAddText={addText}
        onAddShape={addShape}
        onAddImage={addImage}
        onUpdateSelected={(patch) =>
          selectedId && updateElement(selectedId, patch)
        }
        onDuplicateSelected={() => selectedId && duplicateElement(selectedId)}
        onDeleteSelected={() => selectedId && deleteElement(selectedId)}
        onRemoveBackground={removeBackground}
        removingBackground={removingBackground}
        onFillShapeImage={fillShapeImage}
        onPreview={() => setPreviewOpen(true)}
      />

      <div className={styles.body}>
        {layersOpen && (
          <LayersPanel
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorderElement}
            onReorderDrag={reorderByDrag}
            onToggleVisible={toggleVisible}
            onToggleLock={toggleLock}
            onDelete={deleteElement}
            onClose={() => setLayersOpen(false)}
          />
        )}

        <PosterCanvas
          ref={canvasRef}
          width={width}
          height={height}
          scale={scale}
          background={backgroundColor}
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={updateElement}
          onDelete={deleteElement}
        />
      </div>

      {templatePickerOpen && (
        <TemplatePickerModal
          onPick={applyTemplate}
          onClose={() => setTemplatePickerOpen(false)}
        />
      )}

      {previewOpen && (
        <PosterPreviewModal
          canvasEl={canvasRef.current}
          title={title}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
