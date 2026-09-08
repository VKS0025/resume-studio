import { SECTION_LABELS } from "@/lib/resume";
import { SectionContent } from "./SectionContent";
import { contactItems, useVisibleSections, type TemplateProps } from "./shared";

/** Monospaced markers and a skills matrix — built for engineering screens. */
export default function Technical({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const sections = useVisibleSections(data);

  return (
    <div>
      <header className="mb-[1.2em]">
        <h1 className="text-[1.95em] font-bold leading-tight">
          {data.basics.fullName || "Your Name"}
        </h1>
        {data.basics.headline ? (
          <p className="font-mono text-[0.92em]" style={{ color: accent }}>
            {data.basics.headline}
          </p>
        ) : null}
        <p className="mt-[0.55em] font-mono text-[0.78em] text-neutral-600">
          {contactItems(data).join("  |  ")}
        </p>
      </header>

      <div className="space-y-[1.1em]">
        {sections.map((id) => (
          <section key={id} className="pl-[0.9em]" style={{ borderLeft: `2px solid ${accent}30` }}>
            <h2 className="mb-[0.45em] font-mono text-[0.8em] font-bold tracking-[0.06em]">
              <span style={{ color: accent }}>{"// "}</span>
              <span className="uppercase">{SECTION_LABELS[id]}</span>
            </h2>

            {id === "skills" ? (
              <div className="space-y-[0.35em]">
                {data.skills.map((group) => (
                  <div key={group.id} className="flex flex-wrap items-baseline gap-[0.35em]">
                    <span className="min-w-[6.5em] font-mono text-[0.85em] text-neutral-600">
                      {group.category}
                    </span>
                    {group.items.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded px-[0.45em] py-[0.08em] font-mono text-[0.82em]"
                        style={{ backgroundColor: `${accent}14`, color: accent }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <SectionContent id={id} data={data} accent={accent} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
