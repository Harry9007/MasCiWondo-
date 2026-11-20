const pool = require("../config/db");
const { CATALOGO_EJERCICIOS } = require("../../../shared/catalogoEjercicios");
const { generarPlanAlternativoLigero } = require("../../../shared/planAlternativoLigero");

async function crearAlternativaLigeraEnBD(sesionOrigenId, opciones = {}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [sesionesRows] = await conn.query(
      "SELECT * FROM sesiones WHERE id = ?",
      [sesionOrigenId]
    );

    if (sesionesRows.length === 0) {
      throw new Error("La sesión original no existe");
    }

    const sesionOriginal = sesionesRows[0];

    const [ejerciciosRows] = await conn.query(
      `SELECT id, ejercicio_id AS ejercicioId, orden, series,
              repeticiones_o_tiempo AS repeticionesOTiempo,
              porcentaje_intensidad AS porcentajeIntensidad,
              pausa_seg AS pausaSeg, notas_tecnicas AS notasTecnicas
       FROM sesion_ejercicios
       WHERE sesion_id = ?
       ORDER BY orden ASC`,
      [sesionOrigenId]
    );

    const sesionEstructurada = {
      id: sesionOriginal.id,
      diaSemana: sesionOriginal.dia_semana,
      tipoPlan: sesionOriginal.tipo_plan,
      lugarTerreno: sesionOriginal.lugar_terreno,
      ejercicios: ejerciciosRows
    };

    const planLigero = generarPlanAlternativoLigero(sesionEstructurada, {
      ...opciones,
      catalogo: CATALOGO_EJERCICIOS
    });

    const practicanteIdFinal = opciones.practicanteId || sesionOriginal.practicante_id;

    const [insertSesion] = await conn.query(
      `INSERT INTO sesiones (
        microciclo_id, practicante_id, dia_semana, tipo_plan,
        sesion_origen_id, lugar_terreno, rpe_reportado, motivo_ajuste, observaciones
      ) VALUES (?, ?, ?, 'alternativa_ligera', ?, ?, ?, ?, ?)`,
      [
        sesionOriginal.microciclo_id,
        practicanteIdFinal,
        sesionOriginal.dia_semana,
        sesionOriginal.id,
        sesionOriginal.lugar_terreno,
        planLigero.rpeReportado ?? null,
        planLigero.motivoAjuste ?? "sobrecarga",
        `Generada desde sesión #${sesionOriginal.id} (${opciones.nivelAjuste || "ligero"})`
      ]
    );

    const nuevaSesionId = insertSesion.insertId;

    for (let i = 0; i < planLigero.ejercicios.length; i++) {
      const ej = planLigero.ejercicios[i];
      await conn.query(
        `INSERT INTO sesion_ejercicios (
          sesion_id, ejercicio_id, orden, series,
          repeticiones_o_tiempo, porcentaje_intensidad, pausa_seg, notas_tecnicas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nuevaSesionId,
          ej.ejercicioId,
          i + 1,
          ej.series,
          ej.repeticionesOTiempo,
          ej.porcentajeIntensidad || null,
          ej.pausaSeg ?? 60,
          ej.notasTecnicas || null
        ]
      );
    }

    await conn.commit();

    return {
      sesionId: nuevaSesionId,
      sesionOrigenId: sesionOriginal.id,
      tipoPlan: "alternativa_ligera",
      motivoAjuste: planLigero.motivoAjuste,
      rpeReportado: planLigero.rpeReportado,
      ejercicios: planLigero.ejercicios
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { crearAlternativaLigeraEnBD };