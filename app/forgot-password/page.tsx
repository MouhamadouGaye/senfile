"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "@/styles/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
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

        {sent ? (
          <>
            <h1 className={styles.title}>Vérifiez votre boîte mail</h1>
            <p className={styles.subtitle}>
              Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de
              réinitialisation vient d'être envoyé. Il est valable une heure.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Mot de passe oublié</h1>
            <p className={styles.subtitle}>
              Indiquez votre email : nous vous enverrons un lien pour choisir un nouveau mot de
              passe.
            </p>

            <form onSubmit={onSubmit}>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Envoi…" : "Envoyer le lien"}
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
