const { Router } = require("express");
const {
  listarSesiones,
  obtenerSesionPorId,
  listarEjerciciosSesion,
  ajustarFatigaSesion,
  solicitarAlternativaLigera,
} = require("../controllers/sesionesController");

const router = Router();

router.get("/", listarSesiones);
router.get("/:sesionId", obtenerSesionPorId);
router.get("/:sesionId/ejercicios", listarEjerciciosSesion);
router.post("/:sesionId/ajustar-fatiga", ajustarFatigaSesion);
router.post("/:sesionId/alternativa-ligera", solicitarAlternativaLigera);

module.exports = router;