"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./lobby.module.css";
import type { Meeting } from "@/lib/types";
import Aperture from "@/components/call/Aperture";
import { CamIcon, MicIcon } from "@/components/call/Icons";

interface LobbyPageProps {
  params: { id: string };
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { id } = params;
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // undefined = chargement, null = introuvable
  const [meeting, setMeeting] = useState<Meeting | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    setName(sessionStorage.getItem(`aperture:${id}:name`) || "");
    setEmail(sessionStorage.getItem(`aperture:${id}:email`) || "");

    fetch(`/api/meetings/${id}`)
      .then((res) => (res.ok ? (res.json() as Promise<Meeting>) : null))
      .then(setMeeting)
      .catch(() => setMeeting(null));
  }, [id]);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() =>
        setError(
          "Impossible d’accéder à la caméra ou au micro. Vérifiez les autorisations du navigateur.",
        ),
      );

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }

  function toggleCam() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  }

  async function handleJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError(
        "Votre nom et votre email sont nécessaires pour entrer dans la salle.",
      );
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Cette adresse email ne semble pas valide.");
      return;
    }
    setJoining(true);
    await fetch(`/api/meetings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    sessionStorage.setItem(`aperture:${id}:name`, name);
    sessionStorage.setItem(`aperture:${id}:email`, email);
    sessionStorage.setItem(`aperture:${id}:micOn`, String(micOn));
    sessionStorage.setItem(`aperture:${id}:camOn`, String(camOn));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.push(`/meeting/${id}/room`);
  }

  if (meeting === null) {
    return (
      <div className={styles.page}>
        <Link href="/call" className={styles.brand}>
          <Aperture size={24} open={0.6} />
          MGCall
        </Link>
        <p className={styles.stateMsg}>
          Cette réunion n’existe pas ou n’est plus disponible. Vérifiez le lien
          reçu, ou
          <Link href="/schedule"> planifiez-en une nouvelle</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/call" className={styles.brand}>
        <Aperture size={24} open={0.6} />
        MGCall
      </Link>

      <div className={styles.wrap}>
        <div className={styles.previewFrame}>
          {camOn ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={styles.previewVideo}
            />
          ) : (
            <div className={styles.previewOff}>
              <div className={styles.avatarCircle}>
                {(name || "?")[0]?.toUpperCase()}
              </div>
              <span>Caméra coupée</span>
            </div>
          )}
          <div className={styles.previewControls}>
            <button
              type="button"
              className={`${styles.iconBtn} ${!micOn ? styles.iconBtnOff : ""}`}
              onClick={toggleMic}
              aria-label={micOn ? "Couper le micro" : "Activer le micro"}
            >
              <MicIcon off={!micOn} />
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${!camOn ? styles.iconBtnOff : ""}`}
              onClick={toggleCam}
              aria-label={camOn ? "Couper la caméra" : "Activer la caméra"}
            >
              <CamIcon off={!camOn} />
            </button>
          </div>
        </div>

        <div className={styles.side}>
          <h1>{meeting ? meeting.title : "Chargement…"}</h1>
          {meeting && (
            <p className={styles.meta}>
              {meeting.date
                ? `${meeting.date}${meeting.time ? " · " + meeting.time : ""} · `
                : ""}
              organisée par {meeting.hostName}
            </p>
          )}

          <form onSubmit={handleJoin}>
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

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.joinBtn}
              type="submit"
              disabled={joining || meeting === undefined}
            >
              {joining ? "Connexion…" : "Rejoindre la réunion"}
            </button>
            <p className={styles.notice}>
              En rejoignant, vous acceptez d’être visible et audible par les
              autres participants.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
