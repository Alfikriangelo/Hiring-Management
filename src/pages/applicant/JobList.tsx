import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Job } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, ArrowLeft } from "lucide-react";

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
      }
    }
    setLoading(false);
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isMobile = window.innerWidth < 768;
  const showJobList = jobs.length > 0 && (!selectedJob || !isMobile);
  const showJobDetail = selectedJob && (!isMobile || selectedJob);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && selectedJob && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedJob(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-2xl font-bold">Job Openings</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img
              src="images/artwork.png"
              alt="No job openings"
              className="w-64 h-64 mb-8"
            />
            <h2 className="text-xl font-semibold mb-2">
              No job openings available
            </h2>
            <p className="text-muted-foreground">
              Please wait for the next batch of openings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {showJobList && (
              <div className="w-full md:w-80 space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedJob?.id === job.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-card"
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{job.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Rakamin
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>
                            {job.location || "Location not specified"}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground">
                          {formatSalary(
                            job.salary_min,
                            job.salary_max,
                            job.salary_currency
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showJobDetail && (
              <div className="flex-1 bg-white rounded-lg border p-4 md:p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold">
                        {selectedJob.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">Rakamin</p>
                    </div>
                  </div>
                  <Button
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                    onClick={() => {
                      navigate(`/jobs/${selectedJob.id}/apply`);
                    }}
                  >
                    Apply
                  </Button>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <Badge
                    variant="outline"
                    className="bg-success/10 text-success border-success/20"
                  >
                    {selectedJob.job_type || "No job type specified"}
                  </Badge>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>
                    {selectedJob.location || "Location not specified"}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground">
                    {formatSalary(
                      selectedJob.salary_min,
                      selectedJob.salary_max,
                      selectedJob.salary_currency
                    )}
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Job Description</h3>
                  <ul className="space-y-2 text-sm">
                    {selectedJob.description
                      ?.split("\n")
                      .filter((line) => line.trim())
                      .map((line, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{line}</span>
                        </li>
                      )) || (
                      <li className="text-muted-foreground">
                        No description available.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
