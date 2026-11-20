// frontend/web/js/seguimiento.js
function escaparHTML(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function cargarSesiones() {
  const contenedor = document.getElementById("lista-sesiones");
  if (!contenedor) return;

  const microcicloId = document.getElementById("filtroMicrocicloId")?.value.trim() || "";
  const query = microcicloId ? `?microcicloId=${encodeURIComponent(microcicloId)}` : "";

  contenedor.innerHTML = "<p>Cargando sesiones...</p>";
  try {
    const data = await peticionAPI(`/sesiones${query}`);
    if (!data.sesiones || data.sesiones.length === 0) {
      contenedor.innerHTML = "<p>No hay sesiones registradas con ese filtro.</p>";
      return;
    }

    contenedor.innerHTML = data.sesiones
      .map((s) => {
        const esLigera = s.tipo_plan === "alternativa_ligera";
        const badgeClase = esLigera ? "badge-ligera" : "badge-base";
        const etiquetaPlan = esLigera ? "Alternativa Ligera" : (s.tipo_plan || "Base");
        const diaTexto = s.dia_semana ? escaparHTML(s.dia_semana.toUpperCase()) : "DÍA";
        const lugarTexto = escaparHTML(s.lugar_terreno || "Dojang");
        const tieneRpe =
          s.rpe_reportado !== null && s.rpe_reportado !== undefined && s.rpe_reportado !== "";

        const ejerciciosHtml = (s.ejercicios || [])
          .map((ej) => {
            const intensidad = ej.porcentaje_intensidad
              ? ` · ${escaparHTML(ej.porcentaje_intensidad)}`
              : "";
            const pausa =
              ej.pausa_seg !== undefined && ej.pausa_seg !== null
                ? ` · Pausa: ${escaparHTML(ej.pausa_seg)}s`
                : "";
            return `<li>${escaparHTML(ej.ejercicio_nombre)} — <strong>${escaparHTML(ej.series)}</strong> series (${escaparHTML(ej.repeticiones_o_tiempo)}${intensidad}${pausa})</li>`;
          })
          .join("");

        return `
          <div class="sesion-card">
            <div>
              <strong>Sesión #${escaparHTML(s.id)}</strong> · ${diaTexto} · ${lugarTexto}
              <div>
                <small>
                  Microciclo #${escaparHTML(s.microciclo_id)}
                  ${s.motivo_ajuste ? ` · Motivo: ${escaparHTML(s.motivo_ajuste)}` : ""}
                  ${tieneRpe ? ` · RPE: ${escaparHTML(s.rpe_reportado)}` : ""}
                </small>
              </div>
              <ul style="margin-top: 0.45rem; padding-left: 1.2rem; font-size: 0.88rem;">
                ${ejerciciosHtml || "<li>Sin ejercicios registrados</li>"}
              </ul>
            </div>
            <span class="badge ${badgeClase}">${escaparHTML(etiquetaPlan)}</span>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    contenedor.innerHTML = `<p>Error al cargar sesiones: ${escaparHTML(err.message)}</p>`;
  }
}

const btnCargarSesiones = document.getElementById("btn-cargar-sesiones");
if (btnCargarSesiones) {
  btnCargarSesiones.addEventListener("click", cargarSesiones);
}