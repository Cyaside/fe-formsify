# Formsify Frontend (`fe-formsify`)

Frontend Formsify menggunakan Next.js (App Router) dan terhubung ke backend `be-formsify`.

## Repository Links

- Frontend repo: https://github.com/Cyaside/fe-formsify
- Backend repo: https://github.com/Cyaside/be-formsify

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- TanStack React Query (server state/data fetching)
- Zustand (client state)
- DnD Kit (`@dnd-kit/core`, `@dnd-kit/sortable`) untuk drag-drop builder
- Socket.IO Client untuk realtime collaboration
- Recharts untuk analytics chart
- Framer Motion untuk animation/interactions

## Demo Video

### Login & Register

<video src="./readme/loginregister.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/loginregister.mp4)

### Dashboard

<video src="./readme/dashboard.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/dashboard.mp4)

### Form Builder 1

<video src="./readme/form.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/form.mp4)

### Form Builder 2

<video src="./readme/form2.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/form2.mp4)

### Fill Form

<video src="./readme/fill.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/fill.mp4)

### Responses

<video src="./readme/response.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/response.mp4)

### Collaboration

<video src="./readme/collab.mp4" autoplay muted loop playsinline controls width="900"></video>

[Open video](./readme/collab.mp4)

## Prasyarat

- Node.js 20+
- npm
- Backend sudah berjalan (default `http://localhost:4000`)

## Environment Variables

Buat file `fe-formsify/.env.local`: atau bisa lihat di .env.example

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_ENABLE_FORM_COLLAB=false
```

Keterangan:

- `NEXT_PUBLIC_API_BASE_URL`: base URL backend API.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: isi jika Google Sign-In dipakai.
- `NEXT_PUBLIC_ENABLE_FORM_COLLAB`: aktifkan fitur collab realtime di UI.

## Instalasi dan Menjalankan

```bash
cd fe-formsify
npm install
npm run dev
```

Frontend default di `http://localhost:3000`.

## Build dan Lint

```bash
npm run lint
npm run build
```

## Menjalankan di Production

```bash
npm run build
npm run start
```

`start` menggunakan `PORT` environment variable. Jika tidak diisi, gunakan port sesuai runtime platform.

## Catatan Integrasi Backend

- Pastikan `NEXT_PUBLIC_API_BASE_URL` mengarah ke backend yang benar.
- Pastikan backend mengizinkan origin frontend pada `CORS_ORIGIN`.
- Jika collab diaktifkan, backend juga harus set `ENABLE_FORM_COLLAB=true`.
