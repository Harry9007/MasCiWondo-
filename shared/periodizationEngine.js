const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

function parseIsoDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function formatIsoDate(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateObj, days) {
  const copy = new Date(dateObj.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getMondayOfWeek(dateObj) {
  const day = dateObj.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateObj, diff);
}

function getDiaSemanaSpanish(dateObj) {
  return DIAS_SEMANA[dateObj.getUTCDay()];
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function normalizeGranularity(granularity) {
  const map = {
    anio: "anio",
    ano: "anio",
    year: "anio",
    mes: "mes",
    month: "mes",
    semana: "semana",
    week: "semana",
    dia: "dia",
    day: "dia",
  };
  return map[String(granularity || "mes").toLowerCase()] || "mes";
}

function normalizeModel(model) {
  const val = String(model || "atr").toLowerCase();
  if (
    val === "preparatorio_competitivo" ||
    val === "matveev" ||
    val === "tradicional"
  ) {
    return "preparatorio_competitivo";
  }
  return "atr";
}

function normalizeModality(modality) {
  const val = String(modality || "mixto").toLowerCase();
  if (["kyorugi", "poomsae", "mixto"].includes(val)) {
    return val;
  }
  return "mixto";
}

function resolveDateRange({
  fecha_inicio,
  fecha_fin,
  granularidad_generacion = "mes",
}) {
  const gran = normalizeGranularity(granularidad_generacion);
  const start = fecha_inicio ? parseIsoDate(fecha_inicio) : new Date();
  const baseStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );

  let end;
  if (fecha_fin) {
    end = parseIsoDate(fecha_fin);
  } else if (gran === "anio") {
    end = addDays(addDays(baseStart, 365), -1);
  } else if (gran === "semana") {
    end = addDays(baseStart, 6);
  } else if (gran === "dia") {
    end = baseStart;
  } else {
    end = addDays(baseStart, 27);
  }

  if (end < baseStart) {
    end = baseStart;
  }

  return {
    granularidad: gran,
    fecha_inicio: formatIsoDate(baseStart),
    fecha_fin: formatIsoDate(end),
    startDateObj: baseStart,
    endDateObj: end,
  };
}

function getMesoBlueprint(modelo, index, totalMesos) {
  if (modelo === "preparatorio_competitivo") {
    if (index === totalMesos && totalMesos >= 3) {
      return {
        nombre: `Meso ${index}: Descarga y Afinacion`,
        periodo: "descarga",
        enfoque_fuerza: "Mantenimiento reactivo bajo volumen",
        enfoque_resistencia: "Ritmo competitivo fraccionado",
        enfoque_velocidad: "Velocidad de reaccion y salida",
        enfoque_tecnico: "Tactica especifica y control de ritmo",
        volumen_objetivo: 45,
        intensidad_objetivo: 85,
      };
    }

    const ratio = index / Math.max(1, totalMesos);
    if (ratio <= 0.4) {
      return {
        nombre: `Meso ${index}: Preparacion General`,
        periodo: "preparacion_general",
        enfoque_fuerza: "Adaptacion anatomica y fuerza general",
        enfoque_resistencia: "Capacidad aerobica base",
        enfoque_velocidad: "Coordinacion y frecuencia basica",
        enfoque_tecnico: "Fundamentos tecnicos y desplazamientos",
        volumen_objetivo: 80,
        intensidad_objetivo: 60,
      };
    }

    if (ratio <= 0.75) {
      return {
        nombre: `Meso ${index}: Preparacion Especial`,
        periodo: "preparacion_especial",
        enfoque_fuerza: "Fuerza-potencia aplicada al pateo",
        enfoque_resistencia: "Potencia aerobica y tolerancia lactica",
        enfoque_velocidad: "Velocidad gestual y cambios de ritmo",
        enfoque_tecnico: "Combinaciones de combate / Poomsae en fatiga",
        volumen_objetivo: 68,
        intensidad_objetivo: 78,
      };
    }

    return {
      nombre: `Meso ${index}: Periodo Competitivo`,
      periodo: "competitivo",
      enfoque_fuerza: "Potencia explosiva especifica",
      enfoque_resistencia: "Resistencia a rounds de competencia",
      enfoque_velocidad: "Velocidad maxima y anticipacion",
      enfoque_tecnico: "Simulacion competitiva y estrategia",
      volumen_objetivo: 52,
      intensidad_objetivo: 90,
    };
  }

  const mod3 = (index - 1) % 3;
  if (mod3 === 0) {
    return {
      nombre: `Bloque A${Math.ceil(index / 3)}: Acumulacion`,
      periodo: "acumulacion",
      enfoque_fuerza: "Hipertrofia funcional y fuerza base",
      enfoque_resistencia: "Capacidad aerobica y eficiencia energetica",
      enfoque_velocidad: "Frecuencia de pasos y tecnica limpia",
      enfoque_tecnico: "Volumen tecnico, guardia y desplazamientos",
      volumen_objetivo: 82,
      intensidad_objetivo: 62,
    };
  }

  if (mod3 === 1) {
    return {
      nombre: `Bloque T${Math.ceil(index / 3)}: Transformacion`,
      periodo: "transformacion",
      enfoque_fuerza: "Fuerza-potencia y resistencia a la fuerza",
      enfoque_resistencia: "Potencia aerobica y capacidad glucolitica",
      enfoque_velocidad: "Velocidad-potencia en pateo",
      enfoque_tecnico: "Acciones tecnicas encadenadas y contraataque",
      volumen_objetivo: 66,
      intensidad_objetivo: 80,
    };
  }

  return {
    nombre: `Bloque R${Math.ceil(index / 3)}: Realizacion`,
    periodo: "realizacion",
    enfoque_fuerza: "Potencia explosiva y activacion neuromuscular",
    enfoque_resistencia: "Alta intensidad intermitente especifica",
    enfoque_velocidad: "Velocidad de reaccion y explosividad",
    enfoque_tecnico: "Modelado competitivo y precision tactica",
    volumen_objetivo: 48,
    intensidad_objetivo: 92,
  };
}

function getMicroBlueprint(weekIndexInMeso, weeksInMeso, baseVol, baseInt) {
  const isLast = weekIndexInMeso === weeksInMeso;
  if (isLast && weeksInMeso >= 3) {
    return {
      tipo_microciclo: "recuperacion",
      es_descarga: true,
      volumen_carga: clamp(Math.round(baseVol * 0.65), 30, 85),
      intensidad_carga: clamp(Math.round(baseInt * 0.78), 35, 90),
      observaciones: "Microciclo de descarga / supercompensacion.",
    };
  }

  if (weekIndexInMeso === 1) {
    return {
      tipo_microciclo: "ajuste",
      es_descarga: false,
      volumen_carga: clamp(Math.round(baseVol * 0.85), 35, 95),
      intensidad_carga: clamp(Math.round(baseInt * 0.85), 40, 95),
      observaciones: "Microciclo de ajuste inicial y adaptacion.",
    };
  }

  if (weekIndexInMeso === weeksInMeso - 1 && weeksInMeso >= 4) {
    return {
      tipo_microciclo: "choque",
      es_descarga: false,
      volumen_carga: clamp(Math.round(baseVol * 1.05), 40, 100),
      intensidad_carga: clamp(Math.round(baseInt * 1.05), 45, 100),
      observaciones: "Microciclo de choque con estimulo elevado.",
    };
  }

  return {
    tipo_microciclo: "corriente",
    es_descarga: false,
    volumen_carga: clamp(baseVol, 35, 100),
    intensidad_carga: clamp(baseInt, 40, 100),
    observaciones: "Microciclo corriente de progresion regular.",
  };
}

function generatePeriodizationPlan({
  titulo,
  modelo_periodizacion = "atr",
  granularidad_generacion = "mes",
  modalidad = "mixto",
  fecha_inicio,
  fecha_fin,
  objetivo_principal = "Desarrollo integral de Taekwondo",
  dias_entrenamiento = ["lunes", "miercoles", "viernes"],
  practicante_id = null,
}) {
  const modelo = normalizeModel(modelo_periodizacion);
  const mod = normalizeModality(modalidad);
  const range = resolveDateRange({
    fecha_inicio,
    fecha_fin,
    granularidad_generacion,
  });

  const totalDays = Math.max(
    1,
    Math.round((range.endDateObj - range.startDateObj) / 86400000) + 1
  );
  const totalWeeksApprox = Math.max(1, Math.ceil(totalDays / 7));

  let numMesos;
  if (range.granularidad === "dia" || range.granularidad === "semana") {
    numMesos = 1;
  } else if (range.granularidad === "anio") {
    numMesos = clamp(Math.round(totalWeeksApprox / 4), 3, 12);
  } else {
    numMesos = clamp(Math.round(totalWeeksApprox / 4), 1, 6);
  }

  const diasLista =
    Array.isArray(dias_entrenamiento) && dias_entrenamiento.length > 0
      ? dias_entrenamiento
      : ["lunes", "miercoles", "viernes"];
  const diasSet = new Set(diasLista.map((d) => String(d).toLowerCase()));

  const mesociclos = [];
  const baseWeeksPerMeso = Math.max(1, Math.floor(totalWeeksApprox / numMesos));
  let remainderWeeks = totalWeeksApprox - baseWeeksPerMeso * numMesos;

  for (let m = 1; m <= numMesos; m++) {
    const extra = remainderWeeks > 0 ? 1 : 0;
    if (remainderWeeks > 0) {
      remainderWeeks--;
    }
    const semanasDuracion = baseWeeksPerMeso + extra;
    const bp = getMesoBlueprint(modelo, m, numMesos);

    const microciclos = [];
    for (let w = 1; w <= semanasDuracion; w++) {
      const microsPrevios = mesociclos.reduce(
        (acc, item) => acc + item.microciclos.length,
        0
      );
      const globalWeekIdx = microciclos.length + 1 + microsPrevios;
      const weekStartCandidate = addDays(
        range.startDateObj,
        (globalWeekIdx - 1) * 7
      );
      const fechaLunes =
        globalWeekIdx === 1
          ? formatIsoDate(range.startDateObj)
          : formatIsoDate(getMondayOfWeek(weekStartCandidate));

      const microBp = getMicroBlueprint(
        w,
        semanasDuracion,
        bp.volumen_objetivo,
        bp.intensidad_objetivo
      );
      const sesiones = [];

      for (let d = 0; d < 7; d++) {
        const currentDate = addDays(parseIsoDate(fechaLunes), d);
        if (currentDate < range.startDateObj || currentDate > range.endDateObj) {
          continue;
        }

        const diaNombre = getDiaSemanaSpanish(currentDate);
        if (!diasSet.has(diaNombre)) {
          continue;
        }

        sesiones.push({
          practicante_id,
          fecha_sesion: formatIsoDate(currentDate),
          dia_semana: diaNombre,
          tipo_plan: "base_entrenador",
          estado: "planificada",
          sesion_origen_id: null,
          lugar_terreno: "Dojang",
          rpe_reportado: null,
          motivo_ajuste: null,
          observaciones: `${bp.nombre} - ${microBp.tipo_microciclo.toUpperCase()} (${mod.toUpperCase()})`,
        });
      }

      microciclos.push({
        numero_semana: globalWeekIdx,
        fecha_lunes: fechaLunes,
        tipo_microciclo: microBp.tipo_microciclo,
        es_descarga: microBp.es_descarga,
        volumen_carga: microBp.volumen_carga,
        intensidad_carga: microBp.intensidad_carga,
        observaciones: microBp.observaciones,
        sesiones,
      });
    }

    mesociclos.push({
      numero_meso: m,
      nombre: bp.nombre,
      periodo: bp.periodo,
      enfoque_fuerza: bp.enfoque_fuerza,
      enfoque_resistencia: bp.enfoque_resistencia,
      enfoque_velocidad: bp.enfoque_velocidad,
      enfoque_tecnico: bp.enfoque_tecnico,
      semanas_duracion: semanasDuracion,
      volumen_objetivo: bp.volumen_objetivo,
      intensidad_objetivo: bp.intensidad_objetivo,
      microciclos,
    });
  }

  return {
    macrociclo: {
      titulo: titulo || `Plan ${modelo.toUpperCase()} (${range.granularidad})`,
      modelo_periodizacion: modelo,
      granularidad_generacion: range.granularidad,
      modalidad: mod,
      fecha_inicio: range.fecha_inicio,
      fecha_fin: range.fecha_fin,
      objetivo_principal,
    },
    mesociclos,
  };
}

function adjustSessionForFatigue({ rpe_reportado, motivo_ajuste }) {
  const rpe = Number(rpe_reportado);
  const altaFatiga = !Number.isNaN(rpe) && rpe >= 8;

  return {
    rpe_reportado: Number.isNaN(rpe) ? null : clamp(rpe, 1, 10),
    tipo_plan: altaFatiga ? "alternativa_ligera" : "base_entrenador",
    estado: altaFatiga ? "ajustada_fatiga" : "completada",
    motivo_ajuste:
      motivo_ajuste ||
      (altaFatiga
        ? `Fatiga elevada reportada (RPE ${rpe}): reduccion de volumen e impacto.`
        : "Sesion completada dentro de carga tolerada."),
    es_alternativa_ligera: altaFatiga,
    factor_volumen: altaFatiga ? 0.6 : 1,
    factor_pausa: altaFatiga ? 1.35 : 1,
  };
}

module.exports = {
  resolveDateRange,
  generatePeriodizationPlan,
  adjustSessionForFatigue,
};