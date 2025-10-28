// app/pages/admin/JobCandidates.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const monthNamesIndonesian = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDateIndonesian = (dateString: string): string => {
  if (!dateString || dateString === "-") return "-";
  const dateParts = dateString.split("-");
  if (dateParts.length !== 3) return dateString;
  const year = dateParts[0];
  const monthIndex = parseInt(dateParts[1], 10) - 1;
  const day = dateParts[2];
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateString;
  if (isNaN(parseInt(day, 10))) return dateString;
  const monthName = monthNamesIndonesian[monthIndex];
  const formattedDay = parseInt(day, 10).toString();
  return `${formattedDay} ${monthName} ${year}`;
};

const formatDateTimeIndonesian = (dateString: string): string => {
  if (!dateString) return "-";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return dateString;
  const day = dateObj.getDate();
  const month = monthNamesIndonesian[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}, ${day} ${month} ${year}`;
};

interface Candidate {
  id: string;
  applicantId: string;
  full_name: string;
  email: string;
  phone: string;
  dateOfBirthRaw: string;
  domicile: string;
  gender: string;
  linkedin: string;
  createdAt: string;
}

export default function JobCandidates() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(
    new Set()
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const allSelected = candidates
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .every((c) => selectedCandidateIds.has(c.id));
  const someSelected =
    candidates
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .some((c) => selectedCandidateIds.has(c.id)) && !allSelected;
  const selectAllChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
    ? "indeterminate"
    : false;

  const toggleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) newSet.delete(candidateId);
      else newSet.add(candidateId);
      return newSet;
    });
  }, []);

  const toggleSelectAll = () => {
    const currentIds = candidates
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map((c) => c.id);
    const allChecked = currentIds.every((id) => selectedCandidateIds.has(id));

    setSelectedCandidateIds((prev) => {
      const newSet = new Set(prev);
      if (allChecked) currentIds.forEach((id) => newSet.delete(id));
      else currentIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  };

  useEffect(() => {
    if (!jobId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid job ID.",
      });
      navigate("/admin/jobs");
      return;
    }

    const fetchJobAndCandidates = async () => {
      try {
        setLoading(true);

        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();
        if (jobError) throw jobError;
        setJob(jobData);

        const { data: applications, error: appError } = await supabase
          .from("applications")
          .select("id, applicant_id, data, created_at")
          .eq("job_id", jobId);
        if (appError) throw appError;

        const candidateRows: Candidate[] = applications.map((app: any) => {
          const data = app.data || {};
          return {
            id: app.id,
            applicantId: app.applicant_id,
            full_name: data.full_name || "-",
            email: data.email || "-",
            phone: data.phone_number || "-",
            dateOfBirthRaw: data.date_of_birth || "-",
            domicile: data.domicile || "-",
            gender: data.gender || "-",
            linkedin: data.linkedin_link || "-",
            createdAt: app.created_at,
          };
        });

        setCandidates(candidateRows);
        setSelectedCandidateIds(new Set());
        setCurrentPage(1);
      } catch (error: any) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load candidates.",
        });
        navigate("/admin/jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndCandidates();
  }, [jobId, navigate, toast]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [candidates, sortOrder]);

  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const paginatedCandidates = sortedCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleSortToggle = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  const updateJobStatus = async (
    newStatus: "active" | "inactive" | "draft"
  ) => {
    if (!jobId) return;
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);
      if (error) throw error;
      setJob((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast({
        title: "Success",
        description: `Job status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update job status.",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "destructive";
      case "draft":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleBackToJobList = () => navigate("/admin/jobs");
  const handleManageCandidate = (candidateId: string) =>
    navigate(`/admin/jobs/${jobId}/candidates/${candidateId}`);

  const deleteSelectedCandidates = async () => {
    const idsToDelete = Array.from(selectedCandidateIds);
    if (!idsToDelete.length) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("applications")
        .delete()
        .in("id", idsToDelete);
      if (error) throw error;
      setCandidates((prev) => prev.filter((c) => !idsToDelete.includes(c.id)));
      setSelectedCandidateIds(new Set());
      toast({
        title: "Success",
        description: `Deleted ${idsToDelete.length} candidate(s).`,
      });
      if (
        currentPage > 1 &&
        paginatedCandidates.length === idsToDelete.length
      ) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete candidates.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10">
        <Skeleton className="h-10 w-40 mb-4" />
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" onClick={handleBackToJobList}>
          Job list
        </Button>
        <span>›</span>
        <Button variant="secondary">Manage Candidate</Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{job?.title || "Job Details"}</h1>
        {job && (
          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusBadgeVariant(job.status)}
              className="capitalize"
            >
              {job.status}
            </Badge>
            {job.status === "draft" && (
              <Button size="sm" onClick={() => updateJobStatus("active")}>
                Publish Job
              </Button>
            )}
            {job.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateJobStatus("inactive")}
              >
                Deactivate
              </Button>
            )}
            {job.status === "inactive" && (
              <Button size="sm" onClick={() => updateJobStatus("active")}>
                Reactivate
              </Button>
            )}
          </div>
        )}
      </div>

      {selectedCandidateIds.size > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelectedCandidates}
          >
            Delete Selected ({selectedCandidateIds.size})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCandidateIds(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>No candidates found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-600">
            Total candidates: {candidates.length}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectAllChecked}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all candidates"
                      />
                    </TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Domicile</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSortToggle}
                      >
                        Created At {sortOrder === "asc" ? "↑" : "↓"}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCandidates.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedCandidateIds.has(c.id)}
                          onCheckedChange={() => toggleSelectCandidate(c.id)}
                          aria-label="Select candidate"
                        />
                      </TableCell>
                      <TableCell onClick={() => handleManageCandidate(c.id)}>
                        {c.full_name}
                      </TableCell>
                      <TableCell onClick={() => handleManageCandidate(c.id)}>
                        {c.email}
                      </TableCell>
                      <TableCell onClick={() => handleManageCandidate(c.id)}>
                        {c.phone}
                      </TableCell>
                      <TableCell onClick={() => handleManageCandidate(c.id)}>
                        {formatDateIndonesian(c.dateOfBirthRaw)}
                      </TableCell>
                      <TableCell onClick={() => handleManageCandidate(c.id)}>
                        {c.domicile}
                      </TableCell>
                      <TableCell onClick={() => handleManageCandidate(c.id)}>
                        {c.gender}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {c.linkedin ? (
                          <a
                            href={c.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {c.linkedin
                              .replace(/^https?:\/\/(www\.)?/, "")
                              .substring(0, 25)}
                            ...
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateTimeIndonesian(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </Button>
            {pageNumbers.map((num) => (
              <Button
                key={num}
                size="sm"
                variant={num === currentPage ? "default" : "outline"}
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
