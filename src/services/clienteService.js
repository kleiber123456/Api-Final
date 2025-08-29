// src/services/clienteService.js
const ClienteModel = require("../models/clienteModel")
const VehiculoService = require("./vehiculoService")
const CitaService = require("./citaService")
const VentaService = require("./ventaService")

const ClienteService = {
  listar: () => ClienteModel.findAll(),

  obtener: (id) => ClienteModel.findById(id),

  crear: async (data) => {
    // Verificar si ya existe un cliente con el mismo documento
    const clienteExistente = await ClienteModel.findByDocumento(data.documento)
    if (clienteExistente) {
      throw new Error("Ya existe un cliente con este documento")
    }

    // Verificar si ya existe un cliente con el mismo correo
    if (data.correo) {
      const emailExistente = await ClienteModel.findByEmail(data.correo)
      if (emailExistente) {
        throw new Error("Ya existe un cliente con este correo electrónico")
      }
    }

    return ClienteModel.create(data)
  },

  actualizar: async (id, data) => {
    // Verificar si el cliente existe
    const cliente = await ClienteModel.findById(id)
    if (!cliente) {
      throw new Error("Cliente no encontrado")
    }

    // Verificar si hay otro cliente con el mismo documento (que no sea este)
    if (data.documento) {
      const clienteExistente = await ClienteModel.findByDocumento(data.documento)
      if (clienteExistente && clienteExistente.id !== Number.parseInt(id)) {
        throw new Error("Ya existe otro cliente con este documento")
      }
    }

    // Verificar si hay otro cliente con el mismo correo (que no sea este)
    if (data.correo) {
      const emailExistente = await ClienteModel.findByEmail(data.correo)
      if (emailExistente && emailExistente.id !== Number.parseInt(id)) {
        throw new Error("Ya existe otro cliente con este correo electrónico")
      }
    }

    return ClienteModel.update(id, data)
  },

  eliminar: (id) => ClienteModel.delete(id),

  cambiarEstado: async (id) => {
    const cliente = await ClienteModel.findById(id)
    if (!cliente) throw new Error("Cliente no encontrado")

    const nuevoEstado = cliente.estado === "Activo" ? "Inactivo" : "Activo"
    await ClienteModel.cambiarEstado(id, nuevoEstado)
    return nuevoEstado
  },

  // Métodos para rutas prioritarias
  async registrarVehiculo(data) {
    return await VehiculoService.crear(data)
  },

  async obtenerMisCitas(clienteId) {
    return await CitaService.obtenerPorCliente(clienteId)
  },

  async obtenerMisVentas(clienteId) {
    return await VentaService.obtenerPorCliente(clienteId)
  },

  async actualizarPerfil(clienteId, data) {
    return await this.actualizar(clienteId, data)
  },
}

module.exports = ClienteService
