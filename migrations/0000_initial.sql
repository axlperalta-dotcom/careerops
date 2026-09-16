CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY, title text NOT NULL, company text NOT NULL,
  area text NOT NULL CHECK (area IN ('Software','Sistemas','Aeroespacial')),
  status text NOT NULL CHECK (status IN ('Guardada','En preparación','Postulada','Archivada')),
  url text NOT NULL, description text NOT NULL, skills jsonb NOT NULL, created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY, title text NOT NULL,
  area text NOT NULL CHECK (area IN ('Software','Sistemas','Aeroespacial')),
  status text NOT NULL CHECK (status IN ('Por empezar','En progreso','Completado')),
  objective text NOT NULL, job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  url text NOT NULL, skills jsonb NOT NULL, created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  position serial NOT NULL,
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL, done boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY, project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  body text NOT NULL, url text NOT NULL DEFAULT '', kind text NOT NULL CHECK (kind IN ('event','note')), created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS projects_job ON projects(job_id);
CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY);
