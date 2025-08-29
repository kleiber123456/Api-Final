// src/services/mecanicoService.js
const MecanicoModel = require("../models/mecanicoModel")
const CitaService = require("./citaService")
const HorarioService = require("./horarioService")

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
    await MecanicoModel.cambiarEstado(id, nuevoEstado)
    return nuevoEstado
  },

  obtenerCitas: (id) => MecanicoModel.getCitasByMecanico(id),

  obtenerEstadisticas: (id) => MecanicoModel.getEstadisticasByMecanico(id),

  // Métodos para rutas prioritarias
  async obtenerCitasAsignadas(mecanicoId) {
    return await CitaService.obtenerPorMecanico(mecanicoId)
  },

  async actualizarEstadoCita(citaId, mecanicoId, estado) {
    // Verificar que la cita pertenezca al mecánico
    const cita = await CitaService.obtener(citaId)
    if (!cita || cita.mecanico_id !== mecanicoId) {
      throw new Error("Cita no encontrada o no asignada a este mecánico")
    }
    return await CitaService.cambiarEstado(citaId, estado)
  },

  async registrarTrabajo(citaId, mecanicoId, trabajoData) {
    // Verificar que la cita pertenezca al mecánico
    const cita = await CitaService.obtener(citaId)
    if (!cita || cita.mecanico_id !== mecanicoId) {
      throw new Error("Cita no encontrada o no asignada a este mecánico")
    }
    
    // Aquí se podría implementar la lógica para registrar el trabajo
    // Por ahora solo actualizamos las observaciones de la cita
    return await CitaService.actualizar(citaId, {
      observaciones: trabajoData.observaciones || cita.observaciones
    })
  },

  async obtenerMiHorario(mecanicoId) {
    return await HorarioService.obtenerPorMecanico(mecanicoId)
  },

  async obtenerMisEstadisticas(mecanicoId) {
    return await this.obtenerEstadisticas(mecanicoId)
  },
}

module.exports = MecanicoService
