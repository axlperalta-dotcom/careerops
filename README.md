# CareerOps

Organizador personal de vacantes, proyectos y evidencias para construir un portafolio profesional.

**Estado: prototipo local funcional, de un solo usuario. Repositorio privado.** No tiene autenticación ni está preparado para exponerse a Internet. La primera versión permite probar el producto antes de contratar infraestructura o incorporar IA.

## Qué puedes hacer

- Guardar, editar, buscar y filtrar vacantes por área y estado.
- Entrar directamente a Vacantes; navegación con Vacantes, Proyectos y Bitácora.
- Distinguir Guardada (amarillo) y Archivada (naranja).
- Crear proyectos independientes o vinculados a una vacante.
- Organizar tareas y marcar avances sin confundir tareas completadas con dominio de una habilidad.
- Registrar pruebas, decisiones y enlaces de evidencia en una bitácora.
- Conservar datos al recargar o reiniciar la aplicación.
- Eliminar vacantes conservando los proyectos asociados; eliminar proyectos conservando sus notas en el historial.

Incluye un resumen manual de la vacante Product Engineer compartida como referencia, un plan inicial de CareerOps y tareas pendientes. No se atribuyen usuarios, experiencia laboral ni resultados de producción inexistentes.

Los campos de texto tienen un filtro básico de lenguaje muy ofensivo, validado tanto en la interfaz como en la API. El aviso mantiene el formulario para corregirlo. Se detectan palabras completas, mayúsculas, acentos y algunas sustituciones comunes; no es moderación contextual ni garantiza detectar todas las variantes. No se modifican registros anteriores automáticamente. El vocabulario se puede ajustar en `src/lib/content-policy.ts`; la validación de enlaces se mantiene separada.

## Inicio local

Requiere Node.js 22.12 o superior y npm. Se verificó inicialmente con Node.js 24.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:3000. El servidor escucha únicamente en la interfaz local. Para volver a abrirlo en Windows también puedes ejecutar `iniciar-careerops.cmd` y mantener abierta su terminal.

Los datos se guardan en `.data/careerops`, excluido de Git. El repositorio contiene código y documentación, **no una copia de tus datos personales**. `CAREEROPS_DATA_DIR` permite elegir otra carpeta; consulta `.env.example`. Evita sincronizar una base abierta con OneDrive o abrirla desde dos procesos/equipos. Para respaldarla, detén el servidor y copia la carpeta de datos completa. No uses dos servidores con el mismo directorio de datos.

## Tecnología y decisiones

- Next.js App Router, React y TypeScript: interfaz y API Node.js en una aplicación.
- Drizzle ORM y **PGlite**, una compilación de PostgreSQL en WebAssembly con almacenamiento local: permite probar sin instalar un servidor de Postgres ni Docker.
- Zod: validación de entradas en el servidor; solo se aceptan enlaces HTTP/HTTPS.
- CSS propio y Lucide: interfaz adaptable a escritorio y móvil, diálogo nativo, navegación por teclado y movimiento reducido.
- Vitest: integración de datos, integridad referencial, validación y persistencia.
- Playwright: recorrido completo y comportamiento móvil.

PGlite no acredita operación de un servidor PostgreSQL ni sustituye pruebas de concurrencia de producción. Una fase posterior podrá usar Postgres administrado o autoalojado. La v0.1 no incorpora LLM, extracción automática, MCP, cuentas múltiples, AWS ni despliegue público.

## Verificación

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Las pruebas de datos crean una base temporal aislada. Las pruebas de navegador usan el puerto 3011, `.data/e2e` y `.next-e2e`; no modifican tus registros personales. El historial incluye registros de pruebas si se reutiliza esa base de pruebas.

El workflow de GitHub comprueba tipos, pruebas de integración, compilación y recorrido de navegador. Los resultados de CI deben revisarse en cada commit; no se consideran aprobados por existir el archivo del workflow.

## Estructura

```text
src/app/                 Página, estilos y API
src/components/          Interfaz del organizador
src/lib/                 Modelos, validación, esquema y operaciones transaccionales
migrations/              Esquema SQL inicial
tests/                   Pruebas de datos y navegador
docs/                    Alcance, decisiones y guía de pruebas manuales
```

## Trabajo asistido por IA

Proyecto desarrollado con asistencia de Codex. El responsable del producto aporta requisitos, criterio de interfaz y validación de uso. El código generado se verifica con pruebas y revisión; su generación no se presenta como experiencia profesional previa del responsable. Los resultados reales del piloto se documentarán cuando existan.

Consulta [la guía de pruebas](docs/GUIA-DE-PRUEBAS.md), [las decisiones técnicas](docs/ARQUITECTURA.md) y [el alcance](docs/ALCANCE.md).

## Aviso de hidratación con `bis_skin_checked`

El indicador «1 Issue» de desarrollo puede mostrar una diferencia de HTML al iniciar React. En la captura reportada aparece `bis_skin_checked="1"`, que no forma parte del HTML generado por CareerOps. La prueba de carga inicial y recarga con Chromium limpio pasa sin errores de consola.

Esto apunta a una modificación del navegador, probablemente de una extensión; no identifica por sí solo el complemento. Prueba el mismo enlace en una ventana privada sin extensiones habilitadas, o en un perfil limpio. Si el aviso persiste, comparte el detalle nuevo. [Next.js documenta esta causa](https://nextjs.org/docs/messages/react-hydration-error). La prueba `tests/e2e/hydration.spec.ts` verifica la carga sin silenciar errores.
