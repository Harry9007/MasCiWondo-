const STORAGE_KEY_USUARIO = "masciwondo_usuario";

function obtenerUsuarioActivo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USUARIO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarUsuarioActivo(usuario) {
  localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuario));
  aplicarContextoUsuario(usuario);
}

function limpiarUsuarioActivo() {
  localStorage.removeItem(STORAGE_KEY_USUARIO);
  aplicarContextoUsuario(null);
}

function aplicarContextoUsuario(usuario) {
  const estadoEl = document.getElementById("estado-sesion-usuario");
  const btnLogout = document.getElementById("btn-cerrar-sesion");
  const formsAuth = document.getElementById("formularios-auth");

  if (usuario) {
    if (estadoEl) {
      estadoEl.textContent = `Sesión activa: ${usuario.nombre} (${usuario.rol.toUpperCase()} · ${usuario.modalidad} · ID #${usuario.id})`;
    }
    if (btnLogout) btnLogout.style.display = "inline-block";
    if (formsAuth) formsAuth.style.display = "none";

    // Sincronizar campos del panel web si existen
    const inputCreador = document.getElementById("creadorId");
    if (inputCreador && usuario.rol === "entrenador") {
      inputCreador.value = usuario.id;
    }
    const selectModalidad = document.getElementById("modalidad");
    if (selectModalidad && usuario.modalidad) {
      selectModalidad.value = usuario.modalidad;
    }
  } else {
    if (estadoEl) estadoEl.textContent = "No has iniciado sesión.";
    if (btnLogout) btnLogout.style.display = "none";
    if (formsAuth) formsAuth.style.display = "";
  }
}

async function cargarListaEntrenadores() {
  const selectEntrenador = document.getElementById("regEntrenadorId");
  if (!selectEntrenador) return;

  try {
    const data = await peticionAPI("/auth/entrenadores");
    const opciones = (data.entrenadores || [])
      .map((ent) => `<option value="${ent.id}">${ent.nombre} (${ent.modalidad})</option>`)
      .join("");
    selectEntrenador.innerHTML = `<option value="">Sin asignar</option>${opciones}`;
  } catch {
    // Si falla la carga de entrenadores, mantiene la opción por defecto
  }
}

const formLogin = document.getElementById("form-login");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Iniciando sesión...";

    try {
      const data = await peticionAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("loginEmail").value.trim(),
          password: document.getElementById("loginPassword").value
        })
      });
      guardarUsuarioActivo(data.usuario);
      if (msg) msg.textContent = `Bienvenido/a, ${data.usuario.nombre}.`;
      formLogin.reset();
    } catch (err) {
      if (msg) msg.textContent = `Error: ${err.message}`;
    }
  });
}

const formRegistro = document.getElementById("form-registro");
if (formRegistro) {
  formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Registrando usuario...";

    const entrenadorVal = document.getElementById("regEntrenadorId")?.value || null;

    try {
      const data = await peticionAPI("/auth/registro", {
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
      guardarUsuarioActivo(data.usuario);
      if (msg) msg.textContent = `Cuenta creada para ${data.usuario.nombre}.`;
      formRegistro.reset();
    } catch (err) {
      if (msg) msg.textContent = `Error: ${err.message}`;
    }
  });
}

const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener("click", () => {
    limpiarUsuarioActivo();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Sesión cerrada.";
  });
}

// Inicialización al cargar la página
aplicarContextoUsuario(obtenerUsuarioActivo());
cargarListaEntrenadores();