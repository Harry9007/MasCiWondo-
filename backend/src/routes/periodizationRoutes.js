const express = require("express");
const pool = require("../config/db");
const {
  generatePeriodizationPlan,
  adjustSessionForFatigue,
} = require("../../../shared/periodizationEngine");

const router = express.Router();

// POST /api/macrociclos/generar
router.post("/macrociclos/generar", async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      creador_id,
      practicante_id = null,
      titulo,
      modelo_periodizacion = "atr",
      granularidad_generacion = "mes",
      modalidad = "mixto",
      fecha_inicio,
      fecha_fin,
      objetivo_principal = "Desarrollo integral de Taekwondo",
      dias_entrenamiento = ["lunes", "miercoles", "viernes"],
    } = req.body;

    if (!creador_id) {
      return res.status(400).json({ error: "El campo creador_id es obligatorio" });
    }

    const plan = generatePeriodizationPlan({
      titulo,
      modelo_periodizacion,
      granularidad_generacion,
      modalidad,
      fecha_inicio,
      fecha_fin,
      objetivo_principal,
      dias_entrenamiento,
      practicante_id: practicante_id ? Number(practicante_id) : null,
    });

    await connection.beginTransaction();

    const [macroResult] = await connection.query(
      `INSERT INTO macrociclos (
        creador_id,
        practicante_id,
        titulo,
        modelo_periodizacion,
        granularidad_generacion,
        modalidad,
        fecha_inicio,
        fecha_fin,
        objetivo_principal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(creador_id),
        practicante_id ? Number(practicante_id) : null,
        plan.macrociclo.titulo,
        plan.macrociclo.modelo_periodizacion,
        plan.macrociclo.granularidad_generacion,
        plan.macrociclo.modalidad,
        plan.macrociclo.fecha_inicio,
        plan.macrociclo.fecha_fin,
        plan.macrociclo.objetivo_principal,
      ]
    );

    const macrocicloId = macroResult.insertId;
    let totalMesociclos = 0;
    let totalMicrociclos = 0;
    let totalSesiones = 0;

    for (const meso of plan.mesociclos) {
      const [mesoResult] = await connection.query(
        `INSERT INTO mesociclos (
          macrociclo_id,
          numero_meso,
          nombre,
          periodo,
          enfoque_fuerza,
          enfoque_resistencia,
          enfoque_velocidad,
          enfoque_tecnico,
          semanas_duracion,
          volumen_objetivo,
          intensidad_objetivo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          macrocicloId,
          meso.numero_meso,
          meso.nombre,
          meso.periodo,
          meso.enfoque_fuerza,
          meso.enfoque_resistencia,
          meso.enfoque_velocidad,
          meso.enfoque_tecnico,
          meso.semanas_duracion,
          meso.volumen_objetivo,
          meso.intensidad_objetivo,
        ]
      );

      const mesocicloId = mesoResult.insertId;
      totalMesociclos++;

      for (const micro of meso.microciclos) {
        const [microResult] = await connection.query(
          `INSERT INTO microciclos (
            mesociclo_id,
            numero_semana,
            fecha_lunes,
            tipo_microciclo,
            es_descarga,
            volumen_carga,
            intensidad_carga,
            observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mesocicloId,
            micro.numero_semana,
            micro.fecha_lunes,
            micro.tipo_microciclo,
            micro.es_descarga ? 1 : 0,
            micro.volumen_carga,
            micro.intensidad_carga,
            micro.observaciones,
          ]
        );

        const microcicloId = microResult.insertId;
        totalMicrociclos++;

        for (const sesion of micro.sesiones) {
          await connection.query(
            `INSERT INTO sesiones (
              microciclo_id,
              practicante_id,
              fecha_sesion,
              dia_semana,
              tipo_plan,
              estado,
              sesion_origen_id,
              lugar_terreno,
              rpe_reportado,
              motivo_ajuste,
              observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              microcicloId,
              sesion.practicante_id,
              sesion.fecha_sesion,
              sesion.dia_semana,
              sesion.tipo_plan,
              sesion.estado,
              sesion.sesion_origen_id,
              sesion.lugar_terreno,
              sesion.rpe_reportado,
              sesion.motivo_ajuste,
              sesion.observaciones,
            ]
          );
          totalSesiones++;
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      mensaje: "Macrociclo generado correctamente",
      macrociclo_id: macrocicloId,
      resumen: {
        modelo_periodizacion: plan.macrociclo.modelo_periodizacion,
        granularidad_generacion: plan.macrociclo.granularidad_generacion,
        fecha_inicio: plan.macrociclo.fecha_inicio,
        fecha_fin: plan.macrociclo.fecha_fin,
        mesociclos: totalMesociclos,
        microciclos: totalMicrociclos,
        sesiones: totalSesiones,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// GET /api/macrociclos?usuarioId=1
router.get("/macrociclos", async (req, res, next) => {
  try {
    const usuarioId = req.query.usuarioId ? Number(req.query.usuarioId) : null;
    if (usuarioId) {
      const [rows] = await pool.query(
        `SELECT * FROM macrociclos
         WHERE creador_id = ? OR practicante_id = ?
         ORDER BY creado_en DESC`,
        [usuarioId, usuarioId]
      );
      return res.json({ macrociclos: rows });
    }

    const [rows] = await pool.query(
      "SELECT * FROM macrociclos ORDER BY creado_en DESC LIMIT 50"
    );
    res.json({ macrociclos: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/macrociclos/:id/detalle
router.get("/macrociclos/:id/detalle", async (req, res, next) => {
  try {
    const macroId = Number(req.params.id);
    const [macros] = await pool.query(
      "SELECT * FROM macrociclos WHERE id = ? LIMIT 1",
      [macroId]
    );

    if (macros.length === 0) {
      return res.status(404).json({ error: "Macrociclo no encontrado" });
    }

    const [mesos] = await pool.query(
      "SELECT * FROM mesociclos WHERE macrociclo_id = ? ORDER BY numero_meso ASC",
      [macroId]
    );

    const mesoIds = mesos.map((m) => m.id);
    let micros = [];
    if (mesoIds.length > 0) {
      const [rows] = await pool.query(
        `SELECT * FROM microciclos
         WHERE mesociclo_id IN (${mesoIds.map(() => "?").join(",")})
         ORDER BY numero_semana ASC`,
        mesoIds
      );
      micros = rows;
    }

    const microIds = micros.map((mi) => mi.id);
    let sesiones = [];
    if (microIds.length > 0) {
      const [rows] = await pool.query(
        `SELECT * FROM sesiones
         WHERE microciclo_id IN (${microIds.map(() => "?").join(",")})
         ORDER BY fecha_sesion ASC, id ASC`,
        microIds
      );
      sesiones = rows;
    }

    res.json({
      macrociclo: macros[0],
      mesociclos: mesos,
      microciclos: micros,
      sesiones,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sesiones/:id/ajustar-fatiga
router.post("/sesiones/:id/ajustar-fatiga", async (req, res, next) => {
  try {
    const sesionId = Number(req.params.id);
    const { rpe_reportado, motivo_ajuste } = req.body;

    const [existing] = await pool.query(
      "SELECT id FROM sesiones WHERE id = ? LIMIT 1",
      [sesionId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    const ajuste = adjustSessionForFatigue({ rpe_reportado, motivo_ajuste });

    await pool.query(
      `UPDATE sesiones
       SET rpe_reportado = ?,
           tipo_plan = ?,
           estado = ?,
           motivo_ajuste = ?
       WHERE id = ?`,
      [
        ajuste.rpe_reportado,
        ajuste.tipo_plan,
        ajuste.estado,
        ajuste.motivo_ajuste,
        sesionId,
      ]
    );

    if (ajuste.es_alternativa_ligera) {
      await pool.query(
        `UPDATE sesion_ejercicios
         SET series = GREATEST(1, ROUND(series * ?)),
             pausa_seg = ROUND(pausa_seg * ?),
             es_alternativa_ligera = 1
         WHERE sesion_id = ?`,
        [ajuste.factor_volumen, ajuste.factor_pausa, sesionId]
      );
    }

    const [updated] = await pool.query(
      "SELECT * FROM sesiones WHERE id = ? LIMIT 1",
      [sesionId]
    );

    res.json({
      mensaje: "Sesión actualizada según reporte de fatiga",
      ajuste,
      sesion: updated[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;