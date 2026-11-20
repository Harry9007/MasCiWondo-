const { Router } = require("express");
const {
  crearMacrociclo,
  obtenerMacrocicloPorId,
  obtenerDetalleCiclo
} = require("../controllers/ciclosController");

const router = Router();

router.post("/macrociclos", crearMacrociclo);
router.get("/macrociclos/:id", obtenerMacrocicloPorId);
router.get("/macrociclos/:id/detalle", obtenerDetalleCiclo);

module.exports = router;