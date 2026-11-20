const crypto = require("crypto");
const pool = require("../config/db");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, keyHex] = storedHash.split(":");
  const keyBuffer = Buffer.from(keyHex, "hex");
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

async function registrarUsuario(req, res, next) {
  try {
    const {
      nombre,
      email,
      password,
      rol = "practicante",
      modalidad = "kyorugi",
      nivel = "intermedio",
      entrenadorId = null
    } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, correo electrónico y contraseña son obligatorios"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const [existentes] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [emailNormalizado]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        error: "Ya existe un usuario registrado con ese correo electrónico"
      });
    }

    const rolValido = ["entrenador", "practicante"].includes(rol) ? rol : "practicante";
    const modalidadValida = ["kyorugi", "poomsae", "mixto"].includes(modalidad)
      ? modalidad
      : "kyorugi";
    const nivelValido = ["iniciacion", "intermedio", "competitivo"].includes(nivel)
      ? nivel
      : "intermedio";

    const passwordHash = hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, modalidad, nivel, entrenador_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        emailNormalizado,
        passwordHash,
        rolValido,
        modalidadValida,
        nivelValido,
        entrenadorId ? Number(entrenadorId) : null
      ]
    );

    const usuario = {
      id: result.insertId,
      nombre: nombre.trim(),
      email: emailNormalizado,
      rol: rolValido,
      modalidad: modalidadValida,
      nivel: nivelValido,
      entrenador_id: entrenadorId ? Number(entrenadorId) : null
    };

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario
    });
  } catch (error) {
    next(error);
  }
}

async function iniciarSesion(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Ingresa tu correo y contraseña" });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id, nombre, email, password_hash, rol, modalidad, nivel, entrenador_id FROM usuarios WHERE email = ? LIMIT 1",
      [emailNormalizado]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const usuarioSeguro = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      modalidad: user.modalidad,
      nivel: user.nivel,
      entrenador_id: user.entrenador_id
    };

    res.json({
      mensaje: "Sesión iniciada correctamente",
      usuario: usuarioSeguro
    });
  } catch (error) {
    next(error);
  }
}

async function listarEntrenadores(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, modalidad, nivel FROM usuarios WHERE rol = 'entrenador' ORDER BY nombre ASC"
    );
    res.json({ entrenadores: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  listarEntrenadores
};