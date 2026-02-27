import { getSocket } from "../collaboration/client/socket";
import { useTerminalStore } from "./terminal.store";

const USE_DUMMY_TERMINAL = process.env.NEXT_PUBLIC_USE_DUMMY_TERMINAL !== "false";

type ActiveRun = {
  timeoutIds: ReturnType<typeof setTimeout>[];
};

const activeRuns = new Map<string, ActiveRun>();

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function appendLog(message: string, type: "stdout" | "stderr" | "system") {
  useTerminalStore.getState().appendLog({
    id: createId(),
    timestamp: Date.now(),
    message,
    type,
  });
}

function clearActiveRun(roomId: string) {
  const run = activeRuns.get(roomId);
  if (!run) return;
  run.timeoutIds.forEach((id) => clearTimeout(id));
  activeRuns.delete(roomId);
}

function schedule(roomId: string, ms: number, fn: () => void) {
  const timeoutId = setTimeout(fn, ms);
  const run = activeRuns.get(roomId);
  if (run) {
    run.timeoutIds.push(timeoutId);
  }
}

export function startTerminal(roomId: string, fileId?: string | null) {
  if (!USE_DUMMY_TERMINAL) {
    const socket = getSocket();
    socket.emit("terminal:start", { roomId, fileId: fileId ?? undefined });
    return;
  }

  const store = useTerminalStore.getState();
  clearActiveRun(roomId);

  const sessionId = createId();
  activeRuns.set(roomId, { timeoutIds: [] });
  store.clearLogs();
  store.setSession({ id: sessionId, roomId, status: "starting" });

  appendLog("Running main.py...", "system");
  if (fileId) {
    appendLog(`Selected file: ${fileId}`, "system");
  }

  schedule(roomId, 350, () => {
    store.setSession({ id: sessionId, roomId, status: "running" });
    appendLog("Booting execution sandbox...", "system");
  });

  schedule(roomId, 900, () => {
    appendLog("Program started.", "system");
  });

  schedule(roomId, 1300, () => {
    appendLog("Hello from devsync runtime.", "stdout");
  });

  schedule(roomId, 1700, () => {
    appendLog("Execution finished successfully.", "stdout");
  });

  schedule(roomId, 2100, () => {
    store.setSession({ id: sessionId, roomId, status: "stopped" });
    appendLog("Process exited with code 0", "system");
    activeRuns.delete(roomId);
  });
}

export function stopTerminal(roomId: string) {
  if (!USE_DUMMY_TERMINAL) {
    const socket = getSocket();
    socket.emit("terminal:stop", { roomId });
    return;
  }

  const store = useTerminalStore.getState();
  clearActiveRun(roomId);
  const current = store.session;
  const sessionId = current?.roomId === roomId ? current.id : createId();
  store.setSession({ id: sessionId, roomId, status: "stopped" });
  appendLog("Execution stopped by user.", "system");
}

export function sendTerminalInput(roomId: string, input: string) {
  if (!USE_DUMMY_TERMINAL) {
    const socket = getSocket();
    socket.emit("terminal:input", { roomId, input });
    return;
  }

  const text = input.trim();
  if (!text) return;
  appendLog(`> ${text}`, "stdout");
}
