"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import styles from "@/styles/auth.module.css";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre",
      );
      return;
    }
    setLoading(true);
    try {
      const { access_token } = await api.register(email, name, password);
      setToken(access_token);
      router.push(next || "/login");
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
          MGayeFile
        </Link>
        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.subtitle}>
          Quelques secondes suffisent pour commencer à écrire.
        </p>

        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="name">Nom</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
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
          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className={styles.switch}>
          Déjà inscrit ?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback="Chargement...">
      <RegisterForm />
    </Suspense>
  );
}
