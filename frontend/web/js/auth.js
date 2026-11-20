const STORAGE_KEY_USUARIO = "masciwondo_usuario";

function esRutaMacrociclo() {
  const rutaActual = window.location.pathname || "";
  return rutaActual.endsWith("/macrociclo.html") || rutaActual.endsWith("macrociclo.html");
}

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

function irAMacrocicloSiCorresponde() {
  if (!esRutaMacrociclo()) {
    setTimeout(() => {
      window.location.href = "macrociclo.html";
    }, 500);
  }
}

function protegerRutaMacrociclo(usuario = obtenerUsuarioActivo()) {
  if (esRutaMacrociclo() && !usuario) {
    window.location.replace("index.html");
  }
}

function aplicarContextoUsuario(usuario) {
  const estadoEl = document.getElementById("estado-sesion-usuario");
  const btnLogout = document.getElementById("btn-cerrar-sesion");
  const formsAuth = document.getElementById("formularios-auth");
  const btnIrLogin = document.getElementById("btn-ir-login");

  if (btnIrLogin) {
    btnIrLogin.style.display = usuario ? "none" : "inline-block";
  }

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

  actualizarBloqueoPorSesion(usuario);
}

function actualizarBloqueoPorSesion(usuario) {
  const formMacro = document.getElementById("form-macrociclo");
  const resultadoMacro = document.getElementById("resultado-macrociclo");
  const btnGenerar = formMacro?.querySelector('button[type="submit"]');
  const panelMacro = document.getElementById("panel-macrociclo");
  const panelSeguimiento = document.getElementById("panel-seguimiento");
  const avisoSinSesion = document.getElementById("aviso-sin-sesion");

  const haySesion = Boolean(usuario);

  if (panelMacro) {
    panelMacro.classList.toggle("bloqueado-sesion", !haySesion);
    panelMacro.style.display = haySesion ? "" : "none";
  }

  if (panelSeguimiento) {
    panelSeguimiento.style.display = haySesion ? "" : "none";
  }

  if (avisoSinSesion) {
    avisoSinSesion.style.display = haySesion ? "none" : "block";
  }

  if (!formMacro) return;

  if (!haySesion) {
    if (btnGenerar) btnGenerar.disabled = true;
    if (resultadoMacro) {
      resultadoMacro.textContent =
        "Debes iniciar sesión para generar macrociclos, mesociclos y entrenamientos semanales.";
    }
  } else {
    if (btnGenerar) btnGenerar.disabled = false;
    if (
      resultadoMacro &&
      resultadoMacro.textContent.includes("Debes iniciar sesión para generar macrociclos")
    ) {
      resultadoMacro.textContent = "";
    }
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
      if (msg) msg.textContent = `Bienvenido/a, ${data.usuario.nombre}. Redirigiendo a macrociclos...`;
      formLogin.reset();
      irAMacrocicloSiCorresponde();
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
      if (data.usuario?.rol === "entrenador") {
        await cargarListaEntrenadores();
      }
      if (msg) msg.textContent = `Cuenta creada para ${data.usuario.nombre}. Redirigiendo a macrociclos...`;
      formRegistro.reset();
      irAMacrocicloSiCorresponde();
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
    protegerRutaMacrociclo(null);
  });
}

function exigirSesionActiva(
  mensajeCustom = "Debes iniciar sesión o crear una cuenta antes de generar ciclos o entrenamientos."
) {
  const usuario = obtenerUsuarioActivo();
  if (!usuario) {
    const msgAuth = document.getElementById("mensaje-auth");
    if (msgAuth) msgAuth.textContent = mensajeCustom;
    document.getElementById("seccion-cuenta")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return null;
  }
  return usuario;
}

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.getAttribute("data-target");

    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("activa"));
    tab.classList.add("activa");

    document.querySelectorAll(".auth-form-panel").forEach((panel) => {
      panel.classList.toggle("activo", panel.id === targetId);
    });
  });
});

document.querySelectorAll("[data-ir-registro='true']").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("tab-registro")?.click();
  });
});

// Inicialización al cargar la página
const usuarioInicial = obtenerUsuarioActivo();
protegerRutaMacrociclo(usuarioInicial);
aplicarContextoUsuario(usuarioInicial);
cargarListaEntrenadores();