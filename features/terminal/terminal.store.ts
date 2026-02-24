import { create } from "zustand";

export type TerminalStatus =
  | "idle"
  | "starting"
  | "running"
  | "stopped"
  | "error";

export interface TerminalSession {
  id: string;
  roomId: string;
  status: TerminalStatus;
}

export interface TerminalLog {
  id: string;
  timestamp: number;
  message: string;
  type: "stdout" | "stderr" | "system";
}

interface TerminalState {
  session: TerminalSession | null;
  logs: TerminalLog[];

  setSession: (session: TerminalSession | null) => void;
  appendLog: (log: TerminalLog) => void;
  clearLogs: () => void;
  clear: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  session: null,
  logs: [],

  setSession: (session) => set({ session }),

  appendLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  clearLogs: () =>
    set((state) => ({
      ...state,
      logs: [],
    })),

  clear: () =>
    set({
      session: null,
      logs: [],
    }),
}));
