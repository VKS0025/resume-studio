"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResumeData } from "@/lib/resume";
import { normalizeResume, sampleResume } from "@/lib/resume";
import { A4_WIDTH_PX, exportResume, type ExportFormat } from "@/lib/export";
import { createResume, getResume, saveResume } from "@/lib/store";
import ResumePaper from "@/components/ResumePaper";
import { Accordion, Button } from "@/components/ui/controls";
import {
  AchievementsForm,
  BasicsForm,
  CertificationsForm,
  EducationForm,
  ExperienceForm,
  LanguagesForm,
  ProjectsForm,
  SkillsForm,
} from "./ContentForms";
import { SectionsPanel, StylePanel, TemplatePicker } from "./DesignPanel";

type SaveState = "idle" | "saving" | "saved" | "error";
type Tab = "content" | "design" | "sections";

export default function EditorShell({
  resumeId,
  initialTemplate,
}: {
  resumeId: string;
  initialTemplate?: ResumeData["settings"]["template"];
}) {
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("Untitled resume");
  const [data, setData] = useState<ResumeData | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [open, setOpen] = useState<Record<string, boolean>>({ basics: true, experience: true });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [zoom, setZoom] = useState(0.72);
  const [showGuides, setShowGuides] = useState(true);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paperHeight, setPaperHeight] = useState(1123);

  // "new" is a synthetic id: create the record on first load, then swap the URL
  // so a refresh lands on the real document.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (resumeId === "new") {
        const seed = sampleResume();
        if (initialTemplate) seed.settings.template = initialTemplate;
        const created = await createResume("Untitled resume", seed);
        if (cancelled) return;
        setTitle(created.title);
        setData(created.data);
        router.replace(`/editor/${created.id}`);
        return;
      }

      const found = await getResume(resumeId);
      if (cancelled) return;
      if (found) {
        setTitle(found.title);
        setData(normalizeResume(found.data));
      } else {
        setData(sampleResume());
        setError("That resume could not be found, so this is a fresh copy.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId, router, initialTemplate]);

  // Debounced autosave — typing should never block on the network. The
  // "saving" flag is raised by the edit handlers, not here, so this effect
  // only ever schedules the write.
  useEffect(() => {
    if (!data || resumeId === "new") return;
    const timer = setTimeout(async () => {
      try {
        await saveResume(resumeId, title, data);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [data, title, resumeId]);

  const patch = useCallback((partial: Partial<ResumeData>) => {
    setSaveState("saving");
    setData((current) => (current ? { ...current, ...partial } : current));
  }, []);

  /** Widest zoom that still leaves the sheet fully visible in the column. */
  const fitZoom = useCallback(() => {
    const available = canvasRef.current?.clientWidth;
    if (!available) return 0.72;
    return Math.min(1, Math.max(0.35, +((available - 56) / A4_WIDTH_PX).toFixed(2)));
  }, []);

  // Fit once the column actually exists — while the resume is still loading the
  // preview is not mounted, so measuring then would just return the fallback.
  const didFit = useRef(false);
  useEffect(() => {
    if (!data || didFit.current) return;
    didFit.current = true;
    setZoom(fitZoom());
  }, [data, fitZoom]);

  // A CSS transform does not reserve layout space, so the scroll area would
  // either clip a long resume or leave dead space under a short one. Track the
  // sheet's real height and size the wrapper to its scaled footprint.
  useEffect(() => {
    const node = paperRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setPaperHeight(node.offsetHeight));
    observer.observe(node);
    setPaperHeight(node.offsetHeight);
    return () => observer.disconnect();
  }, [data]);

  const counts = useMemo(
    () =>
      data
        ? {
            experience: data.experience.length,
            education: data.education.length,
            skills: data.skills.length,
            projects: data.projects.length,
            certifications: data.certifications.length,
            languages: data.languages.length,
            achievements: data.achievements.length,
          }
        : null,
    [data]
  );

  async function download(format: ExportFormat) {
    if (!paperRef.current) return;
    setBusy(format);
    setError(null);
    try {
      await exportResume(paperRef.current, title, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The download failed. Try again.");
    } finally {
      setBusy(null);
    }
  }

  if (!data || !counts) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Loading your resume…
      </div>
    );
  }

  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <Link
          href="/dashboard"
          className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          ← My resumes
        </Link>
        <input
          value={title}
          onChange={(e) => {
            setSaveState("saving");
            setTitle(e.target.value);
          }}
          aria-label="Resume name"
          className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "All changes saved"
              : saveState === "error"
                ? "Could not save"
                : ""}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="secondary" onClick={() => download("pdf")} disabled={busy !== null}>
            {busy === "pdf" ? "Preparing…" : "PDF"}
          </Button>
          <Button variant="secondary" onClick={() => download("png")} disabled={busy !== null}>
            {busy === "png" ? "Preparing…" : "PNG"}
          </Button>
          <Button variant="secondary" onClick={() => download("jpeg")} disabled={busy !== null}>
            {busy === "jpeg" ? "Preparing…" : "JPEG"}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {/* ------------------------------------------------------- editor */}
        <div className="flex w-[330px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:w-[400px] xl:w-[440px]">
          <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-3 py-2">
            {(
              [
                ["content", "Content"],
                ["design", "Design"],
                ["sections", "Sections"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === key
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="thin-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
            {tab === "content" ? (
              <>
                <Accordion title="Personal details" open={!!open.basics} onToggle={() => toggle("basics")}>
                  <BasicsForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Work experience"
                  count={counts.experience}
                  open={!!open.experience}
                  onToggle={() => toggle("experience")}
                >
                  <ExperienceForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Education"
                  count={counts.education}
                  open={!!open.education}
                  onToggle={() => toggle("education")}
                >
                  <EducationForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Skills"
                  count={counts.skills}
                  open={!!open.skills}
                  onToggle={() => toggle("skills")}
                >
                  <SkillsForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Projects"
                  count={counts.projects}
                  open={!!open.projects}
                  onToggle={() => toggle("projects")}
                >
                  <ProjectsForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Certifications"
                  count={counts.certifications}
                  open={!!open.certifications}
                  onToggle={() => toggle("certifications")}
                >
                  <CertificationsForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Achievements"
                  count={counts.achievements}
                  open={!!open.achievements}
                  onToggle={() => toggle("achievements")}
                >
                  <AchievementsForm data={data} patch={patch} />
                </Accordion>
                <Accordion
                  title="Languages"
                  count={counts.languages}
                  open={!!open.languages}
                  onToggle={() => toggle("languages")}
                >
                  <LanguagesForm data={data} patch={patch} />
                </Accordion>
              </>
            ) : null}

            {tab === "design" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Template
                  </h3>
                  <TemplatePicker data={data} patch={patch} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <StylePanel data={data} patch={patch} />
                </div>
              </div>
            ) : null}

            {tab === "sections" ? (
              <div className="space-y-2">
                <p className="px-1 text-xs text-slate-500">
                  Reorder sections or switch them off. Empty sections never print, whatever
                  their setting.
                </p>
                <SectionsPanel data={data} patch={patch} />
              </div>
            ) : null}
          </div>
        </div>

        {/* ------------------------------------------------------ preview */}
        <div ref={canvasRef} className="canvas-grid relative min-w-0 flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-2 backdrop-blur">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => setShowGuides(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600"
              />
              Show page breaks
            </label>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.08).toFixed(2)))}
                className="h-7 w-7 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
              >
                −
              </button>
              <span className="w-11 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.08).toFixed(2)))}
                className="h-7 w-7 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom(fitZoom())}
                className="ml-1 rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50"
              >
                Fit
              </button>
            </div>
          </div>

          {/* min-w-max keeps a sheet wider than the column reachable by
              scrolling instead of being centred off the left edge. */}
          <div className="flex min-w-max justify-center px-6 py-8">
            <div style={{ width: A4_WIDTH_PX * zoom, height: paperHeight * zoom }}>
              <div
                className="shadow-[0_10px_40px_rgba(15,23,42,0.14)]"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  width: A4_WIDTH_PX,
                }}
              >
                <ResumePaper ref={paperRef} data={data} showGuides={showGuides} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
