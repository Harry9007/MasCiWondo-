const { Router } = require("express");
const {
  registrarUsuario,
  iniciarSesion,
  listarEntrenadores
} = require("../controllers/authController");

const router = Router();

router.post("/registro", registrarUsuario);
router.post("/login", iniciarSesion);
router.get("/entrenadores", listarEntrenadores);

module.exports = router;