# LibraMind AI – Smart Library Management System

A full-stack library management system with AI-powered features, built with React, Node.js, Express, SQLite, and Google Gemini AI.

## Features

### User Roles
- **Student** – Browse/issue books, view history, get AI recommendations
- **Librarian** – Manage books, issue/return, handle reservations
- **Admin** – User management, analytics, fine reports

### Smart Features
- AI book recommendations via Gemini
- AI chatbot for library queries
- QR code generation for books
- Reading habit analysis
- Similar book suggestions

### Core Features
- JWT authentication with role-based access
- Book management with ISBN & cover upload
- Issue/return with auto fine calculation
- Reservation queue system
- Email notifications
- Dark mode UI
- Charts & analytics (Chart.js)
- Responsive design (Tailwind CSS)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Chart.js, React Router |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (JSON Web Tokens) |
| AI | Google Gemini AI |
| File Upload | Multer |
| Email | Nodemailer |
| QR Code | qrcode |

## Project Structure

```
LibraMind AI/
  server/               # Backend API
    config/             # Database config
    controllers/        # Route handlers
    middleware/         # Auth, validation, upload
    models/            # Database schema
    routes/            # Express routes
    services/          # Business logic (gemini, email, qr, fines)
    uploads/           # Cover images & QR codes
    logs/              # Application logs
    server.js          # Entry point
    seed.js            # Database seeder
  client/              # Frontend React app
    src/
      components/      # Layout, charts, common components
      context/         # Auth & theme contexts
      pages/           # Auth, Student, Librarian, Admin pages
      services/        # API client
```

## Prerequisites

- Node.js v18+
- npm v9+

## Setup & Installation

### 1. Clone & Install Dependencies

```bash
# Install backend dependencies
cd "LibraMind AI/server"
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # Optional - app works without it
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

> **Note:** Gemini AI features use mock data if no API key is provided.

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates tables and sample data.

### 4. Start the Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@libramind.com | admin123 |
| Librarian | librarian@libramind.com | librarian123 |
| Student | student@libramind.com | student123 |

## API Overview

### Auth
- `POST /api/auth/register` – Register new user
- `POST /api/auth/login` – Login
- `POST /api/auth/forgot-password` – Request password reset
- `POST /api/auth/reset-password` – Reset password
- `GET /api/auth/profile` – Get profile
- `PUT /api/auth/profile` – Update profile

### Books
- `GET /api/books` – List books (search, filter, paginate)
- `GET /api/books/:id` – Get book details
- `POST /api/books` – Add book (librarian/admin)
- `PUT /api/books/:id` – Update book
- `DELETE /api/books/:id` – Delete book
- `GET /api/books/genres` – List genres
- `GET /api/books/:id/similar` – AI similar books

### Issue/Return
- `GET /api/issues` – List all issues (librarian/admin)
- `GET /api/issues/my-issues` – Student's issued books
- `POST /api/issues/issue` – Issue a book
- `POST /api/issues/return` – Return a book
- `POST /api/issues/renew` – Renew a book

### Dashboard
- `GET /api/dashboard/student` – Student dashboard data
- `GET /api/dashboard/librarian` – Librarian dashboard
- `GET /api/dashboard/admin` – Admin dashboard

### Analytics
- `GET /api/analytics/popular-books` – Most borrowed
- `GET /api/analytics/monthly-trends` – Monthly trends
- `GET /api/analytics/category-usage` – Category stats

### AI Chat
- `POST /api/chat` – Send message to AI assistant

## Database Schema

- **users** – User accounts and roles
- **books** – Book metadata
- **book_copies** – Individual copy tracking
- **issued_books** – Issue/return records
- **reservations** – Book reservation queue
- **fines** – Fine tracking and payments
- **notifications** – User notifications
- **reading_history** – Reading activity logs
- **activity_logs** – System audit trail

## License

MIT
