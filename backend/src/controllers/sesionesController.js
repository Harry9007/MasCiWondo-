const pool = require("../config/db");
const { crearAlternativaLigeraEnBD } = require("../services/autorregulacionService");

const SELECT_SESION_CONTEXTO = `
  SELECT
    s.*,
    mi.numero_semana,
    mi.fecha_lunes,
    mi.tipo_microciclo,
    mi.es_descarga,
    mi.volumen_carga,
    mi.intensidad_carga,
    me.numero_meso,
    me.nombre AS mesociclo_nombre,
    me.periodo AS mesociclo_periodo,
    me.enfoque_fuerza,
    me.enfoque_resistencia,
    me.enfoque_velocidad,
    me.enfoque_tecnico,
    me.volumen_objetivo,
    me.intensidad_objetivo,
    mc.titulo AS macrociclo_titulo,
    mc.modelo_periodizacion,
    mc.modalidad
  FROM sesiones s
  LEFT JOIN microciclos mi ON s.microciclo_id = mi.id
  LEFT JOIN mesociclos me ON mi.mesociclo_id = me.id
  LEFT JOIN macrociclos mc ON me.macrociclo_id = mc.id
`;

function ejerciciosFallbackPorModalidad(modalidad = "kyorugi") {
  const mod = String(modalidad || "kyorugi").toLowerCase();
  if (mod === "poomsae") {
    return [
      {
        orden: 1,
        ejercicio_nombre: "Taegeuk / Poomsae de ritmo y estabilidad",
        categoria: "poomsae",
        impacto: "bajo",
        equipamiento: "ninguno",
        series: 3,
        repeticiones_o_tiempo: "2 rep completas",
        pausa_seg: 60,
        porcentaje_intensidad: "70%",
        es_alternativa_ligera: false,
        notas_tecnicas: "Control postural, transiciones y respiración",
      },
      {
        orden: 2,
        ejercicio_nombre: "Ap Chagi y Dollyo Chagi lentos con control",
        categoria: "poomsae",
        impacto: "bajo",
        equipamiento: "ninguno",
        series: 3,
        repeticiones_o_tiempo: "8 por pierna",
        pausa_seg: 45,
        porcentaje_intensidad: "65%",
        es_alternativa_ligera: false,
        notas_tecnicas: "Altura constante y pivotaje limpio del pie base",
      },
    ];
  }

  return [
    {
      orden: 1,
      ejercicio_nombre: "Desplazamientos en guardia y fintas reactivas",
      categoria: "tecnica_kyorugi",
      impacto: "bajo",
      equipamiento: "ninguno",
      series: 3,
      repeticiones_o_tiempo: "1 min",
      pausa_seg: 45,
      porcentaje_intensidad: "65%",
      es_alternativa_ligera: false,
      notas_tecnicas: "Mantener centro de gravedad estable y guardia alta",
    },
    {
      orden: 2,
      ejercicio_nombre: "Bandal Chagui y Dollyo Chagi a paleta",
      categoria: "tecnica_kyorugi",
      impacto: "medio",
      equipamiento: "paletas",
      series: 4,
      repeticiones_o_tiempo: "10 por lado",
      pausa_seg: 60,
      porcentaje_intensidad: "75%",
      es_alternativa_ligera: false,
      notas_tecnicas: "Rotación de cadera y recuperación rápida del apoyo",
    },
  ];
}

function obtenerCategoriasPrioritarias(ctx) {
  const mod = String(ctx.modalidad || "kyorugi").toLowerCase();
  const modelo = String(ctx.modelo_periodizacion || "").toLowerCase();
  const periodo = String(ctx.mesociclo_periodo || "").toLowerCase();
  const tipoMicro = String(ctx.tipo_microciclo || "").toLowerCase();
  const esDescarga = Boolean(ctx.es_descarga) || periodo === "descarga" || tipoMicro === "recuperacion";
  const textoEnfoques = [
    ctx.enfoque_fuerza,
    ctx.enfoque_resistencia,
    ctx.enfoque_velocidad,
    ctx.enfoque_tecnico,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (ctx.esLigera || esDescarga) {
    return ["movilidad_recuperacion", "tecnica_kyorugi", "capacidad_aerobica"];
  }

  if (mod === "poomsae" || textoEnfoques.includes("poomsae")) {
    return [
      "poomsae",
      "movilidad_recuperacion",
      "fuerza_adaptacion",
      "velocidad_agilidad",
    ];
  }

  // Escala / momento de carga desde microciclo y mesociclo
  if (tipoMicro === "competitivo" || periodo === "competitivo" || periodo === "realizacion") {
    return [
      "tecnica_kyorugi",
      "velocidad_agilidad",
      "potencia_aerobica",
      "fuerza_potencia",
    ];
  }

  if (
    tipoMicro === "choque" ||
    periodo === "preparacion_especial" ||
    periodo === "transformacion" ||
    modelo === "preparatorio_competitivo"
  ) {
    return [
      "fuerza_potencia",
      "velocidad_agilidad",
      "tecnica_kyorugi",
      "fuerza_resistencia",
    ];
  }

  if (
    tipoMicro === "ajuste" ||
    tipoMicro === "corriente" ||
    periodo === "preparacion_general" ||
    periodo === "acumulacion" ||
    modelo === "atr"
  ) {
    return [
      "fuerza_adaptacion",
      "capacidad_aerobica",
      "tecnica_kyorugi",
      "movilidad_recuperacion",
    ];
  }

  if (textoEnfoques.includes("potencia") || textoEnfoques.includes("velocidad")) {
    return ["velocidad_agilidad", "fuerza_potencia", "tecnica_kyorugi"];
  }
  if (textoEnfoques.includes("resistencia") || textoEnfoques.includes("aerob")) {
    return ["capacidad_aerobica", "fuerza_resistencia", "tecnica_kyorugi"];
  }

  return ["tecnica_kyorugi", "velocidad_agilidad", "fuerza_potencia", "capacidad_aerobica"];
}

function prescripcionPorCategoria(categoria) {
  switch (categoria) {
    case "movilidad_recuperacion":
      return { series: 2, repeticiones_o_tiempo: "45 seg", pausa_seg: 30, notas: "Movilidad articular y respiración controlada" };
    case "fuerza_adaptacion":
      return { series: 3, repeticiones_o_tiempo: "12-15 rep", pausa_seg: 60, notas: "Control excéntrico y estabilidad postural" };
    case "fuerza_maxima":
      return { series: 4, repeticiones_o_tiempo: "4-6 rep", pausa_seg: 120, notas: "Máxima intención de fuerza con técnica limpia" };
    case "fuerza_potencia":
      return { series: 4, repeticiones_o_tiempo: "6-8 rep", pausa_seg: 90, notas: "Ejecución explosiva manteniendo velocidad" };
    case "fuerza_resistencia":
      return { series: 3, repeticiones_o_tiempo: "15-20 rep", pausa_seg: 45, notas: "Ritmo constante sin pérdida técnica" };
    case "capacidad_aerobica":
      return { series: 3, repeticiones_o_tiempo: "3 min", pausa_seg: 60, notas: "Ritmo aeróbico continuo y estable" };
    case "potencia_aerobica":
      return { series: 4, repeticiones_o_tiempo: "1 min 30 seg", pausa_seg: 60, notas: "Alta demanda metabólica con recuperación activa" };
    case "velocidad_agilidad":
      return { series: 4, repeticiones_o_tiempo: "8-10 rep", pausa_seg: 60, notas: "Reacción rápida, cambios de dirección y guardia" };
    case "poomsae":
      return { series: 3, repeticiones_o_tiempo: "2 rep completas", pausa_seg: 60, notas: "Precisión técnica, postura y fluidez" };
    case "tecnica_kyorugi":
    default:
      return { series: 4, repeticiones_o_tiempo: "10 por lado", pausa_seg: 60, notas: "Distancia, guardia alta y rotación de cadera" };
  }
}

function mapearEjercicioCatalogo(row, index, ctx) {
  const base = prescripcionPorCategoria(row.categoria);
  const periodo = String(ctx.mesociclo_periodo || "").toLowerCase();
  const tipoMicro = String(ctx.tipo_microciclo || "").toLowerCase();
  const esDescarga =
    Boolean(ctx.es_descarga) ||
    periodo === "descarga" ||
    tipoMicro === "recuperacion";
  const aplicarLigera = Boolean(ctx.esLigera) || esDescarga;

  const intensidadNumerica =
    Number(ctx.intensidad_carga || ctx.intensidad_objetivo || 70) || 70;

  let series = base.series;
  let pausaSeg = base.pausa_seg;
  let intensidad = `${intensidadNumerica}%`;
  const etiquetas = [base.notas];

  if (tipoMicro === "choque" || periodo === "preparacion_especial" || periodo === "transformacion") {
    series = Math.max(series, 4);
    etiquetas.push(`Fase/Micro: ${periodo || tipoMicro}`);
  } else if (tipoMicro === "competitivo" || periodo === "competitivo" || periodo === "realizacion") {
    series = Math.max(series, 4);
    pausaSeg = Math.min(pausaSeg, 45);
    etiquetas.push("Enfoque competitivo");
  } else if (periodo === "preparacion_general" || periodo === "acumulacion") {
    etiquetas.push("Base / Acumulación");
  }

  if (aplicarLigera) {
    series = Math.max(1, series - 1);
    pausaSeg = pausaSeg + 30;
    intensidad = `${Math.min(intensidadNumerica, 55)}% (descarga)`;
    etiquetas.push("Ajustado por descarga/RPE");
  }

  return {
    orden: index + 1,
    ejercicio_id: row.id,
    ejercicio_nombre: row.nombre,
    categoria: row.categoria,
    impacto: row.impacto,
    equipamiento: row.equipamiento,
    ejercicio_alternativo_id: row.ejercicio_alternativo_id ?? null,
    series,
    repeticiones_o_tiempo: base.repeticiones_o_tiempo,
    pausa_seg: pausaSeg,
    porcentaje_intensidad: intensidad,
    es_alternativa_ligera: aplicarLigera,
    notas_tecnicas: etiquetas.filter(Boolean).join(" · "),
  };
}

async function listarSesiones(req, res, next) {
  try {
    const { microcicloId, diaSemana, estado } = req.query;
    let sql = "SELECT * FROM sesiones WHERE 1=1";
    const params = [];

    if (microcicloId) {
      sql += " AND microciclo_id = ?";
      params.push(Number(microcicloId));
    }
    if (diaSemana) {
      sql += " AND dia_semana = ?";
      params.push(String(diaSemana).toLowerCase());
    }
    if (estado) {
      sql += " AND estado = ?";
      params.push(String(estado).toLowerCase());
    }

    sql += " ORDER BY fecha_sesion ASC, id ASC";
    const [rows] = await pool.query(sql, params);
    res.json({ sesiones: rows });
  } catch (error) {
    next(error);
  }
}

async function obtenerSesionPorId(req, res, next) {
  try {
    const sesionId = Number(req.params.sesionId);
    if (!Number.isInteger(sesionId) || sesionId <= 0) {
      return res.status(400).json({ error: "ID de sesión inválido" });
    }

    const [rows] = await pool.query(`${SELECT_SESION_CONTEXTO} WHERE s.id = ?`, [
      sesionId,
    ]);

    if (!rows.length) {
      return res.status(404).json({ error: "La sesión no existe" });
    }

    res.json({ sesion: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function listarEjerciciosSesion(req, res, next) {
  try {
    const sesionId = Number(req.params.sesionId);
    if (!Number.isInteger(sesionId) || sesionId <= 0) {
      return res.status(400).json({ error: "ID de sesión inválido" });
    }

    const [sesRows] = await pool.query(
      `${SELECT_SESION_CONTEXTO} WHERE s.id = ?`,
      [sesionId]
    );

    if (!sesRows.length) {
      return res.status(404).json({ error: "La sesión no existe" });
    }

    const sesion = sesRows[0];
    const esLigera =
      sesion.tipo_plan === "alternativa_ligera" ||
      sesion.estado === "ajustada_fatiga";
    const esDescarga =
      Boolean(sesion.es_descarga) ||
      String(sesion.mesociclo_periodo || "").toLowerCase() === "descarga" ||
      String(sesion.tipo_microciclo || "").toLowerCase() === "recuperacion";

    const ctx = {
      ...sesion,
      esLigera,
    };

    let ejercicios = [];

    try {
      const [catalogoRows] = await pool.query(
        "SELECT id, nombre, categoria, impacto, equipamiento, ejercicio_alternativo_id FROM ejercicios_catalogo ORDER BY id ASC"
      );

      if (Array.isArray(catalogoRows) && catalogoRows.length > 0) {
        const categoriasPrioritarias = obtenerCategoriasPrioritarias(ctx);

        const candidatosOrdenados = [...catalogoRows].sort((a, b) => {
          const idxA = categoriasPrioritarias.indexOf(a.categoria);
          const idxB = categoriasPrioritarias.indexOf(b.categoria);
          const rankA = idxA === -1 ? 99 : idxA;
          const rankB = idxB === -1 ? 99 : idxB;
          if (rankA !== rankB) return rankA - rankB;

          if (esLigera || esDescarga) {
            const pesoImpacto = { bajo: 1, medio: 2, alto: 3 };
            return (pesoImpacto[a.impacto] || 2) - (pesoImpacto[b.impacto] || 2);
          }

          return Number(a.id) - Number(b.id);
        });

        const tamanoVentana = Math.min(8, candidatosOrdenados.length);
        const ventana = candidatosOrdenados.slice(0, tamanoVentana);
        const cantidad = Math.min(4, ventana.length);
        const semilla =
          sesionId +
          Number(sesion.numero_semana || 0) * 3 +
          Number(sesion.numero_meso || 0) * 5;
        const offset = semilla % ventana.length;

        const seleccionados = [];
        const idsUsados = new Set();

        for (let i = 0; i < ventana.length && seleccionados.length < cantidad; i++) {
          const candidato = ventana[(offset + i) % ventana.length];
          if (!idsUsados.has(candidato.id)) {
            idsUsados.add(candidato.id);
            seleccionados.push(candidato);
          }
        }

        ejercicios = seleccionados.map((row, idx) =>
          mapearEjercicioCatalogo(row, idx, ctx)
        );
      }
    } catch (errCatalogo) {
      console.warn(
        "Error consultando ejercicios_catalogo:",
        errCatalogo.message
      );
    }

    if (ejercicios.length === 0) {
      ejercicios = ejerciciosFallbackPorModalidad(sesion.modalidad).map((ej) =>
        esLigera || esDescarga
          ? {
              ...ej,
              es_alternativa_ligera: true,
              series: Math.max(1, ej.series - 1),
              pausa_seg: ej.pausa_seg + 30,
              porcentaje_intensidad: "55% (descarga)",
              notas_tecnicas: `${ej.notas_tecnicas} · Ajustado por descarga/RPE`,
            }
          : ej
      );
    }

    res.json({ ejercicios });
  } catch (error) {
    next(error);
  }
}

async function ajustarFatigaSesion(req, res, next) {
  try {
    const sesionId = Number(req.params.sesionId);
    const rpeReportado = Number(
      req.body.rpe_reportado ?? req.body.rpeReportado
    );
    const motivoAjuste =
      req.body.motivo_ajuste ??
      req.body.motivoAjuste ??
      "Fatiga reportada por RPE";

    if (!Number.isInteger(sesionId) || sesionId <= 0) {
      return res.status(400).json({ error: "ID de sesión inválido" });
    }
    if (
      !Number.isFinite(rpeReportado) ||
      rpeReportado < 1 ||
      rpeReportado > 10
    ) {
      return res
        .status(400)
        .json({ error: "El RPE debe estar entre 1 y 10" });
    }

    const [sesRows] = await pool.query("SELECT * FROM sesiones WHERE id = ?", [
      sesionId,
    ]);
    if (!sesRows.length) {
      return res.status(404).json({ error: "La sesión no existe" });
    }

    const requiereAlternativa = rpeReportado >= 8;
    const nuevoTipoPlan = requiereAlternativa
      ? "alternativa_ligera"
      : sesRows[0].tipo_plan || "base_entrenador";
    const nuevoEstado = requiereAlternativa
      ? "ajustada_fatiga"
      : sesRows[0].estado || "planificada";

    await pool.query(
      `UPDATE sesiones
       SET rpe_reportado = ?,
           motivo_ajuste = ?,
           tipo_plan = ?,
           estado = ?
       WHERE id = ?`,
      [rpeReportado, motivoAjuste, nuevoTipoPlan, nuevoEstado, sesionId]
    );

    if (
      requiereAlternativa &&
      typeof crearAlternativaLigeraEnBD === "function"
    ) {
      try {
        await crearAlternativaLigeraEnBD(sesionId, {
          nivelAjuste: rpeReportado >= 9 ? "alto" : "moderado",
          motivoAjuste,
          rpeReportado,
          practicanteId: sesRows[0].practicante_id || null,
        });
      } catch {
        // El UPDATE principal de la sesión ya quedó guardado
      }
    }

    const [actualizadaRows] = await pool.query(
      `${SELECT_SESION_CONTEXTO} WHERE s.id = ?`,
      [sesionId]
    );

    res.json({
      mensaje: requiereAlternativa
        ? `RPE ${rpeReportado}/10 registrado: se activó la alternativa ligera.`
        : `RPE ${rpeReportado}/10 registrado.`,
      sesion: actualizadaRows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function solicitarAlternativaLigera(req, res, next) {
  try {
    const { sesionId } = req.params;
    const { nivelAjuste, motivoAjuste, rpeReportado, practicanteId } = req.body;

    const resultado = await crearAlternativaLigeraEnBD(sesionId, {
      nivelAjuste,
      motivoAjuste,
      rpeReportado,
      practicanteId,
    });

    res.status(201).json({
      mensaje: "Plan alternativo ligero generado",
      data: resultado,
    });
  } catch (error) {
    if (error.message === "La sesión original no existe") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

module.exports = {
  listarSesiones,
  obtenerSesionPorId,
  listarEjerciciosSesion,
  ajustarFatigaSesion,
  solicitarAlternativaLigera,
};