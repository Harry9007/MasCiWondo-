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

  const macroTitulo = detalle?.macrociclo?.titulo || "Macrociclo";
  const microMap = new Map((detalle?.microciclos || []).map((m) => [m.id, m.numero_semana]));

  for (const s of detalle?.sesiones || []) {
    const numSemana = microMap.get(s.microciclo_id) || s.microciclo_id;
    if (!s.ejercicios || s.ejercicios.length === 0) {
      filas.push([
        macroTitulo,
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
          macroTitulo,
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

  const csvPlano = filas
    .map((fila) => fila.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return `\uFEFF${csvPlano}`;
}

async function verDetalleMacrociclo(macrocicloId) {
  const caja = document.getElementById("resultado-macrociclo");
  if (!caja) return;

  try {
    const detalle = await peticionAPI(`/ciclos/macrociclos/${macrocicloId}/detalle`);
    ultimoCicloCargado = detalle;

    const macro = detalle?.macrociclo || {};
    const mesos = Array.isArray(detalle?.mesociclos) ? detalle.mesociclos : [];
    const micros = Array.isArray(detalle?.microciclos) ? detalle.microciclos : [];
    const sesiones = Array.isArray(detalle?.sesiones) ? detalle.sesiones : [];

    const resumenSesiones = sesiones
      .slice(0, 10)
      .map((s) => {
        const listaEj = (s.ejercicios || [])
          .map(
            (e) =>
              `• ${e.ejercicio_nombre}: ${e.series} series x ${e.repeticiones_o_tiempo} (${e.porcentaje_intensidad || ""})`
          )
          .join("\n    ");
        return `Sesión #${s.id} (${s.dia_semana} - ${s.tipo_plan}):\n    ${listaEj || "Sin ejercicios"}`;
      })
      .join("\n\n");

    caja.innerHTML = `
      <div><strong>Macrociclo:</strong> ${macro.titulo || "Sin título"} (ID ${macro.id ?? macrocicloId})</div>
      <div><strong>Mesociclos:</strong> ${mesos.length} · <strong>Semanas (Microciclos):</strong> ${micros.length} · <strong>Sesiones:</strong> ${sesiones.length}</div>
      <div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button type="button" id="btnDescargarJSON" class="btn-secundario">Descargar JSON</button>
        <button type="button" id="btnDescargarCSV" class="btn-secundario">Descargar CSV (Excel)</button>
      </div>
      <pre style="margin-top:0.75rem; white-space:pre-wrap;">${resumenSesiones || "Sin sesiones generadas."}</pre>
    `;

    document.getElementById("btnDescargarJSON")?.addEventListener("click", () => {
      descargarArchivo(
        JSON.stringify(ultimoCicloCargado, null, 2),
        `macrociclo_${macro.id ?? macrocicloId}.json`,
        "application/json"
      );
    });

    document.getElementById("btnDescargarCSV")?.addEventListener("click", () => {
      descargarArchivo(
        cicloACSV(ultimoCicloCargado),
        `macrociclo_${macro.id ?? macrocicloId}.csv`,
        "text/csv;charset=utf-8;"
      );
    });
  } catch (err) {
    caja.textContent = `Macrociclo #${macrocicloId} creado, pero no se pudo cargar el detalle: ${err.message}`;
  }
}

const formMacrociclo = document.getElementById("form-macrociclo");
if (formMacrociclo) {
  formMacrociclo.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = typeof exigirSesionActiva === "function" ? exigirSesionActiva() : null;
    if (!usuario) return;

    const cajaResultado = document.getElementById("resultado-macrociclo");
    if (cajaResultado) {
      cajaResultado.textContent = "Generando macrociclo, mesociclos y sesiones semanales...";
    }

    const creadorInput = Number(document.getElementById("creadorId")?.value);
    const creadorIdFinal =
      usuario.rol === "entrenador" && creadorInput > 0 ? creadorInput : Number(usuario.id);

    const payload = {
      creadorId: creadorIdFinal,
      usuarioSolicitanteId: Number(usuario.id),
      rolSolicitante: usuario.rol,
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
      if (cajaResultado) {
        cajaResultado.textContent = `Error: ${err.message}`;
      }
    }
  });
}