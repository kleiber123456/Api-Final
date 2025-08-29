const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { checkModulePermission } = require('../middlewares/permissionMiddleware');
const { validate } = require('../middlewares/validationMiddleware');

// Importar controllers
const CitaController = require('../controllers/citaController');
const VentaController = require('../controllers/ventaController');
const ClienteController = require('../controllers/clienteController');
const MecanicoController = require('../controllers/mecanicoController');
const VehiculoController = require('../controllers/vehiculoController');

// ===== FLUJO PRINCIPAL DE CLIENTES =====

// 1. Cliente registra vehículo
router.post('/vehiculos', 
  verifyToken, 
  checkModulePermission('vehiculos'),
  validate('vehiculo'),
  ClienteController.registrarVehiculo
);

// 2. Cliente solicita cita
router.post('/citas/solicitar',
  verifyToken,
  checkModulePermission('citas'),
  validate('cita'),
  CitaController.solicitarCita
);

// 3. Cliente ve sus citas
router.get('/citas/mis-citas',
  verifyToken,
  checkModulePermission('citas'),
  ClienteController.obtenerMisCitas
);

// 4. Cliente ve sus ventas/historial
router.get('/ventas/mis-ventas',
  verifyToken,
  checkModulePermission('ventas'),
  ClienteController.obtenerMisVentas
);

// 5. Cliente actualiza su perfil
router.put('/perfil',
  verifyToken,
  checkModulePermission('clientes'),
  ClienteController.actualizarPerfil
);

// ===== FLUJO PRINCIPAL DE MECÁNICOS =====

// 1. Mecánico ve sus citas asignadas
router.get('/mecanico/citas-asignadas',
  verifyToken,
  checkModulePermission('citas'),
  MecanicoController.obtenerCitasAsignadas
);

// 2. Mecánico actualiza estado de cita
router.put('/mecanico/citas/:id/estado',
  verifyToken,
  checkModulePermission('citas'),
  MecanicoController.actualizarEstadoCita
);

// 3. Mecánico registra trabajo realizado
router.post('/mecanico/citas/:id/trabajo',
  verifyToken,
  checkModulePermission('citas'),
  MecanicoController.registrarTrabajo
);

// 4. Mecánico ve su horario
router.get('/mecanico/mi-horario',
  verifyToken,
  checkModulePermission('horarios'),
  MecanicoController.obtenerMiHorario
);

// 5. Mecánico ve sus estadísticas
router.get('/mecanico/estadisticas',
  verifyToken,
  checkModulePermission('dashboard'),
  MecanicoController.obtenerMisEstadisticas
);

// ===== FLUJO DE RECEPCIÓN =====

// 1. Recepcionista agenda cita para cliente
router.post('/recepcion/citas',
  verifyToken,
  authorizeRoles(1, 2), // Admin o Recepcionista
  validate('cita'),
  CitaController.agendarCita
);

// 2. Recepcionista crea venta
router.post('/recepcion/ventas',
  verifyToken,
  authorizeRoles(1, 2),
  validate('venta'),
  VentaController.crear
);

// 3. Recepcionista asigna mecánico
router.put('/recepcion/citas/:id/asignar-mecanico',
  verifyToken,
  authorizeRoles(1, 2),
  CitaController.asignarMecanico
);

// 4. Recepcionista ve disponibilidad
router.get('/recepcion/disponibilidad',
  verifyToken,
  authorizeRoles(1, 2),
  CitaController.verificarDisponibilidad
);

// ===== ENDPOINTS DE CONSULTA RÁPIDA =====

// Servicios disponibles
router.get('/servicios/disponibles',
  verifyToken,
  checkModulePermission('servicios'),
  (req, res) => {
    // Implementar lógica para obtener servicios activos
    res.json({ message: 'Servicios disponibles' });
  }
);

// Repuestos en stock
router.get('/repuestos/stock',
  verifyToken,
  checkModulePermission('repuestos'),
  (req, res) => {
    // Implementar lógica para obtener repuestos con stock
    res.json({ message: 'Repuestos en stock' });
  }
);

// Estados disponibles
router.get('/estados/citas',
  verifyToken,
  (req, res) => {
    // Implementar lógica para obtener estados de citas
    res.json({ message: 'Estados de citas' });
  }
);

router.get('/estados/ventas',
  verifyToken,
  (req, res) => {
    // Implementar lógica para obtener estados de ventas
    res.json({ message: 'Estados de ventas' });
  }
);

module.exports = router;
