"use client";

import { ACCENT_PRESETS, SECTION_LABELS, type ResumeData, type TemplateId } from "@/lib/resume";
import { TEMPLATES } from "@/components/templates";
import { Field } from "@/components/ui/controls";
import type { Patch } from "./ContentForms";

export function TemplatePicker({ data, patch }: { data: ResumeData; patch: Patch }) {
  const current = data.settings.template;

  return (
    <div className="grid grid-cols-2 gap-2">
      {TEMPLATES.map((template) => {
        const active = template.id === current;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() =>
              patch({ settings: { ...data.settings, template: template.id as TemplateId } })
            }
            className={`rounded-lg border p-2 text-left transition ${
              active
                ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-100"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <TemplateThumb id={template.id} accent={data.settings.accent} active={active} />
            <p className="mt-2 text-xs font-semibold text-slate-800">{template.name}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{template.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}

/** A wireframe of the layout — cheaper and clearer than rendering the real sheet. */
function TemplateThumb({
  id,
  accent,
  active,
}: {
  id: TemplateId;
  accent: string;
  active: boolean;
}) {
  const bar = (width: string, key: number, color?: string) => (
    <div
      key={key}
      className="h-[3px] rounded-full"
      style={{ width, backgroundColor: color ?? "#cbd5e1" }}
    />
  );

  const body = (
    <div className="flex flex-col gap-[3px]">
      {["70%", "90%", "80%", "60%"].map((width, index) => bar(width, index))}
    </div>
  );

  return (
    <div
      className={`aspect-[3/4] overflow-hidden rounded border bg-white p-2 ${
        active ? "border-indigo-200" : "border-slate-200"
      }`}
    >
      {id === "modern" || id === "creative" ? (
        <div className={`flex h-full gap-1.5 ${id === "creative" ? "flex-row-reverse" : ""}`}>
          <div className="w-1/3 rounded-sm" style={{ backgroundColor: `${accent}22` }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: accent }} />
            {body}
          </div>
        </div>
      ) : id === "executive" ? (
        <div className="flex h-full flex-col gap-1.5">
          <div className="-mx-2 -mt-2 mb-1 h-6" style={{ backgroundColor: accent }} />
          {body}
        </div>
      ) : id === "minimal" ? (
        <div className="flex h-full gap-2">
          <div className="w-1/4 space-y-2">
            {[0, 1, 2].map((key) => bar("100%", key, `${accent}66`))}
          </div>
          <div className="flex-1 space-y-1.5">{body}</div>
        </div>
      ) : id === "technical" ? (
        <div className="flex h-full gap-1.5">
          <div className="w-[2px] rounded-full" style={{ backgroundColor: `${accent}66` }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accent }} />
            <div className="flex flex-wrap gap-[3px]">
              {[0, 1, 2, 3].map((key) => (
                <span
                  key={key}
                  className="h-[6px] w-[16px] rounded-sm"
                  style={{ backgroundColor: `${accent}33` }}
                />
              ))}
            </div>
            {body}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-1.5">
          <div
            className={`h-1.5 rounded-full ${id === "classic" ? "mx-auto w-2/3" : "w-2/3"}`}
            style={{ backgroundColor: accent }}
          />
          <div className="h-px w-full" style={{ backgroundColor: `${accent}44` }} />
          {body}
        </div>
      )}
    </div>
  );
}

export function StylePanel({ data, patch }: { data: ResumeData; patch: Patch }) {
  const { settings } = data;
  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    patch({ settings: { ...settings, [key]: value } });

  return (
    <div className="space-y-4">
      <Field label="Accent colour">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              onClick={() => set("accent", preset.value)}
              className={`h-7 w-7 rounded-full transition ${
                settings.accent === preset.value
                  ? "ring-2 ring-slate-900 ring-offset-2"
                  : "ring-1 ring-slate-200"
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
          <input
            type="color"
            value={settings.accent}
            onChange={(e) => set("accent", e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white"
            title="Custom colour"
          />
        </div>
      </Field>

      <Field label="Typeface">
        <div className="grid grid-cols-3 gap-2">
          {(["sans", "serif", "mono"] as const).map((family) => (
            <button
              key={family}
              type="button"
              onClick={() => set("fontFamily", family)}
              className={`rounded-lg border px-2 py-2 text-sm capitalize transition ${
                settings.fontFamily === family
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              } ${family === "serif" ? "font-serif" : family === "mono" ? "font-mono" : "font-sans"}`}
            >
              {family}
            </button>
          ))}
        </div>
      </Field>

      <Slider
        label="Text size"
        value={settings.fontScale}
        min={0.8}
        max={1.25}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => set("fontScale", v)}
      />
      <Slider
        label="Line spacing"
        value={settings.lineHeight}
        min={1.15}
        max={1.9}
        step={0.05}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set("lineHeight", v)}
      />
      <Slider
        label="Page margin"
        value={settings.pageMargin}
        min={24}
        max={80}
        step={2}
        format={(v) => `${v}px`}
        onChange={(v) => set("pageMargin", v)}
      />

      <div className="space-y-2 pt-1">
        <Toggle
          label="Uppercase section headings"
          checked={settings.uppercaseHeadings}
          onChange={(v) => set("uppercaseHeadings", v)}
        />
        <Toggle
          label="Show photo (Modern & Creative)"
          checked={settings.showPhoto}
          onChange={(v) => set("showPhoto", v)}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-slate-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
      />
      {label}
    </label>
  );
}

/** Reorder and hide sections without touching their content. */
export function SectionsPanel({ data, patch }: { data: ResumeData; patch: Patch }) {
  const hidden = new Set(data.hiddenSections);

  const swap = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= data.sectionOrder.length) return;
    const next = [...data.sectionOrder];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ sectionOrder: next });
  };

  return (
    <div className="space-y-1.5">
      {data.sectionOrder.map((id, index) => (
        <div
          key={id}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <label className="flex flex-1 items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={!hidden.has(id)}
              onChange={(e) =>
                patch({
                  hiddenSections: e.target.checked
                    ? data.hiddenSections.filter((entry) => entry !== id)
                    : [...data.hiddenSections, id],
                })
              }
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            <span className={hidden.has(id) ? "text-slate-400 line-through" : ""}>
              {SECTION_LABELS[id]}
            </span>
          </label>
          <button
            type="button"
            aria-label="Move up"
            onClick={() => swap(index, -1)}
            disabled={index === 0}
            className="h-6 w-6 rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-25"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            onClick={() => swap(index, 1)}
            disabled={index === data.sectionOrder.length - 1}
            className="h-6 w-6 rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-25"
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
}
