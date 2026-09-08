import { SECTION_LABELS } from "@/lib/resume";
import { SectionContent } from "./SectionContent";
import { contactItems, useVisibleSections, type TemplateProps } from "./shared";

/** Typographic and airy: no rules, no fills, headings as quiet labels. */
export default function Minimal({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const sections = useVisibleSections(data);

  return (
    <div>
      <header className="mb-[1.6em]">
        <h1 className="text-[1.9em] font-medium leading-tight tracking-[-0.02em]">
          {data.basics.fullName || "Your Name"}
        </h1>
        {data.basics.headline ? (
          <p className="mt-[0.1em] text-[1em] text-neutral-500">
            {data.basics.headline}
          </p>
        ) : null}
        <p className="mt-[0.7em] text-[0.85em] text-neutral-500">
          {contactItems(data).join("   ·   ")}
        </p>
      </header>

      <div className="space-y-[1.5em]">
        {sections.map((id) => (
          <section key={id} className="grid grid-cols-[7.5em_1fr] gap-[1.2em]">
            <h2
              className="pt-[0.2em] text-[0.72em] font-semibold uppercase tracking-[0.14em]"
              style={{ color: accent }}
            >
              {SECTION_LABELS[id]}
            </h2>
            <div className="min-w-0">
              <SectionContent id={id} data={data} accent={accent} muted="#737373" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
