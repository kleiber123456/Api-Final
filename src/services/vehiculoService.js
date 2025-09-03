// src/services/vehiculoService.js
const VehiculoModel = require("../models/vehiculoModel")

const VehiculoService = {
  listar: () => VehiculoModel.findAll(),
  obtener: (id) => VehiculoModel.findById(id),
  obtenerPorCliente: (clienteId) => VehiculoModel.findByCliente(clienteId),
  crear: (data) => VehiculoModel.create(data),
  actualizar: (id, data) => VehiculoModel.update(id, data),
  eliminar: (id) => VehiculoModel.delete(id),

  cambiarEstado: async (id) => {
    const vehiculo = await VehiculoModel.findById(id)
    if (!vehiculo) throw new Error("Vehículo no encontrado")
    const nuevoEstado = vehiculo.estado === "Activo" ? "Inactivo" : "Activo"
    await VehiculoModel.cambiarEstado(id, nuevoEstado)
    return nuevoEstado
  },

  crearVehiculoCliente: (data) => VehiculoModel.createForClient(data),

  obtenerMisVehiculos: (usuarioId) => VehiculoModel.findByUsuarioId(usuarioId),

  verificarPropietario: (vehiculoId, usuarioId) => VehiculoModel.verifyOwnership(vehiculoId, usuarioId),

  editarMiVehiculo: (vehiculoId, data, usuarioId) => VehiculoModel.updateByOwner(vehiculoId, data, usuarioId),
}

module.exports = VehiculoService
