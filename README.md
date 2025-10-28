# Hiring Management System

Enterprise-grade hiring management platform with dual roles (Admin/Recruiter and Applicant/Job Seeker) built with React, TypeScript, Tailwind CSS, ShadCN UI, and Supabase.

---

## Features

### For Admins (Recruiters)
- Create and manage job postings (publish, deactivate, edit)
- Configure job application form fields (mandatory / optional / off per field)
- Auto-generate job slug based on title
- View and manage candidates per job
- Delete candidate and download CV directly from dashboard
- Multi-delete users (user management)
- Role-based access (admin only pages hidden from applicant)
- Real-time toast notifications (success/error)
- Gesture-based webcam capture for identity validation

### For Applicants (Job Seekers)
- Browse **only active** job postings
- Apply to job with **dynamic forms** depending on admin configuration
- Capture profile photo using **hand gesture detection** via webcam
- Upload resume (PDF) via Supabase Storage
- View job details before applying

### Technical Features
- **Authentication**: Email/password using Supabase Auth
- **Protected Routes**: Based on `role` field from Supabase (admin vs applicant)
- **Dynamic Rendering**: Form input visibility based on admin config
- **Gesture-based Capture**: MediaPipe-based hand detection (1 → 2 → 3 fingers triggers auto capture)
- **Minimal Dependency Architecture** — no heavy state manager, clean modular context-based arch
- **Responsive UI** with ShadCN + Tailwind

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI & Styling**: Tailwind CSS + ShadCN UI
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage)
- **Form Handling**: Native controlled components & conditional rendering
- **Media Processing**: Google MediaPipe for hand gesture detection
- **State Management**: React Context API
- **Toast Notification**: Sonner Toast

---

## System Architecture
```
src/
├── components/
│ ├── admin/ # Admin-specific components
│ ├── ui/ # Reusable Shadcn UI components
│ ├── ProtectedRoute.tsx # Role-based route protection
│ └── HandCaptureModal.tsx # Webcam + gesture-based capture
├── contexts/
│ └── AuthContext.tsx # Authentication state context
├── lib/
│ ├── supabase.ts # Supabase client setup
│ └── utils.ts # Utility helpers
├── pages/
│ ├── admin/ # Job List, Candidate List, Job Detail, User Management
│ ├── applicant/ # Job List, Job Detail, Apply Modal
│ └── Auth.tsx # Login (Email/Password)
└── App.tsx # Main router with role-based navigation
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account (use provided credentials or your own)

### Installation & Run development

```bash
git clone <repository-url>
cd <project-directory>
npm install
npm run dev
```
---
### Supabase Setup
This project already uses a Supabase instance, and the credentials (Supabase URL + Anon Key) have been provided inside the PDF file uploaded on the Rakamin platform.

If you want to run this project locally, simply create a .env file in the root directory and insert the credentials from that PDF:

VITE_SUPABASE_URL=your-supabase-url

VITE_SUPABASE_ANON_KEY=your-anon-key

Then, the file src/lib/supabase.ts will automatically use these values from import.meta.env

---
## Usage

### As Admin

1. Login using admin email

2. Create new job posting (with customizable fields)

3. Manage applicants → view details & download resume

4. Delete candidate / deactivate job

### As Applicant

1. Register or login as applicant

2. Browse active job listings

3. Apply → fill form → automatically snap photo via hand-gesture

4. Submit application
