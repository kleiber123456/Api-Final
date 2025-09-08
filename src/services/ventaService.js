// src/services/ventaService.js
const VentaModel = require("../models/ventaModel")
const VentaPorServicioModel = require("../models/ventaPorServicioModel")
const VentaPorRepuestoModel = require("../models/ventaPorRepuestoModel")
const VentaCitaModel = require("../models/ventaCitaModel")
const HistorialVentaModel = require("../models/historialVentaModel")
const HistorialCitaModel = require("../models/historialCitaModel")
const CitaModel = require("../models/citaModel")
const RepuestoModel = require("../models/repuestoModel")
const ServicioModel = require("../models/servicioModel")
const MecanicoModel = require("../models/mecanicoModel")
const db = require("../config/db")

const VentaService = {
  listar: () => VentaModel.findAll(),

  obtener: async (id) => {
    const venta = await VentaModel.findById(id)
    if (venta) {
      venta.servicios = await VentaPorServicioModel.findByVenta(id)
      venta.repuestos = await VentaPorRepuestoModel.findByVenta(id)
      venta.cita = await VentaCitaModel.obtenerCitaPorVenta(id)
    }
    return venta
  },

  obtenerPorCliente: (clienteId) => VentaModel.findByCliente(clienteId),

  obtenerPorEstado: (estadoId) => VentaModel.findByEstado(estadoId),

  obtenerPorRangoFechas: (fechaInicio, fechaFin) => VentaModel.findByDateRange(fechaInicio, fechaFin),

  crear: async (data) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const { cliente_id, estado_venta_id, mecanico_id, servicios, repuestos, cita_id } = data

      // Validaciones básicas
      if (!cliente_id || !estado_venta_id) {
        throw new Error("Cliente y estado de venta son requeridos")
      }

      // Validar mecánico si se proporciona
      if (mecanico_id) {
        const mecanicoData = await MecanicoModel.findById(mecanico_id)
        if (!mecanicoData) {
          throw new Error(`Mecánico con ID ${mecanico_id} no encontrado`)
        }

        if (mecanicoData.estado !== "Activo") {
          throw new Error(`El mecánico ${mecanicoData.nombre} no está activo`)
        }
      }

      // Validar cita si se proporciona
      let citaData = null
      if (cita_id) {
        citaData = await CitaModel.findById(cita_id)
        if (!citaData) {
          throw new Error(`Cita con ID ${cita_id} no encontrada`)
        }
      }

      // Crear la venta
      const ventaId = await VentaModel.create({
        cliente_id,
        estado_venta_id,
        mecanico_id: mecanico_id || null,
        fecha: new Date(),
        total: 0,
      })

      let total = 0
      const serviciosDetalle = []
      const repuestosDetalle = []

      // Procesar servicios
      if (servicios && servicios.length > 0) {
        for (const servicio of servicios) {
          const { servicio_id } = servicio

          const servicioData = await ServicioModel.findById(servicio_id)
          if (!servicioData) {
            throw new Error(`Servicio con ID ${servicio_id} no encontrado`)
          }

          if (servicioData.estado !== "Activo") {
            throw new Error(`El servicio ${servicioData.nombre} no está activo`)
          }

          const subtotal = servicioData.precio
          total += subtotal

          await VentaPorServicioModel.create({
            venta_id: ventaId,
            servicio_id,
            subtotal,
          })

          serviciosDetalle.push({
            servicio_id,
            servicio_nombre: servicioData.nombre,
            servicio_descripcion: servicioData.descripcion,
            precio_servicio: servicioData.precio,
            subtotal,
          })
        }
      }

      // Procesar repuestos
      if (repuestos && repuestos.length > 0) {
        for (const repuesto of repuestos) {
          const { repuesto_id, cantidad } = repuesto

          const repuestoData = await RepuestoModel.findById(repuesto_id)
          if (!repuestoData) {
            throw new Error(`Repuesto con ID ${repuesto_id} no encontrado`)
          }

          if (repuestoData.estado !== "Activo") {
            throw new Error(`El repuesto ${repuestoData.nombre} no está activo`)
          }

          if (repuestoData.cantidad < cantidad) {
            throw new Error(
              `Stock insuficiente para el repuesto ${repuestoData.nombre}. Stock disponible: ${repuestoData.cantidad}`,
            )
          }

          const precio_unitario = repuestoData.precio_venta
          const subtotal = cantidad * precio_unitario
          total += subtotal

          await VentaPorRepuestoModel.create({
            venta_id: ventaId,
            repuesto_id,
            cantidad,
            precio_unitario,
            subtotal,
          })

          // Actualizar stock del repuesto
          const nuevaCantidad = repuestoData.cantidad - cantidad
          const nuevoTotal = nuevaCantidad * repuestoData.precio_venta

          await RepuestoModel.update(repuesto_id, {
            ...repuestoData,
            cantidad: nuevaCantidad,
            total: nuevoTotal,
          })

          // Obtener categoría para el historial
          const [categoriaResult] = await connection.query("SELECT nombre FROM categoria_repuesto WHERE id = ?", [
            repuestoData.categoria_repuesto_id,
          ])

          repuestosDetalle.push({
            repuesto_id,
            repuesto_nombre: repuestoData.nombre,
            repuesto_descripcion: repuestoData.descripcion,
            categoria_nombre: categoriaResult[0]?.nombre || "Sin categoría",
            cantidad,
            precio_unitario,
            subtotal,
          })
        }
      }

      // Actualizar el total de la venta
      await VentaModel.update(ventaId, {
        cliente_id,
        estado_venta_id,
        mecanico_id: mecanico_id || null,
        fecha: new Date(),
        total,
      })

      // Vincular con cita si se proporciona
      if (cita_id) {
        await VentaCitaModel.vincular(ventaId, cita_id, "Venta creada y vinculada con cita")

        // Cambiar estado de cita a "En Proceso" (ID 2) si la venta está en "Pendiente" (ID 1)
        if (estado_venta_id == 1) {
          const estadoAnterior = citaData.estado_cita_id
          await CitaModel.cambiarEstado(cita_id, 2)

          // Crear historial de cita
          await HistorialCitaModel.crear({
            cita_id,
            venta_id: ventaId,
            cliente_id: citaData.cliente_id || null,
            vehiculo_id: citaData.vehiculo_id,
            mecanico_id: citaData.mecanico_id,
            fecha_cita: citaData.fecha,
            hora_cita: citaData.hora,
            estado_anterior:
              estadoAnterior == 1
                ? "Programada"
                : estadoAnterior == 2
                  ? "En Proceso"
                  : estadoAnterior == 3
                    ? "Completada"
                    : "Cancelada",
            estado_nuevo: "En Proceso",
            observaciones: "Estado cambiado automáticamente al crear venta vinculada",
            usuario_modificacion: null,
          })
        }
      }

      // Crear historial de venta
      await HistorialVentaModel.crear({
        venta_id: ventaId,
        cita_id: cita_id || null,
        cliente_id,
        vehiculo_id: null,
        mecanico_id: mecanico_id || null,
        fecha_venta: new Date(),
        estado_anterior: null,
        estado_nuevo: estado_venta_id == 1 ? "Pendiente" : estado_venta_id == 2 ? "Pagada" : "Cancelada",
        total_venta: total,
        observaciones: "Venta creada",
        usuario_modificacion: null,
        servicios: serviciosDetalle,
        repuestos: repuestosDetalle,
      })

      await connection.commit()
      return ventaId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  actualizar: async (id, data) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const { cliente_id, estado_venta_id, mecanico_id, servicios, repuestos } = data

      // Obtener la venta actual
      const ventaActual = await VentaModel.findById(id)
      if (!ventaActual) {
        throw new Error("Venta no encontrada")
      }

      const estadoAnterior = ventaActual.estado_venta_id

      // Validar mecánico si se proporciona
      if (mecanico_id) {
        const mecanicoData = await MecanicoModel.findById(mecanico_id)
        if (!mecanicoData) {
          throw new Error(`Mecánico con ID ${mecanico_id} no encontrado`)
        }

        if (mecanicoData.estado !== "Activo") {
          throw new Error(`El mecánico ${mecanicoData.nombre} no está activo`)
        }
      }

      // Obtener los repuestos actuales para revertir el stock
      const repuestosActuales = await VentaPorRepuestoModel.findByVenta(id)

      // Revertir el stock de los repuestos actuales
      for (const repuestoActual of repuestosActuales) {
        const repuestoData = await RepuestoModel.findById(repuestoActual.repuesto_id)
        if (repuestoData) {
          const nuevaCantidad = repuestoData.cantidad + repuestoActual.cantidad
          const nuevoTotal = nuevaCantidad * repuestoData.precio_venta

          await RepuestoModel.update(repuestoActual.repuesto_id, {
            ...repuestoData,
            cantidad: nuevaCantidad,
            total: nuevoTotal,
          })
        }
      }

      // Eliminar los detalles actuales
      await VentaPorServicioModel.deleteByVenta(id)
      await VentaPorRepuestoModel.deleteByVenta(id)

      let total = 0
      const serviciosDetalle = []
      const repuestosDetalle = []

      // Procesar nuevos servicios
      if (servicios && servicios.length > 0) {
        for (const servicio of servicios) {
          const { servicio_id } = servicio

          const servicioData = await ServicioModel.findById(servicio_id)
          if (!servicioData) {
            throw new Error(`Servicio con ID ${servicio_id} no encontrado`)
          }

          if (servicioData.estado !== "Activo") {
            throw new Error(`El servicio ${servicioData.nombre} no está activo`)
          }

          const subtotal = servicioData.precio
          total += subtotal

          await VentaPorServicioModel.create({
            venta_id: id,
            servicio_id,
            subtotal,
          })

          serviciosDetalle.push({
            servicio_id,
            servicio_nombre: servicioData.nombre,
            servicio_descripcion: servicioData.descripcion,
            precio_servicio: servicioData.precio,
            subtotal,
          })
        }
      }

      // Procesar nuevos repuestos
      if (repuestos && repuestos.length > 0) {
        for (const repuesto of repuestos) {
          const { repuesto_id, cantidad } = repuesto

          const repuestoData = await RepuestoModel.findById(repuesto_id)
          if (!repuestoData) {
            throw new Error(`Repuesto con ID ${repuesto_id} no encontrado`)
          }

          if (repuestoData.estado !== "Activo") {
            throw new Error(`El repuesto ${repuestoData.nombre} no está activo`)
          }

          if (repuestoData.cantidad < cantidad) {
            throw new Error(
              `Stock insuficiente para el repuesto ${repuestoData.nombre}. Stock disponible: ${repuestoData.cantidad}`,
            )
          }

          const precio_unitario = repuestoData.precio_venta
          const subtotal = cantidad * precio_unitario
          total += subtotal

          await VentaPorRepuestoModel.create({
            venta_id: id,
            repuesto_id,
            cantidad,
            precio_unitario,
            subtotal,
          })

          // Actualizar stock del repuesto
          const nuevaCantidad = repuestoData.cantidad - cantidad
          const nuevoTotal = nuevaCantidad * repuestoData.precio_venta

          await RepuestoModel.update(repuesto_id, {
            ...repuestoData,
            cantidad: nuevaCantidad,
            total: nuevoTotal,
          })

          // Obtener categoría para el historial
          const [categoriaResult] = await connection.query("SELECT nombre FROM categoria_repuesto WHERE id = ?", [
            repuestoData.categoria_repuesto_id,
          ])

          repuestosDetalle.push({
            repuesto_id,
            repuesto_nombre: repuestoData.nombre,
            repuesto_descripcion: repuestoData.descripcion,
            categoria_nombre: categoriaResult[0]?.nombre || "Sin categoría",
            cantidad,
            precio_unitario,
            subtotal,
          })
        }
      }

      // Actualizar la venta
      await VentaModel.update(id, {
        cliente_id,
        estado_venta_id,
        mecanico_id: mecanico_id || null,
        fecha: ventaActual.fecha,
        total,
      })

      // Manejar cambios de estado y sincronización con citas
      if (estadoAnterior != estado_venta_id) {
        const citaVinculada = await VentaCitaModel.obtenerCitaPorVenta(id)

        if (citaVinculada) {
          let nuevoEstadoCita = null

          // Lógica de cambio de estado de cita según estado de venta
          if (estado_venta_id == 2) {
            // Venta Pagada
            nuevoEstadoCita = 3 // Cita Completada
          } else if (estado_venta_id == 3) {
            // Venta Cancelada
            nuevoEstadoCita = 4 // Cita Cancelada
          } else if (estado_venta_id == 1) {
            // Venta Pendiente
            nuevoEstadoCita = 2 // Cita En Proceso
          }

          if (nuevoEstadoCita && citaVinculada.estado_cita_id != nuevoEstadoCita) {
            await CitaModel.cambiarEstado(citaVinculada.id, nuevoEstadoCita)

            // Crear historial de cita
            await HistorialCitaModel.crear({
              cita_id: citaVinculada.id,
              venta_id: id,
              cliente_id: citaVinculada.cliente_id,
              vehiculo_id: citaVinculada.vehiculo_id,
              mecanico_id: citaVinculada.mecanico_id,
              fecha_cita: citaVinculada.fecha,
              hora_cita: citaVinculada.hora,
              estado_anterior:
                citaVinculada.estado_cita_id == 1
                  ? "Programada"
                  : citaVinculada.estado_cita_id == 2
                    ? "En Proceso"
                    : citaVinculada.estado_cita_id == 3
                      ? "Completada"
                      : "Cancelada",
              estado_nuevo:
                nuevoEstadoCita == 1
                  ? "Programada"
                  : nuevoEstadoCita == 2
                    ? "En Proceso"
                    : nuevoEstadoCita == 3
                      ? "Completada"
                      : "Cancelada",
              observaciones: "Estado cambiado automáticamente por actualización de venta",
              usuario_modificacion: null,
            })
          }
        }
      }

      // Crear historial de venta
      await HistorialVentaModel.crear({
        venta_id: id,
        cita_id: null,
        cliente_id,
        vehiculo_id: null,
        mecanico_id: mecanico_id || null,
        fecha_venta: ventaActual.fecha,
        estado_anterior: estadoAnterior == 1 ? "Pendiente" : estadoAnterior == 2 ? "Pagada" : "Cancelada",
        estado_nuevo: estado_venta_id == 1 ? "Pendiente" : estado_venta_id == 2 ? "Pagada" : "Cancelada",
        total_venta: total,
        observaciones: "Venta actualizada",
        usuario_modificacion: null,
        servicios: serviciosDetalle,
        repuestos: repuestosDetalle,
      })

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  eliminar: async (id) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // Obtener la venta para verificar que existe
      const venta = await VentaModel.findById(id)
      if (!venta) {
        throw new Error("Venta no encontrada")
      }

      // Obtener los repuestos para revertir el stock
      const repuestos = await VentaPorRepuestoModel.findByVenta(id)

      // Revertir el stock
      for (const repuesto of repuestos) {
        const repuestoData = await RepuestoModel.findById(repuesto.repuesto_id)
        if (repuestoData) {
          const nuevaCantidad = repuestoData.cantidad + repuesto.cantidad
          const nuevoTotal = nuevaCantidad * repuestoData.precio_venta

          await RepuestoModel.update(repuesto.repuesto_id, {
            ...repuestoData,
            cantidad: nuevaCantidad,
            total: nuevoTotal,
          })
        }
      }

      // Verificar si hay cita vinculada y cambiar su estado a "Programada"
      const citaVinculada = await VentaCitaModel.obtenerCitaPorVenta(id)
      if (citaVinculada) {
        await CitaModel.cambiarEstado(citaVinculada.id, 1) // Programada

        // Crear historial de cita
        await HistorialCitaModel.crear({
          cita_id: citaVinculada.id,
          venta_id: null,
          cliente_id: citaVinculada.cliente_id,
          vehiculo_id: citaVinculada.vehiculo_id,
          mecanico_id: citaVinculada.mecanico_id,
          fecha_cita: citaVinculada.fecha,
          hora_cita: citaVinculada.hora,
          estado_anterior:
            citaVinculada.estado_cita_id == 1
              ? "Programada"
              : citaVinculada.estado_cita_id == 2
                ? "En Proceso"
                : citaVinculada.estado_cita_id == 3
                  ? "Completada"
                  : "Cancelada",
          estado_nuevo: "Programada",
          observaciones: "Estado cambiado automáticamente por eliminación de venta vinculada",
          usuario_modificacion: null,
        })
      }

      // Eliminar los detalles
      await VentaPorServicioModel.deleteByVenta(id)
      await VentaPorRepuestoModel.deleteByVenta(id)

      // Eliminar la venta (esto también eliminará las vinculaciones por CASCADE)
      await VentaModel.delete(id)

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  cambiarEstado: async (id, estadoId) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const venta = await VentaModel.findById(id)
      if (!venta) {
        throw new Error("Venta no encontrada")
      }

      const estadoAnterior = venta.estado_venta_id

      await VentaModel.cambiarEstado(id, estadoId)

      // Manejar sincronización con cita vinculada
      const citaVinculada = await VentaCitaModel.obtenerCitaPorVenta(id)

      if (citaVinculada) {
        let nuevoEstadoCita = null

        // Lógica de cambio de estado de cita según estado de venta
        if (estadoId == 2) {
          // Venta Pagada
          nuevoEstadoCita = 3 // Cita Completada
        } else if (estadoId == 3) {
          // Venta Cancelada
          nuevoEstadoCita = 4 // Cita Cancelada
        } else if (estadoId == 1) {
          // Venta Pendiente
          nuevoEstadoCita = 2 // Cita En Proceso
        }

        if (nuevoEstadoCita && citaVinculada.estado_cita_id != nuevoEstadoCita) {
          await CitaModel.cambiarEstado(citaVinculada.id, nuevoEstadoCita)

          // Crear historial de cita
          await HistorialCitaModel.crear({
            cita_id: citaVinculada.id,
            venta_id: id,
            cliente_id: citaVinculada.cliente_id,
            vehiculo_id: citaVinculada.vehiculo_id,
            mecanico_id: citaVinculada.mecanico_id,
            fecha_cita: citaVinculada.fecha,
            hora_cita: citaVinculada.hora,
            estado_anterior:
              citaVinculada.estado_cita_id == 1
                ? "Programada"
                : citaVinculada.estado_cita_id == 2
                  ? "En Proceso"
                  : citaVinculada.estado_cita_id == 3
                    ? "Completada"
                    : "Cancelada",
            estado_nuevo:
              nuevoEstadoCita == 1
                ? "Programada"
                : nuevoEstadoCita == 2
                  ? "En Proceso"
                  : nuevoEstadoCita == 3
                    ? "Completada"
                    : "Cancelada",
            observaciones: "Estado cambiado automáticamente por cambio de estado de venta",
            usuario_modificacion: null,
          })
        }
      }

      // Crear historial de venta
      await HistorialVentaModel.crear({
        venta_id: id,
        cita_id: null,
        cliente_id: venta.cliente_id,
        vehiculo_id: null,
        mecanico_id: venta.mecanico_id,
        fecha_venta: venta.fecha,
        estado_anterior: estadoAnterior == 1 ? "Pendiente" : estadoAnterior == 2 ? "Pagada" : "Cancelada",
        estado_nuevo: estadoId == 1 ? "Pendiente" : estadoId == 2 ? "Pagada" : "Cancelada",
        total_venta: venta.total,
        observaciones: "Estado de venta cambiado",
        usuario_modificacion: null,
        servicios: [],
        repuestos: [],
      })

      await connection.commit()
      return estadoId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  // Vincular venta existente con cita
  vincularConCita: async (ventaId, citaId, observaciones = null) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // Verificar que la venta y cita existen
      const venta = await VentaModel.findById(ventaId)
      const cita = await CitaModel.findById(citaId)

      if (!venta) throw new Error("Venta no encontrada")
      if (!cita) throw new Error("Cita no encontrada")

      // Verificar que no estén ya vinculadas
      const yaVinculada = await VentaCitaModel.estaVinculada(ventaId, citaId)
      if (yaVinculada) {
        throw new Error("La venta y cita ya están vinculadas")
      }

      // Crear vinculación
      await VentaCitaModel.vincular(ventaId, citaId, observaciones)

      // Sincronizar estados
      let nuevoEstadoCita = null
      if (venta.estado_venta_id == 1)
        nuevoEstadoCita = 2 // Pendiente -> En Proceso
      else if (venta.estado_venta_id == 2)
        nuevoEstadoCita = 3 // Pagada -> Completada
      else if (venta.estado_venta_id == 3) nuevoEstadoCita = 4 // Cancelada -> Cancelada

      if (nuevoEstadoCita && cita.estado_cita_id != nuevoEstadoCita) {
        await CitaModel.cambiarEstado(citaId, nuevoEstadoCita)

        // Crear historial de cita
        await HistorialCitaModel.crear({
          cita_id: citaId,
          venta_id: ventaId,
          cliente_id: cita.cliente_id,
          vehiculo_id: cita.vehiculo_id,
          mecanico_id: cita.mecanico_id,
          fecha_cita: cita.fecha,
          hora_cita: cita.hora,
          estado_anterior:
            cita.estado_cita_id == 1
              ? "Programada"
              : cita.estado_cita_id == 2
                ? "En Proceso"
                : cita.estado_cita_id == 3
                  ? "Completada"
                  : "Cancelada",
          estado_nuevo:
            nuevoEstadoCita == 1
              ? "Programada"
              : nuevoEstadoCita == 2
                ? "En Proceso"
                : nuevoEstadoCita == 3
                  ? "Completada"
                  : "Cancelada",
          observaciones: "Estado cambiado automáticamente por vinculación con venta",
          usuario_modificacion: null,
        })
      }

      await connection.commit()
      return { success: true, message: "Venta y cita vinculadas exitosamente" }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  // Obtener historial de una venta
  obtenerHistorial: (ventaId) => HistorialVentaModel.obtenerPorVenta(ventaId),

  // Obtener historial por cliente
  obtenerHistorialPorCliente: (clienteId) => HistorialVentaModel.obtenerPorCliente(clienteId),

  // Obtener historial por vehículo
  obtenerHistorialPorVehiculo: (vehiculoId) => HistorialVentaModel.obtenerPorVehiculo(vehiculoId),
}

module.exports = VentaService
