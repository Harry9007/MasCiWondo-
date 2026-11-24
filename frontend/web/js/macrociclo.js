// web/js/macrociclo.js
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
      "Fecha",
      "Dia",
      "Tipo_Plan",
      "Estado",
      "RPE",
      "Lugar",
      "Ejercicio",
      "Series",
      "Repeticiones_Tiempo",
      "Intensidad",
      "Pausa_Seg",
      "Notas",
    ],
  ];

  const macroTitulo = detalle?.macrociclo?.titulo || "Macrociclo";
  const microMap = new Map(
    (detalle?.microciclos || []).map((m) => [m.id, m.numero_semana])
  );

  for (const s of detalle?.sesiones || []) {
    const numSemana = microMap.get(s.microciclo_id) || s.microciclo_id;
    if (!s.ejercicios || s.ejercicios.length === 0) {
      filas.push([
        macroTitulo,
        numSemana,
        s.id,
        s.fecha_sesion || "",
        s.dia_semana || "",
        s.tipo_plan || "",
        s.estado || "",
        s.rpe_reportado ?? "",
        s.lugar_terreno || "",
        "Sin ejercicios",
        "",
        "",
        "",
        "",
        s.observaciones || "",
      ]);
    } else {
      for (const ej of s.ejercicios) {
        filas.push([
          macroTitulo,
          numSemana,
          s.id,
          s.fecha_sesion || "",
          s.dia_semana || "",
          s.tipo_plan || "",
          s.estado || "",
          s.rpe_reportado ?? "",
          s.lugar_terreno || "",
          ej.ejercicio_nombre,
          ej.series,
          ej.repeticiones_o_tiempo,
          ej.porcentaje_intensidad || "",
          ej.pausa_seg,
          ej.notas_tecnicas || "",
        ]);
      }
    }
  }

  const csvPlano = filas
    .map((fila) =>
      fila.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return `\uFEFF${csvPlano}`;
}

function renderizarJerarquiaCiclo(detalle) {
  const macro = detalle?.macrociclo || {};
  const mesos = Array.isArray(detalle?.mesociclos) ? detalle.mesociclos : [];
  const micros = Array.isArray(detalle?.microciclos) ? detalle.microciclos : [];
  const sesiones = Array.isArray(detalle?.sesiones) ? detalle.sesiones : [];

  const microsPorMeso = new Map();
  for (const micro of micros) {
    const lista = microsPorMeso.get(micro.mesociclo_id) || [];
    lista.push(micro);
    microsPorMeso.set(micro.mesociclo_id, lista);
  }

  const sesionesPorMicro = new Map();
  for (const sesion of sesiones) {
    const lista = sesionesPorMicro.get(sesion.microciclo_id) || [];
    lista.push(sesion);
    sesionesPorMicro.set(sesion.microciclo_id, lista);
  }

  return mesos
    .map((meso) => {
      const microsDelMeso = microsPorMeso.get(meso.id) || [];
      const microsHtml = microsDelMeso
        .map((micro) => {
          const sesionesDelMicro = sesionesPorMicro.get(micro.id) || [];
          const sesionesHtml = sesionesDelMicro
            .map((ses) => {
              const rpeTexto =
                ses.rpe_reportado !== null && ses.rpe_reportado !== undefined
                  ? ` · RPE ${ses.rpe_reportado}`
                  : "";
              const ejerciciosTexto =
                Array.isArray(ses.ejercicios) && ses.ejercicios.length > 0
                  ? `<div class="sesion-ejercicios-mini">${ses.ejercicios
                      .map(
                        (e) =>
                          `<span>${e.ejercicio_nombre} (${e.series}×${e.repeticiones_o_tiempo})</span>`
                      )
                      .join(" · ")}</div>`
                  : "";

              return `
                <li class="sesion-item" data-tipo-plan="${ses.tipo_plan || ""}" data-estado="${ses.estado || ""}">
                  <a href="./sesion-detalle.html?sesionId=${ses.id}" class="enlace-sesion">
                    <strong>#${ses.id} · ${ses.dia_semana}</strong> (${ses.fecha_sesion}) ·
                    <span>${ses.tipo_plan}</span> ·
                    <span>${ses.estado}</span>${rpeTexto}
                  </a>
                  ${ejerciciosTexto}
                </li>
              `;
            })
            .join("");

          const descargaTag = micro.es_descarga ? " · [Descarga]" : "";

          return `
            <article class="micro-card">
              <div class="micro-header">
                <strong>Semana ${micro.numero_semana} (${micro.tipo_microciclo}${descargaTag})</strong>
                <span>Lunes: ${micro.fecha_lunes} · Vol: ${micro.volumen_carga}% · Int: ${micro.intensidad_carga}%</span>
              </div>
              <ul class="sesiones-lista">
                ${sesionesHtml || "<li class='vacio'>Sin sesiones en esta semana.</li>"}
              </ul>
            </article>
          `;
        })
        .join("");

      return `
        <section class="meso-card">
          <div class="meso-header">
            <h4>#${meso.numero_meso} · ${meso.nombre}</h4>
            <p>
              Período: <strong>${meso.periodo}</strong> ·
              Semanas: ${meso.semanas_duracion} ·
              Volumen obj.: ${meso.volumen_objetivo}% ·
              Intensidad obj.: ${meso.intensidad_objetivo}%
            </p>
            <p class="enfoques-meso">
              Fuerza: ${meso.enfoque_fuerza || "-"} |
              Resistencia: ${meso.enfoque_resistencia || "-"} |
              Velocidad: ${meso.enfoque_velocidad || "-"} |
              Técnica: ${meso.enfoque_tecnico || "-"}
            </p>
          </div>
          <div class="micros-lista">
            ${microsHtml || "<p class='vacio'>Sin microciclos en este mesociclo.</p>"}
          </div>
        </section>
      `;
    })
    .join("");
}

async function verDetalleMacrociclo(macrocicloId) {
  const caja = document.getElementById("resultado-macrociclo");
  if (!caja) return;

  try {
    const detalle = await peticionAPI(`/macrociclos/${macrocicloId}/detalle`);
    ultimoCicloCargado = detalle;

    const macro = detalle?.macrociclo || {};
    const mesos = Array.isArray(detalle?.mesociclos) ? detalle.mesociclos : [];
    const micros = Array.isArray(detalle?.microciclos) ? detalle.microciclos : [];
    const sesiones = Array.isArray(detalle?.sesiones) ? detalle.sesiones : [];

    const jerarquiaHtml = renderizarJerarquiaCiclo(detalle);

    caja.innerHTML = `
      <div class="macro-cabecera">
        <div><strong>Macrociclo:</strong> ${macro.titulo || "Sin título"} (ID ${macro.id ?? macrocicloId})</div>
        <div>
          <strong>Modelo:</strong> ${macro.modelo_periodizacion || "atr"} ·
          <strong>Granularidad:</strong> ${macro.granularidad_generacion || "mes"} ·
          <strong>Modalidad:</strong> ${macro.modalidad || "mixto"}
        </div>
        <div>
          <strong>Mesociclos:</strong> ${mesos.length} ·
          <strong>Semanas (Microciclos):</strong> ${micros.length} ·
          <strong>Sesiones:</strong> ${sesiones.length}
        </div>
        <div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" id="btnDescargarJSON" class="btn-secundario">Descargar JSON</button>
          <button type="button" id="btnDescargarCSV" class="btn-secundario">Descargar CSV (Excel)</button>
        </div>
      </div>
      <div class="jerarquia-ciclo" style="margin-top:0.9rem;">
        ${jerarquiaHtml || "<p>Sin mesociclos generados.</p>"}
      </div>
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

function obtenerDiasActivosFormulario() {
  const checks = Array.from(
    document.querySelectorAll('input[name="diasActivos"]:checked, input[name="dias"]:checked')
  );
  if (checks.length > 0) {
    return checks.map((el) => el.value);
  }
  return ["lunes", "martes", "miercoles", "jueves", "viernes"];
}

const formMacrociclo = document.getElementById("form-macrociclo");
if (formMacrociclo) {
  formMacrociclo.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario =
      typeof exigirSesionActiva === "function" ? exigirSesionActiva() : null;
    if (!usuario) return;

    const cajaResultado = document.getElementById("resultado-macrociclo");
    if (cajaResultado) {
      cajaResultado.textContent =
        "Generando macrociclo, mesociclos y sesiones semanales...";
    }

    const creadorInput = Number(document.getElementById("creadorId")?.value);
    const creadorIdFinal =
      usuario.rol === "entrenador" && creadorInput > 0
        ? creadorInput
        : Number(usuario.id);

    const practicanteInput = Number(document.getElementById("practicanteId")?.value);
    const practicanteIdFinal =
      practicanteInput > 0
        ? practicanteInput
        : usuario.rol === "practicante"
        ? Number(usuario.id)
        : null;

    const modeloVal =
      document.getElementById("modeloPeriodizacion")?.value ||
      document.getElementById("periodo")?.value ||
      "atr";
    const granularidadVal =
      document.getElementById("granularidadGeneracion")?.value || "mes";

    const payload = {
      creador_id: creadorIdFinal,
      practicante_id: practicanteIdFinal,
      titulo: document.getElementById("titulo").value.trim(),
      modelo_periodizacion: modeloVal,
      granularidad_generacion: granularidadVal,
      fecha_inicio: document.getElementById("fechaInicio").value,
      fecha_fin: document.getElementById("fechaFin")?.value || null,
      objetivo_principal: document.getElementById("objetivoPrincipal").value.trim(),
      modalidad: document.getElementById("modalidad").value,
      dias_entrenamiento: obtenerDiasActivosFormulario(),
    };

    try {
      const data = await peticionAPI("/macrociclos/generar", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const nuevoId = data.macrociclo_id ?? data.macrocicloId;
      await verDetalleMacrociclo(nuevoId);
    } catch (err) {
      if (cajaResultado) {
        cajaResultado.textContent = `Error: ${err.message}`;
      }
    }
  });
}