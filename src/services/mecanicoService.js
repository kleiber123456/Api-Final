// src/services/mecanicoService.js
const MecanicoModel = require("../models/mecanicoModel")
const CitaModel = require("../models/citaModel") // Importar CitaModel

const MecanicoService = {
  listar: () => MecanicoModel.findAll(),

  obtener: (id) => MecanicoModel.findById(id),

  obtenerPorEstado: (estado) => MecanicoModel.findByEstado(estado),

  crear: async (data) => {
    // Validar datos requeridos
    if (!data.nombre || !data.apellido || !data.tipo_documento || !data.documento) {
      throw new Error("Nombre, apellido, tipo de documento y documento son requeridos")
    }

    // Validar que el tipo de documento sea válido
    const tiposValidos = [
      "Cédula de ciudadanía",
      "Tarjeta de identidad",
      "Cédula de extranjería",
      "Pasaporte",
      "NIT",
      "Otro",
    ]
    if (!tiposValidos.includes(data.tipo_documento)) {
      throw new Error("Tipo de documento no válido")
    }

    // Validar que el teléfono de emergencia sea diferente al teléfono principal
    if (data.telefono && data.telefono_emergencia && data.telefono === data.telefono_emergencia) {
      throw new Error("El teléfono de emergencia debe ser diferente al teléfono principal")
    }

    return MecanicoModel.create(data)
  },

  actualizar: async (id, data) => {
    // Verificar que el mecánico exista
    const mecanico = await MecanicoModel.findById(id)
    if (!mecanico) {
      throw new Error("Mecánico no encontrado")
    }

    // Validar datos requeridos
    if (!data.nombre || !data.apellido || !data.tipo_documento || !data.documento) {
      throw new Error("Nombre, apellido, tipo de documento y documento son requeridos")
    }

    // Validar que el tipo de documento sea válido
    const tiposValidos = [
      "Cédula de ciudadanía",
      "Tarjeta de identidad",
      "Cédula de extranjería",
      "Pasaporte",
      "NIT",
      "Otro",
    ]
    if (!tiposValidos.includes(data.tipo_documento)) {
      throw new Error("Tipo de documento no válido")
    }

    // Validar que el teléfono de emergencia sea diferente al teléfono principal
    if (data.telefono && data.telefono_emergencia && data.telefono === data.telefono_emergencia) {
      throw new Error("El teléfono de emergencia debe ser diferente al teléfono principal")
    }

    return MecanicoModel.update(id, data)
  },

  eliminar: (id) => MecanicoModel.delete(id),

  cambiarEstado: async (id) => {
    const mecanico = await MecanicoModel.findById(id)
    if (!mecanico) throw new Error("Mecánico no encontrado")

    const nuevoEstado = mecanico.estado === "Activo" ? "Inactivo" : "Activo"

    // Si se intenta desactivar, verificar citas asociadas
    if (nuevoEstado === "Inactivo") {
      const citasAsociadas = await CitaModel.findActiveByMecanico(id)
      if (citasAsociadas.length > 0) {
        throw new Error("El mecánico tiene citas asociadas y no puede ser desactivado.")
      }
    }

    await MecanicoModel.cambiarEstado(id, nuevoEstado)
    return nuevoEstado
  },

  obtenerCitas: (id) => MecanicoModel.getCitasByMecanico(id),

  obtenerEstadisticas: (id) => MecanicoModel.getEstadisticasByMecanico(id),
}

module.exports = MecanicoService
