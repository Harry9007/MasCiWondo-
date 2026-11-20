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
      notasTecnicas: "Movilidad de cadera, tobillo y columna torácica"
    }
  ];

  if (esDescarga) {
    ejercicios.push({
      ejercicioId: modalidad === "poomsae" ? 6 : 5,
      series: 3,
      repeticionesOTiempo: "3 min",
      porcentajeIntensidad: "60% RPE",
      pausaSeg: 60,
      notasTecnicas: "Énfasis en fluidez, postura y técnica limpia sin fatiga acumulada"
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
        notasTecnicas: "Precisión de ángulos, equilibrio y transiciones"
      }
    );
  } else {
    ejercicios.push(
      {
        ejercicioId: periodo === "preparacion_general" ? 2 : 3,
        series: esCompetitivo ? 3 : 4,
        repeticionesOTiempo: periodo === "preparacion_general" ? "8 reps" : "6 saltos",
        porcentajeIntensidad: periodo === "preparacion_general" ? "75% RM" : "75% potencia",
        pausaSeg: 90,
        notasTecnicas: "Máxima velocidad de ejecución en cada repetición"
      },
      {
        ejercicioId: esCompetitivo ? 7 : 4,
        series: esCompetitivo ? 5 : 4,
        repeticionesOTiempo: esCompetitivo ? "6 repeticiones" : "20s trabajo x 20s pausa",
        porcentajeIntensidad: "85-90% esfuerzo",
        pausaSeg: 60,
        notasTecnicas: "Transición rápida a patada/desplazamiento de combate"
      }
    );
  }

  ejercicios.push({
    ejercicioId: 8,
    series: 1,
    repeticionesOTiempo: "10 min",
    porcentajeIntensidad: "Recuperación",
    pausaSeg: 0,
    notasTecnicas: "Vuelta a la calma y elongación de aductores, isquios y psoas"
  });

  return {
    diaSemana,
    tipoPlan: "base_entrenador",
    lugarTerreno,
    ejercicios
  };
}

function generarSemanaMicrociclo({
  periodo = "preparacion_general",
  modalidad = "kyorugi",
  diasActivos = ["lunes", "martes", "miercoles", "jueves", "viernes"]
}) {
  return diasActivos.map((diaSemana) => {
    const lugarTerreno =
      diaSemana === "martes" || diaSemana === "jueves" ? "Gimnasio / Pista" : "Dojang";
    return generarSesionBase({ diaSemana, periodo, modalidad, lugarTerreno });
  });
}

module.exports = { generarSesionBase, generarSemanaMicrociclo };