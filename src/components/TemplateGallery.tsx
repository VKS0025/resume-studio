"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ACCENT_PRESETS, sampleResume, type TemplateId } from "@/lib/resume";
import { A4_WIDTH_PX } from "@/lib/export";
import { TEMPLATES } from "@/components/templates";
import ResumePaper from "@/components/ResumePaper";

const THUMB_SCALE = 0.29;

/** Real sheets, shrunk — a wireframe would not show what you actually get. */
export default function TemplateGallery() {
  const [accent, setAccent] = useState(ACCENT_PRESETS[0].value);
  const base = useMemo(() => sampleResume(), []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500">Preview colour</span>
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-label={preset.name}
            title={preset.name}
            onClick={() => setAccent(preset.value)}
            className={`h-6 w-6 rounded-full transition ${
              accent === preset.value
                ? "ring-2 ring-slate-900 ring-offset-2"
                : "ring-1 ring-slate-200"
            }`}
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/editor/new?template=${template.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <Thumb id={template.id} accent={accent} data={base} />
            <div className="px-1 pb-1 pt-3">
              <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
              <p className="mt-0.5 text-xs leading-snug text-slate-500">{template.blurb}</p>
              <span className="mt-2 inline-block text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
                Use this template →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Thumb({
  id,
  accent,
  data,
}: {
  id: TemplateId;
  accent: string;
  data: ReturnType<typeof sampleResume>;
}) {
  const scoped = {
    ...data,
    settings: { ...data.settings, template: id, accent },
  };

  return (
    <div
      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={{ width: "100%", height: 1123 * THUMB_SCALE }}
    >
      <div
        style={{
          transform: `scale(${THUMB_SCALE})`,
          transformOrigin: "top left",
          width: A4_WIDTH_PX,
        }}
      >
        <ResumePaper data={scoped} />
      </div>
    </div>
  );
}
