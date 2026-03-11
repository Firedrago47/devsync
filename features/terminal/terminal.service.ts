import { getSocket } from "../collaboration/client/socket";
import { useTerminalStore } from "./terminal.store";

export function startTerminal(roomId: string, fileId?: string | null) {
  const store = useTerminalStore.getState();
  store.clearLogs();
  const socket = getSocket();
  socket.emit("terminal:start", { roomId, fileId: fileId ?? undefined });
}

export function stopTerminal(roomId: string) {
  const socket = getSocket();
  socket.emit("terminal:stop", { roomId });
}

export function sendTerminalInput(roomId: string, input: string) {
  const socket = getSocket();
  socket.emit("terminal:input", { roomId, input });
}
