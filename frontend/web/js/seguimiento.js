// frontend/web/js/seguimiento.js
async function cargarSesiones() {
  const contenedor = document.getElementById("lista-sesiones");
  const microcicloId = document.getElementById("filtroMicrocicloId").value.trim();
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
        return `
          <div class="sesion-card">
            <div>
              <strong>Sesión #${s.id}</strong> · ${s.dia_semana.toUpperCase()} · ${s.lugar_terreno}
              <div><small>Microciclo #${s.microciclo_id}${s.motivo_ajuste ? ` · Motivo: ${s.motivo_ajuste}` : ""}${s.rpe_reportado ? ` · RPE: ${s.rpe_reportado}` : ""}</small></div>
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

document.getElementById("btn-cargar-sesiones").addEventListener("click", cargarSesiones);