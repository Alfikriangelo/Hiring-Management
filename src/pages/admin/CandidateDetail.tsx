import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface ApplicationData {
  full_name?: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  domicile?: string;
  gender?: string;
  linkedin_link?: string;
  photo_profile?: string;
  cv_path?: string;
  [key: string]: any;
}

interface CandidateDetail {
  id: string;
  job_id: string;
  applicant_id: string;
  data: ApplicationData;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
}

export default function CandidateDetail() {
  const { jobId, candidateId } = useParams<{
    jobId: string;
    candidateId: string;
  }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || !candidateId) {
      toast.error("Invalid URL parameters");
      navigate("/admin/jobs");
      return;
    }

    const fetchCandidateAndJob = async () => {
      try {
        setLoading(true);

        const { data: appData, error: appError } = await supabase
          .from("applications")
          .select("*")
          .eq("id", candidateId)
          .eq("job_id", jobId)
          .single();

        if (appError || !appData) {
          throw new Error("Candidate not found");
        }

        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("id, title, status")
          .eq("id", jobId)
          .single();

        if (jobError || !jobData) {
          throw new Error("Job not found");
        }

        setCandidate(appData);
        setJob(jobData);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to load candidate details");
        navigate(`/admin/jobs/${jobId}/candidates`);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateAndJob();
  }, [jobId, candidateId, navigate]);

  const handleBack = () => {
    navigate(`/admin/jobs/${jobId}/candidates`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;

      toast.success("Candidate deleted successfully");
      navigate(`/admin/jobs/${jobId}/candidates`);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete candidate");
    }
  };

  const handleDownloadCV = async () => {
    const cvPath = candidate?.data?.cv_path;
    if (!cvPath) {
      toast.error("No CV uploaded");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("cvs")
        .download(cvPath);

      if (error) {
        console.error("Download error:", error);
        toast.error("You don't have permission to access this CV");
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cv.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CV downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download CV");
    }
  };

  if (loading) {
    return (
      <div className="p-10 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!candidate || !job) {
    return (
      <div className="p-10">
        <p className="text-muted-foreground">Candidate not found.</p>
        <Button onClick={handleBack} className="mt-4">
          Back to Candidates
        </Button>
      </div>
    );
  }

  const data = candidate.data || {};

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadCV}>
            <Download className="w-4 h-4 mr-2" />
            Download CV
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {data.photo_profile && (
        <div className="mb-8 flex">
          <img
            src={data.photo_profile}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard label="Full Name" value={data.full_name || "-"} />
        <InfoCard label="Email" value={data.email || "-"} />
        <InfoCard label="Phone Number" value={data.phone_number || "-"} />
        <InfoCard label="Date of Birth" value={data.date_of_birth || "-"} />
        <InfoCard label="Domicile" value={data.domicile || "-"} />
        <InfoCard label="Gender" value={data.gender || "-"} />
        <InfoCard
          label="LinkedIn"
          value={
            data.linkedin_link ? (
              <a
                href={data.linkedin_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {data.linkedin_link}
              </a>
            ) : (
              "-"
            )
          }
        />

        <InfoCard
          label="Applied At"
          value={new Date(candidate.created_at).toLocaleString("id-ID")}
        />
      </div>

      <div className="flex flex-col items-start gap-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <Badge
          className="px-3"
          variant={
            job.status === "active"
              ? "default"
              : job.status === "draft"
              ? "secondary"
              : "destructive"
          }
        >
          {job.status}
        </Badge>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="font-medium">{value}</div>
    </div>
  );
}
