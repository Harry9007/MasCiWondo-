require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    const conn = await pool.getConnection();
    console.log("Conexión a base de datos (TiDB/MySQL) verificada.");
    conn.release();
  } catch (error) {
    console.warn("Advertencia al conectar con la BD al iniciar:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

iniciarServidor();