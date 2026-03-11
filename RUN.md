# Running the HRM App

You can run the app in two ways: **combined** (both services together) or **separately** (each service as its own process).

---

## 1. Combined (both services together)

Single command runs backend + frontend:

```bash
npm run dev
```

- **Backend**: http://localhost:5000  
- **Frontend**: http://localhost:5173 (proxies `/api` to backend)

---

## 2. Separate (microservices)

Run each service in its own terminal.

### Terminal 1 – Backend

```bash
npm run dev:backend
```

- API: http://localhost:5000  
- Health: http://localhost:5000/health  
- Status: http://localhost:5000/status  

### Terminal 2 – Frontend

```bash
npm run dev:frontend
```

- App: http://localhost:5173  
- Vite proxies `/api`, `/health`, `/status` to `http://localhost:5000`

**Note:** Start the backend first so the frontend proxy can reach it.

---

## Production build

### Build both

```bash
npm run build:all
```

### Run production

**Terminal 1 – Backend**

```bash
npm run start:backend
```

**Terminal 2 – Frontend**

```bash
npm run start:frontend
```

For production, set `VITE_API_BASE_URL` to your backend URL (e.g. `https://api.yourdomain.com/api`) before building the frontend.

---

## Quick reference

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Combined: backend + frontend          |
| `npm run dev:backend`  | Backend only (port 5000)        |
| `npm run dev:frontend` | Frontend only (port 5173)       |
| `npm run start:backend`  | Production backend             |
| `npm run start:frontend` | Production frontend (preview)  |
| `npm run build:all`      | Build backend + frontend       |
