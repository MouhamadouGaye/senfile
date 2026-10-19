"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ended.module.css";
import Aperture from "@/components/call/Aperture";

interface EndedPageProps {
  params: { id: string };
}

export default function EndedPage({ params }: EndedPageProps) {
  const { id } = params;
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);

  function handleRate(value: number) {
    setRating(value);
    setSent(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.markWrap}>
        <Aperture size={72} open={0.15} />
      </div>
      <h1 className={styles.headline}>Vous avez quitté la réunion</h1>
      <p className={styles.lead}>
        Votre caméra et votre micro ont été coupés. À bientôt.
      </p>

      <div className={styles.actions}>
        <Link href={`/meeting/${id}`} className={styles.primaryBtn}>
          Rejoindre à nouveau
        </Link>
        <Link href="/" className={styles.ghostBtn}>
          Retour à l’accueil
        </Link>
      </div>

      <div className={styles.feedback}>
        <p className={styles.feedbackLabel}>Comment s’est passé l’appel ?</p>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              className={`${styles.star} ${v <= rating ? styles.starActive : ""}`}
              onClick={() => handleRate(v)}
              aria-label={`${v} étoile${v > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        {sent && <p className={styles.thanks}>Merci pour votre retour ✓</p>}
      </div>
    </div>
  );
}
