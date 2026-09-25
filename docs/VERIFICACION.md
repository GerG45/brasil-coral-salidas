# Verificación de la versión local

## Pruebas automáticas

`node --test tests/core.test.cjs`: 14 pruebas correctas, 0 fallos.

- Capacidad exacta de 1, 42, 58 y 100 butacas; uno/dos pisos; tres distribuciones.
- Prevención de asientos duplicados y documentos equivalentes con puntos o espacios.
- Cambio de asiento, liberación y pasajeros sin butaca.
- Embarque por ID de grupo y edición individual.
- Edad al viaje y límites de cumpleaños/bisiestos.
- Respaldos, duplicados y referencias inválidas.
- Fechas de viaje invertidas y nacimiento posterior a salida.
- Fechas inexistentes, como 31 de febrero.
- Equipamiento persistido sin sumar capacidad; movimiento entre pisos y eliminación.
- Prevención de superposiciones entre equipamiento y butacas.
- Migración de respaldos anteriores sin equipamiento.
- Movimiento de butacas ocupadas conservando la asignación y bloqueo al eliminarlas.

## Navegador

Se comprobó en la aplicación local:

- Demo de 58 butacas con dos pisos.
- Creación de salida de 42; navegación de pasajeros bloqueada hasta confirmar plano.
- Renumeración de butaca 1 a A1 y movimiento a otro espacio.
- Confirmación del plano, carga de pasajero y creación de grupo desde su ficha.
- Asignación de la butaca A1 y alojamiento; aparición en lista y rooming.
- Acción de embarque grupal.
- Recarga conservando salidas y pasajeros.
- Apertura de las seis vistas de documentos, sin errores registrados en consola.
- Vista móvil de 390 píxeles, sin desbordamiento horizontal del cuerpo.
- Editor ampliado: colocación de baño, escalera y cafetera, movimiento y eliminación de cafetera, persistencia después de recargar y presencia de los tres elementos en taquilla para imprimir.
- Favicon PNG del logo original servido correctamente; cambio de acentos al verde de marca, conservando las superficies blancas y grises.
- Página de embarque: check individual, fila verde, contador, persistencia al recargar, desmarcado, distintivo de menor de 14 años y filtro de menores. Vista de tablet en 1032 × 1376 y 1376 × 1032 sin desbordamiento horizontal según medidas del documento. No se probó Safari en un iPad físico ni la conexión desde ese dispositivo.
- Prueba de límite de edad: 17 años antes del cumpleaños, 18 el día del cumpleaños y edad desconocida cuando falta una fecha.

Las pruebas manuales usaron exclusivamente datos ficticios. No se verificó una impresora física ni se guardó un PDF desde el diálogo del sistema. La paginación final depende del navegador y las opciones de impresión seleccionadas.

## Conversión histórica

El resultado del conversor pasó el mismo validador de respaldos de la aplicación: 27 personas, 10 grupos y 43 butacas. Los archivos personales se guardaron en `.local-data/`, que el servidor no publica y Git ignora. Los datos convertidos requieren revisión operativa antes de su uso.
