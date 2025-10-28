// components/admin/CreateJobForm.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FieldConfig {
  key: string;
  label: string;
  state: "mandatory" | "optional" | "off";
}

const DEFAULT_FIELDS: FieldConfig[] = [
  { key: "full_name", label: "Full name", state: "mandatory" },
  { key: "photo_profile", label: "Photo Profile", state: "mandatory" },
  { key: "gender", label: "Gender", state: "mandatory" },
  { key: "domicile", label: "Domicile", state: "mandatory" },
  { key: "email", label: "Email", state: "mandatory" },
  { key: "phone_number", label: "Phone number", state: "mandatory" },
  { key: "linkedin_link", label: "LinkedIn link", state: "mandatory" },
  { key: "date_of_birth", label: "Date of birth", state: "mandatory" },
];

interface CreateJobFormProps {
  onSuccess: () => void;
}

export function CreateJobForm({ onSuccess }: CreateJobFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    job_type: "",
    description: "",
    candidates_needed: "",
    salary_min: "",
    salary_max: "",
  });
  const [fieldConfigs, setFieldConfigs] =
    useState<FieldConfig[]>(DEFAULT_FIELDS);

  const cleanNumber = (str: string) =>
    Number(str.replace(/\./g, "").replace(/,/g, "")) || 0;

  const handleFieldStateChange = (
    index: number,
    state: "mandatory" | "optional" | "off"
  ) => {
    const updated = [...fieldConfigs];
    updated[index].state = state;
    setFieldConfigs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseSlug = formData.title.toLowerCase().replace(/\s+/g, "-");
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (true) {
        const { count, error } = await supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("slug", uniqueSlug);

        if (error) {
          throw error;
        }

        if (count === 0) {
          break;
        }

        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          slug: uniqueSlug,
          title: formData.title,
          location: formData.location,
          status: "draft",
          job_type: formData.job_type,
          description: formData.description,
          candidates_needed: parseInt(formData.candidates_needed) || null,
          salary_min: cleanNumber(formData.salary_min),
          salary_max: cleanNumber(formData.salary_max),
          salary_currency: "IDR",
          started_on: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const fields = fieldConfigs
        .filter((f) => f.state !== "off")
        .map((f) => ({
          key: f.key,
          validation: {
            required: f.state === "mandatory",
          },
        }));

      const { error: configError } = await supabase.from("job_configs").insert({
        job_id: jobData.id,
        application_form: {
          sections: [
            {
              title: "Minimum Profile Information Required",
              fields,
            },
          ],
        },
      });

      if (configError) throw configError;

      toast.success("Job created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Job Opening</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Job Name<span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex. Front End Engineer"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_type">
              Job Type<span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.job_type}
              onValueChange={(value) =>
                setFormData({ ...formData, job_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-Time">Full-Time</SelectItem>
                <SelectItem value="Part-Time">Part-Time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              Location<span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              placeholder="Ex. Jakarta Selatan"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Job Description<span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Ex."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidates_needed">
              Number of Candidate Needed
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="candidates_needed"
              type="number"
              placeholder="Ex. 2"
              value={formData.candidates_needed}
              onChange={(e) =>
                setFormData({ ...formData, candidates_needed: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Job Salary</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="salary_min"
                  className="text-xs text-muted-foreground"
                >
                  Minimum Estimated Salary
                </Label>
                <Input
                  id="salary_min"
                  type="number"
                  placeholder="Rp 7.000.000"
                  value={formData.salary_min}
                  onChange={(e) =>
                    setFormData({ ...formData, salary_min: e.target.value })
                  }
                />
              </div>
              <div>
                <Label
                  htmlFor="salary_max"
                  className="text-xs text-muted-foreground"
                >
                  Maximum Estimated Salary
                </Label>
                <Input
                  id="salary_max"
                  type="number"
                  placeholder="Rp 8.000.000"
                  value={formData.salary_max}
                  onChange={(e) =>
                    setFormData({ ...formData, salary_max: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">
              Minimum Profile Information Required
            </h3>
            {fieldConfigs.map((field, index) => (
              <div
                key={field.key}
                className="flex items-center justify-between py-2"
              >
                <Label className="flex-1">{field.label}</Label>
                <div className="flex gap-2">
                  {(["mandatory", "optional", "off"] as const).map((state) => (
                    <Button
                      key={state}
                      type="button"
                      variant={field.state === state ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFieldStateChange(index, state)}
                    >
                      {state.charAt(0).toUpperCase() + state.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Publishing..." : "Publish Job"}
          </Button>
        </div>
      </form>
    </>
  );
}
