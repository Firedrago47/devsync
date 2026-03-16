# DevSync Frontend

DevSync is a realtime collaborative coding workspace designed for learning-focused open-source contribution.
This frontend is where contributors and mentors interact: rooms, editor, collaboration tools, analysis, and guided review UX.

## Why this project exists

Open-source onboarding is hard for beginners because context is scattered across too many tools.
DevSync reduces that friction by combining:
- shared editing,
- communication,
- code understanding,
- and runnable feedback
into one place.

## Purpose

This project is built for **educational mentoring** and contributor enablement.
It is not positioned as a full build/deploy platform.

## Key user outcomes

- understand what each file/module does
- collaborate with mentors in real time
- practice contribution patterns safely
- iterate quickly without complex local setup

## Main frontend capabilities

- Room-based collaboration shell
- Realtime file tree sync
- Shared editor tabs and Yjs-powered co-editing
- Presence and collaborator visibility
- AI-assisted review and codebase analysis views
- In-room chat and voice controls
- Bottom terminal/output panel for remote run logs

## How we built it (abstract view)

Frontend stack:
- Next.js (App Router)
- TypeScript + React
- Zustand for client state
- Socket.IO client for realtime transport
- Monaco editor integration + Yjs synchronization

Design principles:
- keep socket contracts explicit and stable
- isolate UI domains into `features/*`
- keep room shell modular (`ActivityBar`, `Sidebar`, `ToolsPanel`, `BottomPanel`)
- optimize for clarity and guided collaboration over visual complexity

## Local development

```bash
cd /home/fire/Documents/Projects/devsync
npm install
npm run dev
```

Open:
- `http://localhost:3000`

## Required environment (frontend)

Typical `.env.local` values:
- `NEXT_PUBLIC_BACKEND_URL` (backend base URL)
- auth/provider keys (NextAuth / provider-specific)

## Related backend

Backend repo:
- `/home/fire/Documents/Projects/DevSync_BackEnd`

Backend docs:
- `/home/fire/Documents/Projects/DevSync_BackEnd/PROJECT_DOCUMENTATION.md`
