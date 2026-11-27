// mobile/js/mobileSesionDetalle.js
const ETIQUETAS_PLAN_MOVIL = {
  base_entrenador: "Plan base del entrenador",
  alternativa_ligera: "Alternativa ligera (autoregulada)",
  plan_propio: "Plan propio",
};

const ETIQUETAS_ESTADO_MOVIL = {
  planificada: "Planificada",
  completada: "Completada",
  ajustada_fatiga: "Ajustada por fatiga",
  omitida: "Omitida",
};

function pintarCabeceraMovil(sesion) {
  if (!sesion) return;

  const badgePlan = document.getElementById("sesion-badge-plan");
  const badgeEstado = document.getElementById("sesion-badge-estado");
  const titulo = document.getElementById("sesion-titulo");
  const meta = document.getElementById("sesion-meta");
  const rpeValor = document.getElementById("sesion-rpe-valor");
  const motivoEl = document.getElementById("sesion-motivo-ajuste");
  const inputRpe = document.getElementById("input-rpe");

  const tipoPlan = sesion.tipo_plan || "base_entrenador";
  const estado = sesion.estado || "planificada";

  if (badgePlan) {
    badgePlan.textContent = ETIQUETAS_PLAN_MOVIL[tipoPlan] || tipoPlan;
    badgePlan.dataset.tipoPlan = tipoPlan;
  }

  if (badgeEstado) {
    badgeEstado.textContent = ETIQUETAS_ESTADO_MOVIL[estado] || estado;
    badgeEstado.dataset.estado = estado;
  }

  if (titulo) {
    titulo.textContent = `Sesión del ${sesion.dia_semana || ""} (${
      sesion.fecha_sesion || ""
    })`.trim();
  }

  if (meta) {
    meta.textContent = `Terreno: ${sesion.lugar_terreno || "Dojang"}${
      sesion.observaciones ? ` · ${sesion.observaciones}` : ""
    }`;
  }

  if (rpeValor) {
    rpeValor.textContent =
      sesion.rpe_reportado !== null && sesion.rpe_reportado !== undefined
        ? `${sesion.rpe_reportado}/10`
        : "Sin reportar";
  }

  if (
    inputRpe &&
    sesion.rpe_reportado !== null &&
    sesion.rpe_reportado !== undefined
  ) {
    inputRpe.value = sesion.rpe_reportado;
  }

  if (motivoEl) {
    motivoEl.textContent = sesion.motivo_ajuste
      ? `Nota de ajuste: ${sesion.motivo_ajuste}`
      : "";
  }
}

function pintarEjerciciosMovil(ejercicios = []) {
  const ul = document.getElementById("lista-ejercicios-sesion");
  if (!ul) return;
  ul.innerHTML = "";

  if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
    ul.innerHTML = `<li class="vacio">No hay ejercicios asignados a esta sesión.</li>`;
    return;
  }

  for (const ej of ejercicios) {
    const esLigera = Boolean(ej.es_alternativa_ligera);
    const li = document.createElement("li");
    li.className = esLigera
      ? "ejercicio-item alternativa-ligera"
      : "ejercicio-item";

    const intensidad = ej.porcentaje_intensidad
      ? ` · Intensidad: ${ej.porcentaje_intensidad}`
      : "";
    const notas = ej.notas_tecnicas
      ? `<p class="notas-tecnicas">Nota técnica: ${ej.notas_tecnicas}</p>`
      : "";
    const tag = esLigera
      ? `<span class="tag-ligera">Alternativa ligera aplicada</span>`
      : `<span class="tag-base">Base</span>`;

    li.innerHTML = `
      <div class="ejercicio-top">
        <strong>#${ej.orden} · ${ej.ejercicio_nombre}</strong>
        ${tag}
      </div>
      <p class="ejercicio-detalle">
        ${ej.categoria} · Impacto: ${ej.impacto} · Equipo: ${ej.equipamiento}
      </p>
      <p class="ejercicio-carga">
        ${ej.series} series × ${ej.repeticiones_o_tiempo} · Pausa: ${ej.pausa_seg}s${intensidad}
      </p>
      ${notas}
    `;

    ul.appendChild(li);
  }
}

async function cargarDetalleMovil(sesionId) {
  let sesionObj = { id: sesionId };
  try {
    const resSesion = await peticionAPI(`/sesiones/${sesionId}`);
    if (resSesion?.sesion) sesionObj = resSesion.sesion;
  } catch {
    // Si no existe GET /sesiones/:id, continúa con el ID
  }

  pintarCabeceraMovil(sesionObj);
  const resEj = await peticionAPI(`/sesiones/${sesionId}/ejercicios`);
  pintarEjerciciosMovil(resEj.ejercicios || []);

  const form = document.getElementById("form-fatiga-sesion");
  const feedback = document.getElementById("fatiga-feedback");
  const btn = document.getElementById("btn-guardar-fatiga");

  if (!form) return;

  form.onsubmit = async (ev) => {
    ev.preventDefault();
    if (feedback) feedback.textContent = "";
    if (btn) btn.disabled = true;

    try {
      const rpeReportado = Number(document.getElementById("input-rpe").value);
      const motivoAjuste = document
        .getElementById("input-motivo-ajuste")
        ?.value.trim();

      const resp = await peticionAPI(`/sesiones/${sesionId}/ajustar-fatiga`, {
        method: "POST",
        body: JSON.stringify({
          rpe_reportado: rpeReportado,
          motivo_ajuste: motivoAjuste || undefined,
        }),
      });

      pintarCabeceraMovil(resp.sesion || sesionObj);
      const actualizada = await peticionAPI(`/sesiones/${sesionId}/ejercicios`);
      pintarEjerciciosMovil(actualizada.ejercicios || []);

      if (feedback) {
        feedback.textContent =
          resp.mensaje || "Fatiga registrada y sesión actualizada.";
      }
    } catch (err) {
      if (feedback) feedback.textContent = err.message;
    } finally {
      if (btn) btn.disabled = false;
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sesionId = Number(params.get("sesionId"));
  const feedback = document.getElementById("fatiga-feedback");

  if (!sesionId) {
    if (feedback) {
      feedback.textContent =
        "Selecciona una sesión desde Mis Sesiones para ver su detalle y reportar RPE.";
    }
    return;
  }

  try {
    await cargarDetalleMovil(sesionId);
  } catch (err) {
    if (feedback) feedback.textContent = err.message;
  }
});