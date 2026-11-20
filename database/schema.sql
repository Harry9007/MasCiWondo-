CREATE DATABASE IF NOT EXISTS taekwondo_periodizacion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taekwondo_periodizacion;

-- 1. Usuarios (Entrenadores y Practicantes)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  rol ENUM('entrenador', 'practicante') NOT NULL DEFAULT 'practicante',
  modalidad ENUM('kyorugi', 'poomsae', 'mixto') NOT NULL DEFAULT 'kyorugi',
  nivel ENUM('iniciacion', 'intermedio', 'competitivo') NOT NULL DEFAULT 'intermedio',
  entrenador_id INT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuarios_entrenador (entrenador_id)
);

-- 2. Macrociclos
CREATE TABLE IF NOT EXISTS macrociclos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creador_id INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  objetivo_principal VARCHAR(160) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_macro_creador (creador_id),
  CONSTRAINT fk_macro_creador FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Mesociclos
CREATE TABLE IF NOT EXISTS mesociclos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  macrociclo_id INT NOT NULL,
  numero_meso INT NOT NULL,
  nombre VARCHAR(140) NOT NULL,
  periodo ENUM('preparacion_general', 'preparacion_especial', 'competitivo', 'descarga') NOT NULL,
  enfoque_fuerza VARCHAR(80) NOT NULL,
  enfoque_resistencia VARCHAR(80) NOT NULL,
  enfoque_velocidad VARCHAR(80) NOT NULL,
  enfoque_tecnico VARCHAR(120) NOT NULL,
  semanas_duracion INT NOT NULL DEFAULT 4,
  INDEX idx_meso_macro (macrociclo_id),
  CONSTRAINT fk_meso_macro FOREIGN KEY (macrociclo_id) REFERENCES macrociclos(id) ON DELETE CASCADE
);

-- 4. Microciclos
CREATE TABLE IF NOT EXISTS microciclos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mesociclo_id INT NOT NULL,
  numero_semana INT NOT NULL,
  fecha_lunes DATE NOT NULL,
  es_descarga BOOLEAN NOT NULL DEFAULT FALSE,
  observaciones TEXT NULL,
  INDEX idx_micro_meso (mesociclo_id),
  CONSTRAINT fk_micro_meso FOREIGN KEY (mesociclo_id) REFERENCES mesociclos(id) ON DELETE CASCADE
);

-- 5. Catálogo de ejercicios
CREATE TABLE IF NOT EXISTS ejercicios_catalogo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  categoria ENUM(
    'fuerza_adaptacion',
    'fuerza_maxima',
    'fuerza_potencia',
    'fuerza_resistencia',
    'capacidad_aerobica',
    'potencia_aerobica',
    'velocidad_agilidad',
    'tecnica_kyorugi',
    'poomsae',
    'movilidad_recuperacion'
  ) NOT NULL,
  impacto ENUM('bajo', 'medio', 'alto') NOT NULL DEFAULT 'medio',
  equipamiento VARCHAR(120) NOT NULL DEFAULT 'ninguno',
  ejercicio_alternativo_id INT NULL,
  INDEX idx_ej_alternativo (ejercicio_alternativo_id)
);

-- 6. Sesiones
CREATE TABLE IF NOT EXISTS sesiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  microciclo_id INT NOT NULL,
  practicante_id INT NULL,
  dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
  tipo_plan ENUM('base_entrenador', 'alternativa_ligera', 'plan_propio') NOT NULL DEFAULT 'base_entrenador',
  sesion_origen_id INT NULL,
  lugar_terreno VARCHAR(100) NOT NULL DEFAULT 'Dojang',
  rpe_reportado TINYINT NULL,
  motivo_ajuste VARCHAR(160) NULL,
  observaciones TEXT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sesion_micro (microciclo_id),
  INDEX idx_sesion_practicante (practicante_id),
  INDEX idx_sesion_origen (sesion_origen_id),
  CONSTRAINT fk_sesion_micro FOREIGN KEY (microciclo_id) REFERENCES microciclos(id) ON DELETE CASCADE,
  CONSTRAINT fk_sesion_practicante FOREIGN KEY (practicante_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 7. Detalle de ejercicios por sesión
CREATE TABLE IF NOT EXISTS sesion_ejercicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sesion_id INT NOT NULL,
  ejercicio_id INT NOT NULL,
  orden INT NOT NULL DEFAULT 1,
  series INT NOT NULL DEFAULT 3,
  repeticiones_o_tiempo VARCHAR(80) NOT NULL,
  porcentaje_intensidad VARCHAR(60) NULL,
  pausa_seg INT NOT NULL DEFAULT 60,
  notas_tecnicas VARCHAR(255) NULL,
  INDEX idx_se_sesion (sesion_id),
  INDEX idx_se_ejercicio (ejercicio_id),
  CONSTRAINT fk_se_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE,
  CONSTRAINT fk_se_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicios_catalogo(id) ON DELETE RESTRICT
);

-- 8. Claves foráneas auto-referenciadas añadidas tras crear las tablas
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuario_entrenador FOREIGN KEY (entrenador_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE ejercicios_catalogo
  ADD CONSTRAINT fk_ej_alternativo FOREIGN KEY (ejercicio_alternativo_id) REFERENCES ejercicios_catalogo(id) ON DELETE SET NULL;

ALTER TABLE sesiones
  ADD CONSTRAINT fk_sesion_origen FOREIGN KEY (sesion_origen_id) REFERENCES sesiones(id) ON DELETE SET NULL;