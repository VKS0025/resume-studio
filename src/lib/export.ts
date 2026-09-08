"use client";

/**
 * Download pipeline for the resume canvas.
 *
 * Everything is rasterised in the browser from the same DOM node the user is
 * looking at, so what downloads is exactly what the preview shows. PNG and JPEG
 * are that raster; the PDF is that raster sliced onto A4 pages.
 */

export type ExportFormat = "png" | "jpeg" | "pdf";

/** A4 at 96dpi — the size the preview node is laid out at. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export function safeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-z0-9\-_ ]/gi, "")
    .replace(/\s+/g, "-");
  return cleaned || "resume";
}

/**
 * html-to-image inlines webfonts and background images asynchronously; if the
 * fonts are still loading the first paint comes out with fallback metrics. One
 * throwaway render warms that cache.
 */
async function renderDataUrl(
  node: HTMLElement,
  format: "png" | "jpeg",
  scale: number
): Promise<string> {
  const { toPng, toJpeg } = await import("html-to-image");

  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Font loading API is best-effort; carry on with whatever is available.
    }
  }

  const options = {
    pixelRatio: scale,
    // Page-break guides and other editor chrome live inside the paper node but
    // must never appear in a download.
    filter: (element: HTMLElement) =>
      !(element.dataset && element.dataset.exportIgnore !== undefined),
    cacheBust: true,
    backgroundColor: "#ffffff",
    width: node.offsetWidth,
    height: node.offsetHeight,
    quality: format === "jpeg" ? 0.95 : 1,
  };

  const render = format === "jpeg" ? toJpeg : toPng;

  // First pass primes the font/image cache, second pass is the one we keep.
  await render(node, { ...options, pixelRatio: 1 });
  return render(node, options);
}

function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the rendered resume."));
    img.src = src;
  });
}

export async function exportPng(node: HTMLElement, name: string, scale = 3) {
  const dataUrl = await renderDataUrl(node, "png", scale);
  triggerDownload(dataUrl, `${safeFileName(name)}.png`);
}

export async function exportJpeg(node: HTMLElement, name: string, scale = 3) {
  const dataUrl = await renderDataUrl(node, "jpeg", scale);
  triggerDownload(dataUrl, `${safeFileName(name)}.jpg`);
}

/**
 * Slices the rendered page image across as many A4 sheets as it needs, so a
 * three-page resume downloads as a three-page PDF rather than one long strip.
 */
export async function exportPdf(node: HTMLElement, name: string, scale = 3) {
  const { jsPDF } = await import("jspdf");
  const dataUrl = await renderDataUrl(node, "png", scale);
  const image = await loadImage(dataUrl);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Derive the page height from the sheet's own layout rather than from the
  // A4 mm ratio: rounding the ratio leaves a sub-pixel remainder that turns a
  // resume of exactly one page into a two-page PDF with a blank second sheet.
  const renderScale = image.width / node.offsetWidth;
  const pageHeightPx = Math.round(A4_HEIGHT_PX * renderScale);
  const pageCount = Math.max(
    1,
    // A stray pixel or two of rounding must not open a new page.
    Math.ceil((image.height - renderScale) / pageHeightPx)
  );

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  for (let page = 0; page < pageCount; page += 1) {
    const sourceY = page * pageHeightPx;
    const sliceHeight = Math.min(pageHeightPx, image.height - sourceY);

    canvas.width = image.width;
    canvas.height = pageHeightPx;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      0,
      sourceY,
      image.width,
      sliceHeight,
      0,
      0,
      image.width,
      sliceHeight
    );

    if (page > 0) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      A4_WIDTH_MM,
      A4_HEIGHT_MM,
      undefined,
      "FAST"
    );
  }

  pdf.save(`${safeFileName(name)}.pdf`);
}

export async function exportResume(
  node: HTMLElement,
  name: string,
  format: ExportFormat,
  scale = 3
) {
  if (format === "png") return exportPng(node, name, scale);
  if (format === "jpeg") return exportJpeg(node, name, scale);
  return exportPdf(node, name, scale);
}
