"use client";

import type { Profile } from "@/lib/portal";
import type { ResumeData } from "@/lib/resume";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const COLUMNS =
  "id,role,full_name,headline,location,about,skills,links,avatar_url,is_public";

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    role: (row.role as Profile["role"]) ?? "student",
    fullName: (row.full_name as string) ?? "",
    headline: (row.headline as string) ?? "",
    location: (row.location as string) ?? "",
    about: (row.about as string) ?? "",
    skills: (row.skills as string[]) ?? [],
    links: (row.links as Record<string, string>) ?? {},
    avatarUrl: (row.avatar_url as string) ?? "",
    isPublic: Boolean(row.is_public),
  };
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (data) return toProfile(data as unknown as Record<string, unknown>);

  // The signup trigger normally creates this row; accounts made before the
  // trigger existed still need one.
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select(COLUMNS)
    .single();
  return created ? toProfile(created as unknown as Record<string, unknown>) : null;
}

export async function saveProfile(patch: Partial<Profile>): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id;
  if (!userId) return false;

  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.headline !== undefined) row.headline = patch.headline;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.about !== undefined) row.about = patch.about;
  if (patch.skills !== undefined) row.skills = patch.skills;
  if (patch.links !== undefined) row.links = patch.links;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  if (Object.keys(row).length === 0) return true;

  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  return !error;
}

/**
 * Students have already typed all of this into Resume Studio; asking them to
 * type it again into a profile is the fastest way to get an empty profile.
 */
export function profileFromResume(resume: ResumeData): Partial<Profile> {
  const { basics } = resume;
  const links: Record<string, string> = {};
  if (basics.website) links.website = basics.website;
  if (basics.linkedin) links.linkedin = basics.linkedin;
  if (basics.github) links.github = basics.github;

  return {
    fullName: basics.fullName,
    headline: basics.headline,
    location: basics.location,
    about: basics.summary,
    skills: resume.skills.flatMap((group) => group.items).slice(0, 40),
    links,
    avatarUrl: basics.photoUrl,
  };
}
