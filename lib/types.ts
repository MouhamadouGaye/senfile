export interface Attendee {
  name: string;
  email: string;
}

export interface Meeting {
  id: string;
  title: string;
  hostName: string;
  hostEmail: string;
  date: string | null;
  time: string | null;
  duration: number;
  description: string;
  instant: boolean;
  createdAt: number;
  attendees: Attendee[];
}

export interface CreateMeetingInput {
  title?: string;
  hostName?: string;
  hostEmail: string;
  date?: string;
  time?: string;
  duration?: number;
  description?: string;
  instant?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  name: string;
  socketId: string;
  at: number;
}

/** État "métier" d'un participant dans une salle, tel que connu du serveur de signalisation. */
export interface PeerMeta {
  name: string;
  email: string;
  camOn: boolean;
  micOn: boolean;
  sharing: boolean;
}

export interface PublicPeer extends PeerMeta {
  socketId: string;
}

export type PeerStatePatch = Partial<
  Pick<PeerMeta, "camOn" | "micOn" | "sharing">
>;

export type SignalPayload =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "candidate"; candidate: RTCIceCandidateInit };

/** Événements émis par le client vers le serveur Socket.io. */
export interface ClientToServerEvents {
  "join-room": (data: {
    roomId: string;
    name: string;
    email: string;
    micOn: boolean;
    camOn: boolean;
  }) => void;
  signal: (payload: { to: string; data: SignalPayload }) => void;
  "chat-message": (payload: {
    roomId: string;
    text: string;
    name: string;
  }) => void;
  "update-state": (payload: { roomId: string; patch: PeerStatePatch }) => void;
  "hand-raise": (payload: {
    roomId: string;
    raised: boolean;
    name: string;
  }) => void;
  "leave-room": () => void;
}

/** Événements émis par le serveur Socket.io vers le client. */
export interface ServerToClientEvents {
  "existing-peers": (peers: PublicPeer[]) => void;
  "peer-joined": (peer: PublicPeer) => void;
  "peer-updated": (peer: PublicPeer) => void;
  "peer-left": (payload: { socketId: string }) => void;
  signal: (payload: { from: string; data: SignalPayload }) => void;
  "chat-message": (message: ChatMessage) => void;
  "hand-raise": (payload: {
    socketId: string;
    raised: boolean;
    name: string;
  }) => void;
}

/** État local (client) d'un participant distant, incluant son flux média. */
export interface RemotePeerState extends PeerMeta {
  stream?: MediaStream;
}
