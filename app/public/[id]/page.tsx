"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, LogIn, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import Editor from "@/components/Editor";
import styles from "./publicpage.module.css";
import { Margins } from "@/components/MarginRuler";

export default function PublicDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [margins, setMargins] = useState<Margins>({ left: 72, right: 72 });
  const marginsRef = useRef<Margins>({ left: 72, right: 72 });

  useEffect(() => {
    api
      .getPublicDocument(id)
      .then((doc) => {
        setTitle(doc.title);
        setContent(doc.content);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function download() {
    setDownloading(true);
    try {
      await api.downloadPublicPdf(id, title);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  function handleMarginsChange(next: Margins) {
    marginsRef.current = next;
    setMargins(next);
  }

  if (loading) {
    return <div className={styles.loading}>Chargement…</div>;
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              marginBottom: 8,
            }}
          >
            Document introuvable
          </h1>
          <p>
            Ce document n'existe pas ou n'a pas été rendu public par son
            propriétaire.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/" style={{ color: "var(--accent)" }}>
              ← Retour à l'accueil
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.floatingBar}>
        <Link href="/" className={styles.brand}>
          Atelier
          <span className={styles.badge}>
            <Sparkles size={11} /> Lecture seule
          </span>
        </Link>

        <div className={styles.actions}>
          <Link href="/register" className={styles.ctaBtn}>
            <LogIn size={14} /> <span>Créer un compte</span>
          </Link>
          <button
            className={styles.downloadBtn}
            onClick={download}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 size={15} className={styles.spin} />
            ) : (
              <Download size={15} />
            )}
            <span>{downloading ? "Préparation…" : "Télécharger le PDF"}</span>
          </button>
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.documentShell}>
          <Editor
            content={content}
            onReady={() => {}}
            onUpdate={() => {}}
            editable={false}
            margins={margins}
            onMarginsChange={handleMarginsChange}
          />
        </div>
      </div>

      <div className={styles.bottomCta}>
        <h2 className={styles.bottomTitle}>
          Envie de créer votre propre document ?
        </h2>
        <p className={styles.bottomText}>
          Composez du texte, des images, des tableaux, des formes et des
          graphiques dans un éditeur moderne et intuitif — gratuit pour
          commencer.
        </p>
        <div className={styles.bottomActions}>
          <Link href="/register" className={styles.primaryCta}>
            <LogIn size={15} /> Créer mon compte
          </Link>
          <button
            className={styles.secondaryCta}
            onClick={download}
            disabled={downloading}
          >
            <Download size={15} style={{ marginRight: 6 }} />
            Télécharger ce document
          </button>
        </div>
      </div>
    </div>
  );
}
