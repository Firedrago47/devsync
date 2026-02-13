import { getSocket } from "../collaboration/client/socket";

const socket = getSocket();

export function startTerminal(roomId: string, fileId?: string | null) {
  socket.emit("terminal:start", { roomId, fileId: fileId ?? undefined });
}

export function stopTerminal(roomId: string) {
  socket.emit("terminal:stop", { roomId });
}

export function sendTerminalInput(roomId: string, input: string) {
  socket.emit("terminal:input", { roomId, input });
}
