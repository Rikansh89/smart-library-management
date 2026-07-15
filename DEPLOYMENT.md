# Deployment Guide - Smart Library Management System

## Architecture

```
Frontend (React + Vite)  →  Vercel
Backend (Node.js + Express)  →  Render
Database (MySQL)  →  ClearDB / PlanetScale / Railway
```

---

## Prerequisites

- Node.js 18+ installed
- MySQL database (ClearDB, PlanetScale, Railway, or self-hosted)
- GitHub account
- Vercel account (free tier works)
- Render account (free tier works)

---

## Step 1: Push to GitHub

```bash
# From project root
git init
git add .
git commit -m "Initial commit: Smart Library Management System"
git remote add origin https://github.com/YOUR_USERNAME/smart-library-management-system.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up MySQL Database

### Option A: ClearDB (Free, on Heroku)
1. Go to https://elements.heroku.com/addons/cleardb
2. Create a database
3. Copy the `DATABASE_URL` from ClearDB dashboard
4. Extract host, user, password, database name from the URL

### Option B: PlanetScale (Free tier)
1. Go to https://planetscale.com
2. Create a new database
3. Copy connection details from the dashboard
4. Import the schema: `backend/schema.sql`

### Option C: Railway
1. Go to https://railway.app
2. Add MySQL service
3. Copy connection details

### Import Schema

After creating the database, import the schema:

```bash
# Using MySQL CLI
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DB_NAME < backend/schema.sql

# Or use any MySQL GUI (phpMyAdmin, DBeaver, MySQL Workbench)
# Copy and paste the contents of backend/schema.sql
```

### Seed Sample Data (Optional)

```bash
cd backend
# Create .env file with your database credentials first
node utils/generateSampleData.js
```

---

## Step 3: Deploy Backend to Render

### 3.1 Create a Render account at https://render.com

### 3.2 Create a new Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `smart-library-backend`
   - **Region:** Closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### 3.3 Set Environment Variables

Go to **Environment** tab and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5001` | Render sets this automatically, but set it for clarity |
| `DB_HOST` | `your-db-host` | From your MySQL provider |
| `DB_USER` | `your-db-user` | From your MySQL provider |
| `DB_PASSWORD` | `your-db-password` | From your MySQL provider |
| `DB_NAME` | `your-db-name` | From your MySQL provider |
| `JWT_SECRET` | (generate random string) | Use a long random string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (set after Step 4) |
| `FINE_PER_DAY` | `5` | Fine amount per day overdue |
| `GEMINI_API_KEY` | (your API key) | Optional - for AI chatbot |
| `EMAIL_HOST` | `smtp.gmail.com` | Optional - for email notifications |
| `EMAIL_PORT` | `587` | Optional |
| `EMAIL_USER` | (your email) | Optional |
| `EMAIL_PASS` | (app password) | Optional |
| `EMAIL_FROM` | (your email) | Optional |

### 3.4 Deploy
1. Click **Create Web Service**
2. Wait for deployment to complete (2-3 minutes)
3. Note your backend URL: `https://smart-library-backend.onrender.com`

### 3.5 Verify Backend
Visit: `https://smart-library-backend.onrender.com/api/health`
You should see: `{"status":"ok","timestamp":"..."}`

### 3.6 Update CLIENT_URL
Go back to Render → Environment tab → Update `CLIENT_URL` with your actual Vercel URL.

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create a Vercel account at https://vercel.com

### 4.2 Import Project
1. Click **Add New** → **Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `cd frontend && npm install`

### 4.3 Set Environment Variables

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `https://smart-library-backend.onrender.com/api` | Backend API URL |
| `VITE_SOCKET_URL` | `https://smart-library-backend.onrender.com` | Backend Socket.IO URL |
| `VITE_FINE_RATE_PER_DAY` | `5` | Display-only fine rate |
| `VITE_APP_VERSION` | `1.0.0` | Shown in admin settings |

### 4.4 Deploy
1. Click **Deploy**
2. Wait for deployment (1-2 minutes)
3. Note your frontend URL: `https://smart-library-frontend.vercel.app`

### 4.5 Update Backend CLIENT_URL
Go back to Render → Update `CLIENT_URL` to `https://smart-library-frontend.vercel.app`

---

## Step 5: Create Admin Account

After deployment, create an admin account via the API:

```bash
# Register a user first via the frontend, then use the admin endpoint:
curl -X POST https://smart-library-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@library.com","password":"admin123","role":"admin"}'
```

**Note:** The first user should be created via the register endpoint. To create additional admin/librarian accounts, use the admin panel after logging in as admin.

### Default Test Accounts (if seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | password123 |
| Librarian | librarian@library.com | password123 |
| Student | student@library.com | password123 |

---

## Environment Variables Reference

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `us-cdbr-east-02.cleardb.com` |
| `DB_USER` | MySQL username | `bc8372a4b5c6de` |
| `DB_PASSWORD` | MySQL password | `abc123xyz` |
| `DB_NAME` | MySQL database name | `heroku_abc123` |
| `JWT_SECRET` | Secret for JWT tokens | `your-256-bit-secret` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CLIENT_URL` | Frontend URL | `https://app.vercel.app` |
| `PORT` | Server port | `5001` |

### Backend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | None (chatbot disabled) |
| `EMAIL_HOST` | SMTP host | None (emails disabled) |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | None |
| `EMAIL_PASS` | SMTP password | None |
| `EMAIL_FROM` | Sender email | None |
| `FINE_PER_DAY` | Fine per overdue day ($) | `5` |
| `NODE_ENV` | Environment | `development` |

### Frontend (Required for Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.onrender.com/api` |
| `VITE_SOCKET_URL` | Backend Socket.IO URL | `https://backend.onrender.com` |

### Frontend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FINE_RATE_PER_DAY` | Display fine rate | `5` |
| `VITE_APP_VERSION` | App version display | `1.0.0` |

---

## Local Development

### Prerequisites
- Node.js 18+
- MySQL running locally

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/smart-library-management-system.git
cd smart-library-management-system

# 2. Set up backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MySQL credentials

# 3. Import database schema
mysql -u root -p < backend/schema.sql

# 4. Seed sample data
cd backend
node utils/generateSampleData.js

# 5. Set up frontend
cp frontend/.env.example frontend/.env
# Default values work for local development

# 6. Install dependencies
cd ..
npm run install:all

# 7. Start development servers
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5001

---

## Troubleshooting

### Backend Won't Start
1. Check all environment variables are set
2. Verify MySQL connection (host, user, password, database)
3. Check Render logs: Dashboard → Logs tab
4. Ensure `schema.sql` was imported into the database

### Frontend Can't Connect to Backend
1. Verify `VITE_API_URL` is set correctly (must end with `/api`)
2. Verify `VITE_SOCKET_URL` matches backend URL (no trailing `/api`)
3. Check `CLIENT_URL` on Render matches your Vercel URL
4. Check CORS: Backend must allow your Vercel domain

### Database Connection Errors
1. Ensure MySQL allows remote connections
2. Check if your MySQL provider requires SSL (`ssl: {}` in db.js)
3. Verify firewall rules allow connection on port 3306
4. For ClearDB/PlanetScale, use the full connection URL

### Build Failures
1. Ensure Node.js 18+ is set in Render/Vercel
2. Check that all dependencies are in package.json
3. Review build logs for specific error messages

### Vercel Routing Issues (404 on refresh)
1. Ensure `vercel.json` has the SPA rewrite rule
2. Verify the output directory is `frontend/dist`

### Socket.IO Not Working
1. Ensure `CLIENT_URL` matches your exact Vercel domain
2. Check Render logs for socket connection errors
3. Verify `VITE_SOCKET_URL` is set in Vercel

### Email Notifications Not Sending
1. Check `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` are set
2. For Gmail: Use App Passwords (not regular password)
3. Check Render logs for email errors

---

## API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/register | No | - | Register new user |
| POST | /api/auth/login | No | - | Login |
| GET | /api/auth/profile | Yes | Any | Get profile |
| PUT | /api/auth/profile | Yes | Any | Update profile |
| PUT | /api/auth/change-password | Yes | Any | Change password |
| POST | /api/auth/forgot-password | No | - | Request password reset |
| POST | /api/auth/reset-password/:token | No | - | Reset password |
| GET | /api/books | No | - | List books |
| GET | /api/books/categories | No | - | List categories |
| GET | /api/books/most-borrowed | No | - | Most borrowed books |
| GET | /api/books/:id | No | - | Get book details |
| POST | /api/books | Yes | Librarian/Admin | Create book |
| PUT | /api/books/:id | Yes | Librarian/Admin | Update book |
| DELETE | /api/books/:id | Yes | Librarian/Admin | Delete book |
| POST | /api/issues/request | Yes | Student | Request book issue |
| PUT | /api/issues/:id/approve | Yes | Librarian/Admin | Approve issue |
| PUT | /api/issues/:id/return | Yes | Librarian/Admin | Return book |
| GET | /api/issues | Yes | Librarian/Admin | List all issues |
| GET | /api/issues/my | Yes | Any | My issues |
| GET | /api/issues/:id | Yes | Any | Get issue details |
| POST | /api/reservations | Yes | Student | Create reservation |
| GET | /api/reservations/my | Yes | Any | My reservations |
| GET | /api/reservations | Yes | Librarian/Admin | All reservations |
| PUT | /api/reservations/:id/approve | Yes | Librarian/Admin | Approve reservation |
| PUT | /api/reservations/:id/cancel | Yes | Any | Cancel reservation |
| GET | /api/study-rooms | No | - | List rooms |
| GET | /api/study-rooms/:id/availability | No | - | Room availability |
| POST | /api/study-rooms | Yes | Librarian/Admin | Create room |
| PUT | /api/study-rooms/:id | Yes | Librarian/Admin | Update room |
| DELETE | /api/study-rooms/:id | Yes | Librarian/Admin | Delete room |
| POST | /api/study-rooms/book | Yes | Student | Book room |
| GET | /api/study-rooms/bookings/my | Yes | Any | My bookings |
| GET | /api/study-rooms/bookings | Yes | Librarian/Admin | All bookings |
| PUT | /api/study-rooms/bookings/:id/cancel | Yes | Any | Cancel booking |
| GET | /api/notifications | Yes | Any | List notifications |
| GET | /api/notifications/unread-count | Yes | Any | Unread count |
| PUT | /api/notifications/:id/read | Yes | Any | Mark as read |
| PUT | /api/notifications/read-all | Yes | Any | Mark all as read |
| GET | /api/fines/my | Yes | Any | My fines |
| GET | /api/fines/total-unpaid | Yes | Any | Total unpaid |
| PUT | /api/fines/:id/pay | Yes | Any | Pay fine |
| GET | /api/fines/stats | Yes | Admin | Fine statistics |
| GET | /api/resources | No | - | List resources |
| GET | /api/resources/categories | No | - | Resource categories |
| GET | /api/resources/:id | No | - | Get resource |
| POST | /api/resources | Yes | Librarian/Admin | Upload resource |
| DELETE | /api/resources/:id | Yes | Librarian/Admin | Delete resource |
| GET | /api/admin/dashboard | Yes | Admin | Admin dashboard |
| GET | /api/admin/users | Yes | Admin | List users |
| POST | /api/admin/users | Yes | Admin | Create user |
| PUT | /api/admin/users/:id | Yes | Admin | Update user |
| DELETE | /api/admin/users/:id | Yes | Admin | Delete user |
| GET | /api/admin/logs | Yes | Admin | System logs |
| GET | /api/analytics/dashboard | Yes | Admin | Analytics dashboard |
| GET | /api/analytics/full | Yes | Admin | Full analytics |
| GET | /api/recommendations | Yes | Any | Get recommendations |
| POST | /api/recommendations/log | Yes | Any | Log interaction |
| POST | /api/chatbot/chat | Yes | Any | Chat with AI |
| GET | /api/chatbot/search | Yes | Any | AI book search |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router 6, Chart.js |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MySQL with mysql2 driver |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| AI | Google Gemini API (optional) |
| Hosting | Vercel (frontend), Render (backend) |
