import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Job } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus } from 'lucide-react';
import { CreateJobForm } from '@/components/admin/CreateJobForm';
import { toast } from 'sonner';

export default function AdminJobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJobs(data);
    }
    setLoading(false);
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">Job List</h1>
            <nav className="flex gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/jobs">Jobs</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/users">Users</a>
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by job details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-48 h-48 mb-6">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="80" r="30" fill="#E5E7EB"/>
                    <rect x="70" y="120" width="60" height="50" fill="#0D9488" opacity="0.2" rx="4"/>
                    <circle cx="100" cy="145" r="25" fill="#0D9488" opacity="0.3"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2">No job openings available</h2>
                <p className="text-muted-foreground mb-6">
                  Create a job opening now and start the candidate process.
                </p>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-warning hover:bg-warning/90 text-warning-foreground">
                      Create a new job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <CreateJobForm onSuccess={() => {
                      setIsCreateOpen(false);
                      fetchJobs();
                      toast.success('Job vacancy successfully created');
                    }} />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-6 bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">
                          {job.status}
                        </Badge>
                        {job.started_on && (
                          <span className="text-sm text-muted-foreground">
                            started on {new Date(job.started_on).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        )}
                      </div>
                      <Button 
                        onClick={() => navigate(`/admin/jobs/${job.id}/candidates`)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Manage Job
                      </Button>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:w-80">
            <div className="bg-card rounded-lg p-6 border">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold mb-2">Recruit the best candidates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create jobs, invite, and hire with ease
                </p>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create a new job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <CreateJobForm onSuccess={() => {
                      setIsCreateOpen(false);
                      fetchJobs();
                      toast.success('Job vacancy successfully created');
                    }} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
