import type { TemplateId } from "@/lib/resume";
import type { TemplateProps } from "./shared";
import Classic from "./Classic";
import Modern from "./Modern";
import Minimal from "./Minimal";
import Executive from "./Executive";
import Compact from "./Compact";
import Creative from "./Creative";
import Technical from "./Technical";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  blurb: string;
  Component: (props: TemplateProps) => React.JSX.Element;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    blurb: "Centred header, ruled headings. The safest choice for ATS screens.",
    Component: Classic,
  },
  {
    id: "modern",
    name: "Modern",
    blurb: "Tinted sidebar for contact and skills, wide column for the story.",
    Component: Modern,
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Quiet labels in the margin and a lot of white space.",
    Component: Minimal,
  },
  {
    id: "executive",
    name: "Executive",
    blurb: "Full-bleed colour masthead. Formal, senior, hard to ignore.",
    Component: Executive,
  },
  {
    id: "compact",
    name: "Compact",
    blurb: "Dense and small-set, for long careers that still need to fit.",
    Component: Compact,
  },
  {
    id: "creative",
    name: "Creative",
    blurb: "Portrait, oversized name, pill headings and a skills rail.",
    Component: Creative,
  },
  {
    id: "technical",
    name: "Technical",
    blurb: "Monospaced markers and a skills matrix, built for engineering roles.",
    Component: Technical,
  },
];

export function getTemplate(id: TemplateId): TemplateMeta {
  return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}
