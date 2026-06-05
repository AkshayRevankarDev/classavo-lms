# Lumiere — LMS Frontend

React + Vite frontend for your Learning Management System.

## Stack
- React 19, Vite 7, TypeScript
- TailwindCSS v4 + shadcn/ui components
- TanStack Query v5, react-hook-form + zod
- wouter (client-side routing)
- Axios (HTTP client)
- lucide-react (icons)

## Setup

```bash
# Install dependencies (Node 18+ required)
npm install
# or
pnpm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:5173

## Connect to your Django backend

Edit `src/lib/api.ts` — change the `baseURL`:

```ts
export const api = axios.create({
  baseURL: "http://localhost:8000/api",   // ← your Django DRF base URL
  ...
});
```

## Demo Mode

The app ships with built-in demo data so you can explore without a live backend.

- On the login page, click **"Demo as Instructor"** or **"Demo as Student"**
- All CRUD operations work against in-memory mock data
- To disable, clear `localStorage.removeItem("demo_mode")`

Demo logic lives in `src/lib/mock.ts` — edit the sample courses/chapters/enrollments there.

## Auth flow (JWT)

- `POST /api/auth/login/` → `{ access, refresh }` stored in localStorage
- `POST /api/auth/register/` → creates user with `{ username, email, password, role }`
- Every subsequent request has `Authorization: Bearer <access>` injected automatically
- 401 responses auto-logout and redirect to `/login`

Your Django backend should return `{ access: "...", refresh: "...", role: "instructor"|"student" }` from the login endpoint. Adjust `src/lib/api.ts` if your response shape differs.

## Production build

```bash
npm run build
```

Output in `dist/` — serve with any static host (Nginx, Vercel, Netlify, etc.).

## Project structure

```
src/
  components/
    ui/              # shadcn/ui component library
    sidebar-layout   # Shared sidebar + navbar shell
    instructor-layout # Instructor nav (My Courses, Settings)
    student-layout   # Student nav (Browse, My Courses, Settings)
    protected-route  # Role-based route guard
  hooks/
    use-auth         # Auth state (role, token, logout)
  lib/
    api.ts           # Axios instance + JWT + demo interceptor
    mock.ts          # Demo mode data + mutation handlers
  pages/
    login.tsx
    register.tsx
    instructor/
      dashboard.tsx       # Course grid with gradients
      course-detail.tsx   # Chapter list
      chapter-editor.tsx  # Split-panel editor
      settings.tsx
    student/
      dashboard.tsx       # Course discovery
      course-detail.tsx   # Two-column layout
      chapter-reader.tsx  # Reading view with sidebar
      my-courses.tsx      # Enrolled courses only
      settings.tsx
```
