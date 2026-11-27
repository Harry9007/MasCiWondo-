// mobile/js/mobileAuth.js
function esVistaSesionesMovil() {
  const ruta = window.location.pathname || "";
  return ruta.endsWith("/sesiones.html") || ruta.endsWith("sesiones.html");
}

function sincronizarEstadoMovil() {
  const usuario =
    typeof obtenerSesionUsuario === "function" ? obtenerSesionUsuario() : null;
  const estadoEl = document.getElementById("estado-sesion-usuario");
  const btnLogout = document.getElementById("btn-cerrar-sesion");
  const formsAuth = document.getElementById("formularios-auth");
  const btnIrLogin = document.getElementById("btn-ir-login");
  const btnIrSesiones = document.getElementById("btn-ir-sesiones");

  if (btnIrLogin) {
    btnIrLogin.style.display = usuario ? "none" : "inline-flex";
  }
  if (btnIrSesiones) {
    btnIrSesiones.style.display = usuario ? "inline-flex" : "none";
  }

  if (usuario) {
    if (estadoEl) {
      estadoEl.textContent = `Sesión activa: ${usuario.nombre} (${String(
        usuario.rol || ""
      ).toUpperCase()} · ID #${usuario.id})`;
    }
    if (btnLogout) btnLogout.style.display = "inline-flex";
    if (formsAuth) formsAuth.style.display = "none";
  } else {
    if (estadoEl) estadoEl.textContent = "No has iniciado sesión.";
    if (btnLogout) btnLogout.style.display = "none";
    if (formsAuth) formsAuth.style.display = "";
  }
}

async function cargarEntrenadoresMovil() {
  const selectEnt = document.getElementById("regEntrenadorId");
  if (!selectEnt || typeof peticionAPI !== "function") return;
  try {
    const data = await peticionAPI("/auth/entrenadores");
    const opts = (data.entrenadores || [])
      .map(
        (ent) =>
          `<option value="${ent.id}">${ent.nombre} (${ent.modalidad})</option>`
      )
      .join("");
    selectEnt.innerHTML = `<option value="">Sin asignar</option>${opts}`;
  } catch {
    // Mantiene opción por defecto
  }
}

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.getAttribute("data-target");
    document
      .querySelectorAll(".auth-tab")
      .forEach((t) => t.classList.remove("activa"));
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

const formLoginMovil = document.getElementById("form-login");
if (formLoginMovil) {
  formLoginMovil.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Iniciando sesión...";
    try {
      const data = await peticionAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("loginEmail").value.trim(),
          password: document.getElementById("loginPassword").value,
        }),
      });
      if (typeof guardarSesionUsuario === "function") {
        guardarSesionUsuario(data.usuario);
      }
      sincronizarEstadoMovil();
      if (msg) msg.textContent = `Bienvenido/a, ${data.usuario.nombre}.`;
      formLoginMovil.reset();
      if (!esVistaSesionesMovil()) {
        setTimeout(() => {
          window.location.href = "./sesiones.html";
        }, 400);
      }
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
    const entVal = document.getElementById("regEntrenadorId")?.value || null;
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
          entrenadorId: entVal ? Number(entVal) : null,
        }),
      });
      if (typeof guardarSesionUsuario === "function") {
        guardarSesionUsuario(data.usuario);
      }
      sincronizarEstadoMovil();
      if (msg) msg.textContent = `Cuenta creada para ${data.usuario.nombre}.`;
      formRegistroMovil.reset();
      if (!esVistaSesionesMovil()) {
        setTimeout(() => {
          window.location.href = "./sesiones.html";
        }, 400);
      }
    } catch (err) {
      if (msg) msg.textContent = `Error: ${err.message}`;
    }
  });
}

const btnCerrarMovil = document.getElementById("btn-cerrar-sesion");
if (btnCerrarMovil) {
  btnCerrarMovil.addEventListener("click", () => {
    if (typeof cerrarSesionUsuario === "function") cerrarSesionUsuario();
    sincronizarEstadoMovil();
    const msg = document.getElementById("mensaje-auth");
    if (msg) msg.textContent = "Sesión cerrada.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  sincronizarEstadoMovil();
  cargarEntrenadoresMovil();
});