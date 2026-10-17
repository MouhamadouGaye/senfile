import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, type Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PeerMeta,
  PublicPeer,
  ChatMessage,
} from "./lib/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";

const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// roomId -> Map(socketId -> métadonnées du participant)
const rooms = new Map<string, Map<string, PeerMeta>>();

function getRoom(roomId: string): Map<string, PeerMeta> {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId)!;
}

function publicPeer(socketId: string, peer: PeerMeta): PublicPeer {
  return { socketId, ...peer };
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: "/socket.io",
    },
  );

  io.on("connection", (socket: AppSocket) => {
    console.log("🟢 SOCKET CONNECTED", socket.id);

    let currentRoom: string | null = null;

    socket.on("join-room", ({ roomId, name, email, micOn, camOn }) => {
      console.log("🚪 JOIN ROOM", {
        socketId: socket.id,
        roomId,
        name,
        email,
        micOn,
        camOn,
      });
      currentRoom = roomId;
      socket.join(roomId);

      const room = getRoom(roomId);
      const existingPeers: PublicPeer[] = Array.from(room.entries()).map(
        ([id, p]) => publicPeer(id, p),
      );

      // const me: PeerMeta = {
      //   name: name || "Invité",
      //   email: email || "",
      //   camOn: true,
      //   micOn: true,
      //   sharing: false,
      // };

      const me: PeerMeta = {
        name: name || "Invité",
        email: email || "",
        camOn: camOn ?? true,
        micOn: micOn ?? true,
        sharing: false,
      };

      room.set(socket.id, me);

      // Indique au nouvel arrivant qui est déjà là — il initiera les offres
      socket.emit("existing-peers", existingPeers);

      // Indique aux autres qu'un nouveau participant est arrivé (métadonnées seules)
      socket.to(roomId).emit("peer-joined", publicPeer(socket.id, me));
    });

    // // Relais de la signalisation WebRTC (offre / réponse / candidats ICE)
    // socket.on("signal", ({ to, data }) => {
    //   io.to(to).emit("signal", { from: socket.id, data });
    // });
    socket.on("signal", ({ to, data }) => {
      console.log("📡 SIGNAL", {
        from: socket.id,
        to,
        type: data?.type,
        hasCandidate: "candidate" in data && !!data.candidate,
      });

      io.to(to).emit("signal", {
        from: socket.id,
        data,
      });
    });

    socket.on("chat-message", ({ roomId, text, name }) => {
      const message: ChatMessage = {
        id: `${socket.id}-${Date.now()}`,
        text,
        name: name || "Invité",
        socketId: socket.id,
        at: Date.now(),
      };
      io.to(roomId).emit("chat-message", message);
    });

    socket.on("update-state", ({ roomId, patch }) => {
      const room = rooms.get(roomId);
      if (!room || !room.has(socket.id)) return;
      const peer = { ...room.get(socket.id)!, ...patch };
      room.set(socket.id, peer);
      socket.to(roomId).emit("peer-updated", publicPeer(socket.id, peer));
    });

    socket.on("hand-raise", ({ roomId, raised, name }) => {
      socket
        .to(roomId)
        .emit("hand-raise", { socketId: socket.id, raised, name });
    });

    socket.on("leave-room", () => {
      leaveCurrentRoom(socket, currentRoom);
      currentRoom = null;
    });

    socket.on("disconnect", () => {
      leaveCurrentRoom(socket, currentRoom);
    });

    function leaveCurrentRoom(socket: AppSocket, roomId: string | null) {
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) rooms.delete(roomId);
      }
      socket.to(roomId).emit("peer-left", { socketId: socket.id });
      socket.leave(roomId);
    }
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })

    .listen(port, () => {
      console.log(`> Aperture Meet prêt sur http://0.0.0.0:${port}`);
    });
});
