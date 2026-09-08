import type { SectionId } from "@/lib/resume";
import { SECTION_LABELS } from "@/lib/resume";
import {
  Bullets,
  Heading,
  dateRange,
  useVisibleSections,
  type TemplateProps,
} from "./shared";

/** Sections that read well as short lists get pushed into the sidebar. */
const SIDEBAR: SectionId[] = ["skills", "languages", "certifications"];

/** Two columns: a tinted sidebar for facts, a wide column for the story. */
export default function Modern({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const upper = data.settings.uppercaseHeadings;
  const sections = useVisibleSections(data);
  const sidebar = sections.filter((id) => SIDEBAR.includes(id));
  const main = sections.filter((id) => !SIDEBAR.includes(id));
  const { basics } = data;

  return (
    <div className="flex gap-[1.6em]">
      <aside
        className="w-[31%] shrink-0 rounded-[0.4em] p-[1.1em]"
        style={{ backgroundColor: `${accent}12` }}
      >
        {data.settings.showPhoto && basics.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={basics.photoUrl}
            alt=""
            className="mx-auto mb-[0.9em] h-[6.5em] w-[6.5em] rounded-full object-cover"
            style={{ border: `2px solid ${accent}` }}
            crossOrigin="anonymous"
          />
        ) : null}

        <Heading accent={accent} uppercase={upper}>
          Contact
        </Heading>
        <div className="mt-[0.45em] space-y-[0.3em] break-words text-[0.9em]">
          {[
            basics.email,
            basics.phone,
            basics.location,
            basics.website,
            basics.linkedin,
            basics.github,
          ]
            .filter(Boolean)
            .map((line) => (
              <p key={line}>{line}</p>
            ))}
        </div>

        {sidebar.map((id) => (
          <div key={id} className="mt-[1.1em]">
            <Heading accent={accent} uppercase={upper}>
              {SECTION_LABELS[id]}
            </Heading>
            <div className="mt-[0.45em] text-[0.9em]">
              {id === "skills" ? (
                <div className="space-y-[0.5em]">
                  {data.skills.map((group) => (
                    <div key={group.id}>
                      <p className="font-semibold">{group.category}</p>
                      <p>{group.items.join(", ")}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {id === "languages" ? (
                <div className="space-y-[0.2em]">
                  {data.languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between gap-2">
                      <span>{lang.name}</span>
                      <span className="text-neutral-600">{lang.level}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {id === "certifications" ? (
                <div className="space-y-[0.4em]">
                  {data.certifications.map((cert) => (
                    <div key={cert.id}>
                      <p className="font-semibold">{cert.name}</p>
                      <p className="text-neutral-600">
                        {[cert.issuer, cert.date].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </aside>

      <div className="min-w-0 flex-1">
        <header>
          <h1 className="text-[2.05em] font-bold leading-[1.1]">
            {basics.fullName || "Your Name"}
          </h1>
          {basics.headline ? (
            <p className="mt-[0.1em] text-[1.05em]" style={{ color: accent }}>
              {basics.headline}
            </p>
          ) : null}
          <div
            className="mt-[0.6em] h-[3px] w-[3.5em] rounded-full"
            style={{ backgroundColor: accent }}
          />
        </header>

        {main.map((id) => (
          <section key={id} className="mt-[1.15em]">
            <Heading accent={accent} uppercase={upper}>
              {SECTION_LABELS[id]}
            </Heading>

            <div className="mt-[0.5em]">
              {id === "summary" ? (
                <p className="whitespace-pre-line">{basics.summary}</p>
              ) : null}

              {id === "experience" ? (
                <div className="space-y-[0.8em]">
                  {data.experience.map((job) => (
                    <div key={job.id}>
                      <p className="font-semibold">
                        {job.role}
                        {job.company ? (
                          <span style={{ color: accent }}> · {job.company}</span>
                        ) : null}
                      </p>
                      <p className="text-[0.87em] text-neutral-600">
                        {[dateRange(job.start, job.end, job.current), job.location]
                          .filter(Boolean)
                          .join("  ·  ")}
                      </p>
                      <Bullets items={job.bullets} />
                    </div>
                  ))}
                </div>
              ) : null}

              {id === "education" ? (
                <div className="space-y-[0.55em]">
                  {data.education.map((edu) => (
                    <div key={edu.id}>
                      <p className="font-semibold">{edu.school}</p>
                      <p>{[edu.degree, edu.field].filter(Boolean).join(", ")}</p>
                      <p className="text-[0.87em] text-neutral-600">
                        {[dateRange(edu.start, edu.end), edu.score, edu.location]
                          .filter(Boolean)
                          .join("  ·  ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {id === "projects" ? (
                <div className="space-y-[0.6em]">
                  {data.projects.map((project) => (
                    <div key={project.id}>
                      <p className="font-semibold">
                        {project.name}
                        {project.link ? (
                          <span className="ml-2 text-[0.82em] font-normal text-neutral-600">
                            {project.link}
                          </span>
                        ) : null}
                      </p>
                      {project.description ? <p>{project.description}</p> : null}
                      <Bullets items={project.bullets} />
                    </div>
                  ))}
                </div>
              ) : null}

              {id === "achievements" ? (
                <div className="space-y-[0.3em]">
                  {data.achievements.map((item) => (
                    <div key={item.id}>
                      <span className="font-semibold">{item.title}</span>
                      {item.detail ? <span> — {item.detail}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
