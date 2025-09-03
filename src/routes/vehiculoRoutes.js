// src/routes/vehiculoRoutes.js
const express = require("express")
const router = express.Router()
const VehiculoController = require("../controllers/vehiculoController")
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware")

router.get("/", verifyToken, VehiculoController.listar)
router.get("/:id", verifyToken, VehiculoController.obtener)
router.get("/cliente/:clienteId", verifyToken, VehiculoController.obtenerPorCliente)
router.post("/", verifyToken, authorizeRoles(1, 2), VehiculoController.crear)
router.put("/:id", verifyToken, authorizeRoles(1, 2), VehiculoController.actualizar)
router.put("/:id/cambiar-estado", verifyToken, authorizeRoles(1), VehiculoController.cambiarEstado)
router.delete("/:id", verifyToken, authorizeRoles(1), VehiculoController.eliminar)

router.post("/cliente", verifyToken, VehiculoController.crearVehiculoCliente)
router.get("/cliente/mis-vehiculos", verifyToken, VehiculoController.obtenerMisVehiculos)
router.put("/cliente/:id", verifyToken, VehiculoController.editarMiVehiculo)

module.exports = router
