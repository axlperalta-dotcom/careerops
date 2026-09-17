CREATE TABLE requirements (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  position serial NOT NULL
);
CREATE INDEX requirements_job_idx ON requirements(job_id);
CREATE INDEX requirements_project_idx ON requirements(project_id);
CREATE TABLE evidence (
  id uuid PRIMARY KEY,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  body text NOT NULL,
  url text NOT NULL,
  created_at text NOT NULL
);
CREATE INDEX evidence_requirement_idx ON evidence(requirement_id);
