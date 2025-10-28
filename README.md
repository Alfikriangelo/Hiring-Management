# Hiring Management System

Enterprise-grade hiring management platform with dual roles (Admin/Recruiter and Applicant/Job Seeker) built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### For Admins (Recruiters)
- Create and manage job postings with dynamic form configurations
- Configure application form fields (mandatory/optional/off)
- View and manage candidates with resizable, reorderable data tables
- Export candidate data to CSV
- Invite other admins via invite codes
- Filter, sort, and search candidates

### For Applicants (Job Seekers)
- Browse active job postings
- Apply to jobs with dynamic forms based on admin configuration
- Webcam-based profile photo capture with hand-gesture detection
- Upload resume and fill profile information
- View application status

### Technical Features
- **Authentication**: Email/password authentication via Supabase Auth
- **Role-based Access**: Separate routes and permissions for Admin vs Applicant
- **Dynamic Forms**: Job application forms rendered dynamically from backend config
- **Webcam Capture**: Hand-pose detection for automatic photo capture (with manual fallback)
- **Resizable Columns**: Drag to resize table columns with persisted preferences
- **Reorderable Columns**: Drag & drop to reorder table columns
- **Responsive Design**: Mobile-first, fully responsive UI
- **Real-time Validation**: Client-side form validation with error messages

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod
- **Table Features**: @dnd-kit for drag & drop
- **Webcam**: MediaPipe Tasks Vision for hand-pose detection
- **Build Tool**: Vite

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account (or use provided credentials)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase database:
   - The project uses the following Supabase instance:
     - Project URL: `https://xjvwuxogfqmahlplitzo.supabase.co`
     - Anon Key: Already configured in code
   
   - Run the SQL commands from `DATABASE_SCHEMA.md` in your Supabase SQL editor to create tables

4. Create initial Super Admin:
   - Sign up through the app with your email
   - In Supabase SQL editor, run:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

5. Run the development server:
```bash
npm run dev
```

6. Open your browser at `http://localhost:8080`

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin-specific components
│   ├── ui/              # Shadcn UI components
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   ├── supabase.ts      # Supabase client & types
│   └── utils.ts         # Utility functions
├── pages/
│   ├── admin/           # Admin pages
│   ├── applicant/       # Applicant pages
│   ├── Auth.tsx         # Login/Signup page
│   └── Index.tsx        # Root redirect page
└── App.tsx              # Main app with routing
```

## Usage

### As Admin

1. **Sign in** with admin credentials
2. **Create jobs**:
   - Click "Create a new job" button
   - Fill in job details (title, type, description, salary)
   - Configure required fields (mandatory/optional/off)
   - Click "Publish Job"
3. **Manage candidates**:
   - Click "Manage Job" on any job
   - View candidate table
   - Resize columns by dragging edges
   - Reorder columns by drag & drop
   - Filter, sort, and export data

### As Applicant

1. **Sign up** for an account (defaults to applicant role)
2. **Browse jobs** in the job list
3. **Apply to a job**:
   - Click on a job card
   - Fill the application form (fields vary by job config)
   - Use webcam to capture profile photo (or upload manually)
   - Submit application

### Admin Provisioning

Super Admin can generate invite codes:
- Create invite code in admin panel
- Share code with new admin
- New user signs up and enters invite code
- User role is updated to 'admin'

Alternatively, Super Admin can directly assign admin role via database.

## Environment Variables

The Supabase credentials are currently hardcoded for development. For production:

1. Create `.env` file:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. Update `src/lib/supabase.ts` to use environment variables

## Known Limitations

- **Email Confirmation**: Currently disabled for faster development. Enable in Supabase Auth settings for production.
- **File Upload**: Profile photos stored as base64 in database. Consider using Supabase Storage for production.
- **Hand Pose Detection**: Requires webcam access. Fallback to manual upload if denied.
- **Column Preferences**: Stored in localStorage per browser. Consider DB storage for multi-device sync.
- **CSV Export**: Client-side only. For large datasets, implement server-side export.

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Sign up as new user
- [ ] Sign in with existing credentials
- [ ] Sign out
- [ ] Password validation (min 6 chars)
- [ ] Error handling for invalid credentials

**Admin Flow:**
- [ ] Create job with all field states
- [ ] View job list with different statuses
- [ ] Edit job configuration
- [ ] View candidate table
- [ ] Resize table columns
- [ ] Reorder table columns
- [ ] Filter and sort candidates
- [ ] Export to CSV

**Applicant Flow:**
- [ ] View active jobs only
- [ ] Apply to job with all required fields
- [ ] Webcam photo capture
- [ ] Manual photo upload fallback
- [ ] Form validation errors
- [ ] Successful submission

**Role-based Access:**
- [ ] Admin cannot access applicant routes
- [ ] Applicant cannot access admin routes
- [ ] Unauthenticated users redirected to auth

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel/Netlify

1. Connect repository to deployment platform
2. Configure build command: `npm run build`
3. Configure output directory: `dist`
4. Add environment variables if using .env

## Assumptions

1. **Single Company**: System designed for single organization (not multi-tenant)
2. **Currency**: Salary amounts in Indonesian Rupiah (IDR) by default
3. **Super Admin**: Initial super admin created manually via SQL
4. **Email Provider**: Uses Supabase default email provider (configure SMTP for production)
5. **Storage**: Profile photos stored as data URLs (migrate to Supabase Storage for production)

## Contributing

This is a technical assessment project. Not accepting contributions.

## Support

For issues or questions, refer to:
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
