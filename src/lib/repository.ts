import { eq, desc } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";
import type { Command, Workspace } from "./model";

export class RecordNotFound extends Error {}

export class Repository {
  constructor(private db: PgliteDatabase<typeof schema>) {}

  async snapshot(): Promise<Workspace> {
    return this.db.transaction(async (tx) => ({
      jobs: await tx
        .select()
        .from(schema.jobs)
        .orderBy(desc(schema.jobs.createdAt)),
      projects: await tx
        .select()
        .from(schema.projects)
        .orderBy(desc(schema.projects.createdAt)),
      tasks: await tx
        .select()
        .from(schema.tasks)
        .orderBy(schema.tasks.position),
      activities: await tx
        .select()
        .from(schema.activities)
        .orderBy(desc(schema.activities.createdAt)),
    }));
  }

  async execute(command: Command) {
    await this.db.transaction(async (tx) => {
      const stamp = () => new Date().toISOString();
      const event = (
        body: string,
        projectId: string | null = null,
        url = "",
        kind: "event" | "note" = "event",
      ) =>
        tx
          .insert(schema.activities)
          .values({
            id: crypto.randomUUID(),
            body,
            projectId,
            url,
            kind,
            createdAt: stamp(),
          });
      const requireProject = async (id: string) => {
        const [project] = await tx
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.id, id));
        if (!project)
          throw new RecordNotFound(
            "El proyecto ya no existe. Actualiza la página.",
          );
        return project;
      };
      switch (command.type) {
        case "saveJob": {
          if (command.id) {
            const updated = await tx
              .update(schema.jobs)
              .set(command.data)
              .where(eq(schema.jobs.id, command.id))
              .returning();
            if (!updated.length)
              throw new RecordNotFound("La vacante ya no existe.");
          } else
            await tx
              .insert(schema.jobs)
              .values({
                ...command.data,
                id: crypto.randomUUID(),
                createdAt: stamp(),
              });
          await event(
            `${command.id ? "Actualizaste" : "Guardaste"} la vacante «${command.data.title}».`,
          );
          break;
        }
        case "deleteJob": {
          const [deleted] = await tx
            .delete(schema.jobs)
            .where(eq(schema.jobs.id, command.id))
            .returning();
          if (!deleted) throw new RecordNotFound("La vacante ya no existe.");
          await event(
            `Eliminaste la vacante «${deleted.title}». Sus proyectos se conservaron.`,
          );
          break;
        }
        case "saveProject": {
          if (command.data.jobId) {
            const [job] = await tx
              .select()
              .from(schema.jobs)
              .where(eq(schema.jobs.id, command.data.jobId));
            if (!job)
              throw new RecordNotFound("La vacante vinculada ya no existe.");
          }
          const id = command.id ?? crypto.randomUUID();
          if (command.id) {
            await requireProject(id);
            await tx
              .update(schema.projects)
              .set(command.data)
              .where(eq(schema.projects.id, id));
          } else
            await tx
              .insert(schema.projects)
              .values({ ...command.data, id, createdAt: stamp() });
          await event(
            `${command.id ? "Actualizaste" : "Creaste"} el proyecto «${command.data.title}» · ${command.data.status}.`,
            id,
          );
          break;
        }
        case "deleteProject": {
          const project = await requireProject(command.id);
          await tx
            .delete(schema.projects)
            .where(eq(schema.projects.id, command.id));
          await event(`Eliminaste el proyecto «${project.title}».`);
          break;
        }
        case "addTask": {
          await requireProject(command.projectId);
          await tx
            .insert(schema.tasks)
            .values({
              id: crypto.randomUUID(),
              projectId: command.projectId,
              title: command.title,
              done: false,
            });
          break;
        }
        case "toggleTask": {
          const [task] = await tx
            .select()
            .from(schema.tasks)
            .where(eq(schema.tasks.id, command.id));
          if (!task) throw new RecordNotFound("La tarea ya no existe.");
          if (task.done !== command.done) {
            await tx
              .update(schema.tasks)
              .set({ done: command.done })
              .where(eq(schema.tasks.id, command.id));
            await event(
              `${command.done ? "Completaste" : "Reabriste"}: ${task.title}`,
              task.projectId,
            );
          }
          break;
        }
        case "deleteTask": {
          const removed = await tx
            .delete(schema.tasks)
            .where(eq(schema.tasks.id, command.id))
            .returning();
          if (!removed.length)
            throw new RecordNotFound("La tarea ya no existe.");
          break;
        }
        case "addNote": {
          await requireProject(command.projectId);
          await event(command.body, command.projectId, command.url, "note");
          break;
        }
      }
    });
  }

  async seed() {
    await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(schema.meta)
        .values({ key: "seed-v1" })
        .onConflictDoNothing()
        .returning();
      if (!inserted.length) return;
      const jobId = crypto.randomUUID(),
        projectId = crypto.randomUUID(),
        createdAt = new Date().toISOString();
      await tx.insert(schema.jobs).values({
        id: jobId,
        title: "Product Engineer",
        company: "Empresa por confirmar",
        area: "Software",
        status: "En preparación",
        url: "",
        description:
          "Vacante compartida para preparar el portafolio.\n\nResponsabilidades: arquitectura de extremo a extremo; funciones full-stack; agentes con sesiones persistentes y herramientas; búsqueda híbrida y reranking; evaluación de IA; CI/CD, observabilidad e infraestructura; integraciones MCP y aislamiento entre clientes.\n\nSolicita experiencia operando sistemas y productos usados por personas reales. También valora entornos restringidos, educación y desarrollo laboral.\n\nResumen manual del anuncio, no análisis automático. Empresa y enlace pendientes de confirmar.",
        skills: [
          "React",
          "Next.js",
          "TypeScript",
          "Node.js",
          "Python",
          "Postgres",
          "AWS",
          "LLM",
          "Evaluaciones",
          "Docker",
          "MCP",
        ],
        createdAt,
      });
      await tx
        .insert(schema.projects)
        .values({
          id: projectId,
          title: "CareerOps",
          area: "Software",
          status: "Por empezar",
          objective:
            "Organizar vacantes, convertir requisitos en proyectos y reunir evidencias para mi portafolio. Primera meta: probar el recorrido completo y registrar los problemas de uso.",
          jobId,
          url: "",
          skills: ["React", "Next.js", "TypeScript", "Node.js", "Postgres"],
          createdAt,
        });
      await tx
        .insert(schema.tasks)
        .values(
          [
            "Guardar una vacante y revisar sus requisitos",
            "Crear un proyecto vinculado a una vacante",
            "Registrar un avance con evidencia",
            "Probar la interfaz y documentar un problema",
          ].map((title) => ({
            id: crypto.randomUUID(),
            projectId,
            title,
            done: false,
          })),
        );
      await tx
        .insert(schema.activities)
        .values({
          id: crypto.randomUUID(),
          projectId,
          kind: "event",
          url: "",
          createdAt,
          body: "Punto de partida: vacante Product Engineer y plan de CareerOps. Las tareas están pendientes de tu revisión.",
        });
    });
  }
}
