# Brasil Coral · Gestión de salidas

Aplicación HTML, CSS y JavaScript para organizar viajes en colectivo. Usa GitHub Pages para la interfaz y Firebase Authentication + Firestore para el acceso y el guardado compartido. Requiere conexión a Internet.

## Abrir

Acceder a la web de GitHub Pages e ingresar con la cuenta Google autorizada. Para desarrollo: `npm start`, abrir `http://127.0.0.1:4173`. Firebase debe autorizar ese dominio. No abrir el HTML como archivo: los módulos necesitan HTTP.

La información se sincroniza entre dispositivos. Las reglas de Firestore restringen los datos a la cuenta autorizada. Detalles de acceso, conflictos, migración y limitaciones en [docs/NUBE.md](docs/NUBE.md).

## Uso

**Vista para iPad:** abrir **Tomar lista**, ingresar con la cuenta autorizada y elegir la salida. Los checks se guardan en Firebase y se reflejan en la notebook. Ver [docs/IPAD.md](docs/IPAD.md).

1. **Nueva salida:** completar nombre y fecha; elegir 42, 58 o entre 1 y 100 butacas; uno o dos pisos; distribución 2+2, 2+1 o 1+2.
2. **Colectivo:** pulsar **Editar plano** si ya está confirmado. Las herramientas están sobre el mapa: **+ Butaca**, **Baño**, **Escalera**, **Cafetera**, **Renumerar**, **Mover** y **Quitar**. Elegir un elemento y tocar una celda vacía para colocarlo. Para mover, seleccionar el elemento y después la celda destino; también se puede cambiar de piso. Baño, escalera y cafetera se guardan en el respaldo, se copian al reutilizar el plano y aparecen en la taquilla impresa sin contar como butacas. Se pueden agregar filas; solo se quita la última si no tiene butacas ni equipamiento. Las plantillas de dos pisos reparten inicialmente el 70% arriba, redondeado hacia arriba; ajustar el reparto moviendo butacas.
3. **Confirmar plano** habilita pasajeros. Las etiquetas son únicas en todo el colectivo. Una butaca ocupada no puede eliminarse. Regenerar el plano exige liberar todas las asignaciones.
4. **Pasajeros:** guardar identificación, nacimiento, contacto, grupo, asiento, embarque y alojamiento. Marcar **No ocupa butaca** cuando corresponda. Las personas pueden quedar pendientes de asignación. Los documentos repetidos del mismo tipo y las butacas duplicadas se rechazan.
5. **Grupos:** asignar nombre y color. El embarque puede marcarse para una persona o todo el grupo. Hospedaje, habitación, camas y régimen pueden copiarse a todos los integrantes desde una ficha.
6. **Rooming y documentos:** consultar las vistas derivadas; generar lista, rooming, vouchers, manifiesto, datos del seguro o taquilla. **Imprimir / Guardar PDF** usa el diálogo del navegador; elegir A4, guardar como PDF y desactivar encabezados y pies del navegador si aparecen. Cada hotel, voucher y piso empieza en una página nueva.
7. **Respaldos:** descargar JSON periódicamente. Restaurar valida el archivo y reemplaza todas las salidas tras confirmación. El CSV de pasajeros se abre en Excel; el JSON es el respaldo completo.
8. **Reutilizar plano:** crea otra salida sin copiar pasajeros ni fechas. La nueva salida exige revisar y confirmar la distribución.

## Recuperar la planilla original

Hay un conversor específico para la estructura inspeccionada de `4 de Abril MEJORADO- 2025.xlsx`. Requiere Python y `openpyxl`, solo para esa conversión:

```sh
python tools/import_legacy.py "RUTA/4 de Abril MEJORADO- 2025.xlsx"
```

El resultado está en `.local-data/abril-2025.json`, excluido de Git y fuera del directorio público. Importarlo mediante **Restaurar respaldo**. Leer las notas contiguas antes de usar los datos. El conversor no modifica el Excel original ni ejecuta sus scripts.

En el archivo suministrado: 25 pasajeros, 2 tripulantes, 10 grupos y un plano histórico de 43 butacas. La columna U de pasajeros no tiene asientos guardados: quedan por asignar. Las fechas y datos proceden de valores cacheados del archivo; revisar posibles diferencias con el Google Sheets original. El plano histórico se deja sin confirmar para forzar su revisión.

## Estructura

- `dist/index.html`, `styles.css`, `app.js`: interfaz de gestión.
- `dist/core.js`: reglas de pasajeros, planos y respaldos, compartidas con las pruebas.
- `tests/core.test.cjs`: reglas críticas, sin dependencias externas.
- `tools/serve.cjs`: servidor local opcional.
- `tools/import_legacy.py`: conversión específica de la planilla histórica.
- `docs/DECISIONES.md`: correspondencia con las hojas y alcance de esta versión.

```sh
npm test
```

## Alcance actual

Esta versión cubre la gestión y el embarque compartidos. Los documentos se generan como plantillas propias, no como copias visuales exactas de las hojas originales. El manifiesto contiene los datos operativos; no es un formulario oficial validado por una autoridad. La exportación PDF usa impresión del navegador, no descarga automática por lote. No incluye cobros, un catálogo de hoteles con cupos, ni importación universal de cualquier Excel. La importación histórica es un conversor de esquema conocido, no un botón de lectura de XLSX en la interfaz.

El repositorio contiene solamente código, recursos visuales y documentación. Excel, PDF, respaldos y `.local-data/` se excluyen de Git. El flujo de GitHub Actions prueba el código y publica únicamente `dist/`.
