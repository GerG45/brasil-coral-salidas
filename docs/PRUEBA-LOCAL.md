# Versión local: Excel y RENAPER

Abrir `INICIAR-LOCAL.cmd` y visitar http://127.0.0.1:4180. El guardado pertenece a ese navegador y dirección. Esta versión no inicia sesión ni guarda en Firebase. Descargar respaldos periódicamente. La versión publicada mantiene el acceso privado y el guardado en Firebase.

## Excel

Pulsar Importar Excel y elegir un `.xlsx`. Solo se lee la primera hoja:

| Ubicación | Dato |
|---|---|
| A1 | Día y mes, por ejemplo 24 de septiembre |
| B1 | Año de cuatro dígitos; si falta, se completa la fecha antes de importar |
| C1 | Tipo de colectivo |
| E1 | Capacidad real |
| A4:A… | Número de orden original; no se interpreta como butaca |
| B4:B… | Casilla original conservada; no se interpreta como embarque |
| C4:C… | Nombres |
| D4:D… | Apellido |
| E4:E… | DNI |
| F4:F… | Fecha de nacimiento |
| G4:G… | Punto de carga |
| H4:H… | Observación |
| I3 / I4:I… | Encabezado Sexo y valores F, M o X |

Se crea una salida nueva sin plano físico. La capacidad se controla por personas que ocupan lugar. Permite lista de embarque, fichas y documentos sin confirmar un plano. La vista previa muestra errores; no se importan parcialmente las filas inválidas. Si falta sexo, se puede importar y completarlo después desde Editar pasajero, pero no consultar RENAPER.

## RENAPER experimental

1. En Chrome o Edge, abrir Extensiones y activar Modo de desarrollador.
2. Elegir Cargar descomprimida y seleccionar la carpeta `renaper-extension` del proyecto.
3. Recargar el programa local.
4. Completar DNI, sexo y nacimiento. Pulsar Consultar RENAPER en la fila del pasajero.
5. La extensión abre el formulario oficial, lo completa y envía normalmente. Si RENAPER requiere una verificación, completarla allí. Se guarda una letra solo si se reconoce inequívocamente la respuesta, junto con su fecha.

En Configurar RENAPER se puede activar Consultar al guardar. El Excel no dispara consultas masivas. La extensión permite una consulta a la vez y no evita reCAPTCHA ni reintenta indefinidamente. Cambiar DNI, sexo o nacimiento invalida la consulta anterior. Una letra escrita manualmente aparece como sin verificar.

La extensión no está instalada automáticamente y la consulta real sigue pendiente de prueba con un documento y sexo correctos. No completar sexo a partir del nombre.

La versión publicada actualizada también admite salidas sin plano. RENAPER requiere la extensión en Chrome o Edge, tanto en local como en GitHub Pages; no funciona en Safari/iPad.
