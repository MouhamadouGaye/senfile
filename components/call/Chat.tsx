"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "../../app/meeting/[id]/room/room.module.css";
import { SendIcon } from "./Icons";
import type { ChatMessage } from "@/lib/types";

export interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  myName: string;
}

export default function Chat({ messages, onSend, myName }: ChatProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <>
      <div className={styles.chatBody}>
        {messages.length === 0 && (
          <p className={styles.chatEmpty}>
            Aucun message pour l’instant. Dites bonjour 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.name === myName;
          return (
            <div
              key={m.id}
              className={`${styles.chatMsg} ${mine ? styles.chatMsgMine : ""}`}
            >
              <div className={styles.chatMeta}>
                {mine ? "Vous" : m.name} ·{" "}
                {new Date(m.at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className={styles.chatBubble}>{m.text}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form className={styles.chatForm} onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          aria-label="Écrire un message"
        />
        <button className={styles.chatSend} type="submit" aria-label="Envoyer">
          <SendIcon />
        </button>
      </form>
    </>
  );
}
