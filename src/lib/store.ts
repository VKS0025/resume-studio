"use client";

import {
  type ResumeData,
  type ResumeRecord,
  normalizeResume,
  sampleResume,
  uid,
} from "./resume";
import { getSupabaseBrowser } from "./supabase/client";

const LOCAL_KEY = "resume-maker:resumes:v1";

type StoredRow = {
  id: string;
  title: string;
  data: unknown;
  updated_at: string;
  created_at: string;
};

function toRecord(row: StoredRow): ResumeRecord {
  return {
    id: row.id,
    title: row.title || "Untitled resume",
    data: normalizeResume(row.data),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

/* ------------------------------------------------------------------ local */

function readLocal(): StoredRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: StoredRow[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    // Quota or private mode — the editor keeps working, it just will not persist.
  }
}

/* ----------------------------------------------------------------- public */

/** True when the signed-in Supabase session should own the data. */
async function cloudUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listResumes(): Promise<ResumeRecord[]> {
  const supabase = getSupabaseBrowser();
  const userId = await cloudUserId();

  if (supabase && userId) {
    const { data, error } = await supabase
      .from("resumes")
      .select("id,title,data,updated_at,created_at")
      .order("updated_at", { ascending: false });
    if (!error && data) return (data as StoredRow[]).map(toRecord);
  }

  return readLocal()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map(toRecord);
}

export async function getResume(id: string): Promise<ResumeRecord | null> {
  const supabase = getSupabaseBrowser();
  const userId = await cloudUserId();

  if (supabase && userId) {
    const { data, error } = await supabase
      .from("resumes")
      .select("id,title,data,updated_at,created_at")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return toRecord(data as StoredRow);
  }

  const local = readLocal().find((row) => row.id === id);
  return local ? toRecord(local) : null;
}

export async function createResume(
  title = "Untitled resume",
  data: ResumeData = sampleResume()
): Promise<ResumeRecord> {
  const supabase = getSupabaseBrowser();
  const userId = await cloudUserId();
  const now = new Date().toISOString();

  if (supabase && userId) {
    const { data: row, error } = await supabase
      .from("resumes")
      .insert({ title, data, user_id: userId })
      .select("id,title,data,updated_at,created_at")
      .single();
    if (!error && row) return toRecord(row as StoredRow);
  }

  const local: StoredRow = {
    id: uid("res"),
    title,
    data,
    updated_at: now,
    created_at: now,
  };
  writeLocal([local, ...readLocal()]);
  return toRecord(local);
}

export async function saveResume(
  id: string,
  title: string,
  data: ResumeData
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = await cloudUserId();
  const now = new Date().toISOString();

  if (supabase && userId) {
    const { error } = await supabase
      .from("resumes")
      .update({ title, data, updated_at: now })
      .eq("id", id);
    if (!error) return;
  }

  const rows = readLocal();
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) {
    rows[index] = { ...rows[index], title, data, updated_at: now };
  } else {
    rows.unshift({ id, title, data, updated_at: now, created_at: now });
  }
  writeLocal(rows);
}

export async function deleteResume(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = await cloudUserId();

  if (supabase && userId) {
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (!error) return;
  }

  writeLocal(readLocal().filter((row) => row.id !== id));
}

export async function duplicateResume(id: string): Promise<ResumeRecord | null> {
  const source = await getResume(id);
  if (!source) return null;
  return createResume(`${source.title} (copy)`, source.data);
}

/**
 * After a first sign-in, resumes made while signed out would otherwise be
 * stranded in localStorage. Push them into the account, then clear them.
 */
export async function migrateLocalToCloud(): Promise<number> {
  const supabase = getSupabaseBrowser();
  const userId = await cloudUserId();
  if (!supabase || !userId) return 0;

  const rows = readLocal();
  if (rows.length === 0) return 0;

  const { error } = await supabase.from("resumes").insert(
    rows.map((row) => ({
      title: row.title,
      data: row.data,
      user_id: userId,
    }))
  );
  if (error) return 0;

  writeLocal([]);
  return rows.length;
}
