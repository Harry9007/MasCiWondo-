const pool = require("../config/db");
const { crearAlternativaLigeraEnBD } = require("../services/autorregulacionService");

async function listarSesiones(req, res, next) {
  try {
    const { microcicloId, diaSemana } = req.query;
    let sql = "SELECT * FROM sesiones WHERE 1=1";
    const params = [];

    if (microcicloId) {
      sql += " AND microciclo_id = ?";
      params.push(microcicloId);
    }
    if (diaSemana) {
      sql += " AND dia_semana = ?";
      params.push(diaSemana);
    }

    sql += " ORDER BY id ASC";
    const [rows] = await pool.query(sql, params);
    res.json({ sesiones: rows });
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
      practicanteId
    });

    res.status(201).json({
      mensaje: "Plan alternativo ligero generado",
      data: resultado
    });
  } catch (error) {
    if (error.message === "La sesión original no existe") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

module.exports = { listarSesiones, solicitarAlternativaLigera };