"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
// import Aperture from "@/components/Aperture";
import type { Meeting } from "@/lib/types";
import Aperture from "@/components/call/Aperture";
import { api, User } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    (async () => {
      try {
        const [me] = await Promise.all([api.me()]);
        setUser(me);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function extractId(value: string): string {
    const trimmed = value.trim();
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("meeting");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    } catch {
      // pas une URL, on suppose que c'est déjà l'identifiant
    }
    return trimmed;
  }

  async function handleJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim() || !email.trim()) {
      setError("Merci de renseigner le code, votre nom et votre email.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Cette adresse email ne semble pas valide.");
      return;
    }
    setLoading(true);
    const id = extractId(code);
    const res = await fetch(`/api/meetings/${id}`);
    setLoading(false);
    if (!res.ok) {
      setError("Aucune réunion ne correspond à ce code.");
      return;
    }
    sessionStorage.setItem(`aperture:${id}:name`, name);
    sessionStorage.setItem(`aperture:${id}:email`, email);
    router.push(`/meeting/${id}`);
  }

  async function handleInstant() {
    setLoading(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Réunion instantanée",
        hostName: "Organisateur",
        hostEmail: "instant@aperture.local",
        instant: true,
      }),
    });
    const meeting = (await res.json()) as Meeting;
    setLoading(false);
    router.push(`/meeting/${meeting.id}`);
  }
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <Aperture size={28} open={0.7} />
          </span>
          <span className={styles.brandName}>MGayeCall</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/dashboard">Mes réunions</Link>
          <Link href="/schedule">Planifier</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.headline}>
            Le point net sur <em>vos réunions.</em>
          </h1>
          <p className={styles.subhead}>
            Aperture est un espace de visioconférence pour équipes et webinaires
            : vidéo, audio, chat et partage d’écran dans une seule pièce, sans
            compte à créer.
          </p>
          <div className={styles.actions}>
            <button
              className={styles.primaryBtn}
              onClick={handleInstant}
              disabled={loading}
            >
              Démarrer une réunion instantanée
            </button>
            <Link href="/schedule" className={styles.ghostBtn}>
              Planifier pour plus tard
            </Link>
          </div>
        </div>

        <div className={styles.joinCardWrap}>
          <div className={styles.aperturePlacement}>
            <Aperture size={56} open={0.4} color="var(--warm)" />
          </div>
          <form className={styles.joinCard} onSubmit={handleJoin}>
            <p className={styles.joinTitle}>Rejoindre avec un code</p>
            <p className={styles.joinHint}>
              Un email est demandé à chaque participant : c’est lui qui ouvre la
              salle.
            </p>
            <div className={styles.field}>
              <label htmlFor="code">Code ou lien de la réunion</label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ex. a1b2c3 ou le lien complet"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="name">Votre nom</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Votre email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className={styles.joinError}>{error}</p>}
            <button
              className={styles.primaryBtn}
              type="submit"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Vérification…" : "Rejoindre"}
            </button>
          </form>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.feature}>
            <span className={styles.featureNum}>Vidéo & audio</span>
            <p className={styles.featureTitle}>
              Une grille claire, sans limite d’ego
            </p>
            <p className={styles.featureDesc}>
              Chaque participant a sa place dans la grille, avec micro et caméra
              pilotables à tout moment.
            </p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureNum}>Partage d’écran</span>
            <p className={styles.featureTitle}>Montrez, ne décrivez plus</p>
            <p className={styles.featureDesc}>
              Partagez un onglet, une fenêtre ou tout votre écran en un clic,
              sans plugin.
            </p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureNum}>Webinaire</span>
            <p className={styles.featureTitle}>
              Chat, main levée, salle d’attente
            </p>
            <p className={styles.featureDesc}>
              De quoi animer un atelier de 3 personnes ou un webinaire de 50,
              sans changer d’outil.
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        MGayeCall — vos réunions, nettes.
      </footer>
    </div>
  );
}
