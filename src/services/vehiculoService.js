// src/services/vehiculoService.js
const VehiculoModel = require("../models/vehiculoModel")

const VehiculoService = {
  listar: () => VehiculoModel.findAll(),
  obtener: (id) => VehiculoModel.findById(id),
  obtenerPorCliente: (clienteId) => VehiculoModel.findByClienteId(clienteId),
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

  crearVehiculoCliente: (data) => VehiculoModel.create(data),

  obtenerDetalleVehiculoCliente: (vehiculoId, clienteId) => VehiculoModel.findByIdAndClienteId(vehiculoId, clienteId),

  verificarPropietario: (vehiculoId, clienteId) => VehiculoModel.verifyOwnership(vehiculoId, clienteId),

  editarVehiculoCliente: (vehiculoId, data, clienteId) => VehiculoModel.updateByOwner(vehiculoId, data, clienteId),
}

module.exports = VehiculoService
