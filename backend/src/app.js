const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const ciclosRoutes = require("./routes/ciclos.routes");
const sesionesRoutes = require("./routes/sesiones.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, servicio: "taekwondo-ciclos-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ciclos", ciclosRoutes);
app.use("/api/sesiones", sesionesRoutes);

// Manejo básico de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error("Error en servidor:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
