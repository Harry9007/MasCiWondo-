// web/js/pruebasCiclos.js
let ultimaPruebaDetalle = null;

function obtenerProximoLunesISO(offsetSemanas = 0) {
  const hoy = new Date();
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diaSemana = base.getDay(); // 0 = domingo, 1 = lunes...
  const diasHastaLunes = diaSemana === 1 ? 0 : (8 - diaSemana) % 7;
  base.setDate(base.getDate() + diasHastaLunes + offsetSemanas * 7);

  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sumarDiasISO(fechaISO, dias) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  f.setDate(f.getDate() + dias);
  const yyyy = f.getFullYear();
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const dd = String(f.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const PRESETS_CICLOS = {
  atr_kyorugi: () => {
    const inicio = obtenerProximoLunesISO(0);
    return {
      titulo: `[PRUEBA] ATR Kyorugi (${inicio})`,
      modelo: "atr",
      granularidad: "mes",
      modalidad: "kyorugi",
      fechaInicio: inicio,
      fechaFin: sumarDiasISO(inicio, 27),
      objetivo: "Acumulación de fuerza explosiva y táctica de combate Kyorugi",
      dias: ["lunes", "miercoles", "viernes"],
    };
  },
  prep_poomsae: () => {
    const inicio = obtenerProximoLunesISO(0);
    return {
      titulo: `[PRUEBA] Poomsae Precisión (${inicio})`,
      modelo: "preparatorio_competitivo",
      granularidad: "semana",
      modalidad: "poomsae",
      fechaInicio: inicio,
      fechaFin: sumarDiasISO(inicio, 13),
      objetivo: "Estabilidad postural, ritmo y precisión técnica en Poomsae",
      dias: ["lunes", "martes", "jueves", "viernes"],
    };
  },
  descarga_dia: () => {
    const inicio = obtenerProximoLunesISO(0);
    return {
      titulo: `[PRUEBA] Descarga Diaria (${inicio})`,
      modelo: "atr",
      granularidad: "dia",
      modalidad: "mixto",
      fechaInicio: inicio,
      fechaFin: sumarDiasISO(inicio, 6),
      objetivo: "Descarga y recuperación activa previa a evaluación",
      dias: ["lunes", "miercoles", "viernes"],
    };
  },
};

function aplicarPreset(nombrePreset) {
  const creador = PRESETS_CICLOS[nombrePreset];
  if (!creador) return;

  const p = creador();
  document.getElementById("pruebaTitulo").value = p.titulo;
  document.getElementById("pruebaModelo").value = p.modelo;
  document.getElementById("pruebaGranularidad").value = p.granularidad;
  document.getElementById("pruebaModalidad").value = p.modalidad;
  document.getElementById("pruebaFechaInicio").value = p.fechaInicio;
  document.getElementById("pruebaFechaFin").value = p.fechaFin;
  document.getElementById("pruebaObjetivo").value = p.objetivo;

  document.querySelectorAll('input[name="pruebaDias"]').forEach((cb) => {
    cb.checked = p.dias.includes(cb.value);
  });
}

function auditarDetalleCiclo(detalle, diasSolicitados = []) {
  const mesos = detalle?.mesociclos || [];
  const micros = detalle?.microciclos || [];
  const sesiones = detalle?.sesiones || [];

  const diasSet = new Set(diasSolicitados.map((d) => String(d).toLowerCase()));
  const sesionesFueraDeDias = sesiones.filter(
    (s) => s.dia_semana && !diasSet.has(String(s.dia_semana).toLowerCase())
  );

  const volumenes = micros
    .map((m) => Number(m.volumen_carga))
    .filter((n) => !Number.isNaN(n));
  const volPromedio =
    volumenes.length > 0
      ? `${(volumenes.reduce((a, b) => a + b, 0) / volumenes.length).toFixed(1)}%`
      : "N/A";

  return {
    totalMesos: mesos.length,
    totalMicros: micros.length,
    totalSesiones: sesiones.length,
    volPromedio,
    fueraDeDiasCount: sesionesFueraDeDias.length,
    primeraSesionId: sesiones[0]?.id ?? null,
  };
}

function renderizarResultadoPrueba(detalle, diasSolicitados) {
  const auditoriaEl = document.getElementById("auditoria-prueba");
  const detalleEl = document.getElementById("resultado-prueba-detalle");
  if (!auditoriaEl || !detalleEl) return;

  const stats = auditarDetalleCiclo(detalle, diasSolicitados);
  const macro = detalle?.macrociclo || {};

  auditoriaEl.innerHTML = `
    <div><strong>Auditoría del ciclo #${macro.id ?? "?"}:</strong> ${macro.titulo || ""}</div>
    <div>
      Mesociclos: <strong>${stats.totalMesos}</strong> ·
      Microciclos: <strong>${stats.totalMicros}</strong> ·
      Sesiones: <strong>${stats.totalSesiones}</strong> ·
      Volumen micro promedio: <strong>${stats.volPromedio}</strong>
    </div>
    <div>
      Sesiones fuera de días elegidos: <strong>${stats.fueraDeDiasCount}</strong>
      ${
        stats.primeraSesionId
          ? ` · <a href="./sesion-detalle.html?sesionId=${stats.primeraSesionId}" class="enlace-sesion">Abrir Sesión #${stats.primeraSesionId}</a>`
          : ""
      }
    </div>
  `;

  if (typeof renderizarJerarquiaCiclo === "function") {
    detalleEl.innerHTML = renderizarJerarquiaCiclo(detalle);
  } else {
    detalleEl.innerHTML = `<pre>${JSON.stringify(detalle, null, 2)}</pre>`;
  }
}

document.querySelectorAll(".btn-preset").forEach((btn) => {
  btn.addEventListener("click", () => aplicarPreset(btn.dataset.preset));
});

const formPrueba = document.getElementById("form-prueba-ciclo");
if (formPrueba) {
  formPrueba.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario =
      typeof exigirSesionActiva === "function" ? exigirSesionActiva() : null;
    if (!usuario) return;

    const auditoriaEl = document.getElementById("auditoria-prueba");
    if (auditoriaEl) auditoriaEl.textContent = "Ejecutando ciclo de prueba...";

    const diasSeleccionados = Array.from(
      document.querySelectorAll('input[name="pruebaDias"]:checked')
    ).map((cb) => cb.value);

    const diasFinales =
      diasSeleccionados.length > 0
        ? diasSeleccionados
        : ["lunes", "miercoles", "viernes"];

    const practicanteVal = Number(
      document.getElementById("pruebaPracticanteId")?.value
    );

    const payload = {
      creador_id: Number(usuario.id),
      practicante_id:
        practicanteVal > 0
          ? practicanteVal
          : usuario.rol === "practicante"
          ? Number(usuario.id)
          : null,
      titulo: document.getElementById("pruebaTitulo").value.trim(),
      modelo_periodizacion: document.getElementById("pruebaModelo").value,
      granularidad_generacion: document.getElementById("pruebaGranularidad")
        .value,
      modalidad: document.getElementById("pruebaModalidad").value,
      fecha_inicio: document.getElementById("pruebaFechaInicio").value,
      fecha_fin: document.getElementById("pruebaFechaFin")?.value || null,
      objetivo_principal: document.getElementById("pruebaObjetivo").value.trim(),
      dias_entrenamiento: diasFinales,
    };

    try {
      const resp = await peticionAPI("/macrociclos/generar", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const macroId = resp.macrociclo_id ?? resp.macrocicloId;
      const detalle = await peticionAPI(`/macrociclos/${macroId}/detalle`);
      ultimaPruebaDetalle = detalle;
      renderizarResultadoPrueba(detalle, diasFinales);
    } catch (err) {
      if (auditoriaEl) {
        auditoriaEl.textContent = `Error en prueba: ${err.message}`;
      }
    }
  });
}

const btnSimularRpe = document.getElementById("btn-probar-rpe-alta");
if (btnSimularRpe) {
  btnSimularRpe.addEventListener("click", async () => {
    const auditoriaEl = document.getElementById("auditoria-prueba");
    const primeraSesion = ultimaPruebaDetalle?.sesiones?.[0];
    if (!primeraSesion?.id) {
      if (auditoriaEl) {
        auditoriaEl.textContent =
          "Primero ejecuta un ciclo de prueba para tener una sesión disponible.";
      }
      return;
    }

    try {
      const ajuste = await peticionAPI(
        `/sesiones/${primeraSesion.id}/ajustar-fatiga`,
        {
          method: "POST",
          body: JSON.stringify({
            rpe_reportado: 9,
            motivo_ajuste: "Simulación de fatiga alta desde laboratorio de pruebas",
          }),
        }
      );
      const macroId = ultimaPruebaDetalle?.macrociclo?.id;
      if (macroId) {
        const actualizado = await peticionAPI(`/macrociclos/${macroId}/detalle`);
        ultimaPruebaDetalle = actualizado;
        renderizarResultadoPrueba(actualizado, [
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
          "domingo",
        ]);
      }
      if (auditoriaEl) {
        auditoriaEl.insertAdjacentHTML(
          "beforeend",
          `<div style="margin-top:0.4rem;"><strong>Simulación RPE 9:</strong> ${
            ajuste.mensaje || "Sesión ajustada"
          } (Plan: ${ajuste.sesion?.tipo_plan || "alternativa_ligera"})</div>`
        );
      }
    } catch (err) {
      if (auditoriaEl) {
        auditoriaEl.textContent = `Error al simular RPE: ${err.message}`;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarPreset("atr_kyorugi");
});