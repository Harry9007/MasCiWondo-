// frontend/web/js/macrociclo.js
document.getElementById("form-macrociclo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cajaResultado = document.getElementById("resultado-macrociclo");
  cajaResultado.textContent = "Generando macrociclo...";

  const payload = {
    creadorId: Number(document.getElementById("creadorId").value),
    titulo: document.getElementById("titulo").value.trim(),
    fechaInicio: document.getElementById("fechaInicio").value,
    fechaFin: document.getElementById("fechaFin").value,
    objetivoPrincipal: document.getElementById("objetivoPrincipal").value.trim(),
    modalidad: document.getElementById("modalidad").value,
    mesociclos: [
      {
        nombre: document.getElementById("mesoNombre").value.trim(),
        periodo: document.getElementById("periodo").value,
        semanasDuracion: Number(document.getElementById("semanasDuracion").value),
        diasActivos: ["lunes", "martes", "miercoles", "jueves", "viernes"]
      }
    ]
  };

  try {
    const data = await peticionAPI("/ciclos/macrociclos", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    cajaResultado.textContent =
      `Macrociclo creado (ID: ${data.macrocicloId}) con ${data.semanasGeneradas} semana(s) generada(s).`;
  } catch (err) {
    cajaResultado.textContent = `Error: ${err.message}`;
  }
});