document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const sesionId = Number(params.get("sesionId") || params.get("id"));

  const elBadgePlan = document.getElementById("sesion-badge-plan");
  const elBadgeEstado = document.getElementById("sesion-badge-estado");
  const elTitulo = document.getElementById("sesion-titulo");
  const elMeta = document.getElementById("sesion-meta");
  const elRpeValor = document.getElementById("sesion-rpe-valor");
  const elMotivoAjuste = document.getElementById("sesion-motivo-ajuste");

  const formFatiga = document.getElementById("form-fatiga-sesion");
  const inputRpe = document.getElementById("input-rpe");
  const inputMotivo = document.getElementById("input-motivo-ajuste");
  const btnGuardarFatiga = document.getElementById("btn-guardar-fatiga");
  const elFeedback = document.getElementById("fatiga-feedback");
  const listaEjercicios = document.getElementById("lista-ejercicios-sesion");

  function mostrarFeedback(texto, esError = false) {
    if (!elFeedback) return;
    elFeedback.textContent = texto;
    elFeedback.classList.toggle("error", esError);
    elFeedback.classList.toggle("ok", !esError && Boolean(texto));
  }

  function renderizarSesion(sesion) {
    if (!sesion) return;

    if (elBadgePlan) {
      elBadgePlan.textContent = sesion.tipo_plan || "base_entrenador";
    }
    if (elBadgeEstado) {
      elBadgeEstado.textContent = sesion.estado || "planificada";
    }
    if (elTitulo) {
      elTitulo.textContent =
        sesion.titulo || sesion.nombre || `Sesión #${sesion.id}`;
    }
    if (elMeta) {
      const partes = [];
      if (sesion.dia_semana) partes.push(`Día: ${sesion.dia_semana}`);
      if (sesion.modalidad) partes.push(`Modalidad: ${sesion.modalidad}`);
      if (sesion.duracion_min) partes.push(`Duración: ${sesion.duracion_min} min`);
      elMeta.textContent = partes.join(" · ");
    }
    if (elRpeValor) {
      elRpeValor.textContent =
        sesion.rpe_reportado !== null && sesion.rpe_reportado !== undefined
          ? `${sesion.rpe_reportado}/10`
          : "--";
    }
    if (elMotivoAjuste) {
      elMotivoAjuste.textContent = sesion.motivo_ajuste || "";
    }
    if (
      inputRpe &&
      sesion.rpe_reportado !== null &&
      sesion.rpe_reportado !== undefined &&
      !inputRpe.value
    ) {
      inputRpe.value = sesion.rpe_reportado;
    }
    if (inputMotivo && sesion.motivo_ajuste && !inputMotivo.value) {
      inputMotivo.value = sesion.motivo_ajuste;
    }
  }

  function renderizarEjercicios(ejercicios) {
    if (!listaEjercicios) return;
    listaEjercicios.innerHTML = "";

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
      listaEjercicios.innerHTML =
        '<li class="ejercicio-vacio">No hay ejercicios registrados para esta sesión.</li>';
      return;
    }

    ejercicios.forEach((ej, idx) => {
      const li = document.createElement("li");
      li.className = "ejercicio-item";
      if (ej.es_alternativa_ligera) {
        li.classList.add("alternativa-ligera");
      }

      const nombre =
        ej.ejercicio_nombre || ej.nombre || `Ejercicio ${ej.orden || idx + 1}`;
      const series = ej.series ?? "-";
      const repTiempo = ej.repeticiones_o_tiempo ?? "-";
      const pausa =
        ej.pausa_seg !== null && ej.pausa_seg !== undefined
          ? `${ej.pausa_seg}s pausa`
          : "";
      const intensidad = ej.porcentaje_intensidad || "";
      const detalleCarga = [
        `${series} series`,
        repTiempo,
        pausa,
        intensidad,
      ]
        .filter(Boolean)
        .join(" · ");

      const metaExtra = [
        ej.categoria ? `Cat: ${ej.categoria}` : "",
        ej.impacto ? `Impacto: ${ej.impacto}` : "",
        ej.equipamiento ? `Equip: ${ej.equipamiento}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      li.innerHTML = `
        <div class="ejercicio-principal">
          <strong>${ej.orden || idx + 1}. ${nombre}</strong>
          ${ej.es_alternativa_ligera ? '<span class="badge-ligera">Alternativa ligera</span>' : ""}
        </div>
        <div class="ejercicio-carga">${detalleCarga}</div>
        ${metaExtra ? `<div class="ejercicio-meta">${metaExtra}</div>` : ""}
        ${ej.notas_tecnicas ? `<p class="ejercicio-notas">${ej.notas_tecnicas}</p>` : ""}
      `;

      listaEjercicios.appendChild(li);
    });
  }

  async function cargarDetalleCompleto() {
    if (!Number.isInteger(sesionId) || sesionId <= 0) {
      if (elTitulo) elTitulo.textContent = "Sesión no especificada";
      mostrarFeedback(
        "Falta el parámetro sesionId en la URL (ej. sesiondetalle.html?sesionId=90001).",
        true
      );
      return;
    }

    try {
      mostrarFeedback("Cargando sesión y ejercicios...");
      const [dataSesion, dataEjercicios] = await Promise.all([
        peticionAPI(`/sesiones/${sesionId}`),
        peticionAPI(`/sesiones/${sesionId}/ejercicios`),
      ]);

      renderizarSesion(dataSesion.sesion);
      renderizarEjercicios(dataEjercicios.ejercicios);
      mostrarFeedback("");
    } catch (error) {
      console.error("Error al cargar detalle de sesión:", error);
      mostrarFeedback(error.message || "No se pudo cargar la sesión.", true);
    }
  }

  if (formFatiga) {
    formFatiga.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      if (!Number.isInteger(sesionId) || sesionId <= 0) {
        mostrarFeedback("ID de sesión inválido.", true);
        return;
      }

      const rpe = Number(inputRpe?.value);
      const motivo = inputMotivo?.value?.trim() || "";

      if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
        mostrarFeedback("Ingresa un RPE válido entre 1 y 10.", true);
        return;
      }

      try {
        if (btnGuardarFatiga) btnGuardarFatiga.disabled = true;
        mostrarFeedback("Guardando registro de RPE...");

        const resp = await peticionAPI(`/sesiones/${sesionId}/ajustar-fatiga`, {
          method: "POST",
          body: JSON.stringify({
            rpe_reportado: rpe,
            motivo_ajuste: motivo || undefined,
          }),
        });

        if (resp.sesion) {
          renderizarSesion(resp.sesion);
        }

        const dataEjercicios = await peticionAPI(`/sesiones/${sesionId}/ejercicios`);
        renderizarEjercicios(dataEjercicios.ejercicios);

        mostrarFeedback(resp.mensaje || "RPE registrado correctamente.");
      } catch (error) {
        console.error("Error al registrar fatiga:", error);
        mostrarFeedback(
          error.message || "No se pudo registrar el RPE.",
          true
        );
      } finally {
        if (btnGuardarFatiga) btnGuardarFatiga.disabled = false;
      }
    });
  }

  cargarDetalleCompleto();
});