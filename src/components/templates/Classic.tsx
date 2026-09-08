import type { SectionId } from "@/lib/resume";
import { SECTION_LABELS } from "@/lib/resume";
import {
  Bullets,
  Heading,
  contactItems,
  dateRange,
  useVisibleSections,
  type TemplateProps,
} from "./shared";

/** Single column, centred header, ruled headings — the safest ATS layout. */
export default function Classic({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const upper = data.settings.uppercaseHeadings;
  const sections = useVisibleSections(data);

  const Section = ({ id }: { id: SectionId }) => (
    <section className="mt-[1.15em]">
      <Heading accent={accent} uppercase={upper} className="pb-[0.25em]">
        {SECTION_LABELS[id]}
      </Heading>
      <div
        className="mb-[0.6em] h-px w-full"
        style={{ backgroundColor: accent, opacity: 0.35 }}
      />
      {renderBody(id)}
    </section>
  );

  function renderBody(id: SectionId) {
    switch (id) {
      case "summary":
        return <p className="whitespace-pre-line">{data.basics.summary}</p>;

      case "experience":
        return (
          <div className="space-y-[0.75em]">
            {data.experience.map((job) => (
              <div key={job.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{job.role}</span>
                  <span className="shrink-0 text-[0.9em] text-neutral-600">
                    {dateRange(job.start, job.end, job.current)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-[0.94em]">
                  <span style={{ color: accent }}>{job.company}</span>
                  <span className="shrink-0 text-[0.95em] text-neutral-600">
                    {job.location}
                  </span>
                </div>
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
                  <span className="shrink-0 text-[0.9em] text-neutral-600">
                    {dateRange(edu.start, edu.end)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-[0.94em]">
                  <span>
                    {[edu.degree, edu.field].filter(Boolean).join(", ")}
                  </span>
                  <span className="shrink-0 text-[0.95em] text-neutral-600">
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
                <span className="min-w-[7.5em] font-semibold">
                  {group.category}
                </span>
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
                  <span className="shrink-0 text-[0.88em] text-neutral-600">
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
                <span className="shrink-0 text-[0.9em] text-neutral-600">
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
              .map((lang) =>
                [lang.name, lang.level].filter(Boolean).join(" (") +
                (lang.level ? ")" : "")
              )
              .join(" · ")}
          </p>
        );

      default:
        return null;
    }
  }

  return (
    <div>
      <header className="text-center">
        <h1 className="text-[2em] font-bold leading-tight">
          {data.basics.fullName || "Your Name"}
        </h1>
        {data.basics.headline ? (
          <p className="mt-[0.15em] text-[1.05em]" style={{ color: accent }}>
            {data.basics.headline}
          </p>
        ) : null}
        <p className="mt-[0.5em] text-[0.88em] text-neutral-600">
          {contactItems(data).join("  ·  ")}
        </p>
      </header>

      {sections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </div>
  );
}
