# Guardado y acceso

La aplicación estática se sirve con GitHub Pages. Los pasajeros y salidas se guardan en Firestore, nunca en el repositorio. Firebase Authentication identifica la cuenta de Google; las reglas de Firestore verifican el correo autorizado y que esté verificado. Ocultar la interfaz no sustituye las reglas.

Cada salida ocupa un documento en `coral_trips`, con su contenido, revisión, usuario y hora del servidor. Una transacción rechaza la edición si otro dispositivo cambió esa salida desde que se abrió. La lista de embarque relee el documento dentro de la transacción y cambia únicamente el check de la persona elegida. Los checks de distintas personas se conservan; sobre la misma persona rige la última operación confirmada.

Se necesita Internet. El verde aparece después de la confirmación de guardado. No hay cola de escrituras sin conexión. La caché de pasajeros es solo en memoria; la sesión de acceso dura la sesión del navegador. Descargar un respaldo crea un archivo privado que debe conservarse fuera del repositorio.

El guardado en la nube no constituye por sí solo un historial recuperable: conservar respaldos JSON. Restaurar un respaldo reemplaza las salidas actuales tras confirmación; los cambios concurrentes en documentos afectados se rechazan. Límite: 200 salidas y 800 kB por salida.

## Migración

Antes de cambiar de dirección, descargar el respaldo de la versión local. Ingresar con la cuenta autorizada en la versión en nube y usar Restaurar respaldo. Revisar recuentos, fecha de salida y butacas. Las copias históricas se mantienen en `.local-data/`, excluido de Git. Un sitio en GitHub no puede leer el almacenamiento del antiguo localhost por las restricciones de origen del navegador.

## Configuración

La configuración web de Firebase en `dist/cloud-config.js` es pública por diseño. No contiene credenciales administrativas. Nunca agregar claves de servicio, tokens de Firebase CLI ni respaldos al código fuente.

Desplegar las reglas con `firebase deploy --only firestore:rules --project ID_DEL_PROYECTO`. Habilitar Google en Authentication y autorizar el dominio de GitHub Pages. Las nuevas personas operadoras requieren un cambio explícito en los permisos; no alcanza con tener cualquier cuenta de Google.
