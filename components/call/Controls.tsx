"use client";

import styles from "../../app/meeting/[id]/room/room.module.css";
import {
  MicIcon,
  CamIcon,
  ScreenIcon,
  ChatIcon,
  PeopleIcon,
  HandIcon,
  LeaveIcon,
} from "./Icons";

export interface ControlsProps {
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  handRaised: boolean;
  unreadChat: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleHand: () => void;
  onLeave: () => void;
}

export default function Controls({
  micOn,
  camOn,
  sharing,
  handRaised,
  unreadChat,
  onToggleMic,
  onToggleCam,
  onToggleShare,
  onToggleChat,
  onToggleParticipants,
  onToggleHand,
  onLeave,
}: ControlsProps) {
  return (
    <div className={styles.controlbar}>
      <button
        className={`${styles.ctrlBtn} ${!micOn ? styles.ctrlBtnOff : ""}`}
        onClick={onToggleMic}
        aria-label={micOn ? "Couper le micro" : "Activer le micro"}
        title={micOn ? "Couper le micro" : "Activer le micro"}
      >
        <MicIcon off={!micOn} />
      </button>
      <button
        className={`${styles.ctrlBtn} ${!camOn ? styles.ctrlBtnOff : ""}`}
        onClick={onToggleCam}
        aria-label={camOn ? "Couper la caméra" : "Activer la caméra"}
        title={camOn ? "Couper la caméra" : "Activer la caméra"}
      >
        <CamIcon off={!camOn} />
      </button>
      <button
        className={`${styles.ctrlBtn} ${sharing ? styles.ctrlBtnActive : ""}`}
        onClick={onToggleShare}
        aria-label="Partager l’écran"
        title="Partager l’écran"
      >
        <ScreenIcon active={sharing} />
      </button>
      <button
        className={`${styles.ctrlBtn} ${handRaised ? styles.ctrlBtnActiveWarm : ""}`}
        onClick={onToggleHand}
        aria-label="Lever la main"
        title="Lever la main"
      >
        <HandIcon />
      </button>
      <div style={{ position: "relative" }}>
        <button
          className={styles.ctrlBtn}
          onClick={onToggleChat}
          aria-label="Ouvrir le chat"
          title="Chat"
        >
          <ChatIcon />
        </button>
        {unreadChat > 0 && <span className={styles.badgeDot} />}
      </div>
      <button
        className={styles.ctrlBtn}
        onClick={onToggleParticipants}
        aria-label="Voir les participants"
        title="Participants"
      >
        <PeopleIcon />
      </button>
      <button
        className={styles.leaveBtn}
        onClick={onLeave}
        aria-label="Quitter la réunion"
        title="Quitter"
      >
        <LeaveIcon />
      </button>
    </div>
  );
}
