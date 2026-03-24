'use client';

import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    socket = io(socketUrl || undefined, {
      autoConnect: false,
    });
  }
  return socket;
}
