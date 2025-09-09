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

  // --- NUEVOS MÉTODOS PARA CLIENTES ---

  /**
   * Crea una nueva cita para un cliente autenticado.
   * El estado se establece en 'Programada' por defecto.
   * @param {object} data - Datos de la cita (fecha, hora, vehiculo_id, mecanico_id, observaciones).
   * @param {number} clienteId - El ID del cliente autenticado extraído del token.
   * @returns {Promise<number>} - El ID de la nueva cita.
   */
  crearCitaCliente: async (data, clienteId) => {
    // El cliente_id se añade desde el token, y el estado es 'Programada' (ID 1) por defecto.
    const citaData = {
      ...data,
      cliente_id: clienteId,
      estado_cita_id: 1, // 1 = Programada
    }

    // Reutilizamos la lógica de validación del método `crear` original.
    if (!citaData.fecha || !citaData.hora || !citaData.vehiculo_id || !citaData.mecanico_id) {
      throw new Error("Fecha, hora, vehículo y mecánico son requeridos")
    }

    const fechaObj = new Date(citaData.fecha)
    if (fechaObj.getDay() === 0) {
      throw new Error("No se pueden programar citas los domingos")
    }

    const hora = citaData.hora.split(":")[0]
    if (hora < 8 || hora >= 18) {
      throw new Error("Las citas solo pueden programarse entre 8:00 AM y 6:00 PM")
    }

    const disponible = await CitaModel.verificarDisponibilidadMecanico(citaData.mecanico_id, citaData.fecha, citaData.hora)
    if (!disponible) {
      throw new Error("El mecánico ya tiene una cita programada en esta fecha y hora")
    }

    const mecanicosDisponibles = await HorarioModel.verificarDisponibilidad(citaData.fecha, citaData.hora)
    const mecanicoDisponible = mecanicosDisponibles.some((m) => m.id === Number.parseInt(citaData.mecanico_id))

    if (!mecanicoDisponible) {
      throw new Error("El mecánico no está disponible en esta fecha y hora debido a una novedad en su horario")
    }

    return CitaModel.create(citaData)
  },

  /**
   * Actualiza una cita existente de un cliente autenticado.
   * No se puede modificar con menos de 2 horas de antelación.
   * @param {number} citaId - El ID de la cita a actualizar.
   * @param {object} data - Nuevos datos para la cita (fecha, hora, mecanico_id, etc.).
   * @param {number} clienteId - El ID del cliente autenticado para verificación.
   */
  actualizarCitaCliente: async (citaId, data, clienteId) => {
    const cita = await CitaModel.findById(citaId)

    // 1. Verificar que la cita exista y pertenezca al cliente.
    if (!cita) {
      throw new Error("Cita no encontrada.")
    }
    if (cita.cliente_id !== clienteId) {
      throw new Error("No está autorizado para modificar esta cita.")
    }

    // 2. Regla de negocio: No se puede modificar con menos de 2 horas de antelación.
    const ahora = new Date()
    const fechaCita = new Date(`${new Date(cita.fecha).toISOString().split("T")[0]}T${cita.hora}`)
    const diffHoras = (fechaCita - ahora) / (1000 * 60 * 60)

    if (diffHoras < 2) {
      throw new Error("No se puede modificar la cita con menos de 2 horas de antelación.")
    }

    // 3. Preparamos los datos y reutilizamos la lógica de validación del método `actualizar` general.
    const datosParaActualizar = { ...cita, ...data, cliente_id: clienteId, estado_cita_id: cita.estado_cita_id }
    return CitaService.actualizar(citaId, datosParaActualizar)
  },
}

module.exports = CitaService
