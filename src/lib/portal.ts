/**
 * Shared vocabulary for the career portal.
 *
 * The database is the source of truth for these shapes (supabase/migrations/
 * 0002_portal.sql); this file mirrors them in TypeScript and holds the labels
 * the UI shows, so a sector or employment type is spelled one way everywhere.
 */

export type Sector = "private" | "government" | "internship";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

export type MaterialKind =
  | "notes"
  | "previous_paper"
  | "syllabus"
  | "book"
  | "video"
  | "link";

export const SECTOR_LABELS: Record<Sector, string> = {
  private: "Private",
  government: "Government",
  internship: "Internship",
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};

export const MATERIAL_LABELS: Record<MaterialKind, string> = {
  notes: "Notes",
  previous_paper: "Previous paper",
  syllabus: "Syllabus",
  book: "Book",
  video: "Video",
  link: "Link",
};

export type Job = {
  id: string;
  source: string;
  sourceId: string | null;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  isRemote: boolean;
  sector: Sector;
  employmentType: EmploymentType;
  category: string;
  description: string;
  applyUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "hour" | "month" | "year";
  currency: string;
  qualification: string;
  experience: string;
  tags: string[];
  postedAt: string;
  deadline: string | null;
};

export type JobAlert = {
  id: string;
  label: string;
  keywords: string;
  location: string;
  sector: Sector | null;
  employmentType: EmploymentType | null;
  emailDigest: boolean;
  isActive: boolean;
  createdAt: string;
};

export type PortalNotification = {
  id: string;
  kind: "job_match" | "deadline" | "system";
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export type StudyCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
};

export type StudyMaterial = {
  id: string;
  categoryId: string | null;
  title: string;
  description: string;
  kind: MaterialKind;
  subject: string;
  exam: string;
  year: number | null;
  filePath: string;
  externalUrl: string;
  fileSize: number | null;
  downloads: number;
  createdAt: string;
};

export type Profile = {
  id: string;
  role: "student" | "admin";
  fullName: string;
  headline: string;
  location: string;
  about: string;
  skills: string[];
  links: Record<string, string>;
  avatarUrl: string;
  isPublic: boolean;
};

/* ------------------------------------------------------------- formatting */

/**
 * Indian salary figures are quoted in lakhs far more often than in raw rupees,
 * so a plain toLocaleString reads wrong to the audience this portal serves.
 */
export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "salaryPeriod" | "currency">): string {
  const { salaryMin, salaryMax, salaryPeriod, currency } = job;
  if (!salaryMin && !salaryMax) return "";

  const unit = (value: number) => {
    if (currency !== "INR") return `${currency} ${Math.round(value).toLocaleString()}`;
    if (salaryPeriod === "year" && value >= 100000) {
      const lakhs = value / 100000;
      return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
    }
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  };

  const period = salaryPeriod === "year" ? "/yr" : salaryPeriod === "month" ? "/mo" : "/hr";
  if (salaryMin && salaryMax) return `${unit(salaryMin)} – ${unit(salaryMax)}${period}`;
  return `${unit((salaryMin ?? salaryMax) as number)}${period}`;
}

/** "3 days ago" style, because a job board is all about freshness. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

/** Days left before a government notification closes; negative once past. */
export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const end = new Date(`${date}T23:59:59`).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / 86400000);
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
