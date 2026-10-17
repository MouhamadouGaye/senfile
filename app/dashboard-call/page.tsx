"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import type { Meeting } from "@/lib/types";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("aperture:hostEmail");
    if (saved) {
      setEmail(saved);
      fetchMeetings(saved);
    }
  }, []);

  async function fetchMeetings(value: string) {
    const res = await fetch(`/api/meetings?hostEmail=${encodeURIComponent(value)}`);
    const data = (await res.json()) as Meeting[];
    setMeetings(data);
  }

  function handleLookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    localStorage.setItem("aperture:hostEmail", email.trim());
    fetchMeetings(email.trim());
  }

  async function handleDelete(id: string) {
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMeetings((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${id}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.nav}>
        <Link href="/" className={styles.backLink}>
          ← Aperture
        </Link>
        <Link href="/schedule" className={styles.backLink}>
          Planifier une réunion →
        </Link>
      </div>

      <div className={styles.wrap}>
        <h1 className={styles.headline}>Mes réunions</h1>

        <form className={styles.lookup} onSubmit={handleLookup}>
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className={styles.lookupBtn} type="submit">
            Voir
          </button>
        </form>

        {meetings === null && (
          <p className={styles.empty}>Renseignez l’email utilisé lors de la planification pour retrouver vos réunions.</p>
        )}

        {meetings && meetings.length === 0 && (
          <p className={styles.empty}>Aucune réunion planifiée avec cette adresse pour le moment.</p>
        )}

        {meetings && meetings.length > 0 && (
          <div className={styles.list}>
            {[...meetings]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((m) => (
                <div key={m.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <p className={styles.rowTitle}>{m.title}</p>
                    <p className={styles.rowMeta}>
                      {m.date ? `${m.date}${m.time ? " · " + m.time : ""} · ` : "Sans date fixée · "}
                      {m.duration} min · {(m.attendees || []).length} participant(s) inscrit(s)
                    </p>
                  </div>
                  <div className={styles.rowActions}>
                    <button className={styles.smallBtn} onClick={() => copyLink(m.id)}>
                      Copier le lien
                    </button>
                    <Link href={`/meeting/${m.id}`} className={styles.smallBtn}>
                      Ouvrir
                    </Link>
                    <button
                      className={`${styles.smallBtn} ${styles.smallBtnDanger}`}
                      onClick={() => handleDelete(m.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
