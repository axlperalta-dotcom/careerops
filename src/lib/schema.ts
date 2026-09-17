import {
  pgTable,
  text,
  uuid,
  boolean,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";
import type { Job, Project } from "./model";

export const jobs = pgTable("jobs", {
  id: uuid().primaryKey(),
  title: text().notNull(),
  company: text().notNull(),
  area: text().$type<Job["area"]>().notNull(),
  status: text().$type<Job["status"]>().notNull(),
  url: text().notNull(),
  description: text().notNull(),
  skills: jsonb().$type<string[]>().notNull(),
  createdAt: text("created_at").notNull(),
});
export const projects = pgTable("projects", {
  id: uuid().primaryKey(),
  title: text().notNull(),
  area: text().$type<Project["area"]>().notNull(),
  status: text().$type<Project["status"]>().notNull(),
  objective: text().notNull(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  url: text().notNull(),
  skills: jsonb().$type<string[]>().notNull(),
  createdAt: text("created_at").notNull(),
});
export const tasks = pgTable("tasks", {
  position: serial().notNull(),
  id: uuid().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text().notNull(),
  done: boolean().notNull().default(false),
});
export const activities = pgTable("activities", {
  id: uuid().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  body: text().notNull(),
  url: text().notNull().default(""),
  kind: text().$type<"event" | "note">().notNull(),
  createdAt: text("created_at").notNull(),
});
export const meta = pgTable("app_meta", { key: text().primaryKey() });

export const requirements = pgTable("requirements", {
  id: uuid().primaryKey(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  title: text().notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  position: serial().notNull(),
});
export const evidence = pgTable("evidence", {
  id: uuid().primaryKey(),
  requirementId: uuid("requirement_id")
    .notNull()
    .references(() => requirements.id, { onDelete: "cascade" }),
  body: text().notNull(),
  url: text().notNull(),
  createdAt: text("created_at").notNull(),
});
