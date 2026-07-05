import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://bidflow-rfq.onrender.com';

export function useSocket() {
  const { token } = useAuth();

  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  }, [token]);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  return {
    socket,
    joinRoom: (rfqId) => socket?.emit('join_rfq_room', rfqId),
    leaveRoom: (rfqId) => socket?.emit('leave_rfq_room', rfqId),
    onEvent: (event, handler) => socket?.on(event, handler),
    offEvent: (event, handler) => socket?.off(event, handler)
  };
}
