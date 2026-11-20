const pool = require("../config/db");
const { generarSemanaMicrociclo } = require("../../../shared/generadorCiclos");

async function crearMacrociclo(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const {
      creadorId,
      usuarioSolicitanteId,
      titulo,
      fechaInicio,
      fechaFin,
      objetivoPrincipal,
      modalidad = "kyorugi",
      mesociclos = []
    } = req.body;

    const solicitanteId = Number(usuarioSolicitanteId || creadorId);
    if (!solicitanteId) {
      return res.status(401).json({
        error: "Debes iniciar sesión o registrarte para generar macrociclos, mesociclos o entrenamientos."
      });
    }

    const [usuarios] = await conn.query(
      "SELECT id, rol, entrenador_id FROM usuarios WHERE id = ? LIMIT 1",
      [solicitanteId]
    );
    if (usuarios.length === 0) {
      return res.status(401).json({
        error: "Usuario no encontrado. Regístrate o inicia sesión nuevamente."
      });
    }

    const usuarioBD = usuarios[0];
    const creadorFinalId =
      usuarioBD.rol === "practicante" && usuarioBD.entrenador_id
        ? Number(usuarioBD.entrenador_id)
        : Number(usuarioBD.id);

    if (!titulo || !fechaInicio || !fechaFin || !objetivoPrincipal) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: titulo, fechaInicio, fechaFin, objetivoPrincipal"
      });
    }

    if (!Array.isArray(mesociclos) || mesociclos.length === 0) {
      return res.status(400).json({
        error: "Debes incluir al menos un mesociclo para generar el plan"
      });
    }

    await conn.beginTransaction();

    const [macroRes] = await conn.query(
      `INSERT INTO macrociclos (creador_id, titulo, fecha_inicio, fecha_fin, objetivo_principal)
       VALUES (?, ?, ?, ?, ?)`,
      [creadorFinalId, titulo, fechaInicio, fechaFin, objetivoPrincipal]
    );

    const macrocicloId = macroRes.insertId;
    let fechaCursor = new Date(`${fechaInicio}T00:00:00`);
    let semanaGlobal = 1;

    for (let m = 0; m < mesociclos.length; m++) {
      const meso = mesociclos[m];
      const semanasDuracion = Number(meso.semanasDuracion) || 4;
      const periodo = meso.periodo || "preparacion_general";

      const [mesoRes] = await conn.query(
        `INSERT INTO mesociclos (
          macrociclo_id, numero_meso, nombre, periodo,
          enfoque_fuerza, enfoque_resistencia, enfoque_velocidad, enfoque_tecnico, semanas_duracion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          macrocicloId,
          m + 1,
          meso.nombre || `Mesociclo ${m + 1}`,
          periodo,
          meso.enfoqueFuerza || "Fuerza base / adaptacion",
          meso.enfoqueResistencia || "Capacidad aerobica",
          meso.enfoqueVelocidad || "Coordinacion y reaccion",
          meso.enfoqueTecnico || "Fundamentos de Taekwondo",
          semanasDuracion
        ]
      );

      const mesocicloId = mesoRes.insertId;

      for (let s = 0; s < semanasDuracion; s++) {
        const fechaLunesStr = fechaCursor.toISOString().slice(0, 10);
        const esDescarga =
          periodo === "descarga" || (s + 1 === semanasDuracion && semanasDuracion >= 4);

        const [microRes] = await conn.query(
          `INSERT INTO microciclos (mesociclo_id, numero_semana, fecha_lunes, es_descarga, observaciones)
           VALUES (?, ?, ?, ?, ?)`,
          [mesocicloId, semanaGlobal, fechaLunesStr, esDescarga, meso.observaciones || null]
        );

        const microcicloId = microRes.insertId;
        const semanaGenerada = generarSemanaMicrociclo({
          periodo: esDescarga ? "descarga" : periodo,
          modalidad,
          diasActivos: meso.diasActivos || ["lunes", "martes", "miercoles", "jueves", "viernes"]
        });

        for (const sesion of semanaGenerada) {
          const [sesRes] = await conn.query(
            `INSERT INTO sesiones (microciclo_id, dia_semana, tipo_plan, lugar_terreno)
             VALUES (?, ?, 'base_entrenador', ?)`,
            [microcicloId, sesion.diaSemana, sesion.lugarTerreno]
          );

          const sesionId = sesRes.insertId;
          for (let idx = 0; idx < sesion.ejercicios.length; idx++) {
            const ej = sesion.ejercicios[idx];
            await conn.query(
              `INSERT INTO sesion_ejercicios (
                sesion_id, ejercicio_id, orden, series,
                repeticiones_o_tiempo, porcentaje_intensidad, pausa_seg, notas_tecnicas
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sesionId,
                ej.ejercicioId,
                idx + 1,
                ej.series,
                ej.repeticionesOTiempo,
                ej.porcentajeIntensidad,
                ej.pausaSeg,
                ej.notasTecnicas
              ]
            );
          }
        }

        semanaGlobal++;
        fechaCursor.setDate(fechaCursor.getDate() + 7);
      }
    }

    await conn.commit();
    res.status(201).json({
      mensaje: "Macrociclo creado correctamente",
      macrocicloId,
      semanasGeneradas: semanaGlobal - 1
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

async function obtenerMacrocicloPorId(req, res, next) {
  try {
    const { id } = req.params;
    const [macros] = await pool.query("SELECT * FROM macrociclos WHERE id = ?", [id]);
    if (macros.length === 0) {
      return res.status(404).json({ error: "Macrociclo no encontrado" });
    }

    const [mesos] = await pool.query(
      "SELECT * FROM mesociclos WHERE macrociclo_id = ? ORDER BY numero_meso ASC",
      [id]
    );

    res.json({
      macrociclo: macros[0],
      mesociclos: mesos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerDetalleCiclo(req, res, next) {
  try {
    const { id } = req.params;

    const [macros] = await pool.query("SELECT * FROM macrociclos WHERE id = ?", [id]);
    if (macros.length === 0) {
      return res.status(404).json({ error: "Macrociclo no encontrado" });
    }

    const [mesos] = await pool.query(
      "SELECT * FROM mesociclos WHERE macrociclo_id = ? ORDER BY numero_meso ASC",
      [id]
    );

    const mesoIds = mesos.map((m) => m.id);
    let micros = [];
    if (mesoIds.length > 0) {
      const [microRows] = await pool.query(
        `SELECT * FROM microciclos WHERE mesociclo_id IN (${mesoIds.map(() => "?").join(",")}) ORDER BY numero_semana ASC`,
        mesoIds
      );
      micros = microRows;
    }

    const microIds = micros.map((mc) => mc.id);
    let sesionesConEjercicios = [];
    if (microIds.length > 0) {
      const [sesRows] = await pool.query(
        `SELECT * FROM sesiones WHERE microciclo_id IN (${microIds.map(() => "?").join(",")}) ORDER BY id ASC`,
        microIds
      );

      const sesIds = sesRows.map((s) => s.id);
      let detalleRows = [];
      if (sesIds.length > 0) {
        const [det] = await pool.query(
          `SELECT se.id, se.sesion_id, se.ejercicio_id, se.orden, se.series,
                  se.repeticiones_o_tiempo, se.porcentaje_intensidad, se.pausa_seg, se.notas_tecnicas,
                  ec.nombre AS ejercicio_nombre, ec.categoria, ec.impacto
           FROM sesion_ejercicios se
           INNER JOIN ejercicios_catalogo ec ON se.ejercicio_id = ec.id
           WHERE se.sesion_id IN (${sesIds.map(() => "?").join(",")})
           ORDER BY se.sesion_id ASC, se.orden ASC`,
          sesIds
        );
        detalleRows = det;
      }

      const porSesion = new Map();
      for (const d of detalleRows) {
        if (!porSesion.has(d.sesion_id)) porSesion.set(d.sesion_id, []);
        porSesion.get(d.sesion_id).push(d);
      }

      sesionesConEjercicios = sesRows.map((s) => ({
        ...s,
        ejercicios: porSesion.get(s.id) || []
      }));
    }

    res.json({
      macrociclo: macros[0],
      mesociclos: mesos,
      microciclos: micros,
      sesiones: sesionesConEjercicios
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearMacrociclo,
  obtenerMacrocicloPorId,
  obtenerDetalleCiclo
};