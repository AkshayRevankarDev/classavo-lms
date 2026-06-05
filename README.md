# Classavo LMS

A simple Learning Management System built for the Classavo hiring assignment.

- **Backend:** Django 5 + Django REST Framework + SimpleJWT (SQLite)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind + shadcn/ui + wouter
- **Editor:** [Plate.js](https://platejs.org) v49 (`@udecode/plate`) with H1/H2/H3 + bold / italic / underline

## Features

### Instructor
- Sign up as an instructor.
- Create courses, rename them, delete them.
- Add chapters, edit each chapter's rich-text content in Plate.js, delete chapters.
- Toggle every chapter's visibility (public / private).
- See the roster of enrolled students for each course, with each student's progress.

### Student
- Sign up as a student.
- Browse every available course.
- Join a course (instructor cannot enrol).
- Open joined courses and read any chapter the instructor has marked **public**.
  Private chapters are filtered out server-side, not just hidden in the UI.
- Track progress: mark chapters complete; see per-course progress on the dashboard.
- Leave a course at any time (clears enrolment and progress for that course).

## Repo layout

```
backend/             Django project
  lms/               settings, urls
  api/               User, Course, Chapter, Enrollment, ChapterProgress + DRF views
frontend/            Vite + React app
  src/components/    PlateEditor, Layout, ProtectedRoute, shadcn/ui primitives
  src/hooks/         use-auth, use-toast, use-mobile
  src/lib/           axios client (JWT interceptor)
  src/pages/         login, register, instructor/*, student/*
```

## Running locally

### 1. Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 8000
```

The API serves at `http://localhost:8000/api/`.

Optional admin: `.venv/bin/python manage.py createsuperuser`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # serves on http://localhost:5173
```

The axios client is hardcoded to `http://localhost:8000/api` (`src/lib/api.ts`).

## API summary

All endpoints are JSON. Authentication uses JWT in `Authorization: Bearer <token>`.
Login accepts either `email` or `username`. The login response and JWT payload
include the user's `role` claim so the SPA can route appropriately.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create user (`role`: `instructor` \| `student`) |
| POST | `/api/auth/login/` | `{email, password}` → access + refresh tokens (+ role) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| GET | `/api/courses/` | List all courses |
| POST | `/api/courses/` | Create course *(instructor)* |
| GET | `/api/courses/{id}/` | Course detail |
| PATCH/PUT | `/api/courses/{id}/` | Edit course *(owner)* |
| DELETE | `/api/courses/{id}/` | Delete course *(owner)* |
| GET | `/api/courses/{id}/chapters/` | List chapters (public-only for non-owners) |
| POST | `/api/courses/{id}/chapters/` | Create chapter *(owner)* |
| GET | `/api/courses/{id}/chapters/{cid}/` | Read chapter (public or owner) |
| PATCH | `/api/courses/{id}/chapters/{cid}/` | Update chapter *(owner)* |
| DELETE | `/api/courses/{id}/chapters/{cid}/` | Delete chapter *(owner)* |
| POST | `/api/courses/{id}/chapters/{cid}/complete/` | Mark chapter complete *(student)* |
| DELETE | `/api/courses/{id}/chapters/{cid}/complete/` | Unmark complete *(student)* |
| POST | `/api/courses/{id}/enroll/` | Enrol *(student)* |
| POST | `/api/courses/{id}/leave/` | Unenrol + clear progress *(student)* |
| GET | `/api/courses/{id}/progress/` | Current student's progress |
| GET | `/api/courses/{id}/students/` | Instructor-only roster with per-student progress |
| GET | `/api/my-enrollments/` | My enrolments with embedded progress |

Chapter content is stored as the JSON array Plate.js emits — e.g.
`[{ "type": "h1", "children": [{ "text": "Hello", "bold": true }] }]`. The API
also accepts a JSON-encoded string for content and normalises it.

## Design notes

- **JWT carries `role` and `username`** as custom claims (see
  `RoleTokenObtainPairSerializer`) so the SPA can route without a separate
  `/me` round-trip on login.
- **Login by email**: the serializer falls back to username if the input
  doesn't match an email, so either works.
- **`visibility` field**: exposed as `"public"` / `"private"` on the wire,
  mapped to `is_public: bool` in the DB. The frontend never sees the boolean.
- **Private-chapter enforcement** is in the API (`PermissionDenied`) and not
  just the UI — a curl with a student's token to a private chapter URL
  returns 403.
- **Progress** is stored per `(student, chapter)`; leaving a course wipes
  both the enrolment and the progress for that course in a single endpoint.
- **CORS** is wide-open in dev for convenience; tighten before production.
- **Plate.js** is loaded directly (no `dynamic` / SSR concerns since the SPA
  is fully client-side). The same component is used in write mode (instructor
  chapter editor) and read mode (student chapter reader).
