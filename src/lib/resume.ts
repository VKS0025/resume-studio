/**
 * The single source of truth for a resume document.
 *
 * Everything the editor edits, every template renders, and the whole `data`
 * jsonb column in Supabase is this one shape. Adding a field here means adding
 * it in exactly one place.
 */

export type SectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "achievements";

export type TemplateId =
  | "classic"
  | "modern"
  | "minimal"
  | "executive"
  | "compact"
  | "creative"
  | "technical";

export type Basics = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photoUrl: string;
  summary: string;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  start: string;
  end: string;
  score: string;
};

export type SkillGroup = {
  id: string;
  category: string;
  items: string[];
};

export type Project = {
  id: string;
  name: string;
  link: string;
  description: string;
  bullets: string[];
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
};

export type Language = {
  id: string;
  name: string;
  level: string;
};

export type Achievement = {
  id: string;
  title: string;
  detail: string;
};

export type ResumeSettings = {
  template: TemplateId;
  accent: string;
  fontFamily: "sans" | "serif" | "mono";
  fontScale: number;
  lineHeight: number;
  pageMargin: number;
  showPhoto: boolean;
  uppercaseHeadings: boolean;
};

export type ResumeData = {
  basics: Basics;
  experience: Experience[];
  education: Education[];
  skills: SkillGroup[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  achievements: Achievement[];
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  settings: ResumeSettings;
};

export type ResumeRecord = {
  id: string;
  title: string;
  data: ResumeData;
  updatedAt: string;
  createdAt: string;
};

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  achievements: "Achievements",
};

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "achievements",
  "languages",
];

export const ACCENT_PRESETS = [
  { name: "Indigo", value: "#4f46e5" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Teal", value: "#0f766e" },
  { name: "Emerald", value: "#047857" },
  { name: "Crimson", value: "#b91c1c" },
  { name: "Amber", value: "#b45309" },
  { name: "Plum", value: "#7e22ce" },
  { name: "Graphite", value: "#334155" },
];

export const DEFAULT_SETTINGS: ResumeSettings = {
  template: "classic",
  accent: "#4f46e5",
  fontFamily: "sans",
  fontScale: 1,
  lineHeight: 1.45,
  pageMargin: 48,
  showPhoto: false,
  uppercaseHeadings: true,
};

/** Short random id — good enough for list keys and array items. */
export function uid(prefix = "i"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyResume(): ResumeData {
  return {
    basics: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      photoUrl: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** The resume a brand-new document starts from, so the canvas is never blank. */
export function sampleResume(): ResumeData {
  return {
    basics: {
      fullName: "Aarav Sharma",
      headline: "Senior Frontend Engineer",
      email: "aarav.sharma@example.com",
      phone: "+91 98765 43210",
      location: "Bengaluru, India",
      website: "aaravsharma.dev",
      linkedin: "linkedin.com/in/aaravsharma",
      github: "github.com/aaravsharma",
      photoUrl: "",
      summary:
        "Frontend engineer with 7 years building high-traffic React and Next.js products. Led a design-system rollout used by 40+ engineers and cut median page load from 4.1s to 1.3s. Happiest where product thinking meets performance work.",
    },
    experience: [
      {
        id: uid("exp"),
        role: "Senior Frontend Engineer",
        company: "Flipkart",
        location: "Bengaluru",
        start: "Mar 2022",
        end: "",
        current: true,
        bullets: [
          "Rebuilt the checkout flow in Next.js, lifting mobile conversion 18% quarter over quarter.",
          "Owned the shared component library adopted by 6 squads and 40+ engineers.",
          "Cut Largest Contentful Paint from 4.1s to 1.3s through route-level code splitting and image budgets.",
        ],
      },
      {
        id: uid("exp"),
        role: "Frontend Engineer",
        company: "Razorpay",
        location: "Bengaluru",
        start: "Jul 2019",
        end: "Feb 2022",
        current: false,
        bullets: [
          "Shipped the merchant dashboard analytics suite used daily by 12,000 businesses.",
          "Introduced end-to-end tests in Playwright, dropping production regressions by 60%.",
        ],
      },
    ],
    education: [
      {
        id: uid("edu"),
        school: "Delhi Technological University",
        degree: "B.Tech",
        field: "Computer Science",
        location: "New Delhi",
        start: "2015",
        end: "2019",
        score: "8.6 CGPA",
      },
    ],
    skills: [
      {
        id: uid("sk"),
        category: "Languages",
        items: ["TypeScript", "JavaScript", "Python", "SQL"],
      },
      {
        id: uid("sk"),
        category: "Frameworks",
        items: ["React", "Next.js", "Node.js", "Tailwind CSS"],
      },
      {
        id: uid("sk"),
        category: "Tooling",
        items: ["Playwright", "Vitest", "Docker", "Figma"],
      },
    ],
    projects: [
      {
        id: uid("pr"),
        name: "Pagelight",
        link: "github.com/aaravsharma/pagelight",
        description: "Open-source performance budget checker for Next.js apps.",
        bullets: [
          "1.4k GitHub stars; runs as a GitHub Action on every pull request.",
        ],
      },
    ],
    certifications: [
      {
        id: uid("cert"),
        name: "AWS Certified Developer – Associate",
        issuer: "Amazon Web Services",
        date: "2023",
      },
    ],
    languages: [
      { id: uid("lang"), name: "English", level: "Fluent" },
      { id: uid("lang"), name: "Hindi", level: "Native" },
    ],
    achievements: [
      {
        id: uid("ach"),
        title: "Speaker, React India 2024",
        detail: "Talk on shipping design systems without slowing product teams.",
      },
    ],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * Data loaded from storage may predate a field we added later, so every read
 * goes through this instead of being trusted as-is.
 */
export function normalizeResume(input: unknown): ResumeData {
  const base = emptyResume();
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<ResumeData>;

  return {
    basics: { ...base.basics, ...(raw.basics ?? {}) },
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    sectionOrder: sanitizeOrder(raw.sectionOrder),
    hiddenSections: Array.isArray(raw.hiddenSections)
      ? raw.hiddenSections.filter((s): s is SectionId => s in SECTION_LABELS)
      : [],
    settings: { ...base.settings, ...(raw.settings ?? {}) },
  };
}

function sanitizeOrder(order: unknown): SectionId[] {
  const known = new Set(DEFAULT_SECTION_ORDER);
  const seen = new Set<SectionId>();
  const result: SectionId[] = [];

  if (Array.isArray(order)) {
    for (const id of order) {
      if (known.has(id as SectionId) && !seen.has(id as SectionId)) {
        seen.add(id as SectionId);
        result.push(id as SectionId);
      }
    }
  }
  // Anything the stored order never knew about still needs a home.
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id)) result.push(id);
  }
  return result;
}
