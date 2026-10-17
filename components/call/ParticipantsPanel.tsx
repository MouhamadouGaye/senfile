"use client";

import styles from "../../app/meeting/[id]/room/room.module.css";
import { MicIcon, CamIcon } from "./Icons";
import type { RemotePeerState } from "@/lib/types";

export interface ParticipantsPanelProps {
  me: { name: string; micOn: boolean; camOn: boolean };
  peers: Record<string, RemotePeerState>;
  raisedHands: Record<string, string | undefined>;
}

interface PersonRow {
  id: string;
  name: string;
  micOn?: boolean;
  camOn?: boolean;
}

export default function ParticipantsPanel({
  me,
  peers,
  raisedHands,
}: ParticipantsPanelProps) {
  const list: PersonRow[] = [
    { id: "me", name: `${me.name} (vous)`, micOn: me.micOn, camOn: me.camOn },
    ...Object.entries(peers).map(([id, p]) => ({
      id,
      name: p.name,
      micOn: p.micOn,
      camOn: p.camOn,
    })),
  ];

  return (
    <div className={styles.peopleList}>
      {list.map((p) => (
        <div key={p.id} className={styles.personRow}>
          <div className={styles.personAvatar}>
            {(p.name || "?")[0]?.toUpperCase()}
          </div>
          <span className={styles.personName}>{p.name}</span>
          {raisedHands[p.id] && <span title="Main levée">✋</span>}
          <span className={styles.personIcons}>
            {!p.micOn && <MicIcon off />}
            {!p.camOn && <CamIcon off />}
          </span>
        </div>
      ))}
    </div>
  );
}
