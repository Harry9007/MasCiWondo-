// frontend/mobile/js/sesionDia.js
async function buscarSesionesMovil() {
  const microcicloId = document.getElementById("inputMicrociclo").value.trim();
  const contenedor = document.getElementById("contenedorSesiones");
  contenedor.innerHTML = "<p>Cargando...</p>";

  const query = microcicloId ? `?microcicloId=${encodeURIComponent(microcicloId)}` : "";
  try {
    const data = await llamarAPI(`/sesiones${query}`);
    if (!data.sesiones || data.sesiones.length === 0) {
      contenedor.innerHTML = "<p>No se encontraron sesiones.</p>";
      return;
    }

    contenedor.innerHTML = data.sesiones
      .map(
        (ses) => `
          <div class="item-sesion">
            <strong>ID #${ses.id}</strong> · ${ses.dia_semana.toUpperCase()} (${ses.tipo_plan})
            <div><small>Terreno: ${ses.lugar_terreno} · Microciclo #${ses.microciclo_id}</small></div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

document.getElementById("btnBuscarSesiones").addEventListener("click", buscarSesionesMovil);