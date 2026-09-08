import { SECTION_LABELS } from "@/lib/resume";
import { SectionContent } from "./SectionContent";
import { contactItems, useVisibleSections, type TemplateProps } from "./shared";

/** Dense and small-set — for long careers that must still fit two pages. */
export default function Compact({ data }: TemplateProps) {
  const accent = data.settings.accent;
  const upper = data.settings.uppercaseHeadings;
  const sections = useVisibleSections(data);

  return (
    <div className="text-[0.94em]">
      <header className="flex items-end justify-between gap-4 border-b-2 pb-[0.6em]" style={{ borderColor: accent }}>
        <div>
          <h1 className="text-[1.75em] font-bold leading-none">
            {data.basics.fullName || "Your Name"}
          </h1>
          {data.basics.headline ? (
            <p className="mt-[0.25em] text-[0.95em]" style={{ color: accent }}>
              {data.basics.headline}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right text-[0.78em] leading-[1.5] text-neutral-600">
          {contactItems(data).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      <div className="space-y-[0.9em] pt-[0.9em]">
        {sections.map((id) => (
          <section key={id}>
            <h2
              className="mb-[0.35em] text-[0.78em] font-bold tracking-[0.1em]"
              style={{
                color: accent,
                textTransform: upper ? "uppercase" : "none",
              }}
            >
              {SECTION_LABELS[id]}
            </h2>
            <SectionContent id={id} data={data} accent={accent} muted="#595959" />
          </section>
        ))}
      </div>
    </div>
  );
}
