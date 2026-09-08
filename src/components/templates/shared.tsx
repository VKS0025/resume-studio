import type { ReactNode } from "react";
import type { ResumeData, SectionId } from "@/lib/resume";

export type TemplateProps = { data: ResumeData };

/**
 * A section is rendered only when it is not hidden *and* actually has content —
 * an empty "Projects" heading on a printed resume looks like a mistake.
 */
export function useVisibleSections(data: ResumeData): SectionId[] {
  const hidden = new Set(data.hiddenSections);
  return data.sectionOrder.filter((id) => !hidden.has(id) && hasContent(data, id));
}

export function hasContent(data: ResumeData, id: SectionId): boolean {
  switch (id) {
    case "summary":
      return data.basics.summary.trim().length > 0;
    case "experience":
      return data.experience.length > 0;
    case "education":
      return data.education.length > 0;
    case "skills":
      return data.skills.length > 0;
    case "projects":
      return data.projects.length > 0;
    case "certifications":
      return data.certifications.length > 0;
    case "languages":
      return data.languages.length > 0;
    case "achievements":
      return data.achievements.length > 0;
    default:
      return false;
  }
}

export function dateRange(start: string, end: string, current?: boolean): string {
  const to = current ? "Present" : end;
  if (start && to) return `${start} — ${to}`;
  return start || to || "";
}

export function contactItems(data: ResumeData): string[] {
  const { email, phone, location, website, linkedin, github } = data.basics;
  return [email, phone, location, website, linkedin, github].filter(Boolean);
}

/** Splits "Skills" groups into a flat list for templates that show chips. */
export function flatSkills(data: ResumeData): string[] {
  return data.skills.flatMap((group) => group.items).filter(Boolean);
}

export function Heading({
  children,
  accent,
  uppercase,
  className = "",
  style,
}: {
  children: ReactNode;
  accent: string;
  uppercase: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h2
      className={`font-semibold tracking-wide ${className}`}
      style={{
        color: accent,
        textTransform: uppercase ? "uppercase" : "none",
        fontSize: "0.82em",
        letterSpacing: uppercase ? "0.09em" : "0.01em",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function Bullets({ items }: { items: string[] }) {
  const visible = items.filter((line) => line.trim().length > 0);
  if (visible.length === 0) return null;
  return (
    <ul className="mt-1 space-y-[0.18em] pl-[1.05em]">
      {visible.map((line, index) => (
        <li key={index} className="list-disc" style={{ paddingLeft: "0.1em" }}>
          {line}
        </li>
      ))}
    </ul>
  );
}
