"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import {
  requirementStatus,
  type Command,
  type Job,
  type Requirement,
  type Workspace,
} from "@/lib/model";

type Props = {
  job: Job;
  workspace: Workspace;
  busy: boolean;
  mutate: (command: Command, message: string) => Promise<boolean>;
  openProject: (id: string) => void;
};

function RequirementCard({
  requirement,
  workspace,
  busy,
  mutate,
  openProject,
}: Omit<Props, "job"> & { requirement: Requirement }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const evidence = workspace.evidence.filter(
    (item) => item.requirementId === requirement.id,
  );
  const project = workspace.projects.find(
    (item) => item.id === requirement.projectId,
  );
  const status = requirementStatus(requirement, workspace.evidence);
  return (
    <details className="requirement-card">
      <summary>
        <strong>{requirement.title}</strong>
        <span
          className={`requirement-status ${evidence.length ? "has-evidence" : project ? "has-project" : "pending"}`}
        >
          {status}
        </span>
      </summary>
      <div className="requirement-content">
        <form
          className="form"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await mutate(
              {
                type: "saveRequirement",
                id: requirement.id,
                jobId: requirement.jobId,
                title: String(data.get("title") || ""),
                projectId: String(data.get("projectId") || "") || null,
              },
              "Requisito actualizado",
            );
          }}
        >
          <label>
            Requisito
            <input
              name="title"
              required
              maxLength={250}
              defaultValue={requirement.title}
            />
          </label>
          <label>
            Proyecto para practicarlo
            <select name="projectId" defaultValue={requirement.projectId || ""}>
              <option value="">Sin proyecto asignado</option>
              {workspace.projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="requirement-actions">
            <button className="button small secondary" disabled={busy}>
              Guardar requisito
            </button>
            {project && (
              <button
                type="button"
                className="text-link"
                onClick={() => openProject(project.id)}
              >
                Abrir proyecto
              </button>
            )}
          </div>
        </form>
        <h4>Evidencias registradas ({evidence.length})</h4>
        {!evidence.length && (
          <p className="muted">
            Añade una demo, un cambio de código, una prueba o un documento que
            muestre qué hiciste.
          </p>
        )}
        {evidence.map((item) => (
          <div className="requirement-evidence" key={item.id}>
            <p>{item.body}</p>
            <div className="requirement-actions">
              <a
                className="text-link"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir evidencia <ExternalLink size={14} />
              </a>
              <button
                type="button"
                className="text-link danger"
                disabled={busy}
                onClick={() => setConfirm(item.id)}
              >
                Retirar evidencia
              </button>
            </div>
            {confirm === item.id && (
              <div className="requirement-confirm">
                <p>
                  Se retirará de este requisito. El registro histórico seguirá
                  en la bitácora.
                </p>
                <div className="requirement-actions">
                  <button
                    className="button small destructive"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await mutate(
                          { type: "deleteEvidence", id: item.id },
                          "Evidencia retirada",
                        )
                      )
                        setConfirm(null);
                    }}
                  >
                    Confirmar retiro
                  </button>
                  <button
                    className="button small secondary"
                    disabled={busy}
                    onClick={() => setConfirm(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        <form
          className="form note-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            if (
              await mutate(
                {
                  type: "addEvidence",
                  requirementId: requirement.id,
                  body: String(data.get("body") || ""),
                  url: String(data.get("url") || ""),
                },
                "Evidencia registrada",
              )
            )
              form.reset();
          }}
        >
          <label>
            Qué demuestra esta evidencia
            <textarea
              name="body"
              required
              maxLength={3000}
              rows={2}
              placeholder="Ej. Implementé el formulario en React y probé sus validaciones."
            />
          </label>
          <label>
            Enlace a la evidencia
            <input
              name="url"
              type="url"
              required
              maxLength={2048}
              placeholder="https://github.com/…"
            />
          </label>
          <small className="muted">
            Puedes reutilizar un enlace de la bitácora. Se registra tu
            explicación; no se verifica automáticamente el contenido del enlace.
          </small>
          <button className="button small primary" disabled={busy}>
            Guardar evidencia
          </button>
        </form>
        <button
          className="text-link danger"
          disabled={busy}
          onClick={() => setConfirm("requirement")}
        >
          Eliminar requisito
        </button>
        {confirm === "requirement" && (
          <div className="requirement-confirm">
            <p>
              Se eliminarán este requisito y sus evidencias. El proyecto y la
              bitácora se conservarán.
            </p>
            <div className="requirement-actions">
              <button
                className="button small destructive"
                disabled={busy}
                onClick={() =>
                  void mutate(
                    { type: "deleteRequirement", id: requirement.id },
                    "Requisito eliminado",
                  )
                }
              >
                Confirmar eliminación
              </button>
              <button
                className="button small secondary"
                disabled={busy}
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

export function RequirementsPanel(props: Props) {
  const { job, workspace, busy, mutate } = props;
  const [adding, setAdding] = useState(false);
  const requirements = workspace.requirements.filter(
    (item) => item.jobId === job.id,
  );
  const statuses = requirements.map((item) =>
    requirementStatus(item, workspace.evidence),
  );
  const normalize = (value: string) =>
    value.trim().normalize("NFKC").toLocaleLowerCase("es");
  const canImport = job.skills.some(
    (skill) =>
      !requirements.some((item) => normalize(item.title) === normalize(skill)),
  );
  return (
    <section
      className="requirements-panel"
      aria-label="Requisitos y evidencias"
    >
      <h3 className="detail-heading">Requisitos y evidencias</h3>
      <p className="muted">
        Conecta lo que pide la vacante con trabajo que puedas mostrar. Tener
        evidencia no significa dominar una habilidad.
      </p>
      {requirements.length > 0 && (
        <div className="requirement-counts" aria-label="Resumen de requisitos">
          <span>
            <strong>
              {statuses.filter((value) => value === "Sin proyecto").length}
            </strong>{" "}
            sin proyecto
          </span>
          <span>
            <strong>
              {
                statuses.filter((value) => value === "Proyecto vinculado")
                  .length
              }
            </strong>{" "}
            con proyecto, sin evidencia
          </span>
          <span>
            <strong>
              {statuses.filter((value) => value === "Con evidencia").length}
            </strong>{" "}
            con evidencia
          </span>
        </div>
      )}
      <div className="requirement-actions">
        <button
          className="button small secondary"
          disabled={busy}
          onClick={() => setAdding(!adding)}
        >
          <Plus size={14} />
          Añadir requisito
        </button>
        {canImport && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              void mutate(
                { type: "importRequirements", jobId: job.id },
                "Habilidades añadidas como requisitos",
              )
            }
          >
            Usar habilidades del anuncio
          </button>
        )}
      </div>
      {adding && (
        <form
          className="form note-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            if (
              await mutate(
                {
                  type: "saveRequirement",
                  jobId: job.id,
                  title: String(data.get("title") || ""),
                  projectId: String(data.get("projectId") || "") || null,
                },
                "Requisito añadido",
              )
            )
              setAdding(false);
          }}
        >
          <label>
            Nuevo requisito
            <input
              name="title"
              required
              maxLength={250}
              placeholder="Ej. Construir interfaces con React"
              autoFocus
            />
          </label>
          <label>
            Proyecto para practicarlo
            <select name="projectId" defaultValue="">
              <option value="">Lo decidiré después</option>
              {workspace.projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="requirement-actions">
            <button className="button small primary" disabled={busy}>
              Guardar nuevo requisito
            </button>
            <button
              type="button"
              className="button small secondary"
              disabled={busy}
              onClick={() => setAdding(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {!requirements.length && (
        <p className="requirement-empty">
          Empieza con un requisito concreto del anuncio o importa sus
          habilidades y luego ajústalas.
        </p>
      )}
      {requirements.map((requirement) => (
        <RequirementCard
          key={requirement.id}
          {...props}
          requirement={requirement}
        />
      ))}
    </section>
  );
}
