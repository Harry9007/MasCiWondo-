require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const periodizationRoutes = require("./routes/periodizationRoutes");
const sesionesRoutes = require("./routes/sesiones.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas de autenticación, periodización y sesiones
app.use("/api/auth", authRoutes);
app.use("/api", periodizationRoutes);
app.use("/api/sesiones", sesionesRoutes);

// Ruta 404 en formato JSON para endpoints inexistentes
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador global de errores siempre en JSON
app.use((err, req, res, next) => {
  console.error("Error en servidor:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Error interno del servidor",
    code: err.code || undefined,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});