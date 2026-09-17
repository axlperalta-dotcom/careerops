# Alcance v0.1

## Problema

Una persona que prepara su portafolio guarda ofertas de empleo, ideas y evidencias en lugares separados. Necesita relacionar una vacante con un proyecto concreto y saber qué hacer después.

## Recorrido entregado

Guardar vacante → definir requisitos → vincular proyectos → agregar tareas → registrar evidencia por requisito → consultar historial.

La entrada es Vacantes. Se retiró Vista general tras la primera prueba del usuario porque duplicaba acciones y confundía el propósito. Guardada se muestra en amarillo y Archivada en naranja, manteniendo sus etiquetas textuales.

## Criterios de aceptación

- Los formularios permiten crear y editar registros con validación.
- El lenguaje fuertemente ofensivo de la lista básica se rechaza al guardar, también por API, sin borrar el formulario ni alterar datos anteriores.
- Los cambios persisten al reiniciar el almacenamiento.
- Eliminar una vacante no elimina proyectos.
- Eliminar un proyecto elimina sus tareas pero conserva sus notas sin vínculo.
- Reintentar la misma marca de tarea no duplica su evento.
- Las áreas Software, Sistemas y Aeroespacial pueden filtrarse.
- La interfaz funciona con teclado y en un ancho de 390 píxeles.
- Los requisitos se crean, editan, vinculan y eliminan dentro de una vacante.
- Importar habilidades no duplica nombres existentes; no crea evidencia ni asigna proyectos automáticamente.
- Un enlace válido y una explicación son obligatorios para registrar evidencia de un requisito.
- Quitar la última evidencia recalcula el estado; completar un proyecto no acredita un requisito.
- La actualización de la base conserva los registros anteriores y puede ejecutarse nuevamente sin duplicar cambios.

## Límites actuales

- Un usuario y un proceso local; sin login, tenants ni publicación.
- Vacantes y habilidades ingresadas manualmente. El resumen inicial es manual.
- Estado del proyecto elegido por la persona; porcentaje calculado exclusivamente con la lista de tareas.
- Evidencias como texto y enlaces; sin carga de archivos.
- Historial completo en memoria del cliente, sin paginación: adecuado para este piloto pequeño, pendiente de revisar antes de crecer.
- El almacenamiento no tiene sincronización, cifrado de aplicación ni respaldo automático.
- No hay garantía de entrega exactamente una vez para crear registros si la conexión se corta después de guardar. Recargar y comprobar antes de repetir una creación.

## Próximas decisiones, después de la prueba

1. Probar el recorrido de requisitos y evidencias con una vacante real.
2. Decidir si hace falta un perfil de habilidades además de los requisitos por vacante.
3. Diseñar sugerencias de proyectos asistidas por IA, con fuentes y evaluación.
4. Preparar autenticación, Postgres servidor, copias de seguridad y despliegue privado antes de un piloto remoto.

Ninguna fase futura se contabiliza como implementada.
