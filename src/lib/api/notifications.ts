"use client";

import type { PortalNotification } from "@/lib/portal";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const COLUMNS = "id,kind,title,body,link,read_at,created_at";

function toNotification(row: Record<string, unknown>): PortalNotification {
  return {
    id: row.id as string,
    kind: (row.kind as PortalNotification["kind"]) ?? "system",
    title: (row.title as string) ?? "",
    body: (row.body as string) ?? "",
    link: (row.link as string) ?? "",
    readAt: (row.read_at as string) ?? null,
    createdAt: (row.created_at as string) ?? "",
  };
}

export async function listNotifications(limit = 50): Promise<PortalNotification[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => toNotification(row as unknown as Record<string, unknown>));
}

/** Cheap enough to poll for the header badge — it fetches no rows. */
export async function countUnread(): Promise<number> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

export async function markRead(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markAllRead(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase.from("notifications").delete().eq("id", id);
}
