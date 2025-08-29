// src/services/citaService.js
const CitaModel = require("../models/citaModel")
const HorarioModel = require("../models/horarioModel")

const CitaService = {
  listar: () => CitaModel.findAll(),

  obtener: (id) => CitaModel.findById(id),

  obtenerPorCliente: (clienteId) => CitaModel.findByCliente(clienteId),

  obtenerPorMecanico: (mecanicoId) => CitaModel.findByMecanico(mecanicoId),

  obtenerPorFecha: (fecha) => CitaModel.findByFecha(fecha),

  obtenerPorEstado: (estadoId) => CitaModel.findByEstado(estadoId),

  crear: async (data) => {
    // Validar datos requeridos
    if (!data.fecha || !data.hora || !data.estado_cita_id || !data.vehiculo_id || !data.mecanico_id) {
      throw new Error("Fecha, hora, estado, vehículo y mecánico son requeridos")
    }

    // Validar que la fecha no sea en domingo
    const fechaObj = new Date(data.fecha)
    if (fechaObj.getDay() === 0) {
      // 0 = Domingo
      throw new Error("No se pueden programar citas los domingos")
    }

    // Validar que la hora esté dentro del horario laboral (8:00 AM - 6:00 PM)
    const hora = data.hora.split(":")[0]
    if (hora < 8 || hora >= 18) {
      throw new Error("Las citas solo pueden programarse entre 8:00 AM y 6:00 PM")
    }

    // Verificar disponibilidad del mecánico
    const disponible = await CitaModel.verificarDisponibilidadMecanico(data.mecanico_id, data.fecha, data.hora)
    if (!disponible) {
      throw new Error("El mecánico ya tiene una cita programada en esta fecha y hora")
    }

    // Verificar si el mecánico tiene alguna novedad que afecte su disponibilidad
    const mecanicosDisponibles = await HorarioModel.verificarDisponibilidad(data.fecha, data.hora)
    const mecanicoDisponible = mecanicosDisponibles.some((m) => m.id === Number.parseInt(data.mecanico_id))

    if (!mecanicoDisponible) {
      throw new Error("El mecánico no está disponible en esta fecha y hora debido a una novedad en su horario")
    }

    return CitaModel.create(data)
  },

  actualizar: async (id, data) => {
    // Verificar que la cita exista
    const cita = await CitaModel.findById(id)
    if (!cita) {
      throw new Error("Cita no encontrada")
    }

    // Validar datos requeridos
    if (!data.fecha || !data.hora || !data.estado_cita_id || !data.vehiculo_id || !data.mecanico_id) {
      throw new Error("Fecha, hora, estado, vehículo y mecánico son requeridos")
    }

    // Validar que la fecha no sea en domingo
    const fechaObj = new Date(data.fecha)
    if (fechaObj.getDay() === 0) {
      // 0 = Domingo
      throw new Error("No se pueden programar citas los domingos")
    }

    // Validar que la hora esté dentro del horario laboral (8:00 AM - 6:00 PM)
    const hora = data.hora.split(":")[0]
    if (hora < 8 || hora >= 18) {
      throw new Error("Las citas solo pueden programarse entre 8:00 AM y 6:00 PM")
    }

    // Si cambia la fecha, hora o mecánico, verificar disponibilidad
    if (data.fecha !== cita.fecha || data.hora !== cita.hora || data.mecanico_id !== cita.mecanico_id) {
      // Verificar disponibilidad del mecánico
      const disponible = await CitaModel.verificarDisponibilidadMecanico(data.mecanico_id, data.fecha, data.hora, id)
      if (!disponible) {
        throw new Error("El mecánico ya tiene una cita programada en esta fecha y hora")
      }

      // Verificar si el mecánico tiene alguna novedad que afecte su disponibilidad
      const mecanicosDisponibles = await HorarioModel.verificarDisponibilidad(data.fecha, data.hora)
      const mecanicoDisponible = mecanicosDisponibles.some((m) => m.id === Number.parseInt(data.mecanico_id))

      if (!mecanicoDisponible) {
        throw new Error("El mecánico no está disponible en esta fecha y hora debido a una novedad en su horario")
      }
    }

    return CitaModel.update(id, data)
  },

  eliminar: (id) => CitaModel.delete(id),

  cambiarEstado: async (id, estadoId) => {
    const cita = await CitaModel.findById(id)
    if (!cita) {
      throw new Error("Cita no encontrada")
    }

    return CitaModel.cambiarEstado(id, estadoId)
  },

  verificarDisponibilidadMecanicos: (fecha, hora) => HorarioModel.verificarDisponibilidad(fecha, hora),

  // Métodos para rutas prioritarias
  async solicitarCita(data) {
    // Para solicitar cita, no necesitamos mecánico asignado inicialmente
    const citaData = {
      ...data,
      estado_cita_id: 1, // Estado "Solicitada"
      mecanico_id: null // Se asignará después
    }
    return await this.crear(citaData)
  },

  async agendarCita(data) {
    // Para agendar cita, necesitamos todos los datos
    return await this.crear(data)
  },

  async asignarMecanico(citaId, mecanicoId) {
    const cita = await CitaModel.findById(citaId)
    if (!cita) {
      throw new Error("Cita no encontrada")
    }

    // Verificar disponibilidad del mecánico
    const disponible = await CitaModel.verificarDisponibilidadMecanico(mecanicoId, cita.fecha, cita.hora, citaId)
    if (!disponible) {
      throw new Error("El mecánico ya tiene una cita programada en esta fecha y hora")
    }

    return await CitaModel.update(citaId, { mecanico_id: mecanicoId })
  },

  async verificarDisponibilidad(fecha, hora, mecanicoId = null) {
    if (mecanicoId) {
      // Verificar disponibilidad de un mecánico específico
      const disponible = await CitaModel.verificarDisponibilidadMecanico(mecanicoId, fecha, hora)
      return { disponible, mecanico_id: mecanicoId }
    } else {
      // Verificar disponibilidad de todos los mecánicos
      return await HorarioModel.verificarDisponibilidad(fecha, hora)
    }
  },
}

module.exports = CitaService
