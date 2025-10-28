// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmailVerification from "./pages/EmailVerification";
import AuthCallback from "./pages/AuthCallback";
import JobList from "./pages/applicant/JobList";
import AdminJobList from "./pages/admin/AdminJobList";
import UserManagement from "./pages/admin/UserManagement";
import NotFound from "./pages/NotFound";
import JobCandidates from "./pages/admin/JobCandidates";
import { ApplyForm } from "./pages/applicant/ApplyForm";
import { Success } from "./pages/applicant/Success";
import CandidateDetail from "./pages/admin/CandidateDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route
              path="/jobs"
              element={
                <ProtectedRoute allowedRoles={["applicant"]}>
                  <JobList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id/apply"
              element={
                <ProtectedRoute allowedRoles={["applicant"]}>
                  <ApplyForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id/success"
              element={
                <ProtectedRoute allowedRoles={["applicant"]}>
                  <Success />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminJobList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs/:jobId/candidates"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <JobCandidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs/:jobId/candidates/:candidateId"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <CandidateDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
