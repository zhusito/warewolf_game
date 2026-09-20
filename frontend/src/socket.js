import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// autoConnect: false — kita connect manual di GameContext supaya urutan event pasti benar.
export const socket = io(BACKEND_URL, { autoConnect: false });
