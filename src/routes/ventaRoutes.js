// src/routes/ventaRoutes.js
const express = require("express")
const router = express.Router()
const VentaController = require("../controllers/ventaController")
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware")

// Rutas de consulta (GET) - solo requieren autenticación
router.get("/", verifyToken, VentaController.listar)
// Nueva ruta para que el cliente vea sus propias ventas
router.get("/mis-ventas", verifyToken, authorizeRoles(4), VentaController.obtenerMisVentas)
router.get("/cliente/:clienteId", verifyToken, VentaController.obtenerPorCliente)
router.get("/estado/:estadoId", verifyToken, VentaController.obtenerPorEstado)
router.get("/rango", verifyToken, VentaController.obtenerPorRangoFechas)

// Rutas de historial - DEBEN IR ANTES de /:id
router.get("/historial/cliente/:clienteId", verifyToken, VentaController.obtenerHistorialPorCliente)
router.get("/historial/vehiculo/:vehiculoId", verifyToken, VentaController.obtenerHistorialPorVehiculo)

// Ruta específica para obtener una venta por ID - DEBE IR DESPUÉS de las rutas específicas
router.get("/:id", verifyToken, VentaController.obtener)
router.get("/:id/historial", verifyToken, VentaController.obtenerHistorial)

// Rutas de modificación - requieren roles específicos
router.post("/", verifyToken, authorizeRoles(1, 2), VentaController.crear)
router.put("/:id", verifyToken, authorizeRoles(1, 2), VentaController.actualizar)

// Vincular venta con cita
router.post("/:id/vincular-cita", verifyToken, authorizeRoles(1, 2), VentaController.vincularConCita)

// Cambio de estado - solo administradores
router.put("/:id/cambiar-estado", verifyToken, authorizeRoles(1), VentaController.cambiarEstado)

// Eliminación - solo administradores
router.delete("/:id", verifyToken, authorizeRoles(1), VentaController.eliminar)

module.exports = router
