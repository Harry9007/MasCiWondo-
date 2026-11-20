// frontend/mobile/js/auth.js
const STORAGE_KEY_USUARIO_MOVIL = "masciwondo_usuario";

function obtenerUsuarioActivoMovil() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USUARIO_MOVIL);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarUsuarioActivoMovil(usuario) {
  localStorage.setItem(STORAGE_KEY_USUARIO_MOVIL, JSON.stringify(usuario));
  aplicarContextoUsuarioMovil(usuario);
}

function limpiarUsuarioActivoMovil() {
  localStorage.removeItem(STORAGE_KEY_USUARIO_MOVIL);
  aplicarContextoUsuarioMovil(null);
}

function aplicarContextoUsuarioMovil(usuario) {
  const estadoEl = document.getElementById("estado-sesion-usuario");
  const btnLogout = document.getElementById("btn-cerrar-sesion");
  const formsAuth = document.getElementById("formularios-auth");

  if (usuario) {
    if (estadoEl) {
      estadoEl.textContent = `Sesión activa: ${usuario.nombre} (${usuario.rol.toUpperCase()} · ${usuario.modalidad} · ID #${usuario.id})`;
    }
    if (btnLogout) btnLogout.style.display = "inline-block";
    if (formsAuth) formsAuth.style.display = "none";
  } else {
    if (estadoEl) estadoEl.textContent = "No has iniciado sesión.";
    if (btnLogout) btnLogout.style.display = "none";
    if (formsAuth) formsAuth.style.display = "";
  }
}

async function cargarListaEntrenadoresMovil() {
  const selectEntrenador = document.getElementById("regEntrenadorId");
  if (!selectEntrenador) return;

  try {
    const data = await llamarAPI("/auth/entrenadores");
    const opciones = (data.entrenadores || [])
      .map((ent) => `<option value="${ent.id}">${ent.nombre} (${ent.modalidad})</option>`)
      .join("");
    selectEntrenador.innerHTML = `<option value="">Sin asignar</option>${opciones}`;
  } catch {
    // Mantiene la opción por defecto si aún no hay entrenadores o falla la red
  }
}

const formLoginMovil = document.getElementById("form-login");
if (formLoginMovil) {
  formLoginMovil.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Iniciando sesión...";

    try {
      const data = await llamarAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("loginEmail").value.trim(),
          password: document.getElementById("loginPassword").value
        })
      });
      guardarUsuarioActivoMovil(data.usuario);
      if (msg) msg.textContent = `Bienvenido/a, ${data.usuario.nombre}.`;
      formLoginMovil.reset();
    } catch (err) {
      if (msg) msg.textContent = `Error: ${err.message}`;
    }
  });
}

const formRegistroMovil = document.getElementById("form-registro");
if (formRegistroMovil) {
  formRegistroMovil.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Registrando cuenta...";

    const entrenadorVal = document.getElementById("regEntrenadorId")?.value || null;

    try {
      const data = await llamarAPI("/auth/registro", {
        method: "POST",
        body: JSON.stringify({
          nombre: document.getElementById("regNombre").value.trim(),
          email: document.getElementById("regEmail").value.trim(),
          password: document.getElementById("regPassword").value,
          rol: document.getElementById("regRol").value,
          modalidad: document.getElementById("regModalidad").value,
          nivel: document.getElementById("regNivel").value,
          entrenadorId: entrenadorVal ? Number(entrenadorVal) : null
        })
      });
      guardarUsuarioActivoMovil(data.usuario);
      if (msg) msg.textContent = `Cuenta creada para ${data.usuario.nombre}.`;
      formRegistroMovil.reset();
    } catch (err) {
      if (msg) msg.textContent = `Error: ${err.message}`;
    }
  });
}

const btnCerrarSesionMovil = document.getElementById("btn-cerrar-sesion");
if (btnCerrarSesionMovil) {
  btnCerrarSesionMovil.addEventListener("click", () => {
    limpiarUsuarioActivoMovil();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Sesión cerrada.";
  });
}

aplicarContextoUsuarioMovil(obtenerUsuarioActivoMovil());
cargarListaEntrenadoresMovil();