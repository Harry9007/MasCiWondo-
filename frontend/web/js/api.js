// frontend/web/js/api.js
const API_BASE_URL = "http://localhost:3000/api";

async function peticionAPI(endpoint, opciones = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Error en la petición a la API");
  }
  return data;
}