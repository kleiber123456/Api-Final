-- Crear tabla de permisos por módulo
CREATE TABLE IF NOT EXISTS permiso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modulo VARCHAR(45) NOT NULL,
  accion VARCHAR(45) NOT NULL,
  estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de relación permisos-roles
CREATE TABLE IF NOT EXISTS permiso_has_rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permiso_id INT NOT NULL,
  rol_id INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_permiso_rol (permiso_id, rol_id),
  FOREIGN KEY (permiso_id) REFERENCES permiso(id) ON DELETE CASCADE,
  FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE CASCADE
);

-- Insertar permisos por módulo
INSERT IGNORE INTO permiso (modulo, accion) VALUES
-- Módulo de usuarios
('usuarios', 'ver'),
('usuarios', 'crear'),
('usuarios', 'editar'),
('usuarios', 'eliminar'),

-- Módulo de clientes
('clientes', 'ver'),
('clientes', 'crear'),
('clientes', 'editar'),
('clientes', 'eliminar'),

-- Módulo de vehículos
('vehiculos', 'ver'),
('vehiculos', 'crear'),
('vehiculos', 'editar'),
('vehiculos', 'eliminar'),

-- Módulo de citas
('citas', 'ver'),
('citas', 'crear'),
('citas', 'editar'),
('citas', 'eliminar'),

-- Módulo de ventas
('ventas', 'ver'),
('ventas', 'crear'),
('ventas', 'editar'),
('ventas', 'eliminar'),

-- Módulo de servicios
('servicios', 'ver'),
('servicios', 'crear'),
('servicios', 'editar'),
('servicios', 'eliminar'),

-- Módulo de repuestos
('repuestos', 'ver'),
('repuestos', 'crear'),
('repuestos', 'editar'),
('repuestos', 'eliminar'),

-- Módulo de mecánicos
('mecanicos', 'ver'),
('mecanicos', 'crear'),
('mecanicos', 'editar'),
('mecanicos', 'eliminar'),

-- Módulo de proveedores
('proveedores', 'ver'),
('proveedores', 'crear'),
('proveedores', 'editar'),
('proveedores', 'eliminar'),

-- Módulo de compras
('compras', 'ver'),
('compras', 'crear'),
('compras', 'editar'),
('compras', 'eliminar'),

-- Módulo de dashboard
('dashboard', 'ver'),
('dashboard', 'admin'),

-- Módulo de horarios
('horarios', 'ver'),
('horarios', 'crear'),
('horarios', 'editar'),
('horarios', 'eliminar'),

-- Módulo de reportes
('reportes', 'ver'),
('reportes', 'generar'),
('reportes', 'exportar');

-- Asignar permisos a roles
-- Administrador (rol_id = 1) - todos los módulos
INSERT IGNORE INTO permiso_has_rol (permiso_id, rol_id)
SELECT p.id, 1 FROM permiso p;

-- Recepcionista (rol_id = 2) - mismos permisos que administrador
INSERT IGNORE INTO permiso_has_rol (permiso_id, rol_id)
SELECT p.id, 2 FROM permiso p;

-- Mecánico (rol_id = 3) - módulos limitados
INSERT IGNORE INTO permiso_has_rol (permiso_id, rol_id)
SELECT p.id, 3 FROM permiso p 
WHERE p.modulo IN (
  'citas', 'ventas', 'servicios', 'repuestos', 'clientes', 'vehiculos', 'dashboard', 'horarios'
);

-- Cliente (rol_id = 4) - módulos básicos
INSERT IGNORE INTO permiso_has_rol (permiso_id, rol_id)
SELECT p.id, 4 FROM permiso p 
WHERE p.modulo IN (
  'citas', 'ventas', 'clientes', 'vehiculos'
) AND p.accion IN ('ver', 'crear', 'editar');
