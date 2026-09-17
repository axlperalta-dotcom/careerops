# Primera sesión de uso · 16 de septiembre de 2026

Observaciones reportadas por el responsable del producto, no mediciones independientes:

- Probó todos los controles y reportó crear cuatro vacantes y seis proyectos.
- No percibió fallos funcionales durante ese recorrido.
- Aprobó el diseño limpio, los colores y la ausencia de animaciones innecesarias.
- Al entrar, el propósito no quedó claro de inmediato. Vista general repetía acciones de Vacantes.
- Solicitó amarillo/naranja para los estados Guardada y Archivada.
- Solicitó restringir el lenguaje muy ofensivo en los textos.
- Reportó dos leyendas al entrar y después compartió las capturas: el indicador «1 Issue» y su detalle son el mismo aviso de hidratación de React. El atributo inesperado es `bis_skin_checked="1"`.

## Cambios derivados

1. Vacantes como pantalla inicial y solo tres pestañas: Vacantes, Proyectos y Bitácora.
2. Títulos directos y una explicación del recorrido en Vacantes.
3. Guardada en amarillo y Archivada en naranja.
4. Filtro local y de servidor basado en palabras completas, con aviso y conservación del texto ingresado. No es moderación semántica; su alcance y vocabulario están documentados.

No se cambian los registros que la persona creó durante la prueba.

## Diagnóstico del aviso al abrir

Se comprobó que `bis_skin_checked` no existe en el código de la aplicación ni en su respuesta HTML inicial. Una prueba de Playwright con navegador limpio verifica la carga inicial y la recarga: sin errores de consola ni atributos `bis_skin_checked` en el DOM.

El usuario confirmó que el aviso desaparece en incógnito y, tras comparar sus extensiones, identificó **Urban VPN** como responsable en su navegador. La documentación oficial contempla extensiones que modifican el HTML como causa de este tipo de discrepancia: https://nextjs.org/docs/messages/react-hydration-error

El usuario dio el incidente por resuelto y aprobó los cambios. La prueba añadida permanece en CI para detectar errores de carga de la aplicación. Después eligió continuar con requisitos y evidencias dentro de las vacantes; su evaluación de esta nueva función sigue pendiente.
