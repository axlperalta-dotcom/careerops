import { z } from "zod";
import { hasOffensiveLanguage, languageMessage } from "./content-policy";

export const areas = ["Software", "Sistemas", "Aeroespacial"] as const;
export const jobStatuses = [
  "Guardada",
  "En preparación",
  "Postulada",
  "Archivada",
] as const;
export const projectStatuses = [
  "Por empezar",
  "En progreso",
  "Completado",
] as const;
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio.")
    .max(max)
    .refine((value) => !hasOffensiveLanguage(value), languageMessage);
const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Usa un enlace completo que empiece con https:// o http://.");

export const jobInput = z.object({
  title: text(120),
  company: text(120),
  area: z.enum(areas),
  status: z.enum(jobStatuses),
  url: safeUrl,
  description: z
    .string()
    .trim()
    .max(30000)
    .refine((value) => !hasOffensiveLanguage(value), languageMessage),
  skills: z.array(text(80)).max(40),
});
export const projectInput = z.object({
  title: text(120),
  area: z.enum(areas),
  status: z.enum(projectStatuses),
  objective: text(3000),
  jobId: z.string().uuid().nullable(),
  url: safeUrl,
  skills: z.array(text(80)).max(40),
});
export const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("saveRequirement"),
    id: z.string().uuid().optional(),
    jobId: z.string().uuid(),
    title: text(250),
    projectId: z.string().uuid().nullable(),
  }),
  z.object({ type: z.literal("importRequirements"), jobId: z.string().uuid() }),
  z.object({ type: z.literal("deleteRequirement"), id: z.string().uuid() }),
  z.object({
    type: z.literal("addEvidence"),
    requirementId: z.string().uuid(),
    body: text(3000),
    url: safeUrl.refine((value) => !!value, "Añade un enlace a tu evidencia."),
  }),
  z.object({ type: z.literal("deleteEvidence"), id: z.string().uuid() }),
  z.object({
    type: z.literal("saveJob"),
    id: z.string().uuid().optional(),
    data: jobInput,
  }),
  z.object({ type: z.literal("deleteJob"), id: z.string().uuid() }),
  z.object({
    type: z.literal("saveProject"),
    id: z.string().uuid().optional(),
    data: projectInput,
  }),
  z.object({ type: z.literal("deleteProject"), id: z.string().uuid() }),
  z.object({
    type: z.literal("addTask"),
    projectId: z.string().uuid(),
    title: text(250),
  }),
  z.object({
    type: z.literal("toggleTask"),
    id: z.string().uuid(),
    done: z.boolean(),
  }),
  z.object({ type: z.literal("deleteTask"), id: z.string().uuid() }),
  z.object({
    type: z.literal("addNote"),
    projectId: z.string().uuid(),
    body: text(3000),
    url: safeUrl,
  }),
]);
export type Command = z.infer<typeof commandSchema>;
export type Job = z.infer<typeof jobInput> & { id: string; createdAt: string };
export type Project = z.infer<typeof projectInput> & {
  id: string;
  createdAt: string;
};
export type Task = {
  id: string;
  projectId: string;
  title: string;
  done: boolean;
};
export type Activity = {
  id: string;
  projectId: string | null;
  body: string;
  url: string;
  kind: "event" | "note";
  createdAt: string;
};
export type Workspace = {
  requirements: Requirement[];
  evidence: Evidence[];
  jobs: Job[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
};

export type Requirement = {
  id: string;
  jobId: string;
  title: string;
  projectId: string | null;
};
export type Evidence = {
  id: string;
  requirementId: string;
  body: string;
  url: string;
  createdAt: string;
};
export function requirementStatus(
  requirement: Requirement,
  evidence: Evidence[],
) {
  if (evidence.some((item) => item.requirementId === requirement.id))
    return "Con evidencia";
  return requirement.projectId ? "Proyecto vinculado" : "Sin proyecto";
}

export function projectProgress(tasks: Task[], projectId: string) {
  const relevant = tasks.filter((task) => task.projectId === projectId);
  const done = relevant.filter((task) => task.done).length;
  return {
    done,
    total: relevant.length,
    percent: relevant.length ? Math.round((done / relevant.length) * 100) : 0,
  };
}
