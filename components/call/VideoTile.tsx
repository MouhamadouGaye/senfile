"use client";

import { useEffect, useRef } from "react";
import styles from "../../app/meeting/[id]/room/room.module.css";
import { MicIcon } from "./Icons";

export interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  isLocal?: boolean;
  micOn?: boolean;
  camOn?: boolean;
  sharing?: boolean;
  handRaised?: boolean;
}

export default function VideoTile({
  stream,
  name,
  isLocal,
  micOn = true,
  camOn = true,
  sharing,
  handRaised,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  const showVideo = Boolean(stream) && camOn;

  return (
    <div
      className={`${styles.tile} ${sharing ? styles.sharingRing : ""} ${isLocal ? styles.tileMirrored : ""}`}
    >
      {showVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} />
      ) : (
        <div className={styles.tileAvatar}>
          <div className={styles.avatarCircle}>
            {(name || "?")[0]?.toUpperCase()}
          </div>
          <span>{camOn ? "Connexion…" : "Caméra coupée"}</span>
        </div>
      )}

      {handRaised && (
        <div className={styles.handBadge} title={`${name} a levé la main`}>
          ✋
        </div>
      )}

      <div className={styles.tileLabel}>
        {!micOn && (
          <span className={styles.mutedIcon}>
            <MicIcon off />
          </span>
        )}
        <span>
          {name} {isLocal ? "(vous)" : ""}
        </span>
      </div>
    </div>
  );
}
