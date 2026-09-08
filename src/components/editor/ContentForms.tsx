"use client";

import type { ResumeData } from "@/lib/resume";
import { uid } from "@/lib/resume";
import { Button, EntryCard, Field, TextArea, TextInput } from "@/components/ui/controls";

export type Patch = (partial: Partial<ResumeData>) => void;

/** Move an item within a list without mutating the original array. */
function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function replace<T>(list: T[], index: number, value: T): T[] {
  const next = [...list];
  next[index] = value;
  return next;
}

/** Bullets are edited as one-per-line text — quicker than a list of inputs. */
const toLines = (bullets: string[]) => bullets.join("\n");
const fromLines = (value: string) => value.split("\n");

/* ---------------------------------------------------------------- basics */

export function BasicsForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const { basics } = data;
  const set = (key: keyof typeof basics, value: string) =>
    patch({ basics: { ...basics, [key]: value } });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name">
          <TextInput
            value={basics.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Aarav Sharma"
          />
        </Field>
        <Field label="Headline">
          <TextInput
            value={basics.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="Senior Frontend Engineer"
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={basics.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone">
          <TextInput
            value={basics.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="Location">
          <TextInput
            value={basics.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Bengaluru, India"
          />
        </Field>
        <Field label="Website">
          <TextInput
            value={basics.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="yoursite.dev"
          />
        </Field>
        <Field label="LinkedIn">
          <TextInput
            value={basics.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            placeholder="linkedin.com/in/you"
          />
        </Field>
        <Field label="GitHub">
          <TextInput
            value={basics.github}
            onChange={(e) => set("github", e.target.value)}
            placeholder="github.com/you"
          />
        </Field>
      </div>

      <Field
        label="Photo URL"
        hint="Only the Modern and Creative templates show a photo, and only when it is switched on in Design."
      >
        <TextInput
          value={basics.photoUrl}
          onChange={(e) => set("photoUrl", e.target.value)}
          placeholder="https://…/photo.jpg"
        />
      </Field>

      <Field label="Professional summary" hint="Two or three sentences. Lead with the result, not the job title.">
        <TextArea
          value={basics.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="Frontend engineer with 7 years…"
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------ experience */

export function ExperienceForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.experience;

  return (
    <div className="space-y-3">
      {list.map((job, index) => (
        <EntryCard
          key={job.id}
          title={job.role || job.company || `Role ${index + 1}`}
          onUp={index > 0 ? () => patch({ experience: move(list, index, -1) }) : undefined}
          onDown={
            index < list.length - 1
              ? () => patch({ experience: move(list, index, 1) })
              : undefined
          }
          onRemove={() => patch({ experience: list.filter((item) => item.id !== job.id) })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job title">
              <TextInput
                value={job.role}
                onChange={(e) =>
                  patch({ experience: replace(list, index, { ...job, role: e.target.value }) })
                }
              />
            </Field>
            <Field label="Company">
              <TextInput
                value={job.company}
                onChange={(e) =>
                  patch({ experience: replace(list, index, { ...job, company: e.target.value }) })
                }
              />
            </Field>
            <Field label="Location">
              <TextInput
                value={job.location}
                onChange={(e) =>
                  patch({ experience: replace(list, index, { ...job, location: e.target.value }) })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start">
                <TextInput
                  value={job.start}
                  placeholder="Mar 2022"
                  onChange={(e) =>
                    patch({ experience: replace(list, index, { ...job, start: e.target.value }) })
                  }
                />
              </Field>
              <Field label="End">
                <TextInput
                  value={job.end}
                  placeholder="Feb 2024"
                  disabled={job.current}
                  onChange={(e) =>
                    patch({ experience: replace(list, index, { ...job, end: e.target.value }) })
                  }
                />
              </Field>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={job.current}
              onChange={(e) =>
                patch({ experience: replace(list, index, { ...job, current: e.target.checked }) })
              }
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            I currently work here
          </label>

          <Field label="Highlights" hint="One achievement per line. Numbers beat adjectives.">
            <TextArea
              value={toLines(job.bullets)}
              onChange={(e) =>
                patch({
                  experience: replace(list, index, { ...job, bullets: fromLines(e.target.value) }),
                })
              }
            />
          </Field>
        </EntryCard>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          patch({
            experience: [
              ...list,
              {
                id: uid("exp"),
                role: "",
                company: "",
                location: "",
                start: "",
                end: "",
                current: false,
                bullets: [""],
              },
            ],
          })
        }
      >
        + Add role
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------- education */

export function EducationForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.education;

  return (
    <div className="space-y-3">
      {list.map((edu, index) => (
        <EntryCard
          key={edu.id}
          title={edu.school || `Education ${index + 1}`}
          onUp={index > 0 ? () => patch({ education: move(list, index, -1) }) : undefined}
          onDown={
            index < list.length - 1 ? () => patch({ education: move(list, index, 1) }) : undefined
          }
          onRemove={() => patch({ education: list.filter((item) => item.id !== edu.id) })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="School">
              <TextInput
                value={edu.school}
                onChange={(e) =>
                  patch({ education: replace(list, index, { ...edu, school: e.target.value }) })
                }
              />
            </Field>
            <Field label="Degree">
              <TextInput
                value={edu.degree}
                placeholder="B.Tech"
                onChange={(e) =>
                  patch({ education: replace(list, index, { ...edu, degree: e.target.value }) })
                }
              />
            </Field>
            <Field label="Field of study">
              <TextInput
                value={edu.field}
                placeholder="Computer Science"
                onChange={(e) =>
                  patch({ education: replace(list, index, { ...edu, field: e.target.value }) })
                }
              />
            </Field>
            <Field label="Score">
              <TextInput
                value={edu.score}
                placeholder="8.6 CGPA"
                onChange={(e) =>
                  patch({ education: replace(list, index, { ...edu, score: e.target.value }) })
                }
              />
            </Field>
            <Field label="Location">
              <TextInput
                value={edu.location}
                onChange={(e) =>
                  patch({ education: replace(list, index, { ...edu, location: e.target.value }) })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From">
                <TextInput
                  value={edu.start}
                  placeholder="2015"
                  onChange={(e) =>
                    patch({ education: replace(list, index, { ...edu, start: e.target.value }) })
                  }
                />
              </Field>
              <Field label="To">
                <TextInput
                  value={edu.end}
                  placeholder="2019"
                  onChange={(e) =>
                    patch({ education: replace(list, index, { ...edu, end: e.target.value }) })
                  }
                />
              </Field>
            </div>
          </div>
        </EntryCard>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          patch({
            education: [
              ...list,
              {
                id: uid("edu"),
                school: "",
                degree: "",
                field: "",
                location: "",
                start: "",
                end: "",
                score: "",
              },
            ],
          })
        }
      >
        + Add education
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- skills */

export function SkillsForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.skills;

  return (
    <div className="space-y-3">
      {list.map((group, index) => (
        <EntryCard
          key={group.id}
          title={group.category || `Group ${index + 1}`}
          onUp={index > 0 ? () => patch({ skills: move(list, index, -1) }) : undefined}
          onDown={index < list.length - 1 ? () => patch({ skills: move(list, index, 1) }) : undefined}
          onRemove={() => patch({ skills: list.filter((item) => item.id !== group.id) })}
        >
          <Field label="Category">
            <TextInput
              value={group.category}
              placeholder="Languages"
              onChange={(e) =>
                patch({ skills: replace(list, index, { ...group, category: e.target.value }) })
              }
            />
          </Field>
          <Field label="Skills" hint="Separate with commas.">
            <TextInput
              value={group.items.join(", ")}
              placeholder="TypeScript, React, SQL"
              onChange={(e) =>
                patch({
                  skills: replace(list, index, {
                    ...group,
                    items: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                  }),
                })
              }
            />
          </Field>
        </EntryCard>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          patch({ skills: [...list, { id: uid("sk"), category: "", items: [] }] })
        }
      >
        + Add skill group
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------- projects */

export function ProjectsForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.projects;

  return (
    <div className="space-y-3">
      {list.map((project, index) => (
        <EntryCard
          key={project.id}
          title={project.name || `Project ${index + 1}`}
          onUp={index > 0 ? () => patch({ projects: move(list, index, -1) }) : undefined}
          onDown={
            index < list.length - 1 ? () => patch({ projects: move(list, index, 1) }) : undefined
          }
          onRemove={() => patch({ projects: list.filter((item) => item.id !== project.id) })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <TextInput
                value={project.name}
                onChange={(e) =>
                  patch({ projects: replace(list, index, { ...project, name: e.target.value }) })
                }
              />
            </Field>
            <Field label="Link">
              <TextInput
                value={project.link}
                placeholder="github.com/you/project"
                onChange={(e) =>
                  patch({ projects: replace(list, index, { ...project, link: e.target.value }) })
                }
              />
            </Field>
          </div>
          <Field label="One-line description">
            <TextInput
              value={project.description}
              onChange={(e) =>
                patch({
                  projects: replace(list, index, { ...project, description: e.target.value }),
                })
              }
            />
          </Field>
          <Field label="Highlights" hint="One per line.">
            <TextArea
              value={toLines(project.bullets)}
              onChange={(e) =>
                patch({
                  projects: replace(list, index, {
                    ...project,
                    bullets: fromLines(e.target.value),
                  }),
                })
              }
            />
          </Field>
        </EntryCard>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          patch({
            projects: [
              ...list,
              { id: uid("pr"), name: "", link: "", description: "", bullets: [""] },
            ],
          })
        }
      >
        + Add project
      </Button>
    </div>
  );
}

/* --------------------------------------------- certifications / languages */

export function CertificationsForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.certifications;

  return (
    <div className="space-y-3">
      {list.map((cert, index) => (
        <EntryCard
          key={cert.id}
          title={cert.name || `Certification ${index + 1}`}
          onUp={index > 0 ? () => patch({ certifications: move(list, index, -1) }) : undefined}
          onDown={
            index < list.length - 1
              ? () => patch({ certifications: move(list, index, 1) })
              : undefined
          }
          onRemove={() =>
            patch({ certifications: list.filter((item) => item.id !== cert.id) })
          }
        >
          <Field label="Name">
            <TextInput
              value={cert.name}
              onChange={(e) =>
                patch({ certifications: replace(list, index, { ...cert, name: e.target.value }) })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issuer">
              <TextInput
                value={cert.issuer}
                onChange={(e) =>
                  patch({
                    certifications: replace(list, index, { ...cert, issuer: e.target.value }),
                  })
                }
              />
            </Field>
            <Field label="Year">
              <TextInput
                value={cert.date}
                onChange={(e) =>
                  patch({ certifications: replace(list, index, { ...cert, date: e.target.value }) })
                }
              />
            </Field>
          </div>
        </EntryCard>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          patch({
            certifications: [...list, { id: uid("cert"), name: "", issuer: "", date: "" }],
          })
        }
      >
        + Add certification
      </Button>
    </div>
  );
}

export function LanguagesForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.languages;

  return (
    <div className="space-y-3">
      {list.map((lang, index) => (
        <div key={lang.id} className="flex items-end gap-2">
          <Field label="Language">
            <TextInput
              value={lang.name}
              onChange={(e) =>
                patch({ languages: replace(list, index, { ...lang, name: e.target.value }) })
              }
            />
          </Field>
          <Field label="Level">
            <TextInput
              value={lang.level}
              placeholder="Fluent"
              onChange={(e) =>
                patch({ languages: replace(list, index, { ...lang, level: e.target.value }) })
              }
            />
          </Field>
          <Button
            variant="danger"
            className="mb-[1px] shrink-0"
            onClick={() => patch({ languages: list.filter((item) => item.id !== lang.id) })}
          >
            ✕
          </Button>
        </div>
      ))}

      <Button
        variant="secondary"
        onClick={() => patch({ languages: [...list, { id: uid("lang"), name: "", level: "" }] })}
      >
        + Add language
      </Button>
    </div>
  );
}

export function AchievementsForm({ data, patch }: { data: ResumeData; patch: Patch }) {
  const list = data.achievements;

  return (
    <div className="space-y-3">
      {list.map((item, index) => (
        <EntryCard
          key={item.id}
          title={item.title || `Achievement ${index + 1}`}
          onUp={index > 0 ? () => patch({ achievements: move(list, index, -1) }) : undefined}
          onDown={
            index < list.length - 1 ? () => patch({ achievements: move(list, index, 1) }) : undefined
          }
          onRemove={() => patch({ achievements: list.filter((entry) => entry.id !== item.id) })}
        >
          <Field label="Title">
            <TextInput
              value={item.title}
              onChange={(e) =>
                patch({ achievements: replace(list, index, { ...item, title: e.target.value }) })
              }
            />
          </Field>
          <Field label="Detail">
            <TextInput
              value={item.detail}
              onChange={(e) =>
                patch({ achievements: replace(list, index, { ...item, detail: e.target.value }) })
              }
            />
          </Field>
        </EntryCard>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          patch({ achievements: [...list, { id: uid("ach"), title: "", detail: "" }] })
        }
      >
        + Add achievement
      </Button>
    </div>
  );
}
