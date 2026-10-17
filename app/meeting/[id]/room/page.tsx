"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./room.module.css";
import { useWebRTC } from "@/hooks/useWebRTC";
import type { Meeting } from "@/lib/types";
import Aperture from "@/components/call/Aperture";
import VideoTile from "@/components/call/VideoTile";
import Chat from "@/components/call/Chat";
import ParticipantsPanel from "@/components/call/ParticipantsPanel";
import Controls from "@/components/call/Controls";

interface RoomPageProps {
  params: { id: string };
}

type PanelName = "chat" | "people" | null;

function gridColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id } = params;
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState({ name: "", email: "" });
  const [meetingTitle, setMeetingTitle] = useState("Réunion");
  const [panel, setPanel] = useState<PanelName>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const name = sessionStorage.getItem(`aperture:${id}:name`);
    const email = sessionStorage.getItem(`aperture:${id}:email`);
    if (!name || !email) {
      router.replace(`/meeting/${id}`);
      return;
    }
    setIdentity({ name, email });
    setReady(true);

    fetch(`/api/meetings/${id}`)
      .then((res) => (res.ok ? (res.json() as Promise<Meeting>) : null))
      .then((m) => m && setMeetingTitle(m.title));
  }, [id, router]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const rtc = useWebRTC(
    ready
      ? { roomId: id, name: identity.name, email: identity.email }
      : { roomId: null },
  );

  useEffect(() => {
    if (panel !== "chat" && rtc.messages.length > 0) {
      setUnread((u) => u + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtc.messages.length]);

  function openPanel(name: Exclude<PanelName, null>) {
    setPanel((p) => (p === name ? null : name));
    if (name === "chat") setUnread(0);
  }

  function handleToggleHand() {
    const next = !handRaised;
    setHandRaised(next);
    rtc.raiseHand(next);
  }

  function handleLeave() {
    rtc.leaveRoom();
    router.push(`/meeting/${id}/ended`);
  }

  const peerEntries = useMemo(() => Object.entries(rtc.peers), [rtc.peers]);
  const totalTiles = peerEntries.length + 1;
  const columns = gridColumns(totalTiles);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (!ready) return null;

  return (
    <div className={styles.room}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Aperture size={20} open={0.6} />
          <span className={styles.title}>{meetingTitle}</span>
          <span className={styles.dot} />
          <span className={styles.timer}>
            {mm}:{ss}
          </span>
        </div>
        <button
          className={styles.inviteBtn}
          onClick={() => {
            navigator.clipboard.writeText(
              window.location.origin + `/meeting/${id}`,
            );
          }}
        >
          Copier le lien d’invitation
        </button>
      </div>

      {rtc.shareError && (
        <div className={styles.shareToast} role="alert">
          {rtc.shareError}
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.stage}>
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            <VideoTile
              stream={rtc.localStream}
              name={identity.name}
              isLocal
              micOn={rtc.micOn}
              camOn={rtc.camOn}
              sharing={rtc.sharing}
              handRaised={handRaised}
            />
            {peerEntries.map(([socketId, p]) => (
              <VideoTile
                key={socketId}
                stream={p.stream}
                name={p.name}
                micOn={p.micOn !== false}
                camOn={p.camOn !== false}
                sharing={p.sharing}
                handRaised={Boolean(rtc.raisedHands[socketId])}
              />
            ))}
          </div>
        </div>

        {panel && (
          <div className={styles.sidePanel}>
            <div className={styles.panelTabs}>
              <button
                className={`${styles.panelTab} ${panel === "chat" ? styles.panelTabActive : ""}`}
                onClick={() => openPanel("chat")}
              >
                Chat
              </button>
              <button
                className={`${styles.panelTab} ${panel === "people" ? styles.panelTabActive : ""}`}
                onClick={() => openPanel("people")}
              >
                Participants ({totalTiles})
              </button>
              <button
                className={styles.panelClose}
                onClick={() => setPanel(null)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            {panel === "chat" ? (
              <Chat
                messages={rtc.messages}
                onSend={rtc.sendMessage}
                myName={identity.name}
              />
            ) : (
              <ParticipantsPanel
                me={{ name: identity.name, micOn: rtc.micOn, camOn: rtc.camOn }}
                peers={rtc.peers}
                raisedHands={rtc.raisedHands}
              />
            )}
          </div>
        )}
      </div>

      <Controls
        micOn={rtc.micOn}
        camOn={rtc.camOn}
        sharing={rtc.sharing}
        handRaised={handRaised}
        unreadChat={unread}
        onToggleMic={rtc.toggleMic}
        onToggleCam={rtc.toggleCam}
        onToggleShare={rtc.toggleShareScreen}
        onToggleChat={() => openPanel("chat")}
        onToggleParticipants={() => openPanel("people")}
        onToggleHand={handleToggleHand}
        onLeave={handleLeave}
      />
    </div>
  );
}
