// mobile/js/mobileSesiones.js
function escMovil(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function cargarSesionesMovil() {
  const contenedor = document.getElementById("movil-lista-sesiones");
  if (!contenedor) return;

  const microId =
    document.getElementById("movilFiltroMicrociclo")?.value.trim() || "";
  const query = microId
    ? `?microcicloId=${encodeURIComponent(microId)}`
    : "";

  contenedor.innerHTML = "<p>Cargando sesiones...</p>";

  try {
    const data = await peticionAPI(`/sesiones${query}`);
    const sesiones = Array.isArray(data.sesiones) ? data.sesiones : [];

    if (sesiones.length === 0) {
      contenedor.innerHTML = "<p>No hay sesiones registradas.</p>";
      return;
    }

    contenedor.innerHTML = sesiones
      .map((s) => {
        const esLigera =
          s.tipo_plan === "alternativa_ligera" ||
          s.estado === "ajustada_fatiga";
        const badgeClase = esLigera ? "badge-ligera" : "badge-base";
        const etiqueta = esLigera
          ? "Alternativa Ligera"
          : s.tipo_plan || "Base";
        const rpeTexto =
          s.rpe_reportado !== null && s.rpe_reportado !== undefined
            ? ` · RPE ${escMovil(s.rpe_reportado)}/10`
            : "";

        return `
          <article class="sesion-card ${esLigera ? "sesion-alerta-fatiga" : ""}">
            <div style="width:100%;">
              <div class="ejercicio-top">
                <strong>Sesión #${escMovil(s.id)} · ${escMovil(
                  String(s.dia_semana || "").toUpperCase()
                )}</strong>
                <span class="badge ${badgeClase}">${escMovil(etiqueta)}</span>
              </div>
              <p class="sesion-meta">
                ${escMovil(s.fecha_sesion || "")} · ${escMovil(
                  s.lugar_terreno || "Dojang"
                )}${rpeTexto}
              </p>
              <a
                href="./sesion-detalle.html?sesionId=${encodeURIComponent(s.id)}"
                class="btn-primario btn-sesion-movil"
              >
                Abrir Sesión y Reportar RPE
              </a>
            </div>
          </article>
        `;
      })
      .join("");
  } catch (err) {
    contenedor.innerHTML = `<p>Error al cargar sesiones: ${escMovil(
      err.message
    )}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-movil-cargar")
    ?.addEventListener("click", cargarSesionesMovil);
  cargarSesionesMovil();
});