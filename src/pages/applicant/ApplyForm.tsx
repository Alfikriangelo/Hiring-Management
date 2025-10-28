// pages/applicant/ApplyForm.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, Job } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import PhoneInput from "react-phone-input-2";
import { HandCaptureModal } from "@/components/user/HandCaptureModal";

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}

export function ApplyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male",
    domicile: "",
    phone_number: "",
    email: "",
    linkedin_link: "",
    photo_profile: "",
    cv_path: "",
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [domicileError, setDomicileError] = useState("");

  const getFieldConfig = (fieldKey: string) => {
    if (!formConfig || !formConfig.sections?.length) {
      return { show: true, required: true };
    }

    const section = formConfig.sections[0];
    const field = section.fields.find((f: any) => f.key === fieldKey);

    if (!field) {
      if (fieldKey === "photo_profile") return { show: true, required: true };
      if (fieldKey === "cv_path") return { show: true, required: false };
      return { show: false, required: false };
    }

    return {
      show: true,
      required: !!field.validation?.required,
    };
  };

  useEffect(() => {
    if (!id) return;

    const fetchJobAndConfig = async () => {
      try {
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", id)
          .eq("status", "active")
          .single();

        if (jobError) throw jobError;
        setJob(jobData);

        const { data: configData, error: configError } = await supabase
          .from("job_configs")
          .select("application_form")
          .eq("job_id", id)
          .single();

        if (configError) {
          console.warn("No form config found. Using default (all mandatory).");
          setFormConfig(null);
        } else {
          setFormConfig(configData.application_form);
        }
      } catch (error: any) {
        toast.error("Failed to load job details");
        navigate("/jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndConfig();
  }, [id, navigate]);

  useEffect(() => {
    fetch("https://open-api.my.id/api/wilayah/provinces")
      .then((res) => res.json())
      .then(setProvinces)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProvince) return;
    fetch(`https://open-api.my.id/api/wilayah/regencies/${selectedProvince}`)
      .then((res) => res.json())
      .then(setRegencies)
      .catch(console.error);
  }, [selectedProvince]);

  const handlePhotoCaptured = (url: string) => {
    setPhotoUrl(url);
    setFormData((prev) => ({ ...prev, photo_profile: url }));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast.error("Please log in to apply for jobs.");
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      toast.error("Please take a profile photo first.");
      return;
    }

    const fieldsToValidate = [
      { key: "full_name", label: "Full name" },
      { key: "date_of_birth", label: "Date of birth" },
      { key: "gender", label: "Gender" },
      { key: "domicile", label: "Domicile" },
      { key: "phone_number", label: "Phone number" },
      { key: "email", label: "Email" },
      { key: "linkedin_link", label: "LinkedIn link" },
    ];

    for (const field of fieldsToValidate) {
      const config = getFieldConfig(field.key);
      if (config.required && !formData[field.key as keyof typeof formData]) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    if (getFieldConfig("domicile").required && !formData.domicile) {
      setDomicileError("Domicile is required");
      toast.error("Please select your domicile.");
      return;
    }

    const cvConfig = getFieldConfig("cv_path");
    if (cvConfig.required && !cvFile && !formData.cv_path) {
      toast.error("CV is required");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      toast.error("You must be logged in to apply.");
      return;
    }

    let cvPath = formData.cv_path;

    if (cvFile) {
      setUploading(true);
      try {
        if (cvFile.size > 5 * 1024 * 1024) {
          toast.error("File must be less than 5 MB");
          setUploading(false);
          return;
        }

        const fileExt = cvFile.name.split(".").pop()?.toLowerCase();
        if (fileExt !== "pdf") {
          toast.error("Only PDF files are allowed");
          setUploading(false);
          return;
        }

        const filePath = `${user.id}/${Date.now()}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(filePath, cvFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        cvPath = filePath;
      } catch (error: any) {
        console.error("CV upload error:", error);
        toast.error("Failed to upload CV");
        setUploading(false);
        return;
      }
    }

    try {
      const { error } = await supabase.from("applications").insert({
        job_id: id,
        applicant_id: user.id,
        data: { ...formData, cv_path: cvPath },
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Application submitted successfully!");
      navigate(`/jobs/${id}/success`);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (!job)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Job not found</p>
      </div>
    );

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            ←
          </button>
          <div className="w-full flex justify-between items-center">
            <h1 className="text-xl font-bold">Apply at {"Rakamin"}</h1>
            <h1 className="text-xs font-medium">
              ℹ️ Fields marked with * are required
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>
              Photo Profile<span className="text-red-500">*</span>
            </Label>
            <img
              src={photoUrl || "/images/Avatar.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCameraOpen(true)}
              className="w-1/4"
            >
              Take a Picture
            </Button>
          </div>

          {getFieldConfig("full_name").show && (
            <div>
              <Label>
                Full name
                {getFieldConfig("full_name").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <Input
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>
          )}

          {getFieldConfig("date_of_birth").show && (
            <div>
              <Label>
                Date of birth
                {getFieldConfig("date_of_birth").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
          )}

          {getFieldConfig("gender").show && (
            <div>
              <Label>
                Pronoun (gender)
                {getFieldConfig("gender").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={() =>
                      setFormData({ ...formData, gender: "female" })
                    }
                    className="mr-2"
                  />
                  She/her (Female)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={() =>
                      setFormData({ ...formData, gender: "male" })
                    }
                    className="mr-2"
                  />
                  He/him (Male)
                </label>
              </div>
            </div>
          )}

          {getFieldConfig("domicile").show && (
            <div>
              <Label>
                Domicile
                {getFieldConfig("domicile").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProvince}
                  onValueChange={(value) => {
                    setSelectedProvince(value);
                    setFormData({ ...formData, domicile: "" });
                    setDomicileError("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={formData.domicile}
                  onValueChange={(value) => {
                    setFormData({ ...formData, domicile: value });
                    setDomicileError("");
                  }}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Regency/City" />
                  </SelectTrigger>
                  <SelectContent>
                    {regencies.map((reg) => (
                      <SelectItem
                        key={reg.id}
                        value={`${
                          provinces.find((p) => p.id === selectedProvince)?.name
                        } - ${reg.name}`}
                      >
                        {reg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {domicileError && (
                <p className="text-red-500 text-xs mt-1">{domicileError}</p>
              )}
            </div>
          )}

          {getFieldConfig("phone_number").show && (
            <div>
              <Label>
                Phone number
                {getFieldConfig("phone_number").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <PhoneInput
                country={"id"}
                value={formData.phone_number}
                onChange={(phone: string) =>
                  setFormData({ ...formData, phone_number: phone })
                }
                inputClass="w-full h-10 rounded border border-gray-300 px-3"
                buttonClass="rounded-l"
                containerClass="mb-2"
                enableSearch={true}
                countryCodeEditable={true}
              />
            </div>
          )}

          {getFieldConfig("email").show && (
            <div>
              <Label>
                Email
                {getFieldConfig("email").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          )}

          {getFieldConfig("linkedin_link").show && (
            <div>
              <Label>
                Link LinkedIn
                {getFieldConfig("linkedin_link").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <Input
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedin_link}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin_link: e.target.value })
                }
              />
            </div>
          )}

          {getFieldConfig("cv_path").show && (
            <div>
              <Label>
                Upload CV (PDF)
                {getFieldConfig("cv_path").required ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("File must be less than 5 MB");
                      return;
                    }
                    if (file.type !== "application/pdf") {
                      toast.error("Only PDF files are allowed");
                      return;
                    }
                    setCvFile(file);
                  }
                }}
              />
              {formData.cv_path && (
                <p className="text-sm text-green-600 mt-1">✓ CV uploaded</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={uploading}
          >
            {uploading ? "Uploading CV..." : "Submit"}
          </Button>
        </form>
      </div>

      <HandCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </>
  );
}
