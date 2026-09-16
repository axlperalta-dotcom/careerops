import { describe, expect, it } from "vitest";
import { hasOffensiveLanguage } from "../src/lib/content-policy";
import { commandSchema } from "../src/lib/model";

describe("professional language policy", () => {
  it.each([
    "Esto es una mierda.",
    "PÉNDEJO",
    "p3nd3j0",
    "ｐｕｔｏ",
    "pu\u200Bta",
    "FUCK!",
    "cabrón",
  ])("flags a whole offensive token: %s", (value) => {
    expect(hasOffensiveLanguage(value)).toBe(true);
  });
  it.each([
    "Ingeniería de computadoras",
    "Analista de sistemas",
    "Disputa de cambios y reputación",
    "El formulario tiene errores graves y no me gusta.",
    "C++, C#, Node.js, React, PostgreSQL",
    "Scunthorpe software company",
    "Evaluar el filtro de lenguaje ofensivo",
  ])("allows legitimate text: %s", (value) => {
    expect(hasOffensiveLanguage(value)).toBe(false);
  });
  it("validates every free-text record field without blocking links", () => {
    const job = {
      title: "Product Engineer",
      company: "Ejemplo",
      area: "Software",
      status: "Guardada",
      url: "https://example.com/disputa",
      description: "",
      skills: ["React"],
    };
    for (const field of ["title", "company", "description", "skills"]) {
      const data = {
        ...job,
        [field]: field === "skills" ? ["pendejo"] : "pendejo",
      };
      expect(commandSchema.safeParse({ type: "saveJob", data }).success).toBe(
        false,
      );
    }
    const project = {
      title: "Proyecto",
      area: "Sistemas",
      status: "Por empezar",
      objective: "Aprender",
      jobId: null,
      url: "",
      skills: [],
    };
    for (const field of ["title", "objective", "skills"]) {
      const data = {
        ...project,
        [field]: field === "skills" ? ["pendejo"] : "pendejo",
      };
      expect(
        commandSchema.safeParse({ type: "saveProject", data }).success,
      ).toBe(false);
    }
    expect(
      commandSchema.safeParse({
        type: "addTask",
        projectId: crypto.randomUUID(),
        title: "pendejo",
      }).success,
    ).toBe(false);
    expect(
      commandSchema.safeParse({
        type: "addNote",
        projectId: crypto.randomUUID(),
        body: "pendejo",
        url: "",
      }).success,
    ).toBe(false);
    expect(
      commandSchema.safeParse({ type: "saveJob", data: job }).success,
    ).toBe(true);
  });
});
