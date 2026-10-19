"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "@/styles/auth.module.css";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={styles.brand}>
          Atelier
        </Link>

        {done ? (
          <>
            <h1 className={styles.title}>Mot de passe mis à jour</h1>
            <p className={styles.subtitle}>Redirection vers la connexion…</p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Choisir un nouveau mot de passe</h1>
            <p className={styles.subtitle}>Au moins 8 caractères, avec une lettre et un chiffre.</p>

            <form onSubmit={onSubmit}>
              <div className={styles.field}>
                <label htmlFor="password">Nouveau mot de passe</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="confirm">Confirmer le mot de passe</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Mise à jour…" : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        )}

        <p className={styles.switch}>
          <Link href="/login">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
