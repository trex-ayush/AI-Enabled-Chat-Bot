## AI-enabled Customer Support

A full-stack customer support application with authentication, chat sessions, and admin tools. This repository contains a backend (Node.js/Express/MongoDB) and a frontend (React + Vite).

### 🔐 Test Credentials

Use the following test accounts to explore the application:

### 🧑‍💼 User Login
- **Email:** `ayush@gmail.com`  
- **Password:** `Ayush@123`

### 🛠️ Admin Login
- **Email:** `admin@company.com`  
- **Password:** `admin123`

---



### Features
- Secure authentication with httpOnly JWT cookies
- User registration/login/logout and profile management
- Customer chat sessions with history
- Admin dashboard for escalated chats and user management
- Production-ready CORS and cookie configuration

### Tech stack
- Backend: Node.js, Express, MongoDB (Mongoose)
- Frontend: React, Vite, Axios, Tailwind CSS

## Repository layout
```
backend/   # Express API server
frontend/  # React SPA
```

## Prerequisites
- Node.js 18+ and npm
- MongoDB (local or hosted)
- A domain with HTTPS (for production cookies)

## Environment configuration
Create environment files for both backend and frontend. Do not commit your real secrets.

### backend/.env 
```env
PORT=5000
MONGODB_URI=
GEMINI_API_KEY=
FRONTEND_URL=http://localhost:5173
JWT_SECRET=
NODE_ENV=production
```

### frontend/.env
```env
# Must include /api if your backend serves under /api
VITE_API_BASE_URL=http://localhost:5000/api
```

## Install and run locally
Open two terminals (one in `backend`, one in `frontend`).

### Backend
```bash
cd backend
npm install
npm run start
# or: npm run dev   # if you have a dev script for nodemon
```
API: http://localhost:5173

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

## Important configuration notes
- Cookies: The backend sets httpOnly cookies and, in production, uses `SameSite=None; Secure` so they can be sent cross-site over HTTPS.
- CORS: The backend enables CORS with credentials and expects `FRONTEND_URL` to be set to your exact frontend origin.
- Proxy: The backend enables `app.set('trust proxy', 1)` so `Secure` cookies work behind reverse proxies.
- Frontend Axios: `withCredentials` is enabled globally so cookies are sent automatically.

## Deployment checklist
- Backend is accessible via HTTPS and uses `NODE_ENV=production`.
- Backend `.env` sets:
  - `FRONTEND_URL=https://your-frontend.example.com`
  - a strong `JWT_SECRET`
  - `MONGODB_URI` to your hosted database
  - `COOKIE_DOMAIN=.yourdomain.com` if using subdomains
- Frontend `.env` sets:
  - `VITE_API_BASE_URL=https://your-backend.example.com/api`
- Verify in browser devtools after login:
  - Response includes `Set-Cookie: token; Path=/; Max-Age=...; SameSite=None; Secure`
  - Cookie appears under the backend origin and is sent on subsequent API calls

## Troubleshooting: token not stored in production
- Ensure HTTPS on the backend. `Secure` cookies will not set on HTTP.
- Confirm `SameSite=None` and `Secure` are present in the `Set-Cookie` header.
- Confirm exact origin match: `FRONTEND_URL` equals your frontend URL (no trailing slash).
- If behind a proxy/load balancer (Nginx/Heroku/Render), keep `app.set('trust proxy', 1)`.
- Make sure the frontend points to the deployed API: `VITE_API_BASE_URL` is not `localhost`.
- If using subdomains, set an appropriate `COOKIE_DOMAIN`.
- Check that your browser is not blocking third-party cookies by policy or extensions.

## Common scripts
### Backend (`backend/package.json`)
- `npm start` – start server
- `npm run dev` – start in dev mode (if configured)

### Frontend (`frontend/package.json`)
- `npm run dev` – start Vite dev server
- `npm run build` – build production assets
- `npm run preview` – preview production build

## API routes

### Auth (`/api/auth`)
- POST `/register` – register user (sets cookie)
- POST `/login` – authenticate (sets cookie)
- POST `/logout` – clear cookie
- GET `/profile` – get current user (auth)
- PUT `/profile` – update current user (auth)
- POST `/users` – create user (admin only)

### Support (`/api/support`)
- POST `/sessions` – create a new session (public)
- GET `/sessions/:sessionId` – get session history (public)
- POST `/chat` – send message in session (auth)
- GET `/faqs` – list FAQs (public)
- GET `/health` – health check (public)
- GET `/user/chats` – list user chat sessions (auth)
- GET `/user/sessions/:sessionId` – get user session details (auth)
- POST `/user/sessions` – create session for logged-in user (auth)

### Admin (`/api/admin`)
- GET `/escalated-chats` – list escalated chats (admin)
- GET `/escalated-chats/:chatId` – chat details (admin)
- POST `/escalated-chats/:chatId/assign` – assign admin (admin)
- POST `/escalated-chats/:chatId/notes` – add note (admin)
- POST `/sessions/:sessionId/admin-message` – send admin message (admin)
- POST `/escalated-chats/:chatId/resolve` – resolve chat (admin)
- GET `/dashboard/stats` – dashboard stats (admin)
- GET `/users` – list users (admin)
- POST `/users` – create user (admin)
- PUT `/users/:userId` – update user (admin)

## Security notes
- JWT is stored in an httpOnly cookie; client JavaScript cannot read it.
- Always deploy over HTTPS to enable `Secure` cookies.
- Keep `JWT_SECRET` and database credentials safe.
