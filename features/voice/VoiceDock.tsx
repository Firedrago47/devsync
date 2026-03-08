"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, Radio } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { eventBus } from "@/features/collaboration/client/event-bus";
import { getSocket } from "@/features/collaboration/client/socket";
import type { WebRTCPeer } from "@/features/collaboration/client/socket.contract";

interface VoiceDockProps {
  roomId: string;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function VoiceDock({ roomId }: VoiceDockProps) {
  const { data: session } = useSession();
  const [joined, setJoined] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [peers, setPeers] = useState<WebRTCPeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const joinedRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  function upsertPeer(nextPeer: WebRTCPeer) {
    setPeers((prev) => {
      const index = prev.findIndex((peer) => peer.socketId === nextPeer.socketId);
      if (index === -1) return [...prev, nextPeer];
      const copy = [...prev];
      copy[index] = nextPeer;
      return copy;
    });
  }

  function removePeer(socketId: string) {
    setPeers((prev) => prev.filter((peer) => peer.socketId !== socketId));
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });

    const pc = pcsRef.current.get(socketId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(socketId);
    }
  }

  function shouldInitiate(remoteSocketId: string): boolean {
    const mySocketId = getSocket().id;
    if (!mySocketId) return false;
    return mySocketId.localeCompare(remoteSocketId) < 0;
  }

  async function createOffer(targetSocketId: string) {
    const pc = pcsRef.current.get(targetSocketId);
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    getSocket().emit("webrtc:offer", {
      roomId,
      targetSocketId,
      sdp: offer,
    });
  }

  function ensurePeerConnection(remoteSocketId: string): RTCPeerConnection | null {
    const existing = pcsRef.current.get(remoteSocketId);
    if (existing) return existing;

    const localStream = localStreamRef.current;
    if (!localStream) return null;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current.set(remoteSocketId, pc);

    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      getSocket().emit("webrtc:ice-candidate", {
        roomId,
        targetSocketId: remoteSocketId,
        candidate: event.candidate.toJSON(),
      });
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: stream,
      }));
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "failed" || state === "closed" || state === "disconnected") {
        removePeer(remoteSocketId);
      }
    };

    return pc;
  }

  async function startVoice() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = stream;
      joinedRef.current = true;
      setJoined(true);
      setMicEnabled(true);

      getSocket().emit("webrtc:join", {
        roomId,
        name: session?.user?.name ?? undefined,
        muted: false,
      });
    } catch (err) {
      console.error("Failed to start voice:", err);
      setError("Mic permission denied or unavailable");
    }
  }

  function stopVoice() {
    if (joinedRef.current) {
      getSocket().emit("webrtc:leave", { roomId });
    }

    joinedRef.current = false;
    setJoined(false);
    setPeers([]);
    setRemoteStreams({});

    for (const pc of pcsRef.current.values()) {
      pc.close();
    }
    pcsRef.current.clear();

    const localStream = localStreamRef.current;
    if (localStream) {
      for (const track of localStream.getTracks()) {
        track.stop();
      }
    }
    localStreamRef.current = null;
  }

  function toggleMic() {
    const localStream = localStreamRef.current;
    if (!localStream) return;

    const nextEnabled = !micEnabled;
    for (const track of localStream.getAudioTracks()) {
      track.enabled = nextEnabled;
    }

    setMicEnabled(nextEnabled);
    getSocket().emit("webrtc:mute", {
      roomId,
      muted: !nextEnabled,
    });
  }

  useEffect(() => {
    const offPeers = eventBus.on("webrtc:peers", async (payload) => {
      if (!joinedRef.current || payload.roomId !== roomId) return;
      setPeers(payload.peers);

      for (const peer of payload.peers) {
        ensurePeerConnection(peer.socketId);
        if (shouldInitiate(peer.socketId)) {
          await createOffer(peer.socketId);
        }
      }
    });

    const offPeerJoined = eventBus.on("webrtc:peer-joined", async (payload) => {
      if (!joinedRef.current || payload.roomId !== roomId) return;
      upsertPeer(payload.peer);
      ensurePeerConnection(payload.peer.socketId);

      if (shouldInitiate(payload.peer.socketId)) {
        await createOffer(payload.peer.socketId);
      }
    });

    const offPeerUpdated = eventBus.on("webrtc:peer-updated", (payload) => {
      if (payload.roomId !== roomId) return;
      upsertPeer(payload.peer);
    });

    const offPeerLeft = eventBus.on("webrtc:peer-left", (payload) => {
      if (payload.roomId !== roomId) return;
      removePeer(payload.socketId);
    });

    const offOffer = eventBus.on("webrtc:offer", async (payload) => {
      if (!joinedRef.current || payload.roomId !== roomId) return;
      const pc = ensurePeerConnection(payload.fromSocketId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getSocket().emit("webrtc:answer", {
        roomId,
        targetSocketId: payload.fromSocketId,
        sdp: answer,
      });
    });

    const offAnswer = eventBus.on("webrtc:answer", async (payload) => {
      if (!joinedRef.current || payload.roomId !== roomId) return;
      const pc = ensurePeerConnection(payload.fromSocketId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    const offIce = eventBus.on("webrtc:ice-candidate", async (payload) => {
      if (!joinedRef.current || payload.roomId !== roomId) return;
      const pc = ensurePeerConnection(payload.fromSocketId);
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    });

    return () => {
      offPeers();
      offPeerJoined();
      offPeerUpdated();
      offPeerLeft();
      offOffer();
      offAnswer();
      offIce();
      stopVoice();
    };
  }, [roomId]);

  useEffect(() => {
    for (const [socketId, stream] of Object.entries(remoteStreams)) {
      const audioElement = audioRefs.current.get(socketId);
      if (!audioElement) continue;
      if (audioElement.srcObject !== stream) {
        audioElement.srcObject = stream;
      }
    }
  }, [remoteStreams]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
      <div className="border-b border-neutral-300 bg-neutral-200 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
              Voice Channel
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            {peers.length + (joined ? 1 : 0)} connected
          </span>
        </div>
      </div>

      <div className="border-b border-neutral-300 px-3 py-2 dark:border-neutral-800">
        <div className="flex items-center gap-2 rounded-md bg-emerald-100 px-2 py-1.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Radio className="h-3.5 w-3.5" />
          <span className="text-[12px] font-medium truncate">
            {joined ? "Voice Connected" : "Room Voice"}
          </span>
        </div>

        {error && <p className="mt-2 text-[11px] text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="px-3 py-2 space-y-1 max-h-28 overflow-auto">
        {joined && (
          <div className="flex items-center justify-between rounded-md bg-neutral-200 px-2 py-1.5 dark:bg-neutral-800/70">
            <span className="text-[12px] font-medium truncate text-neutral-900 dark:text-neutral-100">You</span>
            <span className="text-[10px] text-neutral-600 dark:text-neutral-300">{micEnabled ? "Live" : "Muted"}</span>
          </div>
        )}
        {peers.map((peer) => (
          <div
            key={peer.socketId}
            className="flex items-center justify-between rounded-md bg-neutral-200 px-2 py-1.5 dark:bg-neutral-800/70"
          >
            <span className="text-[12px] truncate text-neutral-800 dark:text-neutral-200">{peer.name}</span>
            <span className="text-[10px] text-neutral-600 dark:text-neutral-300">{peer.muted ? "Muted" : "Live"}</span>
            <audio
              autoPlay
              ref={(el) => {
                if (!el) {
                  audioRefs.current.delete(peer.socketId);
                  return;
                }
                audioRefs.current.set(peer.socketId, el);
              }}
            />
          </div>
        ))}
        {!joined && peers.length === 0 && (
          <div className="px-1 py-1 text-[11px] text-neutral-500 dark:text-neutral-400">Join to connect voice.</div>
        )}
      </div>

      <div className="border-t border-neutral-300 bg-neutral-200 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/70">
        <div className="flex items-center gap-2">
          {!joined ? (
            <Button
              size="sm"
              className="h-8 bg-emerald-600 px-3 text-[11px] text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              onClick={startVoice}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Join Voice
            </Button>
          ) : (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full"
                onClick={toggleMic}
                title={micEnabled ? "Mute" : "Unmute"}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-[#ed4245] hover:bg-[#c53337] text-white"
                onClick={stopVoice}
                title="Disconnect"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
