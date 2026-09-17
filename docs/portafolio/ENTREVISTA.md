# CareerOps · Guion de entrevista y demostración

Este material es una guía de práctica. Adáptalo a tu forma de hablar y a lo que puedas explicar, sin memorizar términos que todavía no entiendas.

## Presentación de un minuto

> CareerOps es un proyecto personal que surgió al preparar mi portafolio. Tenía vacantes con muchos requisitos y quería relacionarlos con proyectos y trabajo concreto que pudiera mostrar.
>
> Mi aportación fue definir el recorrido, tomar decisiones sobre la interfaz y probar el producto. Por ejemplo, detecté que la vista general repetía lo que ya se podía hacer en Vacantes y propuse simplificar la navegación. También investigué un aviso que aparecía con una extensión de Chrome.
>
> Usé asistencia de IA para implementar el código y preparar verificaciones. La aplicación permite guardar vacantes, asociar requisitos a proyectos y registrar evidencia con enlaces. Tiene pruebas automáticas y funciona localmente. Lo que quiero demostrar con ella es mi criterio para convertir una necesidad en un producto, probarlo y explicar sus límites.

## Demo de tres minutos

Antes de empezar, abre la aplicación y prepara una vacante y un proyecto de demostración. Evita mostrar información personal o de postulaciones que no quieras compartir. Si no hay conexión, usa las capturas del caso de estudio.

| Tiempo    | Qué mostrar                     | Qué explicar                                                                              |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| 0:00–0:30 | Lista de Vacantes.              | «Aquí organizo las oportunidades por área y estado».                                      |
| 0:30–1:20 | Requisitos de Product Engineer. | «Un requisito puede estar pendiente, tener un proyecto o contar con evidencia».           |
| 1:20–2:00 | Una evidencia y su explicación. | «Registro trabajo concreto. El sistema no dice automáticamente que domino una habilidad». |
| 2:00–2:30 | Proyecto y tareas.              | «Este porcentaje mide tareas terminadas, no mi nivel profesional».                        |
| 2:30–3:00 | Bitácora y caso de estudio.     | «Puedo reconstruir avances y decisiones. Sigue siendo un prototipo local».                |

Si muestras GitHub Actions, explica qué comprueba la ejecución antes de abrir detalles técnicos. No hace falta recorrer todas las pruebas.

## Preguntas que conviene practicar

**¿Qué hiciste tú y qué hizo la IA?**  
«Yo definí la necesidad, aporté requisitos, revisé la interfaz y probé sus funciones. La IA asistió con código, arquitectura, pruebas automatizadas y documentación. Puedo explicar las decisiones de producto; sigo aprendiendo los detalles del backend».

**¿Qué cambiaste después de probarlo?**  
«Retiramos una vista general que duplicaba acciones. Dejamos Vacantes, Proyectos y Bitácora. Después añadimos requisitos con evidencias porque un enlace entre una vacante y un proyecto era demasiado general».

**¿Cómo investigaste el aviso del navegador?**  
«Comprobé que no aparecía en incógnito y comparé las extensiones hasta identificar Urban VPN. La aplicación también tenía una prueba de carga con un navegador limpio. La evidencia apuntaba a una modificación del HTML por la extensión».

**¿Cómo sabes que funciona?**  
«Lo probé manualmente y reporté lo que encontraba confuso. El proyecto además tiene pruebas de datos y navegador, y una ejecución de GitHub Actions aprobada. Eso reduce errores conocidos, aunque no garantiza que no haya otros».

**¿Qué ocurre si eliminas un proyecto?**  
«Se eliminan sus tareas. Los requisitos dejan de apuntar a ese proyecto, pero conservan sus evidencias, y la bitácora conserva el historial. Son decisiones explícitas para evitar perder contexto».

**¿Está en producción?**  
«No. Es un prototipo local de un usuario. Todavía no acredita operación de un servicio con usuarios externos, despliegue en AWS ni cumplimiento de un entorno regulado».

**¿Cómo tratarías un resultado incorrecto de la IA?**  
«Primero trataría la propuesta como algo por comprobar. Revisaría el comportamiento esperado y reproduciría el problema con datos controlados. En este proyecto se combinan mi revisión de uso y pruebas automáticas; no asumiría que una respuesta generada es correcta por sí sola».

**¿Qué mejorarías después?**  
«Observaría a otra persona usar el recorrido sin explicárselo y registraría dónde se detiene. Antes de hacerlo remoto resolveríamos acceso, permisos y respaldo de datos».

## Vocabulario con ejemplos del proyecto

| Concepto             | Explicación sencilla                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| API                  | El punto por el que la pantalla pide leer o guardar datos.                                 |
| Validación           | Reglas que comprueban si una entrada se puede aceptar, como exigir un enlace HTTP o HTTPS. |
| Transacción          | Agrupa cambios para que se guarden juntos o se reviertan si algo falla.                    |
| Migración            | Un cambio organizado en la estructura de la base de datos.                                 |
| Integración continua | Comprobaciones que GitHub ejecuta cuando se suben cambios.                                 |
| Evidencia            | Un enlace y una explicación de trabajo concreto; no una certificación de dominio.          |

## Autoevaluación antes de una entrevista

- Explica en tus palabras una decisión que tomaste y por qué.
- Muestra un requisito con evidencia y otro pendiente.
- Describe qué probaste personalmente y qué verificó la automatización.
- Explica una limitación actual sin inventar experiencia de producción.
- Si desconoces un detalle técnico, dilo y señala cómo lo investigarías.
