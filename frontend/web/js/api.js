// web/js/api.js
const RENDER_API_URL = "https://masciwondo.onrender.com/api";
const LOCAL_API_URL = "http://localhost:3000/api";

const esLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE_URL = esLocalhost ? LOCAL_API_URL : RENDER_API_URL;
const SESSION_KEY = "masciwondo_usuario";

function guardarSesionUsuario(usuario) {
  if (!usuario) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

function obtenerSesionUsuario() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error al leer la sesión desde localStorage:", error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function cerrarSesionUsuario() {
  localStorage.removeItem(SESSION_KEY);
}

async function peticionAPI(endpoint, opciones = {}) {
  const rutaNormalizada = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const headersCombinados = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${rutaNormalizada}`, {
    ...opciones,
    headers: headersCombinados,
  });

  const textoRespuesta = await res.text();
  let data = {};

  if (textoRespuesta) {
    try {
      data = JSON.parse(textoRespuesta);
    } catch {
      throw new Error(
        `Respuesta no JSON del servidor (HTTP ${res.status})`
      );
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `Error en la petición a la API (HTTP ${res.status})`);
  }

  return data;
}