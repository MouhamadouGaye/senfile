// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { io, type Socket } from "socket.io-client";
// import type {
//   ClientToServerEvents,
//   ServerToClientEvents,
//   ChatMessage,
//   RemotePeerState,
// } from "@/lib/types";

// const ICE_SERVERS: RTCConfiguration = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//   ],
// };

// type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// export interface UseWebRTCParams {
//   roomId: string | null;
//   name?: string;
//   email?: string;
// }

// export interface UseWebRTCResult {
//   localStream: MediaStream | null;
//   peers: Record<string, RemotePeerState>;
//   messages: ChatMessage[];
//   connected: boolean;
//   micOn: boolean;
//   camOn: boolean;
//   sharing: boolean;
//   shareError: string | null;
//   raisedHands: Record<string, string | undefined>;
//   toggleMic: () => void;
//   toggleCam: () => void;
//   toggleShareScreen: () => Promise<void>;
//   sendMessage: (text: string) => void;
//   raiseHand: (raised: boolean) => void;
//   leaveRoom: () => void;
// }

// /**
//  * Gère : connexion socket.io, capture caméra/micro, maillage WebRTC
//  * (une RTCPeerConnection par participant distant), partage d'écran et chat.
//  */
// export function useWebRTC({
//   roomId,
//   name,
//   email,
// }: UseWebRTCParams): UseWebRTCResult {
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [peers, setPeers] = useState<Record<string, RemotePeerState>>({});
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [connected, setConnected] = useState(false);
//   const [micOn, setMicOn] = useState(true);
//   const [camOn, setCamOn] = useState(true);
//   const [sharing, setSharing] = useState(false);
//   const [shareError, setShareError] = useState<string | null>(null);
//   const [raisedHands, setRaisedHands] = useState<
//     Record<string, string | undefined>
//   >({});

//   const socketRef = useRef<AppSocket | null>(null);
//   const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const screenTrackRef = useRef<MediaStreamTrack | null>(null);
//   const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

//   const upsertPeer = useCallback(
//     (socketId: string, patch: Partial<RemotePeerState>) => {
//       setPeers((prev) => ({
//         ...prev,
//         [socketId]: {
//           ...(prev[socketId] || ({} as RemotePeerState)),
//           ...patch,
//         },
//       }));
//     },
//     [],
//   );

//   const removePeer = useCallback((socketId: string) => {
//     setPeers((prev) => {
//       const next = { ...prev };
//       delete next[socketId];
//       return next;
//     });
//     setRaisedHands((prev) => {
//       const next = { ...prev };
//       delete next[socketId];
//       return next;
//     });
//     if (pcsRef.current[socketId]) {
//       pcsRef.current[socketId].close();
//       delete pcsRef.current[socketId];
//     }
//   }, []);

//   const createPeerConnection = useCallback(
//     (remoteId: string): RTCPeerConnection => {
//       const pc = new RTCPeerConnection(ICE_SERVERS);

//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((track) => {
//           pc.addTrack(track, localStreamRef.current!);
//         });
//       }

//       pc.onicecandidate = (event) => {
//         if (event.candidate) {
//           socketRef.current?.emit("signal", {
//             to: remoteId,
//             data: { type: "candidate", candidate: event.candidate.toJSON() },
//           });
//         }
//       };

//       pc.ontrack = (event) => {
//         upsertPeer(remoteId, { stream: event.streams[0] });
//       };

//       pcsRef.current[remoteId] = pc;
//       return pc;
//     },
//     [upsertPeer],
//   );

//   const callPeer = useCallback(
//     async (remoteId: string) => {
//       const pc = createPeerConnection(remoteId);
//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);
//       socketRef.current?.emit("signal", {
//         to: remoteId,
//         data: { type: "offer", sdp: offer },
//       });
//     },
//     [createPeerConnection],
//   );

//   useEffect(() => {
//     if (!roomId) return undefined;
//     let cancelled = false;

//     async function init() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       if (cancelled) {
//         stream.getTracks().forEach((t) => t.stop());
//         return;
//       }
//       localStreamRef.current = stream;
//       cameraTrackRef.current = stream.getVideoTracks()[0] || null;
//       setLocalStream(stream);

//       const socket: AppSocket = io({ path: "/socket.io" });
//       socketRef.current = socket;

//       // socket.on("connect", () => {
//       //   setConnected(true);
//       //   socket.emit("join-room", {
//       //     roomId: roomId!,
//       //     name: name || "Invité",
//       //     email: email || "",
//       //   });
//       // });

//       // Start test

//       socket.on("connect", () => {
//         console.log("✅ SOCKET CONNECTED:", socket.id);

//         setConnected(true);

//         socket.emit("join-room", {
//           roomId: roomId!,
//           name: name || "Invité",
//           email: email || "",
//           micOn,
//           camOn,
//         });
//       });

//       socket.on("connect_error", (error) => {
//         console.error("❌ SOCKET CONNECT ERROR:", error);
//       });

//       socket.on("disconnect", (reason) => {
//         console.log("🔌 SOCKET DISCONNECTED:", reason);
//       });
//       // End test

//       socket.on("existing-peers", async (existingPeers) => {
//         existingPeers.forEach((p) => {
//           upsertPeer(p.socketId, {
//             name: p.name,
//             email: p.email,
//             camOn: p.camOn,
//             micOn: p.micOn,
//             sharing: p.sharing,
//           });
//         });
//         for (const p of existingPeers) {
//           await callPeer(p.socketId);
//         }
//       });

//       socket.on("peer-joined", (p) => {
//         upsertPeer(p.socketId, {
//           name: p.name,
//           email: p.email,
//           camOn: p.camOn,
//           micOn: p.micOn,
//           sharing: p.sharing,
//         });
//       });

//       socket.on("peer-updated", (p) => {
//         upsertPeer(p.socketId, {
//           camOn: p.camOn,
//           micOn: p.micOn,
//           sharing: p.sharing,
//         });
//       });

//       socket.on("signal", async ({ from, data }) => {
//         let pc = pcsRef.current[from];
//         if (data.type === "offer") {
//           if (!pc) pc = createPeerConnection(from);
//           await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit("signal", {
//             to: from,
//             data: { type: "answer", sdp: answer },
//           });
//         } else if (data.type === "answer") {
//           if (pc)
//             await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
//         } else if (data.type === "candidate") {
//           if (pc) {
//             try {
//               await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//             } catch {
//               // ignore les candidats hors-course
//             }
//           }
//         }
//       });

//       socket.on("peer-left", ({ socketId }) => {
//         removePeer(socketId);
//       });

//       socket.on("chat-message", (message) => {
//         setMessages((prev) => [...prev, message]);
//       });

//       socket.on("hand-raise", ({ socketId, raised, name: raiserName }) => {
//         setRaisedHands((prev) => ({
//           ...prev,
//           [socketId]: raised ? raiserName : undefined,
//         }));
//       });
//     }

//     init();

//     return () => {
//       cancelled = true;
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((t) => t.stop());
//       }
//       if (screenTrackRef.current) {
//         screenTrackRef.current.stop();
//       }
//       Object.values(pcsRef.current).forEach((pc) => pc.close());
//       pcsRef.current = {};
//       if (socketRef.current) {
//         socketRef.current.emit("leave-room");
//         socketRef.current.disconnect();
//       }
//       if (shareErrorTimeoutRef.current)
//         clearTimeout(shareErrorTimeoutRef.current);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [roomId]);

//   const toggleMic = useCallback(() => {
//     if (!localStreamRef.current || !roomId) return;
//     const track = localStreamRef.current.getAudioTracks()[0];
//     if (!track) return;
//     track.enabled = !track.enabled;
//     setMicOn(track.enabled);
//     socketRef.current?.emit("update-state", {
//       roomId,
//       patch: { micOn: track.enabled },
//     });
//   }, [roomId]);

//   const toggleCam = useCallback(() => {
//     // On agit toujours sur la piste physique de la caméra, jamais sur celle de l'écran
//     // partagé : couper "la caméra" pendant un partage ne doit pas couper le partage.
//     const track = cameraTrackRef.current;
//     if (!track || !roomId) return;
//     track.enabled = !track.enabled;
//     setCamOn(track.enabled);
//     socketRef.current?.emit("update-state", {
//       roomId,
//       patch: { camOn: track.enabled },
//     });
//   }, [roomId]);

//   const replaceOutgoingVideoTrack = useCallback(
//     (newTrack: MediaStreamTrack) => {
//       Object.values(pcsRef.current).forEach((pc) => {
//         const sender = pc
//           .getSenders()
//           .find((s) => s.track && s.track.kind === "video");
//         if (sender) sender.replaceTrack(newTrack);
//       });
//     },
//     [],
//   );

//   function stopShareScreen() {
//     if (screenTrackRef.current) {
//       screenTrackRef.current.stop();
//       screenTrackRef.current = null;
//     }
//     if (cameraTrackRef.current && localStreamRef.current) {
//       replaceOutgoingVideoTrack(cameraTrackRef.current);
//       const newLocal = new MediaStream([
//         cameraTrackRef.current,
//         ...localStreamRef.current.getAudioTracks(),
//       ]);
//       // Crucial : on met aussi à jour la référence utilisée pour initialiser toute NOUVELLE
//       // RTCPeerConnection (ex. un participant qui rejoint juste après l'arrêt du partage).
//       // Sans ça, les nouveaux venus recevraient encore l'ancienne piste vidéo.
//       localStreamRef.current = newLocal;
//       setLocalStream(newLocal);
//     }
//     setSharing(false);
//     if (roomId)
//       socketRef.current?.emit("update-state", {
//         roomId,
//         patch: { sharing: false },
//       });
//   }

//   const shareErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
//     null,
//   );

//   function flashShareError(message: string) {
//     setShareError(message);
//     if (shareErrorTimeoutRef.current)
//       clearTimeout(shareErrorTimeoutRef.current);
//     shareErrorTimeoutRef.current = setTimeout(() => setShareError(null), 6000);
//   }

//   const toggleShareScreen = useCallback(async () => {
//     if (!roomId) return;
//     setShareError(null);

//     if (!sharing) {
//       if (!navigator.mediaDevices?.getDisplayMedia) {
//         flashShareError(
//           "Le partage d’écran n’est pas pris en charge par ce navigateur.",
//         );
//         return;
//       }
//       try {
//         const displayStream = await navigator.mediaDevices.getDisplayMedia({
//           video: true,
//           audio: false,
//         });
//         const screenTrack = displayStream.getVideoTracks()[0];
//         screenTrackRef.current = screenTrack;
//         replaceOutgoingVideoTrack(screenTrack);

//         // Aperçu local : on remplace la piste vidéo affichée localement, et on met à jour
//         // la référence "source de vérité" utilisée par toute future RTCPeerConnection.
//         if (localStreamRef.current) {
//           const newLocal = new MediaStream([
//             screenTrack,
//             ...localStreamRef.current.getAudioTracks(),
//           ]);
//           localStreamRef.current = newLocal;
//           setLocalStream(newLocal);
//         }
//         setSharing(true);
//         socketRef.current?.emit("update-state", {
//           roomId,
//           patch: { sharing: true },
//         });

//         // Se déclenche quand l'utilisateur arrête le partage depuis l'UI native du
//         // navigateur (bouton "Arrêter le partage") plutôt que depuis nos contrôles.
//         screenTrack.onended = () => {
//           stopShareScreen();
//         };
//       } catch (err) {
//         const name = err instanceof DOMException ? err.name : "";
//         if (name === "NotAllowedError") {
//           flashShareError(
//             "Partage d’écran refusé. Autorisez-le dans les permissions du navigateur pour l’activer.",
//           );
//         } else if (name === "NotFoundError") {
//           flashShareError("Aucun écran ou fenêtre disponible à partager.");
//         } else if (
//           location.protocol !== "https:" &&
//           location.hostname !== "localhost"
//         ) {
//           flashShareError(
//             "Le partage d’écran nécessite une connexion HTTPS (ou localhost).",
//           );
//         } else {
//           flashShareError("Impossible de démarrer le partage d’écran.");
//         }
//       }
//     } else {
//       stopShareScreen();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [sharing, roomId, replaceOutgoingVideoTrack]);

//   const sendMessage = useCallback(
//     (text: string) => {
//       if (!text.trim() || !roomId) return;
//       socketRef.current?.emit("chat-message", {
//         roomId,
//         text,
//         name: name || "Invité",
//       });
//     },
//     [roomId, name],
//   );

//   const raiseHand = useCallback(
//     (raised: boolean) => {
//       if (!roomId) return;
//       socketRef.current?.emit("hand-raise", {
//         roomId,
//         raised,
//         name: name || "Invité",
//       });
//     },
//     [roomId, name],
//   );

//   const leaveRoom = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((t) => t.stop());
//     }
//     if (screenTrackRef.current) screenTrackRef.current.stop();
//     Object.values(pcsRef.current).forEach((pc) => pc.close());
//     pcsRef.current = {};
//     socketRef.current?.emit("leave-room");
//     socketRef.current?.disconnect();
//   }, []);

//   return {
//     localStream,
//     peers,
//     messages,
//     connected,
//     micOn,
//     camOn,
//     sharing,
//     shareError,
//     raisedHands,
//     toggleMic,
//     toggleCam,
//     toggleShareScreen,
//     sendMessage,
//     raiseHand,
//     leaveRoom,
//   };
// }

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ChatMessage,
  RemotePeerState,
} from "@/lib/types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseWebRTCParams {
  roomId: string | null;
  name?: string;
  email?: string;
}

export interface UseWebRTCResult {
  localStream: MediaStream | null;
  peers: Record<string, RemotePeerState>;
  messages: ChatMessage[];
  connected: boolean;
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  shareError: string | null;
  raisedHands: Record<string, string | undefined>;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleShareScreen: () => Promise<void>;
  sendMessage: (text: string) => void;
  raiseHand: (raised: boolean) => void;
  leaveRoom: () => void;
}

/**
 * Gère : connexion socket.io, capture caméra/micro, maillage WebRTC
 * (une RTCPeerConnection par participant distant), partage d'écran et chat.
 */
export function useWebRTC({
  roomId,
  name,
  email,
}: UseWebRTCParams): UseWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RemotePeerState>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [raisedHands, setRaisedHands] = useState<
    Record<string, string | undefined>
  >({});

  const socketRef = useRef<AppSocket | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>(
    {},
  );

  const upsertPeer = useCallback(
    (socketId: string, patch: Partial<RemotePeerState>) => {
      setPeers((prev) => ({
        ...prev,
        [socketId]: {
          ...(prev[socketId] || ({} as RemotePeerState)),
          ...patch,
        },
      }));
    },
    [],
  );

  const removePeer = useCallback((socketId: string) => {
    setPeers((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    setRaisedHands((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });

    delete pendingCandidatesRef.current[socketId];

    if (pcsRef.current[socketId]) {
      pcsRef.current[socketId].close();
      delete pcsRef.current[socketId];
    }
  }, []);

  // const createPeerConnection = useCallback(
  //   (remoteId: string): RTCPeerConnection => {
  //     const pc = new RTCPeerConnection(ICE_SERVERS);

  //     if (localStreamRef.current) {
  //       localStreamRef.current.getTracks().forEach((track) => {
  //         pc.addTrack(track, localStreamRef.current!);
  //       });
  //     }

  //     pc.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         socketRef.current?.emit("signal", {
  //           to: remoteId,
  //           data: { type: "candidate", candidate: event.candidate.toJSON() },
  //         });
  //       }
  //     };

  //     pc.ontrack = (event) => {
  //       upsertPeer(remoteId, { stream: event.streams[0] });
  //     };

  //     pcsRef.current[remoteId] = pc;
  //     return pc;
  //   },
  //   [upsertPeer],
  // );
  const createPeerConnection = useCallback(
    (remoteId: string): RTCPeerConnection => {
      const existing = pcsRef.current[remoteId];

      if (existing) {
        return existing;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;

        socketRef.current?.emit("signal", {
          to: remoteId,
          data: {
            type: "candidate",
            candidate: event.candidate.toJSON(),
          },
        });
      };

      pc.ontrack = (event) => {
        console.log("🎥 REMOTE TRACK", {
          peer: remoteId,
          kind: event.track.kind,
          streamId: event.streams[0]?.id,
        });

        const incomingStream = event.streams[0] || new MediaStream();

        if (!event.streams[0]) {
          incomingStream.addTrack(event.track);
        }

        upsertPeer(remoteId, {
          stream: incomingStream,
        });
      };

      pc.onconnectionstatechange = () => {
        console.log("🔗 WEBRTC CONNECTION", remoteId, pc.connectionState);

        if (pc.connectionState === "failed") {
          console.error("❌ WEBRTC FAILED", remoteId);
        }

        if (pc.connectionState === "closed") {
          console.log("🔴 WEBRTC CLOSED", remoteId);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("🧊 ICE", remoteId, pc.iceConnectionState);
      };

      pc.onicegatheringstatechange = () => {
        console.log("🧊 ICE GATHERING", remoteId, pc.iceGatheringState);
      };

      pc.onsignalingstatechange = () => {
        console.log("📡 SIGNALING", remoteId, pc.signalingState);
      };

      pcsRef.current[remoteId] = pc;

      return pc;
    },
    [upsertPeer],
  );
  // const callPeer = useCallback(
  //   async (remoteId: string) => {
  //     const pc = createPeerConnection(remoteId);
  //     const offer = await pc.createOffer();
  //     await pc.setLocalDescription(offer);
  //     socketRef.current?.emit("signal", {
  //       to: remoteId,
  //       data: { type: "offer", sdp: offer },
  //     });
  //   },
  //   [createPeerConnection],
  // );

  const callPeer = useCallback(
    async (remoteId: string) => {
      const pc = createPeerConnection(remoteId);

      if (pc.signalingState !== "stable") {
        return;
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const description = pc.localDescription;

      if (!description) return;

      console.log("📤 OFFER", {
        to: remoteId,
      });

      socketRef.current?.emit("signal", {
        to: remoteId,
        data: {
          type: "offer",
          sdp: description.toJSON(),
        },
      });
    },
    [createPeerConnection],
  );

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;

    async function init() {
      const savedMicOn =
        sessionStorage.getItem(`aperture:${roomId}:micOn`) !== "false";

      const savedCamOn =
        sessionStorage.getItem(`aperture:${roomId}:camOn`) !== "false";

      setMicOn(savedMicOn);
      setCamOn(savedCamOn);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      setLocalStream(stream);

      const socket: AppSocket = io({ path: "/socket.io" });
      socketRef.current = socket;

      // socket.on("connect", () => {
      //   setConnected(true);
      //   socket.emit("join-room", {
      //     roomId: roomId!,
      //     name: name || "Invité",
      //     email: email || "",
      //   });
      // });

      // Start test

      socket.on("connect", () => {
        console.log("✅ SOCKET CONNECTED:", socket.id);

        setConnected(true);

        // socket.emit("join-room", {
        //   roomId: roomId!,
        //   name: name || "Invité",
        //   email: email || "",
        //   micOn,
        //   camOn,
        // });

        socket.emit("join-room", {
          roomId: roomId!,
          name: name || "Invité",
          email: email || "",
          micOn: savedMicOn,
          camOn: savedCamOn,
        });
      });

      socket.on("connect_error", (error) => {
        console.error("❌ SOCKET CONNECT ERROR:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 SOCKET DISCONNECTED:", reason);
      });
      // End test

      socket.on("existing-peers", async (existingPeers) => {
        existingPeers.forEach((p) => {
          upsertPeer(p.socketId, {
            name: p.name,
            email: p.email,
            camOn: p.camOn,
            micOn: p.micOn,
            sharing: p.sharing,
          });
        });
        for (const p of existingPeers) {
          await callPeer(p.socketId);
        }
      });

      socket.on("peer-joined", (p) => {
        upsertPeer(p.socketId, {
          name: p.name,
          email: p.email,
          camOn: p.camOn,
          micOn: p.micOn,
          sharing: p.sharing,
        });
      });

      socket.on("peer-updated", (p) => {
        upsertPeer(p.socketId, {
          camOn: p.camOn,
          micOn: p.micOn,
          sharing: p.sharing,
        });
      });

      // socket.on("signal", async ({ from, data }) => {
      //   let pc = pcsRef.current[from];
      //   if (data.type === "offer") {
      //     if (!pc) pc = createPeerConnection(from);
      //     await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      //     const answer = await pc.createAnswer();
      //     await pc.setLocalDescription(answer);
      //     socket.emit("signal", {
      //       to: from,
      //       data: { type: "answer", sdp: answer },
      //     });
      //   } else if (data.type === "answer") {
      //     if (pc)
      //       await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      //   } else if (data.type === "candidate") {
      //     if (pc) {
      //       try {
      //         await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      //       } catch {
      //         // ignore les candidats hors-course
      //       }
      //     }
      //   }
      // });

      socket.on("signal", async ({ from, data }) => {
        try {
          let pc = pcsRef.current[from];

          console.log("📨 SIGNAL RECEIVED", {
            from,
            type: data.type,
            hasPc: !!pc,
          });

          if (data.type === "offer") {
            if (!pc) {
              pc = createPeerConnection(from);
            }

            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            const pending = pendingCandidatesRef.current[from] || [];

            for (const candidate of pending) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

            delete pendingCandidatesRef.current[from];

            const answer = await pc.createAnswer();

            await pc.setLocalDescription(answer);

            const description = pc.localDescription;

            if (!description) return;

            console.log("📤 ANSWER", {
              to: from,
            });

            socket.emit("signal", {
              to: from,
              data: {
                type: "answer",
                sdp: description.toJSON(),
              },
            });

            return;
          }

          if (data.type === "answer") {
            if (!pc) {
              console.error("❌ ANSWER reçue sans RTCPeerConnection", from);
              return;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            const pending = pendingCandidatesRef.current[from] || [];

            for (const candidate of pending) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

            delete pendingCandidatesRef.current[from];

            return;
          }

          if (data.type === "candidate") {
            if (!pc) {
              if (!pendingCandidatesRef.current[from]) {
                pendingCandidatesRef.current[from] = [];
              }

              pendingCandidatesRef.current[from].push(data.candidate);

              console.log("⏳ ICE candidate mis en attente", from);

              return;
            }

            if (!pc.remoteDescription) {
              if (!pendingCandidatesRef.current[from]) {
                pendingCandidatesRef.current[from] = [];
              }

              pendingCandidatesRef.current[from].push(data.candidate);

              console.log(
                "⏳ ICE candidate en attente de remoteDescription",
                from,
              );

              return;
            }

            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));

            console.log("✅ ICE candidate ajouté", from);
          }
        } catch (error) {
          console.error("❌ SIGNAL HANDLER ERROR", {
            from,
            type: data.type,
            error,
          });
        }
      });

      socket.on("peer-left", ({ socketId }) => {
        removePeer(socketId);
      });

      socket.on("chat-message", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on("hand-raise", ({ socketId, raised, name: raiserName }) => {
        setRaisedHands((prev) => ({
          ...prev,
          [socketId]: raised ? raiserName : undefined,
        }));
      });
    }

    init();

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};
      pendingCandidatesRef.current = {};
      if (socketRef.current) {
        socketRef.current.emit("leave-room");
        socketRef.current.disconnect();
      }
      if (shareErrorTimeoutRef.current)
        clearTimeout(shareErrorTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current || !roomId) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    socketRef.current?.emit("update-state", {
      roomId,
      patch: { micOn: track.enabled },
    });
  }, [roomId]);

  const toggleCam = useCallback(() => {
    // On agit toujours sur la piste physique de la caméra, jamais sur celle de l'écran
    // partagé : couper "la caméra" pendant un partage ne doit pas couper le partage.
    const track = cameraTrackRef.current;
    if (!track || !roomId) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    socketRef.current?.emit("update-state", {
      roomId,
      patch: { camOn: track.enabled },
    });
  }, [roomId]);

  const replaceOutgoingVideoTrack = useCallback(
    (newTrack: MediaStreamTrack) => {
      Object.values(pcsRef.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(newTrack);
      });
    },
    [],
  );

  function stopShareScreen() {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (cameraTrackRef.current && localStreamRef.current) {
      replaceOutgoingVideoTrack(cameraTrackRef.current);
      const newLocal = new MediaStream([
        cameraTrackRef.current,
        ...localStreamRef.current.getAudioTracks(),
      ]);
      // Crucial : on met aussi à jour la référence utilisée pour initialiser toute NOUVELLE
      // RTCPeerConnection (ex. un participant qui rejoint juste après l'arrêt du partage).
      // Sans ça, les nouveaux venus recevraient encore l'ancienne piste vidéo.
      localStreamRef.current = newLocal;
      setLocalStream(newLocal);
    }
    setSharing(false);
    if (roomId)
      socketRef.current?.emit("update-state", {
        roomId,
        patch: { sharing: false },
      });
  }

  const shareErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  function flashShareError(message: string) {
    setShareError(message);
    if (shareErrorTimeoutRef.current)
      clearTimeout(shareErrorTimeoutRef.current);
    shareErrorTimeoutRef.current = setTimeout(() => setShareError(null), 6000);
  }

  const toggleShareScreen = useCallback(async () => {
    if (!roomId) return;
    setShareError(null);

    if (!sharing) {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        flashShareError(
          "Le partage d’écran n’est pas pris en charge par ce navigateur.",
        );
        return;
      }
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        replaceOutgoingVideoTrack(screenTrack);

        // Aperçu local : on remplace la piste vidéo affichée localement, et on met à jour
        // la référence "source de vérité" utilisée par toute future RTCPeerConnection.
        if (localStreamRef.current) {
          const newLocal = new MediaStream([
            screenTrack,
            ...localStreamRef.current.getAudioTracks(),
          ]);
          localStreamRef.current = newLocal;
          setLocalStream(newLocal);
        }
        setSharing(true);
        socketRef.current?.emit("update-state", {
          roomId,
          patch: { sharing: true },
        });

        // Se déclenche quand l'utilisateur arrête le partage depuis l'UI native du
        // navigateur (bouton "Arrêter le partage") plutôt que depuis nos contrôles.
        screenTrack.onended = () => {
          stopShareScreen();
        };
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError") {
          flashShareError(
            "Partage d’écran refusé. Autorisez-le dans les permissions du navigateur pour l’activer.",
          );
        } else if (name === "NotFoundError") {
          flashShareError("Aucun écran ou fenêtre disponible à partager.");
        } else if (
          location.protocol !== "https:" &&
          location.hostname !== "localhost"
        ) {
          flashShareError(
            "Le partage d’écran nécessite une connexion HTTPS (ou localhost).",
          );
        } else {
          flashShareError("Impossible de démarrer le partage d’écran.");
        }
      }
    } else {
      stopShareScreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharing, roomId, replaceOutgoingVideoTrack]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !roomId) return;
      socketRef.current?.emit("chat-message", {
        roomId,
        text,
        name: name || "Invité",
      });
    },
    [roomId, name],
  );

  const raiseHand = useCallback(
    (raised: boolean) => {
      if (!roomId) return;
      socketRef.current?.emit("hand-raise", {
        roomId,
        raised,
        name: name || "Invité",
      });
    },
    [roomId, name],
  );

  const leaveRoom = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenTrackRef.current) screenTrackRef.current.stop();
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    socketRef.current?.emit("leave-room");
    socketRef.current?.disconnect();
  }, []);

  return {
    localStream,
    peers,
    messages,
    connected,
    micOn,
    camOn,
    sharing,
    shareError,
    raisedHands,
    toggleMic,
    toggleCam,
    toggleShareScreen,
    sendMessage,
    raiseHand,
    leaveRoom,
  };
}
