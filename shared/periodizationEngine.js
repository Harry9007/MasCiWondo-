const DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function parseDateUTC(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateUTC(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysUTC(dateObj, days) {
  const copy = new Date(dateObj.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getMondayUTC(dateObj) {
  const day = dateObj.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysUTC(dateObj, diff);
}

function resolveDateRange({ granularity = "mes", referenceDate, startDate, endDate }) {
  if (startDate && endDate) {
    return { start_date: startDate, end_date: endDate, granularity };
  }

  const ref = referenceDate ? parseDateUTC(referenceDate) : new Date();
  const base = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));

  if (granularity === "dia") {
    const iso = formatDateUTC(base);
    return { start_date: iso, end_date: iso, granularity };
  }

  if (granularity === "semana") {
    const monday = getMondayUTC(base);
    const sunday = addDaysUTC(monday, 6);
    return {
      start_date: formatDateUTC(monday),
      end_date: formatDateUTC(sunday),
      granularity,
    };
  }

  if (granularity === "anio") {
    return {
      start_date: formatDateUTC(new Date(Date.UTC(base.getUTCFullYear(), 0, 1))),
      end_date: formatDateUTC(new Date(Date.UTC(base.getUTCFullYear(), 11, 31))),
      granularity,
    };
  }

  return {
    start_date: formatDateUTC(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))),
    end_date: formatDateUTC(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0))),
    granularity: "mes",
  };
}

function buildMesocycleBlueprints(model, totalWeeks) {
  const safeWeeks = Math.max(1, totalWeeks);

  if (model === "preparatorio_competitivo") {
    const wGeneral = Math.max(1, Math.round(safeWeeks * 0.35));
    const wEspecial = Math.max(1, Math.round(safeWeeks * 0.35));
    const wCompetitivo = Math.max(1, safeWeeks - wGeneral - wEspecial);

    return [
      {
        numero_meso: 1,
        nombre: "Preparación General",
        periodo: "preparacion_general",
        semanas_duracion: wGeneral,
        volumen_objetivo: 80,
        intensidad_objetivo: 55,
        enfoque_fuerza: "Adaptación anatómica y fuerza base",
        enfoque_resistencia: "Capacidad aeróbica general",
        enfoque_velocidad: "Coordinación y desplazamientos base",
        enfoque_tecnico: "Fundamentos técnicos y postura",
      },
      {
        numero_meso: 2,
        nombre: "Preparación Especial",
        periodo: "preparacion_especial",
        semanas_duracion: wEspecial,
        volumen_objetivo: 70,
        intensidad_objetivo: 75,
        enfoque_fuerza: "Fuerza-potencia y tren inferior",
        enfoque_resistencia: "Resistencia específica / interválica",
        enfoque_velocidad: "Velocidad de reacción y golpeo",
        enfoque_tecnico: "Combinaciones y lectura táctica",
      },
      {
        numero_meso: 3,
        nombre: "Etapa Competitiva y Ajuste",
        periodo: "competitivo",
        semanas_duracion: wCompetitivo,
        volumen_objetivo: 45,
        intensidad_objetivo: 90,
        enfoque_fuerza: "Potencia explosiva sin fatiga",
        enfoque_resistencia: "Ritmo de asalto / tolerancia",
        enfoque_velocidad: "Velocidad máxima y precisión",
        enfoque_tecnico: "Estrategia de combate / ejecución poomsae",
      },
    ];
  }

  const wAcum = Math.max(1, Math.round(safeWeeks * 0.4));
  const wTrans = Math.max(1, Math.round(safeWeeks * 0.35));
  const wReal = Math.max(1, safeWeeks - wAcum - wTrans);

  return [
    {
      numero_meso: 1,
      nombre: "Mesociclo de Acumulación",
      periodo: "acumulacion",
      semanas_duracion: wAcum,
      volumen_objetivo: 85,
      intensidad_objetivo: 55,
      enfoque_fuerza: "Fuerza base y resistencia muscular",
      enfoque_resistencia: "Base aeróbica y volumen de trabajo",
      enfoque_velocidad: "Agilidad y frecuencia de pies",
      enfoque_tecnico: "Volumen técnico y corrección postural",
    },
    {
      numero_meso: 2,
      nombre: "Mesociclo de Transformación",
      periodo: "transformacion",
      semanas_duracion: wTrans,
      volumen_objetivo: 65,
      intensidad_objetivo: 80,
      enfoque_fuerza: "Fuerza-potencia y transferencia",
      enfoque_resistencia: "Potencia aeróbica / intervalos de combate",
      enfoque_velocidad: "Velocidad gestual y explosividad",
      enfoque_tecnico: "Transferencia técnico-táctica bajo fatiga",
    },
    {
      numero_meso: 3,
      nombre: "Mesociclo de Realización",
      periodo: "realizacion",
      semanas_duracion: wReal,
      volumen_objetivo: 40,
      intensidad_objetivo: 90,
      enfoque_fuerza: "Activación neuromuscular / potencia rápida",
      enfoque_resistencia: "Ritmo competitivo y recuperación entre rondas",
      enfoque_velocidad: "Velocidad de ejecución y reacción",
      enfoque_tecnico: "Precisión, táctica y puesta a punto",
    },
  ];
}

function resolveMicrocycleType(weekIndexInMeso, totalWeeksInMeso, periodo) {
  if (periodo === "realizacion" || periodo === "competitivo") {
    return weekIndexInMeso === totalWeeksInMeso - 1 ? "competitivo" : "ajuste";
  }
  if (totalWeeksInMeso >= 4 && weekIndexInMeso === totalWeeksInMeso - 1) {
    return "recuperacion";
  }
  if (weekIndexInMeso === 0) {
    return "ajuste";
  }
  if (totalWeeksInMeso >= 3 && weekIndexInMeso === totalWeeksInMeso - 2 && periodo !== "preparacion_general") {
    return "choque";
  }
  return "corriente";
}

function generatePeriodizationPlan({
  modelo_periodizacion = "atr",
  granularidad_generacion = "mes",
  fecha_inicio,
  fecha_fin,
  modalidad = "mixto",
  dias_entrenamiento = ["lunes", "miercoles", "viernes"],
}) {
  const start = parseDateUTC(fecha_inicio);
  const end = parseDateUTC(fecha_fin);
  const diffDays = Math.max(1, Math.floor((end - start) / 86400000) + 1);
  const totalWeeks = granularidad_generacion === "dia" ? 1 : Math.max(1, Math.ceil(diffDays / 7));

  const blueprints = buildMesocycleBlueprints(modelo_periodizacion, totalWeeks);
  const mesocycles = [];
  let cursorDate = getMondayUTC(start);
  let globalWeekCounter = 1;

  for (const bp of blueprints) {
    const mesoStart = new Date(cursorDate.getTime());
    const microcycles = [];

    for (let w = 0; w < bp.semanas_duracion; w++) {
      const microType = resolveMicrocycleType(w, bp.semanas_duracion, bp.periodo);
      const isRecovery = microType === "recuperacion" || microType === "transitorio";
      const factor = isRecovery ? 0.65 : microType === "choque" ? 1.15 : 1.0;

      const volCarga = Math.min(100, Math.max(20, Math.round(bp.volumen_objetivo * factor)));
      const intCarga = Math.min(100, Math.max(25, Math.round(bp.intensidad_objetivo * (isRecovery ? 0.75 : 1.0))));

      const microStart = new Date(cursorDate.getTime());
      const sesiones = [];

      for (let d = 0; d < 7; d++) {
        const currentDayDate = addDaysUTC(microStart, d);
        if (currentDayDate < start || currentDayDate > end) continue;

        const dayName = DIAS_SEMANA[d];
        if (!dias_entrenamiento.includes(dayName)) continue;

        sesiones.push({
          fecha_sesion: formatDateUTC(currentDayDate),
          dia_semana: dayName,
          tipo_plan: "base_entrenador",
          lugar_terreno: "Dojang",
          estado: "planificada",
          enfoque: bp.enfoque_tecnico,
        });
      }

      microcycles.push({
        numero_semana: globalWeekCounter++,
        fecha_lunes: formatDateUTC(microStart),
        tipo_microciclo: microType,
        es_descarga: isRecovery,
        volumen_carga: volCarga,
        intensidad_carga: intCarga,
        sesiones,
      });

      cursorDate = addDaysUTC(cursorDate, 7);
    }

    const mesoEnd = addDaysUTC(cursorDate, -1);
    mesocycles.push({
      numero_meso: bp.numero_meso,
      nombre: bp.nombre,
      periodo: bp.periodo,
      semanas_duracion: bp.semanas_duracion,
      fecha_inicio: formatDateUTC(mesoStart),
      fecha_fin: formatDateUTC(mesoEnd),
      volumen_objetivo: bp.volumen_objetivo,
      intensidad_objetivo: bp.intensidad_objetivo,
      enfoque_fuerza: bp.enfoque_fuerza,
      enfoque_resistencia: bp.enfoque_resistencia,
      enfoque_velocidad: bp.enfoque_velocidad,
      enfoque_tecnico: bp.enfoque_tecnico,
      microcycles,
    });
  }

  return {
    modelo_periodizacion,
    granularidad_generacion,
    fecha_inicio: formatDateUTC(start),
    fecha_fin: formatDateUTC(end),
    modalidad,
    mesocycles,
  };
}

function adjustSessionForFatigue(ejercicios, { rpe_reportado = 8, motivo_ajuste = "Fatiga o sobrecarga reportada" }) {
  const highFatigue = Number(rpe_reportado) >= 7;
  const scaleFactor = highFatigue ? 0.65 : 0.8;

  const ejerciciosAjustados = ejercicios.map((ej) => {
    const nuevasSeries = Math.max(1, Math.round((ej.series || 3) * scaleFactor));
    const nuevaPausa = Math.min(180, Math.round((ej.pausa_seg || 60) * 1.25));

    return {
      ...ej,
      series: nuevasSeries,
      pausa_seg: nuevaPausa,
      es_alternativa_ligera: true,
      porcentaje_intensidad: highFatigue ? "Baja / RPE 5-6 (control)" : "Moderada / RPE 6",
      notas_tecnicas: ej.notas_tecnicas
        ? `${ej.notas_tecnicas} | Ajustado por fatiga: priorizar técnica limpia.`
        : "Ajustado por fatiga: priorizar técnica limpia y evitar fallo.",
    };
  });

  return {
    tipo_plan: "alternativa_ligera",
    estado: "ajustada_fatiga",
    rpe_reportado,
    motivo_ajuste,
    ejercicios: ejerciciosAjustados,
  };
}

module.exports = {
  resolveDateRange,
  generatePeriodizationPlan,
  adjustSessionForFatigue,
};