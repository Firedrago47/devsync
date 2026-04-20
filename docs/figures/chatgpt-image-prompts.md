# ChatGPT Image Prompts for DevSync Figures

Use these directly in ChatGPT image generation.

## Figure 4.1 Prompt: System Architecture of the DevSync Platform

Create a clean and immersive academic system architecture diagram titled:
**"System Architecture of the DevSync Platform"**.

Style:
- White background
- Professional software architecture style
- Sharp black/gray text, high contrast
- Rounded rectangles for components
- Cylinders for databases/storage
- Solid arrows for request/data flow
- 16:9 layout, high resolution, presentation-ready

Content and layout (left to right):
- Left: **User Browser**
- Middle-left group labeled **Frontend Layer (Next.js + React + TypeScript)** containing:
  - RoomRouteClient
  - CollaborationProvider
  - Typed Event Bus
  - Zustand Stores
  - RoomShell / Sidebar / Editor / Terminal / Chat
  - Monaco Editor
  - Yjs CRDT
- Middle: **Socket.IO Client** connected bidirectionally to **Realtime Gateway (Socket.IO Server)**
- Middle-right group labeled **Backend Collaboration Services** containing:
  - room.handlers
  - fs.handlers
  - yjs.handlers
  - terminal.handlers
  - chat/presence handlers
- Right-side data/services:
  - room.service connected to **Supabase DB** (cylinder)
  - fs.handlers connected to **Object Storage + Room Tree State** (cylinder)
  - yjs.handlers connected to **Per-file Y Docs** (cylinder)
  - terminal.handlers connected to **Judge0 Execution**
- Show return stream from terminal service to frontend as:
  - terminal:session
  - terminal:log
- Show presence/chat updates flowing to frontend stores.

Caption at bottom:
**"Event-driven real-time collaboration architecture with role-aware backend enforcement."**

---

## Figure 4.2 Prompt: Role-Based Collaboration and Room Management Workflow

Create a UML-style sequence diagram titled:
**"Figure 4.2 Role-Based Collaboration and Room Management Workflow"**.

Style:
- White background
- Professional thesis/report look
- Monospace-like sequence labels where appropriate
- High readability for all text
- 16:9, high resolution

Participants (left to right):
1. Joining User
2. Frontend (RoomRouteClient + CollaborationProvider)
3. Socket Server
4. room.service
5. Room Owner

Sequence to show:
1. Joining User opens `/room/{roomId}`.
2. Frontend sends `room:join(roomId, userId, name, email)` to Socket Server.
3. Socket Server checks `isMember(roomId, userId)` with room.service.
4. Use an **alt** branch:
   - **Existing member**:
     - role returned (owner/editor/viewer)
     - server sends `room:snapshot + fs:snapshot + presence:update + collab:history`
     - user enters room
   - **Not a member**:
     - server stores pending join request
     - owner receives `room:join-request`
     - joining user receives `room:error(code=pending_role_assignment)`
     - frontend shows waiting screen
     - owner sends `room:assign-role(roomId, userId, editor|viewer)`
     - server verifies owner, assigns role, clears pending request
     - server sends updated snapshot to owner and bootstrap snapshots to joining user
     - user enters room with assigned permissions

Add a note block:
- Viewer: read-only
- Editor: file + code edits
- Owner: editor rights + role assignment

Caption at bottom:
**"Owner-mediated access control with real-time onboarding and synchronized room state."**
