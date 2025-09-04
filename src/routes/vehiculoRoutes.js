// src/routes/vehiculoRoutes.js
const express = require("express")
const router = express.Router()
const VehiculoController = require("../controllers/vehiculoController")
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware")

// Endpoints administrativos (requieren roles específicos)
router.get("/", verifyToken, VehiculoController.listar)
router.get("/:id", verifyToken, VehiculoController.obtener)
router.post("/", verifyToken, authorizeRoles(1, 2), VehiculoController.crear)
router.put("/:id", verifyToken, authorizeRoles(1, 2), VehiculoController.actualizar)
router.put("/:id/cambiar-estado", verifyToken, authorizeRoles(1), VehiculoController.cambiarEstado)
router.delete("/:id", verifyToken, authorizeRoles(1), VehiculoController.eliminar)

router.get("/cliente/:clienteId", verifyToken, VehiculoController.obtenerPorCliente)
router.post("/cliente/crear", verifyToken, VehiculoController.crearVehiculoCliente)
router.get("/cliente/detalle/:id", verifyToken, VehiculoController.obtenerDetalleVehiculoCliente)
router.put("/cliente/editar/:id", verifyToken, VehiculoController.editarVehiculoCliente)

module.exports = router
