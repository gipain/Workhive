export type UserRole = 'student' | 'company' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  created_at: string;
  student_profile?: StudentProfile;
  company_profile?: CompanyProfile;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  bio?: string;
  university?: string;
  graduation_year?: number;
  avatar_url?: string;
  resume_url?: string;
  portfolio_url?: string;
  phone?: string;
  rating_avg: number;
  total_completed: number;
  skills: Skill[];
  created_at: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  industry?: string;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  company_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  requirements?: string;
  max_applicants: number;
  skills: Skill[];
  company?: CompanyProfile;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  project_id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  cover_letter?: string;
  student?: StudentProfile;
  project?: Project;
  created_at: string;
}

export interface Invitation {
  id: string;
  project_id: string;
  student_id: string;
  company_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  project?: Project;
  company?: CompanyProfile;
  created_at: string;
}

export interface Submission {
  id: string;
  project_id: string;
  student_id: string;
  content?: string;
  comment?: string;
  file_url?: string;
  link_url?: string;
  status: 'pending_review' | 'changes_requested' | 'approved';
  feedback?: string;
  reviewer_comment?: string;
  student?: StudentProfile;
  created_at: string;
}

export interface Review {
  id: string;
  project_id: string;
  student_id: string;
  company_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  project_id: string;
  student_id: string;
  pdf_url: string;
  issued_at: string;
  project?: Project;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata_json?: Record<string, string>;
  created_at: string;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  target_user_id: string;
  subject?: string;
  description?: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reporter?: User;
  target_user?: User;
  created_at: string;
  resolved_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
