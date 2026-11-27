// mobile/js/mobileApp.js
function escaparTextoMovil(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sincronizarCabeceraMovil() {
  const usuario =
    typeof obtenerSesionUsuario === "function" ? obtenerSesionUsuario() : null;
  const estadoEl = document.getElementById("estado-sesion-usuario");
  const btnIrLogin = document.getElementById("btn-ir-login");
  const btnSalir = document.getElementById("btn-cerrar-sesion");

  if (usuario) {
    if (estadoEl) {
      estadoEl.textContent = `${usuario.nombre} (${String(
        usuario.rol || "practicante"
      ).toUpperCase()} · ID #${usuario.id})`;
    }
    if (btnIrLogin) btnIrLogin.style.display = "none";
    if (btnSalir) {
      btnSalir.style.display = "inline-flex";
      btnSalir.onclick = () => {
        if (typeof cerrarSesionUsuario === "function") cerrarSesionUsuario();
        sincronizarCabeceraMovil();
      };
    }
  } else {
    if (estadoEl) estadoEl.textContent = "No has iniciado sesión.";
    if (btnIrLogin) btnIrLogin.style.display = "inline-flex";
    if (btnSalir) btnSalir.style.display = "none";
  }
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
      contenedor.innerHTML =
        "<p>No hay sesiones disponibles para mostrar.</p>";
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
            ? ` · RPE ${escaparTextoMovil(s.rpe_reportado)}/10`
            : "";

        return `
          <article class="sesion-card ${esLigera ? "sesion-alerta-fatiga" : ""}">
            <div style="width:100%;">
              <div class="ejercicio-top">
                <strong>Sesión #${escaparTextoMovil(s.id)} · ${escaparTextoMovil(
                  String(s.dia_semana || "").toUpperCase()
                )}</strong>
                <span class="badge ${badgeClase}">${escaparTextoMovil(etiqueta)}</span>
              </div>
              <p class="sesion-meta">
                ${escaparTextoMovil(s.fecha_sesion || "")} · ${escaparTextoMovil(
                  s.lugar_terreno || "Dojang"
                )}${rpeTexto}
              </p>
              <a
                href="../web/sesion-detalle.html?sesionId=${encodeURIComponent(s.id)}"
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
    contenedor.innerHTML = `<p>Error al cargar sesiones: ${escaparTextoMovil(
      err.message
    )}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  sincronizarCabeceraMovil();
  document
    .getElementById("btn-movil-cargar")
    ?.addEventListener("click", cargarSesionesMovil);
  cargarSesionesMovil();
});