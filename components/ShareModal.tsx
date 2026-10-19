"use client";

import { useEffect, useState } from "react";
import { api, Collaborator, Invite } from "@/lib/api";
import styles from "./sharemodal.module.css";

type Props = {
  documentId: string;
  isPublic: boolean;
  onPublicChange: (isPublic: boolean) => void;
  onClose: () => void;
};

export default function ShareModal({ documentId, isPublic, onPublicChange, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingPublic, setTogglingPublic] = useState(false);

  const [email, setEmail] = useState("");
  const [emailRole, setEmailRole] = useState<"viewer" | "editor">("editor");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [linkRole, setLinkRole] = useState<"viewer" | "editor">("editor");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [lastEmailLink, setLastEmailLink] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .listCollaborators(documentId)
      .then((res) => {
        setCollaborators(res.collaborators);
        setInvites(res.pending_invites);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  function inviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  function publicUrl() {
    return `${window.location.origin}/public/${documentId}`;
  }

  async function togglePublic() {
    setTogglingPublic(true);
    try {
      const updated = await api.togglePublic(documentId, !isPublic);
      onPublicChange(updated.is_public);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTogglingPublic(false);
    }
  }

  async function sendEmailInvite() {
    if (!email.trim()) return;
    setSendingInvite(true);
    try {
      const invite = await api.createInvite(documentId, email.trim(), emailRole);
      setLastEmailLink(inviteUrl(invite.token));
      setEmail("");
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSendingInvite(false);
    }
  }

  async function generateLink() {
    setGeneratingLink(true);
    try {
      const invite = await api.createInvite(documentId, null, linkRole);
      setLinkUrl(inviteUrl(invite.token));
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGeneratingLink(false);
    }
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  async function removeCollaborator(id: string) {
    await api.revokeCollaborator(documentId, id);
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  }

  async function removeInvite(id: string) {
    await api.revokeInvite(documentId, id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>Partager le document</h3>
        <p className={styles.subheading}>Invitez des personnes par email ou générez un lien.</p>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Inviter par email</div>
          <div className={styles.row}>
            <input
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              className={styles.roleSelect}
              value={emailRole}
              onChange={(e) => setEmailRole(e.target.value as "viewer" | "editor")}
            >
              <option value="editor">Éditeur</option>
              <option value="viewer">Lecteur</option>
            </select>
            <button className={styles.actionBtn} onClick={sendEmailInvite} disabled={sendingInvite || !email.trim()}>
              {sendingInvite ? "…" : "Inviter"}
            </button>
          </div>
          {lastEmailLink && (
            <div className={styles.linkResult}>
              <input readOnly value={lastEmailLink} />
              <button className={styles.copyBtn} onClick={() => copy(lastEmailLink)}>
                Copier
              </button>
            </div>
          )}
          <p className={styles.hint}>
            L'envoi automatique d'email nécessite un fournisseur SMTP côté serveur (voir README). En
            attendant, copiez et transmettez ce lien vous-même.
          </p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Publier</div>
          <div className={styles.publicRow}>
            <div>
              <div className={styles.publicLabel}>Document public</div>
              <p className={styles.hint} style={{ margin: 0 }}>
                Visible en lecture seule par n'importe qui, sans compte, via un lien.
              </p>
            </div>
            <button
              className={`${styles.toggle} ${isPublic ? styles.toggleOn : ""}`}
              onClick={togglePublic}
              disabled={togglingPublic}
              role="switch"
              aria-checked={isPublic}
              aria-label="Rendre le document public"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
          {isPublic && (
            <div className={styles.linkResult}>
              <input readOnly value={publicUrl()} />
              <button className={styles.copyBtn} onClick={() => copy(publicUrl())}>
                Copier
              </button>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Lien de partage</div>
          <div className={styles.row}>
            <select
              className={styles.roleSelect}
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value as "viewer" | "editor")}
            >
              <option value="editor">Éditeur</option>
              <option value="viewer">Lecteur</option>
            </select>
            <button className={styles.actionBtn} onClick={generateLink} disabled={generatingLink}>
              {generatingLink ? "…" : "Générer un lien"}
            </button>
          </div>
          {linkUrl && (
            <div className={styles.linkResult}>
              <input readOnly value={linkUrl} />
              <button className={styles.copyBtn} onClick={() => copy(linkUrl)}>
                Copier
              </button>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Personnes ayant accès</div>
          {loading ? (
            <p className={styles.hint}>Chargement…</p>
          ) : (
            <div className={styles.peopleList}>
              {collaborators.length === 0 && invites.length === 0 && (
                <p className={styles.hint}>Personne d'autre n'a encore accès à ce document.</p>
              )}
              {collaborators.map((c) => (
                <div key={c.id} className={styles.personRow}>
                  <div className={styles.personInfo}>
                    <span className={styles.personName}>{c.user.name}</span>
                    <span className={styles.personRole}>{c.role === "editor" ? "Éditeur" : "Lecteur"}</span>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeCollaborator(c.id)}>
                    Retirer
                  </button>
                </div>
              ))}
              {invites.map((i) => (
                <div key={i.id} className={styles.personRow}>
                  <div className={styles.personInfo}>
                    <span className={styles.personName}>{i.email || "Lien de partage"}</span>
                    <span className={styles.personRole}>
                      {i.role === "editor" ? "Éditeur" : "Lecteur"} · en attente
                    </span>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeInvite(i.id)}>
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.closeFooter}>
          <button className={styles.closeBtn} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
