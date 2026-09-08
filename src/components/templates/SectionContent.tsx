import type { ResumeData, SectionId } from "@/lib/resume";
import { Bullets, dateRange } from "./shared";

/**
 * The body of a section, without any heading chrome.
 *
 * Templates differ in how they frame a section — a rule, a band, a coloured
 * bar — far more than in how they list a job. Sharing the body keeps those
 * frames free to be genuinely different without five copies of this markup.
 */
export function SectionContent({
  id,
  data,
  accent,
  muted = "#525252",
}: {
  id: SectionId;
  data: ResumeData;
  accent: string;
  muted?: string;
}) {
  switch (id) {
    case "summary":
      return <p className="whitespace-pre-line">{data.basics.summary}</p>;

    case "experience":
      return (
        <div className="space-y-[0.75em]">
          {data.experience.map((job) => (
            <div key={job.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">
                  {job.role}
                  {job.company ? (
                    <span style={{ color: accent }}> · {job.company}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[0.87em]" style={{ color: muted }}>
                  {dateRange(job.start, job.end, job.current)}
                </span>
              </div>
              {job.location ? (
                <p className="text-[0.87em]" style={{ color: muted }}>
                  {job.location}
                </p>
              ) : null}
              <Bullets items={job.bullets} />
            </div>
          ))}
        </div>
      );

    case "education":
      return (
        <div className="space-y-[0.55em]">
          {data.education.map((edu) => (
            <div key={edu.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{edu.school}</span>
                <span className="shrink-0 text-[0.87em]" style={{ color: muted }}>
                  {dateRange(edu.start, edu.end)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-[0.95em]">
                <span>{[edu.degree, edu.field].filter(Boolean).join(", ")}</span>
                <span className="shrink-0 text-[0.9em]" style={{ color: muted }}>
                  {[edu.score, edu.location].filter(Boolean).join(" · ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      );

    case "skills":
      return (
        <div className="space-y-[0.3em]">
          {data.skills.map((group) => (
            <div key={group.id} className="flex gap-2">
              <span className="min-w-[7em] font-semibold">{group.category}</span>
              <span className="flex-1">{group.items.join(" · ")}</span>
            </div>
          ))}
        </div>
      );

    case "projects":
      return (
        <div className="space-y-[0.6em]">
          {data.projects.map((project) => (
            <div key={project.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{project.name}</span>
                <span className="shrink-0 text-[0.85em]" style={{ color: muted }}>
                  {project.link}
                </span>
              </div>
              {project.description ? <p>{project.description}</p> : null}
              <Bullets items={project.bullets} />
            </div>
          ))}
        </div>
      );

    case "certifications":
      return (
        <div className="space-y-[0.25em]">
          {data.certifications.map((cert) => (
            <div key={cert.id} className="flex items-baseline justify-between gap-3">
              <span>
                <span className="font-semibold">{cert.name}</span>
                {cert.issuer ? ` — ${cert.issuer}` : ""}
              </span>
              <span className="shrink-0 text-[0.87em]" style={{ color: muted }}>
                {cert.date}
              </span>
            </div>
          ))}
        </div>
      );

    case "achievements":
      return (
        <div className="space-y-[0.25em]">
          {data.achievements.map((item) => (
            <div key={item.id}>
              <span className="font-semibold">{item.title}</span>
              {item.detail ? <span> — {item.detail}</span> : null}
            </div>
          ))}
        </div>
      );

    case "languages":
      return (
        <p>
          {data.languages
            .map((lang) => (lang.level ? `${lang.name} (${lang.level})` : lang.name))
            .join("  ·  ")}
        </p>
      );

    default:
      return null;
  }
}
