// web/js/seguimiento.js
function escaparHTML(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderizarResumenCarga(sesiones = []) {
  const resumenEl = document.getElementById("resumen-carga-seguimiento");
  if (!resumenEl) return;

  if (!Array.isArray(sesiones) || sesiones.length === 0) {
    resumenEl.innerHTML = "";
    return;
  }

  const total = sesiones.length;
  const ajustadas = sesiones.filter(
    (s) => s.tipo_plan === "alternativa_ligera" || s.estado === "ajustada_fatiga"
  ).length;

  const rpes = sesiones
    .map((s) => Number(s.rpe_reportado))
    .filter((n) => !Number.isNaN(n) && n > 0);

  const promedioRpe =
    rpes.length > 0
      ? (rpes.reduce((acc, val) => acc + val, 0) / rpes.length).toFixed(1)
      : "—";

  const alertasFatiga = rpes.filter((r) => r >= 8).length;

  resumenEl.innerHTML = `
    <div class="resumen-carga-grid">
      <span><strong>Sesiones:</strong> ${total}</span>
      <span><strong>Alternativa ligera / ajustadas:</strong> ${ajustadas}</span>
      <span><strong>RPE promedio:</strong> ${promedioRpe}</span>
      <span><strong>Alertas RPE ≥ 8:</strong> ${alertasFatiga}</span>
    </div>
  `;
}

async function cargarSesiones() {
  const contenedor = document.getElementById("lista-sesiones");
  if (!contenedor) return;

  const microcicloId =
    document.getElementById("filtroMicrocicloId")?.value.trim() || "";
  const query = microcicloId
    ? `?microcicloId=${encodeURIComponent(microcicloId)}`
    : "";

  contenedor.innerHTML = "<p>Cargando sesiones...</p>";
  renderizarResumenCarga([]);

  try {
    const data = await peticionAPI(`/sesiones${query}`);
    const sesiones = Array.isArray(data.sesiones) ? data.sesiones : [];

    if (sesiones.length === 0) {
      contenedor.innerHTML =
        "<p>No hay sesiones registradas con ese filtro.</p>";
      return;
    }

    renderizarResumenCarga(sesiones);

    contenedor.innerHTML = sesiones
      .map((s) => {
        const esLigera =
          s.tipo_plan === "alternativa_ligera" || s.estado === "ajustada_fatiga";
        const badgeClase = esLigera ? "badge-ligera" : "badge-base";
        const etiquetaPlan =
          s.tipo_plan === "alternativa_ligera"
            ? "Alternativa Ligera"
            : s.tipo_plan || "Base";
        const diaTexto = s.dia_semana
          ? escaparHTML(String(s.dia_semana).toUpperCase())
          : "DÍA";
        const fechaTexto = s.fecha_sesion
          ? ` · ${escaparHTML(s.fecha_sesion)}`
          : "";
        const lugarTexto = escaparHTML(s.lugar_terreno || "Dojang");
        const tieneRpe =
          s.rpe_reportado !== null &&
          s.rpe_reportado !== undefined &&
          s.rpe_reportado !== "";
        const rpeAlto = tieneRpe && Number(s.rpe_reportado) >= 8;

        const ejerciciosHtml = (s.ejercicios || [])
          .map((ej) => {
            const intensidad = ej.porcentaje_intensidad
              ? ` · ${escaparHTML(ej.porcentaje_intensidad)}`
              : "";
            const pausa =
              ej.pausa_seg !== undefined && ej.pausa_seg !== null
                ? ` · Pausa: ${escaparHTML(ej.pausa_seg)}s`
                : "";
            const marcaLigera = ej.es_alternativa_ligera
              ? " <em>(Ligera)</em>"
              : "";
            return `<li>${escaparHTML(ej.ejercicio_nombre)}${marcaLigera} — <strong>${escaparHTML(ej.series)}</strong> series (${escaparHTML(ej.repeticiones_o_tiempo)}${intensidad}${pausa})</li>`;
          })
          .join("");

        return `
          <div class="sesion-card ${rpeAlto ? "sesion-alerta-fatiga" : ""}" data-sesion-id="${escaparHTML(s.id)}">
            <div>
              <strong>
                <a href="./sesion-detalle.html?sesionId=${encodeURIComponent(s.id)}" class="enlace-sesion">
                  Sesión #${escaparHTML(s.id)}
                </a>
              </strong> · ${diaTexto}${fechaTexto} · ${lugarTexto}
              <div>
                <small>
                  Microciclo #${escaparHTML(s.microciclo_id)}
                  ${s.estado ? ` · Estado: ${escaparHTML(s.estado)}` : ""}
                  ${s.motivo_ajuste ? ` · Motivo: ${escaparHTML(s.motivo_ajuste)}` : ""}
                  ${tieneRpe ? ` · RPE: <strong>${escaparHTML(s.rpe_reportado)}</strong>` : ""}
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

async function cargarMacrociclosUsuario() {
  const contenedor = document.getElementById("lista-macrociclos-usuario");
  if (!contenedor) return;

  const usuario =
    typeof obtenerUsuarioActivo === "function"
      ? obtenerUsuarioActivo()
      : typeof obtenerSesionUsuario === "function"
      ? obtenerSesionUsuario()
      : null;

  if (!usuario?.id) {
    contenedor.innerHTML = "";
    return;
  }

  try {
    const data = await peticionAPI(
      `/macrociclos?usuarioId=${encodeURIComponent(usuario.id)}`
    );
    const planes = Array.isArray(data.macrociclos) ? data.macrociclos : [];

    if (planes.length === 0) {
      contenedor.innerHTML = "<p>Aún no tienes macrociclos creados.</p>";
      return;
    }

    contenedor.innerHTML = planes
      .map(
        (m) => `
        <div class="macro-item-card">
          <div>
            <strong>#${escaparHTML(m.id)} · ${escaparHTML(m.titulo)}</strong>
            <div>
              <small>
                Modelo: ${escaparHTML(m.modelo_periodizacion || "atr")} ·
                Granularidad: ${escaparHTML(m.granularidad_generacion || "mes")} ·
                Modalidad: ${escaparHTML(m.modalidad || "mixto")} ·
                ${escaparHTML(m.fecha_inicio || "")} al ${escaparHTML(m.fecha_fin || "")}
              </small>
            </div>
          </div>
          <button type="button" class="btn-secundario btn-ver-macro" data-macro-id="${escaparHTML(m.id)}">
            Ver detalle
          </button>
        </div>
      `
      )
      .join("");

    contenedor.querySelectorAll(".btn-ver-macro").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.macroId);
        if (id && typeof verDetalleMacrociclo === "function") {
          verDetalleMacrociclo(id);
        }
      });
    });
  } catch {
    // Si el contenedor existe pero el endpoint aún no devuelve lista, no bloquea la vista
  }
}

const btnCargarSesiones = document.getElementById("btn-cargar-sesiones");
if (btnCargarSesiones) {
  btnCargarSesiones.addEventListener("click", cargarSesiones);
}

document.addEventListener("DOMContentLoaded", cargarMacrociclosUsuario);