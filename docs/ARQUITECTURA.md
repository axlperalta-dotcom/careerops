# Decisiones de arquitectura v0.1

## Un solo producto, un despliegue local

Next.js sirve la interfaz y `/api/workspace`. Las escrituras pasan por una unión de comandos validada con Zod. El repositorio utiliza transacciones Drizzle y restricciones relacionales PostgreSQL. El cliente recibe el estado confirmado por el servidor y no muestra una escritura optimista como guardada.

La API comprueba Origin para rechazar escrituras explícitamente originadas desde otros sitios y requiere JSON. Esto no es autenticación. El servidor solo escucha en 127.0.0.1. Antes de publicar se necesitan autenticación, autorización, límites de peticiones/cuerpo y una revisión de seguridad.

## Persistencia sin una cuenta de nube

PGlite guarda PostgreSQL en una carpeta local y se reutiliza como instancia única durante hot reload. La inicialización está protegida por una promesa; la semilla se registra con una clave única y una transacción para no reinsertar datos que el usuario haya eliminado.

El esquema inicial se mantiene como SQL en `migrations/0000_initial.sql`. `src/lib/migrate.ts` aplica una lista ordenada de migraciones y registra cada nombre en `app_meta`, dentro de la misma transacción que su DDL. La migración inicial es idempotente para adoptar bases existentes; `0001_requirements.sql` añade requisitos y evidencias. Repetir el arranque omite migraciones aplicadas. Los próximos cambios deben añadirse como archivos nuevos y registrarse en esa lista; Drizzle se mantiene alineado con el SQL. Las pruebas verifican la actualización desde el esquema anterior y la conservación de todos sus registros.

## Integridad

- Proyecto → vacante: `ON DELETE SET NULL`.
- Tarea → proyecto: `ON DELETE CASCADE`.
- Actividad → proyecto: `ON DELETE SET NULL`.
- Requisito → vacante y evidencia → requisito: `ON DELETE CASCADE`.
- Requisito → proyecto: `ON DELETE SET NULL`; sus evidencias sobreviven al eliminar el proyecto.
- Un requisito tiene un proyecto opcional y varias evidencias. El proyecto puede reutilizarse entre vacantes.
- Los estados de requisitos se derivan de sus vínculos actuales, sin medir competencia ni validar el contenido remoto.
- Guardar evidencia añade una nota histórica en la misma transacción. Retirarla no borra esa nota; agrega un evento de retiro.
- Un cambio de negocio y su evento se guardan en la misma transacción.
- Volver a marcar una tarea en su estado actual no agrega otra actividad.
- Las pruebas verifican una reapertura real de la base en disco.

## Seguridad y escala pendientes

No hay secretos en el repositorio. Las carpetas de datos, los archivos de entorno y artefactos de pruebas se excluyen de Git. Los enlaces se validan como HTTP/HTTPS y se abren con `noopener noreferrer`. React escapa el texto; no se renderiza HTML del anuncio.

No existe aislamiento multiusuario, SOC 2, experiencia GovCloud ni operación a escala acreditada por este prototipo. Para una versión remota se deben diseñar autorización, aislamiento de clientes, respaldos y restauración, observabilidad, retención, paginación y control de concurrencia. AWS y Pulumi forman parte de una fase posterior, no de esta entrega.

## Referencias

- https://nextjs.org/docs/app/getting-started/installation
- https://pglite.dev/docs/filesystems
- https://orm.drizzle.team/docs/connect-pglite
