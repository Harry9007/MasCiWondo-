// frontend/web/js/macrociclo.js
let ultimoCicloCargado = null;

function descargarArchivo(contenido, nombreArchivo, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

function cicloACSV(detalle) {
  const filas = [
    [
      "Macrociclo",
      "Microciclo",
      "Sesion_ID",
      "Dia",
      "Tipo_Plan",
      "Lugar",
      "Ejercicio",
      "Series",
      "Repeticiones_Tiempo",
      "Intensidad",
      "Pausa_Seg",
      "Notas"
    ]
  ];

  const microMap = new Map((detalle.microciclos || []).map((m) => [m.id, m.numero_semana]));

  for (const s of detalle.sesiones || []) {
    const numSemana = microMap.get(s.microciclo_id) || s.microciclo_id;
    if (!s.ejercicios || s.ejercicios.length === 0) {
      filas.push([
        detalle.macrociclo.titulo,
        numSemana,
        s.id,
        s.dia_semana,
        s.tipo_plan,
        s.lugar_terreno,
        "Sin ejercicios",
        "",
        "",
        "",
        "",
        s.observaciones || ""
      ]);
    } else {
      for (const ej of s.ejercicios) {
        filas.push([
          detalle.macrociclo.titulo,
          numSemana,
          s.id,
          s.dia_semana,
          s.tipo_plan,
          s.lugar_terreno,
          ej.ejercicio_nombre,
          ej.series,
          ej.repeticiones_o_tiempo,
          ej.porcentaje_intensidad || "",
          ej.pausa_seg,
          ej.notas_tecnicas || ""
        ]);
      }
    }
  }

  return filas
    .map((fila) => fila.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

async function verDetalleMacrociclo(macrocicloId) {
  const caja = document.getElementById("resultado-macrociclo");
  const detalle = await peticionAPI(`/ciclos/macrociclos/${macrocicloId}/detalle`);
  ultimoCicloCargado = detalle;

  const resumenSesiones = (detalle.sesiones || [])
    .slice(0, 10)
    .map((s) => {
      const listaEj = (s.ejercicios || [])
        .map(
          (e) =>
            `• ${e.ejercicio_nombre}: ${e.series} series x ${e.repeticiones_o_tiempo} (${e.porcentaje_intensidad || ""})`
        )
        .join("\n    ");
      return `Sesión #${s.id} (${s.dia_semana} - ${s.tipo_plan}):\n    ${listaEj}`;
    })
    .join("\n\n");

  caja.innerHTML = `
    <div><strong>Macrociclo:</strong> ${detalle.macrociclo.titulo} (ID ${detalle.macrociclo.id})</div>
    <div><strong>Mesociclos:</strong> ${detalle.mesociclos.length} · <strong>Semanas (Microciclos):</strong> ${detalle.microciclos.length} · <strong>Sesiones:</strong> ${detalle.sesiones.length}</div>
    <div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
      <button type="button" id="btnDescargarJSON" class="btn-secundario">Descargar JSON</button>
      <button type="button" id="btnDescargarCSV" class="btn-secundario">Descargar CSV (Excel)</button>
    </div>
    <pre style="margin-top:0.75rem; white-space:pre-wrap;">${resumenSesiones || "Sin sesiones generadas."}</pre>
  `;

  document.getElementById("btnDescargarJSON").addEventListener("click", () => {
    descargarArchivo(
      JSON.stringify(ultimoCicloCargado, null, 2),
      `macrociclo_${detalle.macrociclo.id}.json`,
      "application/json"
    );
  });

  document.getElementById("btnDescargarCSV").addEventListener("click", () => {
    descargarArchivo(
      cicloACSV(ultimoCicloCargado),
      `macrociclo_${detalle.macrociclo.id}.csv`,
      "text/csv;charset=utf-8;"
    );
  });
}

const formMacrociclo = document.getElementById("form-macrociclo");
if (formMacrociclo) {
  formMacrociclo.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cajaResultado = document.getElementById("resultado-macrociclo");
    cajaResultado.textContent = "Generando macrociclo y sesiones...";

    const payload = {
      creadorId: Number(document.getElementById("creadorId").value),
      titulo: document.getElementById("titulo").value.trim(),
      fechaInicio: document.getElementById("fechaInicio").value,
      fechaFin: document.getElementById("fechaFin").value,
      objetivoPrincipal: document.getElementById("objetivoPrincipal").value.trim(),
      modalidad: document.getElementById("modalidad").value,
      mesociclos: [
        {
          nombre: document.getElementById("mesoNombre").value.trim(),
          periodo: document.getElementById("periodo").value,
          semanasDuracion: Number(document.getElementById("semanasDuracion").value),
          diasActivos: ["lunes", "martes", "miercoles", "jueves", "viernes"]
        }
      ]
    };

    try {
      const data = await peticionAPI("/ciclos/macrociclos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await verDetalleMacrociclo(data.macrocicloId);
    } catch (err) {
      cajaResultado.textContent = `Error: ${err.message}`;
    }
  });
}