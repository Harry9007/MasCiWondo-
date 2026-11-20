// frontend/mobile/js/api.js
const API_URL = "http://localhost:3000/api";

async function llamarAPI(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Error al comunicar con el servidor");
  }
  return datos;
}