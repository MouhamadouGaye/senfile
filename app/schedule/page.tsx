"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./schedule.module.css";
import type { Meeting } from "@/lib/types";

interface ScheduleForm {
  title: string;
  hostName: string;
  hostEmail: string;
  date: string;
  time: string;
  duration: number;
  description: string;
}

export default function SchedulePage() {
  const [form, setForm] = useState<ScheduleForm>({
    title: "",
    hostName: "",
    hostEmail: "",
    date: "",
    time: "",
    duration: 30,
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [inviteEmails, setInviteEmails] = useState("");
  const [copied, setCopied] = useState(false);

  function update<K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.hostName.trim() || !form.hostEmail.trim()) {
      setError("Le titre, votre nom et votre email sont nécessaires.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.hostEmail)) {
      setError("Cette adresse email ne semble pas valide.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Une erreur est survenue.");
      return;
    }
    const created = (await res.json()) as Meeting;
    setMeeting(created);
  }

  const link = meeting && typeof window !== "undefined" ? `${window.location.origin}/meeting/${meeting.id}` : "";

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function mailtoHref(): string {
    if (!meeting) return "#";
    const subject = encodeURIComponent(`Invitation — ${meeting.title}`);
    const when = meeting.date
      ? `${meeting.date}${meeting.time ? " à " + meeting.time : ""}`
      : "dès que vous êtes prêts";
    const body = encodeURIComponent(
      `Vous êtes invité(e) à « ${meeting.title} », prévue ${when}.\n\nRejoindre : ${link}\n\nUn email valide vous sera demandé en entrant dans la salle.`
    );
    const to = inviteEmails
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.nav}>
        <Link href="/" className={styles.backLink}>
          ← Aperture
        </Link>
      </div>

      <div className={styles.wrap}>
        {!meeting ? (
          <>
            <h1 className={styles.headline}>Planifier une réunion</h1>
            <p className={styles.lead}>
              Renseignez quelques informations : un lien de réunion et une salle d’attente
              seront créés instantanément.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="title">Titre de la réunion</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Point d’équipe hebdomadaire"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="hostName">Votre nom</label>
                  <input
                    id="hostName"
                    value={form.hostName}
                    onChange={(e) => update("hostName", e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="hostEmail">Votre email</label>
                  <input
                    id="hostEmail"
                    type="email"
                    value={form.hostEmail}
                    onChange={(e) => update("hostEmail", e.target.value)}
                  />
                  <p className={styles.hint}>Nécessaire pour ouvrir la salle et gérer les invités.</p>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="time">Heure</label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="duration">Durée (minutes)</label>
                <input
                  id="duration"
                  type="number"
                  min="10"
                  step="5"
                  value={form.duration}
                  onChange={(e) => update("duration", Number(e.target.value))}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="description">Description (facultatif)</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Ordre du jour, contexte, lien vers un document…"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.submitBtn} disabled={loading}>
                {loading ? "Création…" : "Créer le lien de réunion"}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.confirm}>
            <span className={styles.confirmTag}>
              <span className={styles.dot} />
              Réunion créée
            </span>
            <h2 className={styles.confirmTitle}>{meeting.title}</h2>
            <p className={styles.confirmMeta}>
              {meeting.date ? `${meeting.date}${meeting.time ? " · " + meeting.time : ""} · ` : ""}
              {meeting.duration} min · organisée par {meeting.hostName}
            </p>

            <div className={styles.linkRow}>
              <div className={styles.linkBox}>{link}</div>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? "Copié ✓" : "Copier le lien"}
              </button>
            </div>

            <label htmlFor="invitees" style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
              Inviter par email (adresses séparées par des virgules)
            </label>
            <div className={styles.inviteRow}>
              <input
                id="invitees"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="marie@exemple.com, ali@exemple.com"
              />
              <a className={styles.copyBtn} href={mailtoHref()}>
                Ouvrir un email
              </a>
            </div>

            <div className={styles.actionsRow}>
              <Link href={`/meeting/${meeting.id}`} className={styles.submitBtn} style={{ textDecoration: "none", textAlign: "center" }}>
                Entrer dans la salle maintenant
              </Link>
              <Link href="/dashboard" className={styles.copyBtn} style={{ textDecoration: "none", textAlign: "center", flex: 1 }}>
                Voir mes réunions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
