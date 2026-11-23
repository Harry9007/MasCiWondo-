import { Router } from 'express';
import {
  createFullPeriodizationPlan,
  applyFatigueAdjustmentToSession,
} from '../services/periodizationService.js';

export function createPeriodizationRouter(pool) {
  const router = Router();

  router.post('/macrociclos/generar', async (req, res) => {
    try {
      const { creador_id, titulo } = req.body;
      if (!creador_id || !titulo) {
        return res.status(400).json({ error: 'creador_id y titulo son obligatorios' });
      }

      const result = await createFullPeriodizationPlan(pool, req.body);
      return res.status(201).json({ ok: true, data: result });
    } catch (err) {
      console.error('Error al generar macrociclo:', err);
      return res.status(500).json({ error: 'No se pudo generar el plan de periodización' });
    }
  });

  router.post('/sesiones/:id/ajustar-fatiga', async (req, res) => {
    try {
      const { id } = req.params;
      const { rpe_reportado = 8, motivo_ajuste = 'Fatiga reportada por practicante' } = req.body;

      const result = await applyFatigueAdjustmentToSession(pool, id, { rpe_reportado, motivo_ajuste });
      return res.status(200).json({ ok: true, data: result });
    } catch (err) {
      console.error('Error al ajustar sesión por fatiga:', err);
      return res.status(500).json({ error: 'No se pudo aplicar el ajuste por fatiga' });
    }
  });

  router.post('/evaluaciones', async (req, res) => {
    try {
      const { practicante_id, macrociclo_id = null, fecha_evaluacion, flexiones = null, abdominales = null, patadas = null, observaciones = null } = req.body;
      if (!practicante_id || !fecha_evaluacion) {
        return res.status(400).json({ error: 'practicante_id y fecha_evaluacion son obligatorios' });
      }

      const [ins] = await pool.execute(
        `INSERT INTO evaluaciones_fisicas
          (practicante_id, macrociclo_id, fecha_evaluacion, flexiones, abdominales, patadas, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [practicante_id, macrociclo_id, fecha_evaluacion, flexiones, abdominales, patadas, observaciones]
      );

      return res.status(201).json({ ok: true, id: ins.insertId });
    } catch (err) {
      console.error('Error al guardar evaluación:', err);
      return res.status(500).json({ error: 'No se pudo registrar la evaluación física' });
    }
  });

  router.get('/evaluaciones/practicante/:practicanteId', async (req, res) => {
    try {
      const { practicanteId } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM evaluaciones_fisicas
         WHERE practicante_id = ?
         ORDER BY fecha_evaluacion DESC, id DESC`,
        [practicanteId]
      );
      return res.status(200).json({ ok: true, data: rows });
    } catch (err) {
      console.error('Error al consultar evaluaciones:', err);
      return res.status(500).json({ error: 'No se pudieron obtener las evaluaciones' });
    }
  });

  return router;
}