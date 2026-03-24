import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './src/lib/socket/server.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './src/lib/types.js';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const httpServer = createServer();
const io = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: { origin: '*' },
});

const app = next({ dev, httpServer });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  setupSocketHandlers(io);

  httpServer.on('request', (req, res) => {
    // Let Socket.IO handle its own requests — don't pass them to Next.js
    if (req.url?.startsWith('/socket.io')) return;
    handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(
      `> Server listening on http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`
    );
  });
});
