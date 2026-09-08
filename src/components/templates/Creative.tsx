import type { SectionId } from "@/lib/resume";
import { SECTION_LABELS } from "@/lib/resume";
import { SectionContent } from "./SectionContent";
import { useVisibleSections, type TemplateProps } from "./shared";

const SIDEBAR: SectionId[] = ["skills", "languages", "certifications", "achievements"];

/** Portrait, oversized name and a right rail — for portfolio-led roles. */
export default function Creative({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const sections = useVisibleSections(data);
  const rail = sections.filter((id) => SIDEBAR.includes(id));
  const main = sections.filter((id) => !SIDEBAR.includes(id));
  const { basics } = data;

  return (
    <div>
      <header className="mb-[1.3em] flex items-center gap-[1.1em]">
        {data.settings.showPhoto && basics.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={basics.photoUrl}
            alt=""
            className="h-[5.5em] w-[5.5em] shrink-0 rounded-full object-cover"
            style={{ border: `3px solid ${accent}` }}
            crossOrigin="anonymous"
          />
        ) : (
          <span
            className="flex h-[5.5em] w-[5.5em] shrink-0 items-center justify-center rounded-full text-[1.8em] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {initials(basics.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[2.2em] font-extrabold leading-[1.05] tracking-[-0.02em]">
            {basics.fullName || "Your Name"}
          </h1>
          {basics.headline ? (
            <p className="text-[1.05em] font-medium" style={{ color: accent }}>
              {basics.headline}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex gap-[1.5em]">
        <div className="min-w-0 flex-1 space-y-[1.15em]">
          {main.map((id) => (
            <section key={id}>
              <h2 className="mb-[0.45em] text-[0.95em] font-bold">
                <span
                  className="rounded-full px-[0.7em] py-[0.18em] text-[0.82em] uppercase tracking-[0.09em] text-white"
                  style={{ backgroundColor: accent }}
                >
                  {SECTION_LABELS[id]}
                </span>
              </h2>
              <SectionContent id={id} data={data} accent={accent} />
            </section>
          ))}
        </div>

        <aside className="w-[30%] shrink-0 space-y-[1.05em] text-[0.9em]">
          <div>
            <h2 className="mb-[0.4em] text-[0.8em] font-bold uppercase tracking-[0.1em]" style={{ color: accent }}>
              Contact
            </h2>
            <div className="space-y-[0.25em] break-words">
              {[basics.email, basics.phone, basics.location, basics.website, basics.linkedin, basics.github]
                .filter(Boolean)
                .map((line) => (
                  <p key={line}>{line}</p>
                ))}
            </div>
          </div>

          {rail.map((id) => (
            <div key={id}>
              <h2 className="mb-[0.4em] text-[0.8em] font-bold uppercase tracking-[0.1em]" style={{ color: accent }}>
                {SECTION_LABELS[id]}
              </h2>
              {id === "skills" ? (
                <div className="flex flex-wrap gap-[0.3em]">
                  {data.skills.flatMap((group) => group.items).map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full px-[0.6em] py-[0.12em] text-[0.9em]"
                      style={{ backgroundColor: `${accent}18`, color: accent }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <SectionContent id={id} data={data} accent={accent} muted="#737373" />
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YN";
  return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}
