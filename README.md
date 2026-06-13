# Frontend Reference Implementation

This directory contains the React (Vite) frontend for the [FastAPI Authentication Template](https://github.com/Avneesh11905/Fastapi_OAuth_Backend). It serves as a comprehensive **reference implementation**, demonstrating how a modern Single Page Application (SPA) should securely interface with a stateless JWT backend.

## 📑 Index
- [What This Template Features](#-what-this-template-features)
- [Routing Architecture (TanStack Router)](#️-routing-architecture-tanstack-router)
- [Tech Stack & UI Components](#️-tech-stack--ui-components)
- [How to Use the Frontend Template](#-how-to-use-the-frontend-template)
  - [Development Setup](#1-development-setup)
  - [Building Your Features](#2-building-your-features)
  - [Running in Production](#3-running-in-production)

## 🎯 What This Template Features

This frontend implements a rigorous, production-grade security and state management architecture:
- **In-Memory Token Storage**: Access Tokens are strictly held in a closure variable in `src/lib/api.ts` (instead of global Axios defaults or localStorage) to neutralize XSS vulnerabilities and prevent token exposure.
- **Silent Token Rotation**: Utilizes an advanced Axios interceptor that catches `401 Unauthorized` responses and automatically hits the `POST /auth/refresh` endpoint. The backend validates the HttpOnly cookie, returns a new Access Token, and the interceptor seamlessly retries the failed request without disrupting the user.
- **CSRF Protection**: Safely extracts the `csrf_token` cookie and attaches it as an `X-CSRF` header to all mutating requests.
- **Open Redirect Prevention**: Login redirects enforce strict same-origin validation (`isValidRedirect`) to neutralize malicious phishing links.
- **Content Security Policy (CSP) & XSS Defenses**: A baseline `<meta>` CSP is configured to mitigate XSS globally, and strict HTTP protocol validation is applied to dynamic user content like avatars.
- **Eager State Synchronization**: Implements token prefetching to seamlessly align the React context state with the server session, entirely preventing visual flashes or intentional `401 Unauthorized` requests during the initial page load.
- **Centralized API Handling**: A globally configured Axios instance (`src/lib/api.ts`) manages all backend communication, error toasting (via Sonner), and token rotation seamlessly.

## 🛣️ Routing Architecture (TanStack Router)

This project leverages [TanStack Router](https://tanstack.com/router) for type-safe, file-based routing. Route access is strictly controlled using router middleware (`beforeLoad`):

- **Protected Routes (`_protected/`)**: Routes placed inside the `_protected` layout automatically verify the user's session. If the user is unauthenticated, they are immediately redirected to `/login` (with a `redirectUrl` parameter to return them after authenticating).
- **Auth-Restricted Routes**: Routes like `/login` and `/register` include logic to check the authentication state. If an already-authenticated user attempts to visit them, they are instantly bounced back to the `/dashboard`.
- **Public Routes**: Routes like the landing page (`/`) are fully accessible but adapt their UI (e.g., swapping "Sign In" buttons for "Dashboard" buttons) based on the global `useAuth` hook.

## 🛠️ Tech Stack & UI Components

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Styling & UI**: Built with [Tailwind CSS v4](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/). Reusable, accessible components (like Buttons, Inputs, and Skeletons) are built on top of Radix UI primitives and are located in `src/components/ui`.
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) is globally integrated into the Axios interceptors to automatically display beautiful toast notifications for server errors or invalid requests.

## 🚀 How to Use the Frontend Template

### 1. Development Setup
Make sure you have Node.js (v18+) installed.
```bash
npm install
npm run dev
```
The application will start on `http://localhost:3000`. 
*(Ensure your FastAPI backend is running simultaneously on `http://localhost:8000` for authentication to function correctly.)*

### 2. Building Your Features
- **Adding New API Calls**: Always import `api` from `src/lib/api.ts` to make backend requests. This ensures your requests automatically include CSRF headers and benefit from the silent refresh loop.
  ```typescript
  import { api } from '../lib/api';
  const response = await api.get('/your/custom/endpoint');
  ```
- **Adding New Pages**: Create new files in the `src/routes/` directory. If the page requires the user to be logged in, place the file inside the `src/routes/_protected/` directory to automatically inherit security policies.
- **Accessing User Data**: Use the `useAuth()` hook provided by `src/context/AuthContext.tsx` anywhere in your application to get the current user, session status, or trigger logouts.

### 3. Running in Production
When you are ready to deploy, create a highly optimized production build:
```bash
npm run build
```
This will generate static files in the `dist/` directory. You can serve this directory using any static file host (like Nginx, Vercel, Netlify, or AWS S3/CloudFront). 

*Note: Ensure your production server is configured to handle Single Page Application (SPA) routing by redirecting all 404 requests back to `index.html`.*
