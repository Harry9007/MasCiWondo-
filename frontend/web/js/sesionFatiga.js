// web/js/sesionFatiga.js
const etiquetaPlan = {
  base_entrenador: "Plan base del entrenador",
  alternativa_ligera: "Alternativa ligera (autoregulada)",
  plan_propio: "Plan propio",
};

const etiquetaEstado = {
  planificada: "Planificada",
  completada: "Completada",
  ajustada_fatiga: "Ajustada por fatiga",
  omitida: "Omitida",
};

function renderizarCabeceraSesion(sesion) {
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
    badgePlan.textContent = etiquetaPlan[tipoPlan] || tipoPlan;
    badgePlan.dataset.tipoPlan = tipoPlan;
  }

  if (badgeEstado) {
    badgeEstado.textContent = etiquetaEstado[estado] || estado;
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

function renderizarEjerciciosSesion(ejercicios = []) {
  const contenedor = document.getElementById("lista-ejercicios-sesion");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
    contenedor.innerHTML = `<li class="vacio">No hay ejercicios asignados a esta sesión todavía.</li>`;
    return;
  }

  for (const ej of ejercicios) {
    const esAlternativa = Boolean(ej.es_alternativa_ligera);
    const li = document.createElement("li");
    li.className = esAlternativa
      ? "ejercicio-item alternativa-ligera"
      : "ejercicio-item";

    const intensidadTexto = ej.porcentaje_intensidad
      ? ` · Intensidad: ${ej.porcentaje_intensidad}`
      : "";
    const notasTexto = ej.notas_tecnicas
      ? `<p class="notas-tecnicas">Nota técnica: ${ej.notas_tecnicas}</p>`
      : "";
    const tagAlternativa = esAlternativa
      ? `<span class="tag-ligera">Alternativa ligera aplicada</span>`
      : `<span class="tag-base">Base</span>`;

    li.innerHTML = `
      <div class="ejercicio-top">
        <strong>#${ej.orden} · ${ej.ejercicio_nombre}</strong>
        ${tagAlternativa}
      </div>
      <p class="ejercicio-detalle">
        Categoría: ${ej.categoria} · Impacto: ${ej.impacto} · Equipo: ${ej.equipamiento}
      </p>
      <p class="ejercicio-carga">
        ${ej.series} series × ${ej.repeticiones_o_tiempo} · Pausa: ${ej.pausa_seg}s${intensidadTexto}
      </p>
      ${notasTexto}
    `;

    contenedor.appendChild(li);
  }
}

async function cargarEjerciciosSesion(sesionId) {
  if (typeof peticionAPI === "function") {
    const data = await peticionAPI(`/sesiones/${sesionId}/ejercicios`);
    return data.ejercicios || [];
  }
  const base = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL
    : `${API_BASE_URL}/api`;
  const res = await fetch(`${base}/sesiones/${sesionId}/ejercicios`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error || "Error al obtener los ejercicios de la sesión"
    );
  }
  return data.ejercicios || [];
}

async function enviarAjusteFatiga(sesionId, payload) {
  if (typeof peticionAPI === "function") {
    return peticionAPI(`/sesiones/${sesionId}/ajustar-fatiga`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  const base = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL
    : `${API_BASE_URL}/api`;
  const res = await fetch(`${base}/sesiones/${sesionId}/ajustar-fatiga`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "No se pudo actualizar la sesión");
  }
  return data;
}

async function inicializarVistaSesion(sesion) {
  if (!sesion || !sesion.id) return;

  renderizarCabeceraSesion(sesion);
  const ejercicios = await cargarEjerciciosSesion(sesion.id);
  renderizarEjerciciosSesion(ejercicios);

  const form = document.getElementById("form-fatiga-sesion");
  const feedback = document.getElementById("fatiga-feedback");
  const btnGuardar = document.getElementById("btn-guardar-fatiga");

  if (!form) return;

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (feedback) feedback.textContent = "";
    if (btnGuardar) btnGuardar.disabled = true;

    try {
      const rpeReportado = Number(document.getElementById("input-rpe").value);
      const motivoAjuste = document
        .getElementById("input-motivo-ajuste")
        ?.value.trim();

      const data = await enviarAjusteFatiga(sesion.id, {
        rpe_reportado: rpeReportado,
        motivo_ajuste: motivoAjuste || undefined,
      });

      renderizarCabeceraSesion(data.sesion || sesion);
      const ejerciciosActualizados = await cargarEjerciciosSesion(sesion.id);
      renderizarEjerciciosSesion(ejerciciosActualizados);

      if (feedback) {
        feedback.textContent =
          data.mensaje || "Sesión actualizada correctamente.";
      }
    } catch (err) {
      if (feedback) feedback.textContent = err.message;
    } finally {
      if (btnGuardar) btnGuardar.disabled = false;
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sesionIdParam = Number(params.get("sesionId"));
  if (!sesionIdParam) return;

  const feedback = document.getElementById("fatiga-feedback");
  try {
    let sesionObj = { id: sesionIdParam };
    if (typeof peticionAPI === "function") {
      try {
        const resSesion = await peticionAPI(`/sesiones/${sesionIdParam}`);
        if (resSesion?.sesion) sesionObj = resSesion.sesion;
      } catch {
        // Si no existe GET /sesiones/:id, igual carga ejercicios con el ID de la URL
      }
    }
    await inicializarVistaSesion(sesionObj);
  } catch (err) {
    if (feedback) feedback.textContent = err.message;
  }
});