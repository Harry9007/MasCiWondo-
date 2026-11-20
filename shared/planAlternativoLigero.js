const { CATALOGO_EJERCICIOS } = require("./catalogoEjercicios");

function generarPlanAlternativoLigero(
  sesionBase,
  {
    nivelAjuste = "ligero",
    motivoAjuste = "sobrecarga",
    rpeReportado = 8,
    catalogo = CATALOGO_EJERCICIOS
  } = {}
) {
  const factorVolumen = nivelAjuste === "recuperacion" ? 0.6 : 0.75;
  const sustituirAltoImpacto = nivelAjuste === "recuperacion" || rpeReportado >= 8;

  const ejerciciosAjustados = sesionBase.ejercicios.map((item) => {
    const infoEjercicio = catalogo.find((e) => e.id === item.ejercicioId);
    let ejercicioIdFinal = item.ejercicioId;
    let notaExtra = "Ajuste por sobrecarga";

    if (
      sustituirAltoImpacto &&
      infoEjercicio &&
      infoEjercicio.impacto === "alto" &&
      infoEjercicio.alternativaId
    ) {
      ejercicioIdFinal = infoEjercicio.alternativaId;
      notaExtra = `Sustituido (${infoEjercicio.nombre}) por menor impacto`;
    }

    const nuevasSeries = Math.max(1, Math.round(item.series * factorVolumen));
    const nuevaPausa = item.pausaSeg > 0 ? Math.round(item.pausaSeg * 1.25) : 0;

    return {
      ...item,
      ejercicioId: ejercicioIdFinal,
      series: nuevasSeries,
      pausaSeg: nuevaPausa,
      porcentajeIntensidad:
        nivelAjuste === "recuperacion" ? "Suave / control (RPE 5-6)" : "Moderada (RPE 6-7)",
      notasTecnicas: `${item.notasTecnicas}. [${notaExtra}]`
    };
  });

  return {
    ...sesionBase,
    tipoPlan: "alternativa_ligera",
    sesionOrigenId: sesionBase.id ?? null,
    motivoAjuste,
    rpeReportado,
    ejercicios: ejerciciosAjustados
  };
}

module.exports = { generarPlanAlternativoLigero };