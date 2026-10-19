"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  clearToken,
  DocumentSummary,
  PosterSummary,
  User,
} from "@/lib/api";
import styles from "./dashboard.module.css";

type Tab = "documents" | "posters" | "sheet";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [posters, setPosters] = useState<PosterSummary[]>([]);
  const [tab, setTab] = useState<Tab>("documents");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [showBugNotice, setShowBugNotice] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [me, documents, posterList] = await Promise.all([
          api.me(),
          api.listDocuments(),
          api.listPosters(),
        ]);
        setUser(me);
        setDocs(documents);
        setPosters(posterList);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleCreateDocument() {
    setCreating(true);
    setNewMenuOpen(false);
    try {
      const doc = await api.createDocument();
      router.push(`/editor/${doc.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreatePoster() {
    setCreating(true);
    setNewMenuOpen(false);
    try {
      const poster = await api.createPoster();
      router.push(`/poster/${poster.id}?new=1`);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreatePublicDocument() {
    setCreating(true);
    setNewMenuOpen(false);
    try {
      const doc = await api.createDocument("Document public sans titre");
      await api.togglePublic(doc.id, true);
      router.push(`/editor/${doc.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm("Supprimer ce document définitivement ?")) return;
    await api.deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleDuplicateDoc(id: string) {
    const copy = await api.duplicateDocument(id);
    setDocs((prev) => [copy, ...prev]);
  }

  async function handleDeletePoster(id: string) {
    if (!confirm("Supprimer cette affiche définitivement ?")) return;
    await api.deletePoster(id);
    setPosters((prev) => prev.filter((p) => p.id !== id));
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBugNotice(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  if (loading) {
    return <div className={styles.loading}>Chargement…</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>MGaye</span>

        <div className={styles.userZone}>
          <span className={styles.call} onClick={() => router.push("/call")}>
            Discussion
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Déconnexion
          </button>
          <h2 className={styles.userName}>{user?.name}</h2>
        </div>
      </header>
      {/* Warning pour la Maintenance de l'app */}

      {showBugNotice && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-notice-title"
          >
            <button
              className={styles.closeButton}
              onClick={() => setShowBugNotice(false)}
              aria-label="Fermer"
            >
              ×
            </button>

            <div className={styles.icon}>🔧</div>

            <h2 id="bug-notice-title">Corrections en cours</h2>

            <p>
              Nous effectuons actuellement quelques corrections et améliorations
              afin de rendre le site plus stable et agréable à utiliser.
            </p>

            <p>
              Certaines fonctionnalités peuvent donc présenter des comportements
              inhabituels pendant cette phase.
            </p>

            <button
              className={styles.confirmButton}
              onClick={() => setShowBugNotice(false)}
            >
              Compris
            </button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              className={styles.tabBtn}
              data-active={tab === "documents"}
              onClick={() => setTab("documents")}
            >
              Documents
            </button>
            <button
              className={styles.tabBtn}
              data-active={tab === "posters"}
              onClick={() => setTab("posters")}
            >
              Affiches
            </button>

            <button
              className={styles.tabBtn}
              data-active={tab === "sheet"}
              onClick={() =>
                window.open(
                  "https://app.avecsonko.org/sheet",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Sheet
            </button>
          </div>

          <div className={styles.newMenuWrap}>
            <button
              className={styles.newBtn}
              onClick={() => setNewMenuOpen((o) => !o)}
              disabled={creating}
            >
              {creating ? "Création…" : "+ Nouveau"}
            </button>
            {newMenuOpen && (
              <div className={styles.newMenu}>
                <button
                  className={styles.newMenuItem}
                  onClick={handleCreateDocument}
                >
                  📄 Document
                </button>
                <button
                  className={styles.newMenuItem}
                  onClick={handleCreatePoster}
                >
                  🎨 Affiche
                </button>
                <button
                  className={styles.newMenuItem}
                  onClick={handleCreatePublicDocument}
                >
                  🌐 Document public
                </button>
              </div>
            )}
          </div>
        </div>

        {tab === "documents" ? (
          docs.length === 0 ? (
            <div className={styles.empty}>
              <p>Vous n'avez pas encore de document.</p>
              <p className={styles.emptySub}>
                Créez le premier pour commencer à écrire.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className={styles.card}
                  onClick={() => router.push(`/editor/${doc.id}`)}
                >
                  <div className={styles.cardPreview}>
                    {doc.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={api.fileUrl(doc.thumbnail_url)} alt="" />
                    ) : (
                      <span className={styles.cardPreviewInitial}>
                        {doc.title.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {doc.role && doc.role !== "owner" && (
                      <span className={styles.roleBadge}>
                        {doc.role === "editor" ? "Éditeur" : "Lecteur"}
                      </span>
                    )}
                    {doc.is_public && (
                      <span className={styles.publicBadge}>🌐 Public</span>
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardTitle}>{doc.title}</span>
                    <span className={styles.cardDate}>
                      Modifié le{" "}
                      {new Date(doc.updated_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.duplicateBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateDoc(doc.id);
                      }}
                      aria-label="Dupliquer"
                      title="Dupliquer"
                    >
                      ⧉
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc.id);
                      }}
                      aria-label="Supprimer"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : posters.length === 0 ? (
          <div className={styles.empty}>
            <p>Vous n'avez pas encore d'affiche.</p>
            <p className={styles.emptySub}>
              Créez-en une pour composer librement texte, formes et images.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {posters.map((poster) => (
              <div
                key={poster.id}
                className={styles.card}
                onClick={() => router.push(`/poster/${poster.id}`)}
              >
                <div className={styles.cardPreview}>
                  {poster.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={api.fileUrl(poster.thumbnail_url)} alt="" />
                  ) : (
                    <span className={styles.cardPreviewInitial}>
                      {poster.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardTitle}>{poster.title}</span>
                  <span className={styles.cardDate}>
                    Modifié le{" "}
                    {new Date(poster.updated_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePoster(poster.id);
                    }}
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
