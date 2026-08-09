import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../middleware/auth.middleware";
import { isAllowedOrigin } from "../app";

let io: SocketServer;

export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      // Reuse the same origin-validation logic as Express CORS middleware
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket.io CORS: origin '${origin}' is not allowed`));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    pingTimeout: 60000,
  });

  // ── Authentication middleware for Socket.io ─────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        socket.data.user = payload;
      } catch {
        // Allow unauthenticated for public rooms (event viewing)
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as JwtPayload | undefined;
    console.log(`🔌 Socket connected: ${socket.id}${user ? ` (user: ${user.userId})` : " (guest)"}`);

    // ── Join authenticated user's personal room ──────────────────────
    if (user) {
      socket.join(`user:${user.userId}`);
    }

    // ── Join event room for realtime inventory ───────────────────────
    socket.on("join:event", (eventId: string) => {
      socket.join(`event:${eventId}`);
      console.log(`   ↳ Joined event room: event:${eventId}`);
    });

    socket.on("leave:event", (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get the initialized Socket.io instance (call after initializeSocket)
 */
export function getSocketIO(): SocketServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
}
