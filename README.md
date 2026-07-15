# Smart Library Management System

A full-stack library management system built with **MySQL**, **Express.js**, **React (Vite)**, and **Node.js**. Supports three user roles: **Admin**, **Librarian**, and **Student**.

## Features

- **Role-based access**: Admin, Librarian, and Student dashboards
- **Book management**: Add, edit, delete, search, and browse books with cover images and QR codes
- **Issue/Return workflow**: Request → Approve → Issue → Return with fine calculation
- **Reservations**: Students can reserve books; Librarians approve/cancel
- **Study room booking**: Real-time availability slots for room booking
- **Digital library**: Upload and download resources (PDFs, documents, etc.)
- **Fine management**: Auto-calculated late fines ($5/day)
- **Analytics**: Monthly borrowing trends, most borrowed books, active students, category distribution
- **Notifications**: Real-time via Socket.IO
- **Password management**: Forgot/reset password via email, change password from profile
- **System logs**: Admin activity log viewer with pagination

## Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | React 18, Vite 5, TailwindCSS  |
| Backend  | Express.js, Socket.IO          |
| Database | MySQL with mysql2 driver       |
| Auth     | JWT (JSON Web Tokens)          |
| Email    | Nodemailer                     |
| Charts   | Chart.js + react-chartjs-2     |
| AI       | Google Generative AI (Gemini)  |

## Project Structure

```
├── backend/
│   ├── config/            # DB, nodemailer config
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth, validation
│   ├── models/            # DB query helpers
│   ├── routes/            # Express routes
│   ├── utils/             # Seed data, helpers
│   ├── uploads/           # Uploaded files
│   ├── server.js          # Entry point
│   └── schema.sql         # DB schema
├── frontend/
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Route pages
│   │   │   ├── admin/     # Admin pages
│   │   │   ├── librarian/ # Librarian pages
│   │   │   └── student/   # Student pages
│   │   └── services/      # API client, socket
│   └── index.html
├── package.json           # Root convenience scripts
├── vercel.json            # Vercel deployment config
└── render.yaml            # Render deployment config
```

## Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm** >= 9

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd smart-library-management-system
npm run install:all
```

### 2. Database

Run `backend/schema.sql` against your MySQL instance:

```bash
mysql -u root -p < backend/schema.sql
```

### 3. Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=smart_library
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Smart Library <noreply@library.com>
CLIENT_URL=http://localhost:5173
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
VITE_FINE_RATE_PER_DAY=5
VITE_APP_VERSION=1.0.0
```

### 4. Seed sample data (optional)

```bash
npm run seed
```

### 5. Start development

```bash
npm run dev
```

Backend runs on `http://localhost:5001`, frontend on `http://localhost:5173`.

### 6. Build for production

```bash
npm run build
```

## Deployment

> **Note:** This project uses **MySQL** (not MongoDB). For production, provision a MySQL instance on a cloud provider (AWS RDS, Google Cloud SQL, Aiven, or PlanetScale) and set the `DB_*` environment variables accordingly.

### Vercel (Frontend)

The `vercel.json` at the project root is preconfigured. Set the `VITE_API_URL` environment variable to your Render backend URL.

### Render (Backend)

The `render.yaml` at the project root is preconfigured. Fill in the required environment variables through the Render dashboard, including `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`.

### Database (MySQL)

The project **does not use MongoDB**. You need a MySQL 8.0+ database:

1. Provision a MySQL instance (e.g., AWS RDS, Aiven, or Render's managed MySQL).
2. Run `schema.sql` against it: `mysql -h <host> -u <user> -p < schema.sql`
3. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in the backend environment.

### Environment Variables Summary

| Variable              | Where         | Required | Description                          |
| --------------------- | ------------- | -------- | ------------------------------------ |
| `PORT`                | Backend       | No       | Server port (default: 5001)          |
| `DB_HOST`             | Backend       | Yes      | MySQL host                           |
| `DB_USER`             | Backend       | Yes      | MySQL user                           |
| `DB_PASSWORD`         | Backend       | Yes      | MySQL password                       |
| `DB_NAME`             | Backend       | Yes      | MySQL database name                  |
| `JWT_SECRET`          | Backend       | Yes      | JWT signing secret                   |
| `JWT_EXPIRES_IN`      | Backend       | No       | Token expiry (default: 7d)           |
| `EMAIL_HOST`          | Backend       | No       | SMTP host for emails                 |
| `EMAIL_PORT`          | Backend       | No       | SMTP port (default: 587)             |
| `EMAIL_USER`          | Backend       | No       | SMTP user                            |
| `EMAIL_PASS`          | Backend       | No       | SMTP password                        |
| `EMAIL_FROM`          | Backend       | No       | From address for emails              |
| `GEMINI_API_KEY`      | Backend       | No       | Google Gemini AI key (chatbot)       |
| `FINE_PER_DAY`        | Backend       | No       | Late fine per day (default: 5)       |
| `CLIENT_URL`          | Backend       | Yes      | Frontend URL for CORS & reset links  |
| `VITE_API_URL`        | Frontend      | Yes      | Backend API URL in production        |
| `VITE_SOCKET_URL`     | Frontend      | No       | Socket.IO server URL                 |
| `VITE_FINE_RATE_PER_DAY` | Frontend   | No       | Fine rate shown in Settings UI       |
| `VITE_APP_VERSION`    | Frontend      | No       | Version displayed in Settings        |

## API Overview

| Method | Endpoint                          | Description            | Auth     |
| ------ | --------------------------------- | ---------------------- | -------- |
| POST   | /api/auth/register                | Register               | No       |
| POST   | /api/auth/login                   | Login                  | No       |
| GET    | /api/auth/profile                 | Get profile            | Yes      |
| PUT    | /api/auth/profile                 | Update profile         | Yes      |
| PUT    | /api/auth/change-password         | Change password        | Yes      |
| POST   | /api/auth/forgot-password         | Forgot password        | No       |
| POST   | /api/auth/reset-password/:token   | Reset password         | No       |
| GET    | /api/books                        | List books             | Yes      |
| GET    | /api/books/:id                    | Get book details       | Yes      |
| GET    | /api/issues                       | List issues            | Yes      |
| POST   | /api/issues                       | Request issue          | Yes      |
| GET    | /api/reservations                 | List reservations      | Yes      |
| POST   | /api/reservations                 | Create reservation     | Yes      |
| GET    | /api/rooms                        | List study rooms       | Yes      |
| GET    | /api/rooms/:id/availability       | Room availability      | Yes      |
| POST   | /api/rooms/book                   | Book a room            | Yes      |
| GET    | /api/resources                    | Digital resources      | Yes      |
| GET    | /api/notifications                | User notifications     | Yes      |
| GET    | /api/admin/dashboard              | Admin dashboard stats  | Admin    |
| GET    | /api/admin/users                  | Manage users           | Admin    |
| GET    | /api/admin/logs                   | System logs            | Admin    |

## Role Capabilities

| Feature              | Student | Librarian | Admin |
| -------------------- | ------- | --------- | ----- |
| Browse books         | ✓       | ✓         | ✓     |
| Issue/Return books   | ✓       | ✓         | ✓     |
| Reserve books        | ✓       | ✗         | ✗     |
| Book study rooms     | ✓       | ✗         | ✗     |
| Access digital lib   | ✓       | ✓         | ✓     |
| Manage books         | ✗       | ✓         | ✓     |
| Manage issues        | ✗       | ✓         | ✓     |
| Manage reservations  | ✗       | ✓         | ✓     |
| Manage rooms         | ✗       | ✓         | ✓     |
| Manage resources     | ✗       | ✓         | ✓     |
| Manage users         | ✗       | ✗         | ✓     |
| View analytics       | ✗       | ✗         | ✓     |
| View system logs     | ✗       | ✗         | ✓     |
| Configure settings   | ✗       | ✗         | ✓     |
