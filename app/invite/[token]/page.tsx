"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "@/styles/auth.module.css";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<{
    document_title: string;
    role: string;
    email: string | null;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!window.localStorage.getItem("token"));
    api
      .previewInvite(token)
      .then(setPreview)
      .catch((e) => setPreviewError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function join() {
    setJoining(true);
    setJoinError(null);
    try {
      const { document_id } = await api.acceptInvite(token);
      router.push(`/editor/${document_id}`);
    } catch (e: any) {
      // On garde l'aperçu affiché (le lien est valide, c'est la validation
      // finale qui a échoué) et on montre le vrai message d'erreur plutôt
      // que de basculer sur un écran générique "invitation introuvable"
      // qui masquerait la cause réelle (session expirée, email différent
      // de celui invité, etc.).
      setJoinError(e.message);
    } finally {
      setJoining(false);
    }
  }

  const returnTo = `/invite/${token}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={styles.brand}>
          MGayeFile
        </Link>

        {loading ? (
          <p className={styles.subtitle}>Chargement de l'invitation…</p>
        ) : previewError ? (
          <>
            <h1 className={styles.title}>Invitation introuvable</h1>
            <p className={styles.subtitle}>{previewError}</p>
            <p className={styles.switch}>
              <Link href="/dashboard">← Retour au tableau de bord</Link>
            </p>
          </>
        ) : preview ? (
          <>
            <h1 className={styles.title}>
              Rejoindre « {preview.document_title} »
            </h1>
            <p className={styles.subtitle}>
              Vous êtes invité(e) en tant que{" "}
              <strong>
                {preview.role === "editor" ? "éditeur" : "lecteur"}
              </strong>
              {preview.email && (
                <>
                  {" "}
                  à l'adresse <strong>{preview.email}</strong>
                </>
              )}
              .
            </p>

            {joinError && (
              <p className={styles.error}>
                {joinError}
                {preview.email && (
                  <>
                    {" "}
                    Connectez-vous avec le compte utilisant l'adresse{" "}
                    <strong>{preview.email}</strong>, ou demandez un nouveau
                    lien au propriétaire du document.
                  </>
                )}
              </p>
            )}

            {loggedIn ? (
              <button
                className={styles.submit}
                onClick={join}
                disabled={joining}
              >
                {joining ? "…" : "Rejoindre le document"}
              </button>
            ) : (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(returnTo)}`}
                  className={styles.submit}
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Se connecter pour rejoindre
                </Link>
                <p className={styles.switch}>
                  Pas de compte ?{" "}
                  <Link href={`/register?next=${encodeURIComponent(returnTo)}`}>
                    Créez-en un
                  </Link>
                </p>
              </>
            )}

            {joinError && loggedIn && (
              <p className={styles.switch}>
                Mauvais compte ?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(returnTo)}`}
                  onClick={() => {
                    // Permet de se reconnecter avec un autre compte sans quitter le flux d'invitation.
                    window.localStorage.removeItem("token");
                  }}
                >
                  Se connecter avec un autre compte
                </Link>
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
