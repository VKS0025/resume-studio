import { SECTION_LABELS } from "@/lib/resume";
import { SectionContent } from "./SectionContent";
import { contactItems, useVisibleSections, type TemplateProps } from "./shared";

/** A solid accent masthead and bar-marked headings — senior, formal, decisive. */
export default function Executive({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const upper = data.settings.uppercaseHeadings;
  const sections = useVisibleSections(data);

  return (
    <div>
      <header
        className="-mx-[var(--page-pad)] -mt-[var(--page-pad)] mb-[1.3em] px-[var(--page-pad)] py-[1.3em]"
        style={{ backgroundColor: accent, color: "#ffffff" }}
      >
        <h1 className="text-[2.1em] font-bold leading-tight tracking-[-0.01em]">
          {data.basics.fullName || "Your Name"}
        </h1>
        {data.basics.headline ? (
          <p className="mt-[0.15em] text-[1.05em] opacity-90">
            {data.basics.headline}
          </p>
        ) : null}
        <p className="mt-[0.7em] text-[0.85em] opacity-85">
          {contactItems(data).join("   ·   ")}
        </p>
      </header>

      <div className="space-y-[1.2em]">
        {sections.map((id) => (
          <section key={id}>
            <div className="mb-[0.55em] flex items-center gap-[0.55em]">
              <span
                className="h-[0.95em] w-[0.28em] rounded-sm"
                style={{ backgroundColor: accent }}
              />
              <h2
                className="text-[0.85em] font-bold tracking-[0.08em]"
                style={{
                  textTransform: upper ? "uppercase" : "none",
                  color: "#171717",
                }}
              >
                {SECTION_LABELS[id]}
              </h2>
            </div>
            <SectionContent id={id} data={data} accent={accent} />
          </section>
        ))}
      </div>
    </div>
  );
}
