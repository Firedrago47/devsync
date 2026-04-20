# DevSync

DevSync is a collaborative coding workspace built to make open-source onboarding less overwhelming and more human.
It gives contributors and mentors one shared place to read code, discuss ideas, review changes, and learn by doing.

## Why this project matters

Getting started in open source can feel like solving a puzzle with missing pieces.
DevSync helps by bringing the important pieces together:

- shared code editing
- real-time collaboration
- guided AI assistance
- structured mentoring workflows

The goal is simple: help people contribute with more confidence, less friction, and better context.

## What you can do with DevSync

- Create and join project rooms
- Collaborate in real time with shared file trees and editor state
- Use AI chat and review tools while coding
- See collaborator presence and in-room activity
- Run remote code execution flows from the workspace
- Keep discussions and technical context in the same place

## Screenshots

Add your product screenshots here before publishing.

### 1) Landing / Auth Experience
![Landing page screenshot placeholder](docs/screenshots/01-landing.png)

### 2) Collaborative Room Workspace
![Room workspace screenshot placeholder](docs/screenshots/02-room-workspace.png)

### 3) AI Review and Insights Panel
![AI review screenshot placeholder](docs/screenshots/03-ai-review.png)

### 4) Real-time Collaboration (Presence + Editor)
![Real-time collaboration screenshot placeholder](docs/screenshots/04-collaboration.png)

## Tech stack

- Next.js (App Router)
- TypeScript + React
- NextAuth (OAuth)
- Socket.IO client
- Yjs for collaborative editing
- Zustand for state management

## Security highlights

Recent hardening work included:

- server-side protection for private routes and AI API routes
- auth checks on sensitive API handlers
- origin checks for state-changing requests
- rate limiting controls for AI endpoints
- secure HTTP headers (CSP, HSTS, frame/mime/referrer protections)
- dependency updates and audit cleanup

## Local development

```bash
cd devsync
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create a `.env.local` with values like:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `WISDOM_URL`
- `WISDOM_API_KEY`

## Project structure

- `app/` - App Router pages and API routes
- `features/` - domain-level frontend modules
- `components/` and `ui/` - reusable interface components
- `lib/` - shared utilities, including security helpers
- `docs/` - architecture notes and diagrams

## Contributing

Contributions are welcome.

If you want to help, open an issue first with one of these:

- bug report
- feature request
- documentation improvement

Then create a PR with clear scope and screenshots for UI changes.

