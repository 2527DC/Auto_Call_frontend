# Voxeno frontend

Next.js app for Voxeno: AI voice agents, campaigns, call activity, leads and follow-ups, WhatsApp, settings and the admin area.

## Run it locally

1. Start the backend first: see [Running Voxeno locally](https://github.com/2527DC/Auto_Call_backend/blob/main/docs/local-development.md) in the backend repo. It also covers testing calls without a phone and real calls from your laptop.
2. Point this app at it. Create `.env.local` (copy `.env.example`):

   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   NEXT_PUBLIC_STORAGE_URL=http://localhost:5000/
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

3. Install and start:

   ```bash
   npm install
   npm run dev          # http://localhost:3000
   ```

   If port 3000 is taken: `PORT=3001 npm run dev`, and add that address to `FRONTEND_URL` and `ALLOWED_ORIGINS` in the backend `.env`.

Inside a git worktree with a symlinked `node_modules`, use `npx next dev --webpack` (Turbopack rejects the symlink).

Pushes to `main` deploy to production.
