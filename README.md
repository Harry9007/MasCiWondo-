# 🥋 MasCiWondo
## Planificador de Ciclos de Taekwondo (Web + Móvil)

**MasCiWondo** es una plataforma web y móvil orientada a la planificación deportiva y el control de carga en **Taekwondo** (*Kyorugi*, *Poomsae* y acondicionamiento físico), estructurando entrenamientos en **macrociclos**, **mesociclos**, **microciclos** y **sesiones semanales**.

Está diseñada para cubrir tanto la gestión de entrenadores como la autorregulación del practicante:

- **Planificación de entrenadores para múltiples practicantes** y creación de planes propios.
- **Control de sobrecarga y fatiga (RPE)** con generación de **planes alternativos más ligeros**.
- **Exportación de macrociclos** en formatos **JSON** y **CSV** para análisis o respaldo.

---

## 📁 Estructura del Proyecto

```text
masciwondo/
├── backend/                  # API REST con Node.js, Express y MySQL / TiDB Cloud
│   ├── src/
│   │   ├── config/           # Configuración y pool de conexión (db.js)
│   │   ├── controllers/      # Lógica de autenticación, ciclos y sesiones
│   │   ├── routes/           # Definición de rutas de la API
│   │   └── app.js            # Punto de entrada y configuración de Express
│   ├── .env.example          # Plantilla de variables de entorno (sin credenciales reales)
│   └── package.json
├── database/                 # Esquema SQL y datos semilla
├── docs/                     # Documentación del plan de trabajo y reglas deportivas
├── frontend/
│   ├── web/                  # Panel web de autenticación, planificación y seguimiento
│   │   ├── index.html        # Inicio de sesión y registro de usuarios
│   │   ├── macrociclo.html   # Generación de macrociclos, seguimiento y exportación
│   │   ├── css/
│   │   │   └── estilos.css
│   │   └── js/
│   │       ├── api.js
│   │       ├── auth.js
│   │       ├── macrociclo.js
│   │       └── seguimiento.js
│   └── mobile/               # Interfaz móvil para el practicante
│       ├── index.html
│       ├── css/
│       └── js/
├── shared/                   # Funciones compartidas en JavaScript (periodización y ajustes)
├── .gitignore
└── README.md