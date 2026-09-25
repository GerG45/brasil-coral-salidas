# De hojas y activadores a una fuente de datos

## Inspección

El libro incluye Colectivo, Taquilla, Rooming, Lista de Pasajeros, su copia, Vouchers, HOJA COMANDO, Datos para el seguro, Manifiesto y propiedades de scripts. La fuente operativa es Colectivo. Se inspeccionaron encabezados, metadatos del viaje, registros y bloques de rooming; no se ejecutaron los scripts adjuntos.

El archivo y los scripts no comparten exactamente el mismo esquema. Por ejemplo, el encabezado de Colectivo ubica Butaca en U, GRUPO en W y nombre/apellido en Z/AA. El script `completarGrupo` interpreta T como checkbox y U como grupo. Ejecutarlo sin adaptar sería incorrecto. Además hay dos declaraciones de `onChange`, rangos fijos, diferencias en el nombre de Lista de Pasajeros y un registro explícito del token OAuth. Ninguno de estos mecanismos se trasladó a la aplicación.

## Modelo

- Una **salida** contiene fechas, transporte, coordinación, plano, grupos y pasajeros.
- Los **pisos** contienen una cuadrícula y butacas con ID, etiqueta, fila y columna. La posición y la numeración son independientes.
- Un **pasajero** tiene un ID estable y referencias al grupo y butaca. La etiqueta visible puede cambiar sin perder la asignación.
- Los **grupos** tienen ID, nombre y color. No se identifican por fragmentos de nombres.
- Los documentos son vistas calculadas al abrirlos o imprimirlos. No hay copias que deban sincronizarse con activadores.
- La edad se calcula a la fecha de la salida. Sin nacimiento o sin fecha de salida se muestra pendiente.
- Alojamiento y habitación se registran por persona; la acción explícita de aplicar al grupo evita sobrescribir excepciones involuntariamente.
- Los infantes sin asiento se cuentan como personas sin consumir capacidad. No se infiere ese estado por edad.

## Correspondencia

| Antes | Ahora |
| --- | --- |
| Una hoja por salida y scripts instalados | Salidas independientes dentro del mismo programa |
| Decenas de exportadores con rangos A1 | Un generador de documentos por tipo y filtro |
| Colores buscados celda por celda | Color de grupo calculado en el mapa |
| Celdas combinadas y líneas como estructura | Tablas agrupadas por hotel y grupo |
| Propagar checkbox por comparación de columnas | Acción de embarque con ID de grupo |
| Limpiar rangos y restaurar fórmulas | Nueva salida reutilizando solo el plano |
| Copias de información para manifiesto y seguro | Vistas de las mismas fichas |

## Límites y próximos desarrollos

La persistencia usa Firebase Authentication y Firestore. Se sincroniza en tiempo real y las transacciones rechazan ediciones antiguas sobre una salida modificada en otro dispositivo. La lista de embarque cambia exclusivamente el check elegido sobre la versión más reciente. Ver NUBE.md.

Quedan para una evolución acordada: catálogo de unidades reutilizables, inventario real de habitaciones, adaptación exacta de vouchers/manifiestos a cada proveedor, generación PDF directa por lote, importación asistida de distintas planillas y pruebas de grandes volúmenes. No hay compromisos de reservas, controles oficiales ni comunicaciones automáticas.
