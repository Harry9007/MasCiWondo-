const { Router } = require("express");
const { listarSesiones, solicitarAlternativaLigera } = require("../controllers/sesionesController");

const router = Router();

router.get("/", listarSesiones);
router.post("/:sesionId/alternativa-ligera", solicitarAlternativaLigera);

module.exports = router;