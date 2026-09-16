# Decisiones de arquitectura v0.1

## Un solo producto, un despliegue local

Next.js sirve la interfaz y `/api/workspace`. Las escrituras pasan por una unión de comandos validada con Zod. El repositorio utiliza transacciones Drizzle y restricciones relacionales PostgreSQL. El cliente recibe el estado confirmado por el servidor y no muestra una escritura optimista como guardada.

La API comprueba Origin para rechazar escrituras explícitamente originadas desde otros sitios y requiere JSON. Esto no es autenticación. El servidor solo escucha en 127.0.0.1. Antes de publicar se necesitan autenticación, autorización, límites de peticiones/cuerpo y una revisión de seguridad.

## Persistencia sin una cuenta de nube

PGlite guarda PostgreSQL en una carpeta local y se reutiliza como instancia única durante hot reload. La inicialización está protegida por una promesa; la semilla se registra con una clave única y una transacción para no reinsertar datos que el usuario haya eliminado.

El esquema inicial se mantiene como SQL en `migrations/0000_initial.sql`. Futuros cambios necesitan migraciones nuevas, numeradas y versionadas; `CREATE TABLE IF NOT EXISTS` no actualiza tablas existentes. El esquema Drizzle debe mantenerse alineado con esas migraciones.

## Integridad

- Proyecto → vacante: `ON DELETE SET NULL`.
- Tarea → proyecto: `ON DELETE CASCADE`.
- Actividad → proyecto: `ON DELETE SET NULL`.
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
