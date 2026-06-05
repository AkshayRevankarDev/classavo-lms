# LMS Frontend — Lumiere

A React + Vite LMS frontend with JWT auth, instructor & student dashboards, and a built-in demo mode (no backend required to preview).

## Quick Start

```bash
npm install       # or: pnpm install / yarn
npm run dev
```

Open http://localhost:5173 — click **"Demo as Instructor"** or **"Demo as Student"** to explore without a backend.

---

## Connecting to Your Django Backend

Edit **`src/lib/api.ts`** and change `baseURL`:

```ts
export const api = axios.create({
  baseURL: "http://localhost:8000/api",   // ← your Django URL
});
```

Enable CORS in Django for your frontend origin:

```python
# settings.py
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", ...rest]
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```

---

## JWT Role Claim

After login the frontend decodes the JWT to read the user's role.
Add a `role` claim to your SimpleJWT tokens:

```python
# serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role   # adjust to your User model field
        return token
```

```python
# settings.py
SIMPLE_JWT = {
    "TOKEN_OBTAIN_SERIALIZER": "yourapp.serializers.CustomTokenObtainPairSerializer",
}
```

---

## Removing Demo Mode (Production)

When your backend is ready, remove the demo buttons by deleting:
- The `enterDemo` function and two `<Button>` blocks in `src/pages/login.tsx`
- The file `src/lib/mock.ts`
- The demo-mode block in `src/lib/api.ts` (the `if (isDemo)` block)

---

## Routes

| Path | Role | Description |
|------|------|-------------|
| `/login` | Any | Login + demo buttons |
| `/register` | Any | Register with role selector |
| `/instructor` | Instructor | Course dashboard |
| `/instructor/courses/:id` | Instructor | Course chapters |
| `/instructor/courses/:id/chapters/:id` | Instructor | Chapter editor |
| `/student` | Student | Course discovery + enroll |
| `/student/courses/:id` | Student | Course curriculum (public chapters only) |
| `/student/courses/:id/chapters/:id` | Student | Chapter reader |

## Stack

- React 19 + Vite 6
- wouter (routing)
- Axios (API calls with JWT interceptor + demo mode interceptor)
- TailwindCSS v4 + shadcn/ui (New York style)
- TanStack Query v5
- react-hook-form + zod
- lucide-react icons
