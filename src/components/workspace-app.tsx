"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  FolderKanban,
  Link2,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Rocket,
  Layers3,
} from "lucide-react";
import {
  areas,
  jobStatuses,
  projectStatuses,
  projectProgress,
  commandSchema,
  type Activity,
  type Command,
  type Job,
  type Project,
  type Workspace,
} from "@/lib/model";

import { RequirementsPanel } from "./requirements-panel";

type View = "jobs" | "projects" | "log";
type Modal =
  | { type: "jobForm"; job?: Job }
  | { type: "projectForm"; project?: Project; jobId?: string }
  | { type: "job"; id: string }
  | { type: "project"; id: string }
  | { type: "delete"; entity: "job" | "project"; id: string; title: string };
const nav = [
  { id: "jobs", label: "Vacantes", icon: BriefcaseBusiness },
  { id: "projects", label: "Proyectos", icon: FolderKanban },
  { id: "log", label: "Bitácora", icon: BookOpen },
] as const;
const viewTitles: Record<View, string> = {
  jobs: "Mis vacantes",
  projects: "Mis proyectos",
  log: "Bitácora",
};
const viewSubtitles: Record<View, string> = {
  jobs: "Guarda una vacante, revisa sus requisitos y crea un proyecto para practicarlos.",
  projects: "Construye, prueba y reúne evidencia de lo que vas aprendiendo.",
  log: "Tus decisiones, pruebas y aprendizajes, en un solo lugar.",
};
const areaIcon = { Software: Code2, Sistemas: Layers3, Aeroespacial: Rocket };
const date = (value: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
const skillsFrom = (value: FormDataEntryValue | null) => [
  ...new Set(
    String(value || "")
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean),
  ),
];
const str = (data: FormData, key: string) => String(data.get(key) || "");

function Badge({ value }: { value: string }) {
  const color = ["Completado", "Postulada"].includes(value)
    ? "green"
    : ["En progreso", "En preparación"].includes(value)
      ? "blue"
      : value === "Guardada"
        ? "amber"
        : value === "Archivada"
          ? "orange"
          : "neutral";
  return (
    <span className={`badge ${color}`}>
      <span />
      {value}
    </span>
  );
}
function Tags({ values, limit = 5 }: { values: string[]; limit?: number }) {
  return (
    <div className="tags">
      {values.slice(0, limit).map((value) => (
        <span key={value}>{value}</span>
      ))}
      {values.length > limit && <span>+{values.length - limit}</span>}
    </div>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <FolderKanban size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export default function WorkspaceApp() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [view, setView] = useState<View>("jobs");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setWorkspace(body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tu espacio.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (modal && dialog.current && !dialog.current.open)
      dialog.current.showModal();
    else if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  function navigate(next: View) {
    setView(next);
    setQuery("");
    setArea("Todas");
    setStatus("Todos");
  }
  function open(next: Modal) {
    setError("");
    setModal(next);
  }
  async function mutate(command: Command, message: string) {
    if (busy) return false;
    const parsed = commandSchema.safeParse(command);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Revisa los campos.");
      return false;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo guardar.");
      setWorkspace(body);
      setNotice(message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const matches = (values: string[]) =>
    values
      .join(" ")
      .toLocaleLowerCase("es")
      .includes(query.toLocaleLowerCase("es"));
  const jobs =
    workspace?.jobs.filter(
      (j) =>
        (area === "Todas" || j.area === area) &&
        (status === "Todos" || view !== "jobs" || j.status === status) &&
        matches([j.title, j.company, ...j.skills]),
    ) ?? [];
  const projects =
    workspace?.projects.filter(
      (p) =>
        (area === "Todas" || p.area === area) &&
        (status === "Todos" || view !== "projects" || p.status === status) &&
        matches([p.title, p.objective, ...p.skills]),
    ) ?? [];
  const activities =
    workspace?.activities.filter((a) => matches([a.body])) ?? [];

  function ProjectCard({ project }: { project: Project }) {
    const progress = projectProgress(workspace!.tasks, project.id);
    const Icon = areaIcon[project.area];
    const job = workspace!.jobs.find((j) => j.id === project.jobId);
    return (
      <button
        className="project-card"
        onClick={() => open({ type: "project", id: project.id })}
      >
        <div className="card-top">
          <span
            className={`app-icon ${project.area === "Aeroespacial" ? "orange" : ""}`}
          >
            <Icon size={23} />
          </span>
          <Badge value={project.status} />
        </div>
        <h3>
          {project.title}
          <ArrowUpRight size={19} />
        </h3>
        <p className="clamp">{project.objective}</p>
        <Tags values={project.skills} limit={4} />
        <div className="project-progress">
          <span>Lista de tareas</span>
          <strong>
            {progress.done}/{progress.total}
          </strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="project-footer">
          <Link2 size={14} />
          <span>{job?.title || "Proyecto independiente"}</span>
          <span className="percent">{progress.percent}%</span>
        </div>
      </button>
    );
  }
  function JobRow({ job }: { job: Job }) {
    const linked = workspace!.projects.filter(
      (p) =>
        p.jobId === job.id ||
        workspace!.requirements.some(
          (r) => r.jobId === job.id && r.projectId === p.id,
        ),
    ).length;
    return (
      <button
        className="job-row"
        onClick={() => open({ type: "job", id: job.id })}
      >
        <span className="company-icon">
          <BriefcaseBusiness size={22} />
        </span>
        <span className="job-name">
          <strong>{job.title}</strong>
          <small>
            {job.company} <span>·</span> {job.area}
          </small>
        </span>
        <span className="job-row-tags">
          <Tags values={job.skills} limit={2} />
        </span>
        <Badge value={job.status} />
        <span className="linked-count">
          {linked} {linked === 1 ? "proyecto" : "proyectos"}
        </span>
        <ChevronRight size={18} />
      </button>
    );
  }
  function ActivityRow({ activity }: { activity: Activity }) {
    const project = workspace!.projects.find(
      (p) => p.id === activity.projectId,
    );
    return (
      <div className="activity-row">
        <span
          className={`activity-icon ${activity.kind === "note" ? "note" : ""}`}
        >
          {activity.kind === "note" ? (
            <MessageSquareText size={16} />
          ) : (
            <Check size={16} />
          )}
        </span>
        <div>
          <p>{activity.body}</p>
          <small>
            {date(activity.createdAt)}
            {project ? ` · ${project.title}` : ""}
          </small>
          {activity.url && (
            <a
              className="evidence-link"
              href={activity.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir evidencia <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    );
  }

  function renderModal() {
    if (!modal || !workspace) return null;
    if (modal.type === "jobForm") {
      const job = modal.job;
      async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const ok = await mutate(
          {
            type: "saveJob",
            id: job?.id,
            data: {
              title: str(data, "title"),
              company: str(data, "company"),
              area: str(data, "area") as Job["area"],
              status: str(data, "status") as Job["status"],
              url: str(data, "url"),
              description: str(data, "description"),
              skills: skillsFrom(data.get("skills")),
            },
          },
          "Vacante guardada",
        );
        if (ok) setModal(null);
      }
      return (
        <>
          <span className="eyebrow">OPORTUNIDADES</span>
          <h2>{job ? "Editar vacante" : "Nueva vacante"}</h2>
          <p className="muted">
            Guarda lo importante del anuncio. Puedes completar los detalles
            después.
          </p>
          <form onSubmit={submit} className="form" key={job?.id || "newJob"}>
            <div className="form-grid">
              <label>
                Puesto
                <input
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={job?.title}
                  placeholder="Ej. Product Engineer"
                  autoFocus
                />
              </label>
              <label>
                Empresa
                <input
                  name="company"
                  required
                  maxLength={120}
                  defaultValue={job?.company}
                  placeholder="Nombre o empresa por confirmar"
                />
              </label>
              <label>
                Área
                <select name="area" defaultValue={job?.area || "Software"}>
                  {areas.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select name="status" defaultValue={job?.status || "Guardada"}>
                  {jobStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Enlace del anuncio <small>opcional</small>
              <input
                name="url"
                type="url"
                maxLength={2048}
                defaultValue={job?.url}
                placeholder="https://…"
              />
            </label>
            <label>
              Habilidades <small>separadas por comas</small>
              <input
                name="skills"
                maxLength={3200}
                defaultValue={job?.skills.join(", ")}
                placeholder="React, Python, Postgres"
              />
            </label>
            <label>
              Descripción y requisitos
              <textarea
                name="description"
                rows={6}
                maxLength={30000}
                defaultValue={job?.description}
                placeholder="Pega el anuncio o escribe los requisitos que quieres trabajar."
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button disabled={busy} className="button primary">
                {busy ? "Guardando…" : "Guardar vacante"}
              </button>
            </div>
          </form>
        </>
      );
    }
    if (modal.type === "projectForm") {
      const project = modal.project;
      const linkedJob = workspace.jobs.find(
        (j) => j.id === (project?.jobId || modal.jobId),
      );
      async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const ok = await mutate(
          {
            type: "saveProject",
            id: project?.id,
            data: {
              title: str(data, "title"),
              area: str(data, "area") as Project["area"],
              status: str(data, "status") as Project["status"],
              objective: str(data, "objective"),
              jobId: str(data, "jobId") || null,
              url: str(data, "url"),
              skills: skillsFrom(data.get("skills")),
            },
          },
          "Proyecto guardado",
        );
        if (ok) setModal(project ? { type: "project", id: project.id } : null);
      }
      return (
        <>
          <span className="eyebrow">PORTAFOLIO</span>
          <h2>{project ? "Editar proyecto" : "Nuevo proyecto"}</h2>
          <p className="muted">
            Define un resultado pequeño que puedas construir y demostrar.
          </p>
          <form
            onSubmit={submit}
            className="form"
            key={project?.id || "newProject"}
          >
            <label>
              Nombre del proyecto
              <input
                name="title"
                required
                maxLength={120}
                defaultValue={project?.title}
                placeholder="¿Qué vas a construir?"
                autoFocus
              />
            </label>
            <label>
              Objetivo
              <textarea
                name="objective"
                required
                rows={3}
                maxLength={3000}
                defaultValue={project?.objective}
                placeholder="Qué problema resuelve y cómo comprobarás que funciona."
              />
            </label>
            <div className="form-grid">
              <label>
                Área
                <select
                  name="area"
                  defaultValue={project?.area || linkedJob?.area || "Software"}
                >
                  {areas.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  name="status"
                  defaultValue={project?.status || "Por empezar"}
                >
                  {projectStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Vacante vinculada
              <select
                name="jobId"
                defaultValue={project?.jobId || modal.jobId || ""}
              >
                <option value="">Proyecto independiente</option>
                {workspace.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} · {j.company}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Habilidades que practicarás <small>separadas por comas</small>
              <input
                name="skills"
                maxLength={3200}
                defaultValue={(project?.skills || linkedJob?.skills || []).join(
                  ", ",
                )}
                placeholder="React, pruebas, diseño de interfaz"
              />
            </label>
            <label>
              Repositorio o demostración <small>opcional</small>
              <input
                type="url"
                name="url"
                maxLength={2048}
                defaultValue={project?.url}
                placeholder="https://github.com/…"
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button disabled={busy} className="button primary">
                {busy ? "Guardando…" : "Guardar proyecto"}
              </button>
            </div>
          </form>
        </>
      );
    }
    if (modal.type === "job") {
      const job = workspace.jobs.find((j) => j.id === modal.id);
      if (!job) return null;
      const linked = workspace.projects.filter(
        (p) =>
          p.jobId === job.id ||
          workspace.requirements.some(
            (r) => r.jobId === job.id && r.projectId === p.id,
          ),
      );
      return (
        <>
          <span className="eyebrow">{job.area} / VACANTE</span>
          <h2>{job.title}</h2>
          <p className="muted">{job.company}</p>
          <div className="detail-actions">
            <Badge value={job.status} />
            <button
              className="button small secondary"
              onClick={() => open({ type: "jobForm", job })}
            >
              <Pencil size={14} />
              Editar
            </button>
            {job.url && (
              <a
                className="text-link"
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver anuncio <ExternalLink size={14} />
              </a>
            )}
          </div>
          <h3 className="detail-heading">Habilidades del anuncio</h3>
          {job.skills.length ? (
            <Tags values={job.skills} limit={40} />
          ) : (
            <p className="muted">Aún no agregas habilidades.</p>
          )}
          <RequirementsPanel
            key={job.id}
            job={job}
            workspace={workspace}
            busy={busy}
            mutate={mutate}
            openProject={(id) => open({ type: "project", id })}
          />
          <h3 className="detail-heading">Descripción y requisitos</h3>
          <p className="description">
            {job.description ||
              "Sin descripción. Puedes agregarla al editar la vacante."}
          </p>
          <div className="section-heading detail-heading">
            <h3>
              Proyectos vinculados <span>{linked.length}</span>
            </h3>
            <button
              className="text-link"
              onClick={() => open({ type: "projectForm", jobId: job.id })}
            >
              <Plus size={15} />
              Crear proyecto
            </button>
          </div>
          {linked.length ? (
            linked.map((p) => (
              <button
                className="linked-project"
                key={p.id}
                onClick={() => open({ type: "project", id: p.id })}
              >
                <FolderKanban size={18} />
                <strong>{p.title}</strong>
                <Badge value={p.status} />
                <ChevronRight size={18} />
              </button>
            ))
          ) : (
            <p className="muted">
              Convierte un requisito de esta vacante en tu próximo proyecto.
            </p>
          )}
          <div className="danger-zone">
            <button
              className="text-link danger"
              onClick={() =>
                open({
                  type: "delete",
                  entity: "job",
                  id: job.id,
                  title: job.title,
                })
              }
            >
              <Trash2 size={14} />
              Eliminar vacante
            </button>
          </div>
        </>
      );
    }
    if (modal.type === "project") {
      const project = workspace.projects.find((p) => p.id === modal.id);
      if (!project) return null;
      const progress = projectProgress(workspace.tasks, project.id);
      const tasks = workspace.tasks.filter((t) => t.projectId === project.id);
      const notes = workspace.activities.filter(
        (a) => a.projectId === project.id && a.kind === "note",
      );
      const job = workspace.jobs.find((j) => j.id === project.jobId);
      return (
        <>
          <span className="eyebrow">{project.area} / PROYECTO</span>
          <h2>{project.title}</h2>
          <p className="description">{project.objective}</p>
          <div className="detail-actions">
            <Badge value={project.status} />
            <button
              className="button small secondary"
              onClick={() => open({ type: "projectForm", project })}
            >
              <Pencil size={14} />
              Editar
            </button>
            {project.url && (
              <a
                className="text-link"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Repositorio / demo <ExternalLink size={14} />
              </a>
            )}
          </div>
          {job && (
            <button
              className="linked-vacancy"
              onClick={() => open({ type: "job", id: job.id })}
            >
              <Link2 size={15} />
              {job.title}
              <ArrowUpRight size={15} />
            </button>
          )}
          <Tags values={project.skills} limit={40} />
          <div className="section-heading detail-heading">
            <h3>Lista de tareas</h3>
            <span className="muted">
              {progress.done} de {progress.total} · {progress.percent}%
            </span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="tasks">
            {tasks.map((task) => (
              <div className={`task ${task.done ? "done" : ""}`} key={task.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={busy}
                    onChange={(event) =>
                      void mutate(
                        {
                          type: "toggleTask",
                          id: task.id,
                          done: event.target.checked,
                        },
                        event.target.checked
                          ? "Tarea completada"
                          : "Tarea reabierta",
                      )
                    }
                  />
                  <span>{task.title}</span>
                </label>
                <button
                  className="icon-button"
                  aria-label={`Eliminar tarea: ${task.title}`}
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      { type: "deleteTask", id: task.id },
                      "Tarea eliminada",
                    )
                  }
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <form
            className="inline-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              if (
                await mutate(
                  {
                    type: "addTask",
                    projectId: project.id,
                    title: str(data, "task"),
                  },
                  "Tarea agregada",
                )
              )
                form.reset();
            }}
          >
            <input
              aria-label="Nueva tarea"
              name="task"
              required
              maxLength={250}
              placeholder="Añade un siguiente paso concreto…"
            />
            <button className="button secondary" disabled={busy}>
              <Plus size={17} />
              Añadir
            </button>
          </form>
          <h3 className="detail-heading">Avances y evidencias</h3>
          <p className="muted">
            Registra lo que probaste, un problema o algo que aprendiste.
          </p>
          <form
            className="form note-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              if (
                await mutate(
                  {
                    type: "addNote",
                    projectId: project.id,
                    body: str(data, "body"),
                    url: str(data, "url"),
                  },
                  "Avance registrado",
                )
              )
                form.reset();
            }}
          >
            <label className="sr-only" htmlFor="note-body">
              Descripción del avance
            </label>
            <textarea
              id="note-body"
              name="body"
              required
              rows={3}
              maxLength={3000}
              placeholder="Ej. Probé guardar una vacante. El formulario…"
            />
            <label className="sr-only" htmlFor="note-url">
              Enlace de evidencia
            </label>
            <input
              id="note-url"
              name="url"
              type="url"
              maxLength={2048}
              placeholder="Enlace de evidencia (opcional)"
            />
            <button className="button primary" disabled={busy}>
              <Plus size={16} />
              Registrar avance
            </button>
          </form>
          <div>
            {notes.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </div>
          <div className="danger-zone">
            <button
              className="text-link danger"
              onClick={() =>
                open({
                  type: "delete",
                  entity: "project",
                  id: project.id,
                  title: project.title,
                })
              }
            >
              <Trash2 size={14} />
              Eliminar proyecto
            </button>
          </div>
        </>
      );
    }
    if (modal.type === "delete")
      return (
        <>
          <span className="eyebrow">ELIMINAR</span>
          <h2>¿Eliminar «{modal.title}»?</h2>
          <p className="description">
            {modal.entity === "job"
              ? "Se eliminarán la vacante, sus requisitos y sus evidencias. Los proyectos y la bitácora se conservarán."
              : "Se eliminarán el proyecto y sus tareas. Los requisitos quedarán sin este proyecto, pero conservarán sus evidencias. Sus avances permanecerán en la bitácora."}{" "}
            Esta acción no se puede deshacer.
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="button destructive"
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(
                    {
                      type:
                        modal.entity === "job" ? "deleteJob" : "deleteProject",
                      id: modal.id,
                    },
                    "Registro eliminado",
                  )
                )
                  setModal(null);
              }}
            >
              Eliminar {modal.entity === "job" ? "vacante" : "proyecto"}
            </button>
          </div>
        </>
      );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="CareerOps, inicio">
          <span className="brand-mark">
            <ArrowUpRight size={27} />
          </span>
          Career<span>Ops</span>
          <span className="brand-dot" />
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">AP</span>
          <div>
            <strong>Mi portafolio</strong>
            <small>Espacio personal</small>
          </div>
          <span className="version">01</span>
        </div>
        <span className="nav-caption">MI ESPACIO</span>
        <nav aria-label="Navegación principal">
          {nav.map((item) => (
            <button
              key={item.id}
              aria-label={item.label}
              title={item.label}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === "jobs" && workspace && (
                <span className="nav-count">{workspace.jobs.length}</span>
              )}
              {item.id === "projects" && workspace && (
                <span className="nav-count">{workspace.projects.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-star">
            <Sparkles size={20} />
          </span>
          <strong>Un paso a la vez.</strong>
          <p>Un proyecto pequeño también puede demostrar una gran habilidad.</p>
          <button
            onClick={() => {
              navigate("projects");
              open({ type: "projectForm" });
            }}
          >
            Crear un proyecto <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={17} />
          <div>
            <strong>Solo en tu computadora</strong>
            <small>Guardado local · v0.1</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Mi espacio <ChevronRight size={14} />
            <strong>{nav.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-pill">
              <span />
              Uso personal
            </span>
            <span className="user-avatar" aria-label="Espacio personal de AP">
              AP
            </span>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">TU PORTAFOLIO, EN CONSTRUCCIÓN</div>
              <h1>{viewTitles[view]}</h1>
              <p>{viewSubtitles[view]}</p>
            </div>
            {view !== "log" && (
              <button
                className="button primary"
                disabled={!workspace}
                onClick={() =>
                  open(
                    view === "projects"
                      ? { type: "projectForm" }
                      : { type: "jobForm" },
                  )
                }
              >
                <Plus size={18} />
                {view === "projects" ? "Nuevo proyecto" : "Nueva vacante"}
              </button>
            )}
          </div>
          {error && !modal && (
            <div role="alert" className="error-banner">
              {error}
              <button onClick={() => void load()}>Reintentar</button>
            </div>
          )}
          {!workspace ? (
            <div className="loading">
              <LoaderCircle className="spin" size={25} />
              <p>Abriendo tu espacio…</p>
            </div>
          ) : (
            <>
              <>
                <div className="toolbar">
                  <div className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Buscar"
                      placeholder={
                        view === "log"
                          ? "Buscar en tus avances…"
                          : "Buscar por nombre o habilidad…"
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Limpiar búsqueda"
                        onClick={() => setQuery("")}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {view !== "log" && (
                    <>
                      <select
                        aria-label="Filtrar por área"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      >
                        <option value="Todas">Todas las áreas</option>
                        {areas.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Filtrar por estado"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="Todos">Todos los estados</option>
                        {(view === "jobs" ? jobStatuses : projectStatuses).map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </>
                  )}
                </div>
                {view === "jobs" && (
                  <>
                    <div className="result-count">
                      {jobs.length} {jobs.length === 1 ? "vacante" : "vacantes"}
                    </div>
                    <div className="job-list">
                      {jobs.map((j) => (
                        <JobRow key={j.id} job={j} />
                      ))}
                      {!jobs.length && (
                        <Empty
                          title={
                            workspace.jobs.length
                              ? "No hay coincidencias"
                              : "Empieza por una oportunidad"
                          }
                          text={
                            workspace.jobs.length
                              ? "Prueba otro nombre, área o estado."
                              : "Agrega una vacante que te gustaría preparar."
                          }
                        />
                      )}
                    </div>
                  </>
                )}
                {view === "projects" && (
                  <>
                    <div className="result-count">
                      {projects.length}{" "}
                      {projects.length === 1 ? "proyecto" : "proyectos"}
                    </div>
                    <div className="project-grid full-grid">
                      {projects.map((p) => (
                        <ProjectCard key={p.id} project={p} />
                      ))}
                    </div>
                    {!projects.length && (
                      <Empty
                        title={
                          workspace.projects.length
                            ? "No hay coincidencias"
                            : "Tu portafolio empieza aquí"
                        }
                        text={
                          workspace.projects.length
                            ? "Prueba otro nombre, área o estado."
                            : "Crea un proyecto con un objetivo pequeño y claro."
                        }
                        action={
                          !workspace.projects.length && (
                            <button
                              className="button primary"
                              onClick={() => open({ type: "projectForm" })}
                            >
                              <Plus size={16} />
                              Nuevo proyecto
                            </button>
                          )
                        }
                      />
                    )}
                  </>
                )}
                {view === "log" && (
                  <div className="panel log-panel">
                    <div className="section-heading">
                      <h2>Historial de tu espacio</h2>
                      <span className="muted">
                        Últimos {activities.length} registros
                      </span>
                    </div>
                    {activities.map((a) => (
                      <ActivityRow key={a.id} activity={a} />
                    ))}
                    {!activities.length && (
                      <Empty
                        title="Sin registros por mostrar"
                        text="Abre un proyecto para registrar un avance o prueba otra búsqueda."
                      />
                    )}
                  </div>
                )}
              </>
              <footer className="page-footer">
                <span>
                  CareerOps <span> / </span> Construye tu siguiente oportunidad.
                </span>
                <span>
                  <span className="tiny-dot" /> Los cambios se guardan al
                  confirmar
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      <dialog
        ref={dialog}
        className="modal"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setModal(null);
        }}
        onClose={() => setModal(null)}
        aria-label="Detalle y edición"
      >
        <button
          className="modal-close icon-button"
          aria-label="Cerrar ventana"
          disabled={busy}
          onClick={() => setModal(null)}
        >
          <X size={21} />
        </button>
        {error && (
          <div role="alert" className="error-banner">
            {error}
          </div>
        )}
        {renderModal()}
      </dialog>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button
            className="icon-button"
            aria-label="Cerrar notificación"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
