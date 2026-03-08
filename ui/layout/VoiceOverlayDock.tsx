"use client";

import { useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import VoiceDock from "@/features/voice/VoiceDock";

interface VoiceOverlayDockProps {
  roomId: string;
}

export default function VoiceOverlayDock({ roomId }: VoiceOverlayDockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute left-2 bottom-2 z-[120]">
      {open && (
        <div className="pointer-events-auto mb-2 w-[260px] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          <VoiceDock roomId={roomId} />
        </div>
      )}

      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-700 shadow-[0_10px_24px_rgba(0,0,0,0.25)] transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          title={open ? "Close Voice Panel" : "Open Voice Panel"}
          aria-label={open ? "Close Voice Panel" : "Open Voice Panel"}
        >
          {open ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
