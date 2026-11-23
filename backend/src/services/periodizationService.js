import {
  resolveDateRange,
  generatePeriodizationPlan,
  adjustSessionForFatigue,
} from '../../shared/periodizationEngine.js';

export async function createFullPeriodizationPlan(pool, payload) {
  const {
    creador_id,
    practicante_id = null,
    titulo,
    objetivo_principal = 'Desarrollo integral y rendimiento',
    modelo_periodizacion = 'atr',
    granularidad_generacion = 'mes',
    referenceDate,
    fecha_inicio,
    fecha_fin,
    modalidad = 'mixto',
    dias_entrenamiento = ['lunes', 'miercoles', 'viernes'],
  } = payload;

  const range = resolveDateRange({
    granularity: granularidad_generacion,
    referenceDate,
    startDate: fecha_inicio,
    endDate: fecha_fin,
  });

  const plan = generatePeriodizationPlan({
    modelo_periodizacion,
    granularidad_generacion: range.granularity,
    fecha_inicio: range.start_date,
    fecha_fin: range.end_date,
    modalidad,
    dias_entrenamiento,
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [macroRes] = await conn.execute(
      `INSERT INTO macrociclos
        (creador_id, practicante_id, titulo, modelo_periodizacion, granularidad_generacion, fecha_inicio, fecha_fin, objetivo_principal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creador_id,
        practicante_id,
        titulo,
        plan.modelo_periodizacion,
        plan.granularidad_generacion,
        plan.fecha_inicio,
        plan.fecha_fin,
        objetivo_principal,
      ]
    );

    const macrocicloId = macroRes.insertId;

    for (const meso of plan.mesocycles) {
      const [mesoRes] = await conn.execute(
        `INSERT INTO mesociclos
          (macrociclo_id, numero_meso, nombre, periodo, enfoque_fuerza, enfoque_resistencia, enfoque_velocidad, enfoque_tecnico, semanas_duracion, volumen_objetivo, intensidad_objetivo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      const mesocicloId = mesoRes.insertId;

      for (const micro of meso.microcycles) {
        const [microRes] = await conn.execute(
          `INSERT INTO microciclos
            (mesociclo_id, numero_semana, tipo_microciclo, fecha_lunes, es_descarga, volumen_carga, intensidad_carga)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            mesocicloId,
            micro.numero_semana,
            micro.tipo_microciclo,
            micro.fecha_lunes,
            micro.es_descarga ? 1 : 0,
            micro.volumen_carga,
            micro.intensidad_carga,
          ]
        );

        const microcicloId = microRes.insertId;

        for (const sesion of micro.sesiones) {
          await conn.execute(
            `INSERT INTO sesiones
              (microciclo_id, practicante_id, fecha_sesion, dia_semana, tipo_plan, lugar_terreno, observaciones, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              microcicloId,
              practicante_id,
              sesion.fecha_sesion,
              sesion.dia_semana,
              sesion.tipo_plan,
              sesion.lugar_terreno,
              sesion.enfoque,
              sesion.estado,
            ]
          );
        }
      }
    }

    await conn.commit();
    return { macrociclo_id: macrocicloId, ...plan };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function applyFatigueAdjustmentToSession(pool, sessionId, { rpe_reportado, motivo_ajuste }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [ejRows] = await conn.execute(
      `SELECT se.id, se.ejercicio_id, se.orden, se.series, se.repeticiones_o_tiempo, se.porcentaje_intensidad, se.pausa_seg, se.notas_tecnicas, ec.nombre
       FROM sesion_ejercicios se
       JOIN ejercicios_catalogo ec ON ec.id = se.ejercicio_id
       WHERE se.sesion_id = ?
       ORDER BY se.orden ASC`,
      [sessionId]
    );

    const adjusted = adjustSessionForFatigue(ejRows, { rpe_reportado, motivo_ajuste });

    await conn.execute(
      `UPDATE sesiones
       SET tipo_plan = ?, estado = ?, rpe_reportado = ?, motivo_ajuste = ?
       WHERE id = ?`,
      [adjusted.tipo_plan, adjusted.estado, adjusted.rpe_reportado, adjusted.motivo_ajuste, sessionId]
    );

    for (const item of adjusted.ejercicios) {
      await conn.execute(
        `UPDATE sesion_ejercicios
         SET series = ?, pausa_seg = ?, porcentaje_intensidad = ?, notas_tecnicas = ?, es_alternativa_ligera = 1
         WHERE id = ?`,
        [item.series, item.pausa_seg, item.porcentaje_intensidad, item.notas_tecnicas, item.id]
      );
    }

    await conn.commit();
    return { session_id: Number(sessionId), ...adjusted };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}