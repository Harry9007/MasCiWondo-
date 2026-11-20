// frontend/mobile/js/modoLigero.js
document.getElementById("formModoLigero").addEventListener("submit", async (e) => {
  e.preventDefault();
  const sesionBaseId = document.getElementById("sesionBaseId").value.trim();
  const salida = document.getElementById("resultadoLigero");
  salida.textContent = "Generando alternativa ligera...";

  const cuerpo = {
    nivelAjuste: document.getElementById("nivelAjuste").value,
    rpeReportado: Number(document.getElementById("rpeReportado").value),
    motivoAjuste: document.getElementById("motivoAjuste").value
  };

  try {
    const resp = await llamarAPI(`/sesiones/${encodeURIComponent(sesionBaseId)}/alternativa-ligera`, {
      method: "POST",
      body: JSON.stringify(cuerpo)
    });

    const ejResumen = (resp.data?.ejercicios || [])
      .map((item) => `- Ejercicio #${item.ejercicioId}: ${item.series} series (${item.repeticionesOTiempo})`)
      .join("\n");

    salida.textContent =
      `Alternativa ligera creada (ID Sesión #${resp.data?.sesionId}):\n${ejResumen}`;
  } catch (error) {
    salida.textContent = `Error: ${error.message}`;
  }
});