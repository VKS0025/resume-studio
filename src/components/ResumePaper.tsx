"use client";

import { forwardRef } from "react";
import type { ResumeData } from "@/lib/resume";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "@/lib/export";
import { getTemplate } from "./templates";

const FONT_STACKS: Record<ResumeData["settings"]["fontFamily"], string> = {
  sans: "var(--font-resume-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "var(--font-resume-serif), Georgia, 'Times New Roman', serif",
  mono: "var(--font-resume-mono), ui-monospace, 'SFMono-Regular', monospace",
};

/**
 * The A4 sheet, at exactly the pixel size the exporter rasterises.
 *
 * It is laid out at 794 x 1123 (A4 at 96dpi) and scaled with a CSS transform
 * for display, so zooming never changes what a download looks like.
 */
const ResumePaper = forwardRef<HTMLDivElement, { data: ResumeData; showGuides?: boolean }>(
  function ResumePaper({ data, showGuides = false }, ref) {
    const { settings } = data;
    const { Component } = getTemplate(settings.template);

    return (
      <div
        ref={ref}
        className="relative bg-white text-neutral-900"
        style={{
          width: A4_WIDTH_PX,
          minHeight: A4_HEIGHT_PX,
          padding: settings.pageMargin,
          fontFamily: FONT_STACKS[settings.fontFamily],
          fontSize: 13 * settings.fontScale,
          lineHeight: settings.lineHeight,
          // Executive bleeds its masthead to the sheet edge.
          ["--page-pad" as string]: `${settings.pageMargin}px`,
        }}
      >
        <Component data={data} />
        {showGuides ? <PageGuides /> : null}
      </div>
    );
  }
);

/** Dashed markers at each A4 boundary so overflow is obvious while editing. */
function PageGuides() {
  return (
    <div
      data-export-ignore
      className="pointer-events-none absolute inset-0 select-none"
      aria-hidden
    >
      {[1, 2, 3, 4].map((page) => (
        <div
          key={page}
          className="absolute left-0 right-0 border-t border-dashed border-rose-400/70"
          style={{ top: page * A4_HEIGHT_PX }}
        >
          <span className="absolute -top-[9px] right-1 bg-white px-1 text-[10px] font-medium text-rose-500">
            page {page + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ResumePaper;
