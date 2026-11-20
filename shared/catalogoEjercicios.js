// Catalogo base de ejemplo alineado con el modelo guia + Taekwondo
const CATALOGO_EJERCICIOS = [
  { id: 1, nombre: "Calentamiento dinamico + movilidad articular", categoria: "movilidad_recuperacion", impacto: "bajo", equipamiento: "ninguno", alternativaId: null },
  { id: 2, nombre: "Sentadilla con carga (%RM)", categoria: "fuerza_adaptacion", impacto: "medio", equipamiento: "gimnasio", alternativaId: 1 },
  { id: 3, nombre: "Saltos al cajon / pliometria de tren inferior", categoria: "fuerza_potencia", impacto: "alto", equipamiento: "conos_vallas", alternativaId: 1 },
  { id: 4, nombre: "Trabajo intermitente en peto/escudo (rondas 20s x 20s)", categoria: "potencia_aerobica", impacto: "alto", equipamiento: "peto_escudo", alternativaId: 5 },
  { id: 5, nombre: "Sombra tecnica de pateo y desplazamientos (ritmo controlado)", categoria: "tecnica_kyorugi", impacto: "bajo", equipamiento: "ninguno", alternativaId: 1 },
  { id: 6, nombre: "Ejecucion de Poomsae con control postural y respiracion", categoria: "poomsae", impacto: "bajo", equipamiento: "ninguno", alternativaId: 1 },
  { id: 7, nombre: "Sprint corto / reaccion visual a estimulo", categoria: "velocidad_agilidad", impacto: "alto", equipamiento: "conos_vallas", alternativaId: 5 },
  { id: 8, nombre: "Estiramiento guiado y descarga respiratoria", categoria: "movilidad_recuperacion", impacto: "bajo", equipamiento: "ninguno", alternativaId: null }
];

// 1. Generar una sesion base segun periodo y modalidad de Taekwondo
function generarSesionBase({ diaSemana, periodo, modalidad = "kyorugi", lugarTerreno = "Dojang" }) {
  const esDescarga = periodo === "descarga";
  const esCompetitivo = periodo === "competitivo";

  const ejercicios = [
    {
      ejercicioId: 1,
      series: 1,
      repeticionesOTiempo: esDescarga ? "12 min" : "18 min",
      porcentajeIntensidad: "50-60% FCmax",
      pausaSeg: 30,
      notasTecnicas: "Movilidad de cadera, tobillo y columna toracica"
    }
  ];

  if (esDescarga) {
    ejercicios.push({
      ejercicioId: modalidad === "poomsae" ? 6 : 5,
      series: 3,
      repeticionesOTiempo: "3 min",
      porcentajeIntensidad: "60% RPE",
      pausaSeg: 60,
      notasTecnicas: "Enfasis en fluidez, postura y tecnica limpia sin fatiga acumulada"
    });
  } else if (modalidad === "poomsae") {
    ejercicios.push(
      {
        ejercicioId: 2,
        series: esCompetitivo ? 3 : 4,
        repeticionesOTiempo: esCompetitivo ? "5 reps" : "8 reps",
        porcentajeIntensidad: esCompetitivo ? "75% RM" : "70% RM",
        pausaSeg: 90,
        notasTecnicas: "Estabilidad de base y fuerza de piernas"
      },
      {
        ejercicioId: 6,
        series: esCompetitivo ? 5 : 4,
        repeticionesOTiempo: "1 Poomsae completo",
        porcentajeIntensidad: "80-85% esfuerzo",
        pausaSeg: 75,
        notasTecnicas: "Precision de angulos, equilibrio y transiciones"
      }
    );
  } else {
    // Kyorugi o mixto
    ejercicios.push(
      {
        ejercicioId: periodo === "preparacion_general" ? 2 : 3,
        series: esCompetitivo ? 3 : 4,
        repeticionesOTiempo: periodo === "preparacion_general" ? "8 reps" : "6 saltos",
        porcentajeIntensidad: periodo === "preparacion_general" ? "75% RM" : "75% potencia",
        pausaSeg: 90,
        notasTecnicas: "Maxima velocidad de ejecucion en cada repeticion"
      },
      {
        ejercicioId: esCompetitivo ? 7 : 4,
        series: esCompetitivo ? 5 : 4,
        repeticionesOTiempo: esCompetitivo ? "6 repeticiones" : "20s trabajo x 20s pausa",
        porcentajeIntensidad: "85-90% esfuerzo",
        pausaSeg: 60,
        notasTecnicas: "Transicion rapida a patada/desplazamiento de combate"
      }
    );
  }

  ejercicios.push({
    ejercicioId: 8,
    series: 1,
    repeticionesOTiempo: "10 min",
    porcentajeIntensidad: "Recuperacion",
    pausaSeg: 0,
    notasTecnicas: "Vuelta a la calma y elongacion de aductores, isquios y psoas"
  });

  return {
    diaSemana,
    tipoPlan: "base_entrenador",
    lugarTerreno,
    ejercicios
  };
}

// 2. Generar plan alternativo mas ligero cuando el practicante esta sobrecargado
// nivelAjuste: 'ligero' (-25% volumen) o 'recuperacion' (-40% volumen y sustitucion de alto impacto)
function generarPlanAlternativoLigero(sesionBase, {
  nivelAjuste = "ligero",
  motivoAjuste = "sobrecarga",
  rpeReportado = 8,
  catalogo = CATALOGO_EJERCICIOS
}) {
  const factorVolumen = nivelAjuste === "recuperacion" ? 0.6 : 0.75; // -40% o -25%
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
