import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = "admin" | "applicant";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Job {
  id: string;
  slug: string;
  title: string;
  location?: string;
  status: "active" | "inactive" | "draft";
  description?: string;
  job_type?: string;
  candidates_needed?: number;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  created_at: string;
  started_on?: string;
}

export interface ApplicationFormField {
  key: string;
  label?: string;
  type?: string;
  validation: {
    required: boolean;
  };
}

export interface JobConfig {
  application_form: {
    sections: {
      title: string;
      fields: ApplicationFormField[];
    }[];
  };
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  data: Record<string, any>;
  created_at: string;
}
