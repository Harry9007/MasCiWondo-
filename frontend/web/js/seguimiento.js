// frontend/web/js/seguimiento.js
async function cargarSesiones() {
  const contenedor = document.getElementById("lista-sesiones");
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
        const etiquetaPlan = esLigera ? "Alternativa Ligera" : s.tipo_plan;
        const diaTexto = s.dia_semana ? s.dia_semana.toUpperCase() : "DÍA";
        const lugarTexto = s.lugar_terreno || "Dojang";

        const ejerciciosHtml = (s.ejercicios || [])
          .map((ej) => {
            const intensidad = ej.porcentaje_intensidad ? ` · ${ej.porcentaje_intensidad}` : "";
            const pausa =
              ej.pausa_seg !== undefined && ej.pausa_seg !== null
                ? ` · Pausa: ${ej.pausa_seg}s`
                : "";
            return `<li>${ej.ejercicio_nombre} — <strong>${ej.series}</strong> series (${ej.repeticiones_o_tiempo}${intensidad}${pausa})</li>`;
          })
          .join("");

        return `
          <div class="sesion-card">
            <div>
              <strong>Sesión #${s.id}</strong> · ${diaTexto} · ${lugarTexto}
              <div>
                <small>
                  Microciclo #${s.microciclo_id}
                  ${s.motivo_ajuste ? ` · Motivo: ${s.motivo_ajuste}` : ""}
                  ${s.rpe_reportado ? ` · RPE: ${s.rpe_reportado}` : ""}
                </small>
              </div>
              <ul style="margin-top: 0.45rem; padding-left: 1.2rem; font-size: 0.88rem;">
                ${ejerciciosHtml || "<li>Sin ejercicios registrados</li>"}
              </ul>
            </div>
            <span class="badge ${badgeClase}">${etiquetaPlan}</span>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    contenedor.innerHTML = `<p>Error al cargar sesiones: ${err.message}</p>`;
  }
}

const btnCargarSesiones = document.getElementById("btn-cargar-sesiones");
if (btnCargarSesiones) {
  btnCargarSesiones.addEventListener("click", cargarSesiones);
}