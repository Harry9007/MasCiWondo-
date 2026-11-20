const { Router } = require("express");
const { crearMacrociclo, obtenerMacrocicloPorId } = require("../controllers/ciclosController");

const router = Router();

router.post("/macrociclos", crearMacrociclo);
router.get("/macrociclos/:id", obtenerMacrocicloPorId);

module.exports = router;