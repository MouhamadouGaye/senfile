"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import styles from "./posterpreview.module.css";

type Format = "png" | "jpeg";

type Props = {
  canvasEl: HTMLElement | null;
  title: string;
  onClose: () => void;
};

export default function PosterPreviewModal({ canvasEl, title, onClose }: Props) {
  const [format, setFormat] = useState<Format>("png");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!canvasEl) return;
      setLoading(true);
      setError(null);
      try {
        const htmlToImage = await import("html-to-image");
        const fn = format === "png" ? htmlToImage.toPng : htmlToImage.toJpeg;
        const url = await fn(canvasEl, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: format === "jpeg" ? "#ffffff" : undefined,
          quality: format === "jpeg" ? 0.92 : undefined,
        });
        if (!cancelled) setDataUrl(url);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Échec de la génération de l'aperçu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [canvasEl, format]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${title || "affiche"}.${format === "jpeg" ? "jpg" : "png"}`;
    a.click();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Aperçu — {title}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className={styles.previewArea}>
          {loading && (
            <div className={styles.loading}>
              <span className={styles.spinner} />
              Génération de l'image…
            </div>
          )}
          {error && <div className={styles.loading}>{error}</div>}
          {!loading && !error && dataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="Aperçu de l'affiche" className={styles.previewImg} />
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.formatGroup}>
            <button className={styles.formatBtn} data-active={format === "png"} onClick={() => setFormat("png")}>
              PNG
            </button>
            <button className={styles.formatBtn} data-active={format === "jpeg"} onClick={() => setFormat("jpeg")}>
              JPEG
            </button>
          </div>
          <button className={styles.downloadBtn} onClick={download} disabled={!dataUrl}>
            <Download size={15} /> Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}
