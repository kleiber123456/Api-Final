// src/controllers/ventaController.js
const VentaService = require("../services/ventaService")

const VentaController = {
  async listar(req, res) {
    try {
      const ventas = await VentaService.listar()
      res.json(ventas)
    } catch (error) {
      console.error("Error al listar ventas:", error)
      res.status(500).json({ error: "Error al listar las ventas" })
    }
  },

  async obtener(req, res) {
    try {
      const venta = await VentaService.obtener(req.params.id)
      if (!venta) {
        return res.status(404).json({ error: "Venta no encontrada" })
      }
      res.json(venta)
    } catch (error) {
      console.error("Error al obtener venta:", error)
      res.status(500).json({ error: "Error al obtener la venta" })
    }
  },

  async obtenerPorCliente(req, res) {
    try {
      const ventas = await VentaService.obtenerPorCliente(req.params.clienteId)
      res.json(ventas)
    } catch (error) {
      console.error("Error al obtener ventas por cliente:", error)
      res.status(500).json({ error: "Error al obtener las ventas del cliente" })
    }
  },

  async obtenerPorEstado(req, res) {
    try {
      const ventas = await VentaService.obtenerPorEstado(req.params.estadoId)
      res.json(ventas)
    } catch (error) {
      console.error("Error al obtener ventas por estado:", error)
      res.status(500).json({ error: "Error al obtener las ventas por estado" })
    }
  },

  async obtenerPorRangoFechas(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: "Fecha de inicio y fecha de fin son requeridas" })
      }
      const ventas = await VentaService.obtenerPorRangoFechas(fechaInicio, fechaFin)
      res.json(ventas)
    } catch (error) {
      console.error("Error al obtener ventas por rango de fechas:", error)
      res.status(500).json({ error: "Error al obtener las ventas por rango de fechas" })
    }
  },

  async crear(req, res) {
    try {
      console.log("Datos recibidos para crear venta:", req.body)

      const { cliente_id, estado_venta_id, cita_id } = req.body
      if (!cliente_id || !estado_venta_id) {
        return res.status(400).json({ error: "Cliente y estado de venta son requeridos" })
      }

      const id = await VentaService.crear(req.body)
      console.log("Venta creada con ID:", id)

      res.status(201).json({
        message: "Venta creada exitosamente",
        id,
        success: true,
        citaVinculada: !!cita_id,
      })
    } catch (error) {
      console.error("Error al crear venta:", error)
      res.status(400).json({ error: error.message, success: false })
    }
  },

  async actualizar(req, res) {
    try {
      console.log("Actualizando venta ID:", req.params.id)
      console.log("Datos para actualizar:", req.body)

      await VentaService.actualizar(req.params.id, req.body)
      res.json({ message: "Venta actualizada exitosamente", success: true })
    } catch (error) {
      console.error("Error al actualizar venta:", error)
      res.status(400).json({ error: error.message, success: false })
    }
  },

  async eliminar(req, res) {
    try {
      console.log("Eliminando venta ID:", req.params.id)

      await VentaService.eliminar(req.params.id)
      res.json({ message: "Venta eliminada exitosamente", success: true })
    } catch (error) {
      console.error("Error al eliminar venta:", error)
      res.status(400).json({ error: error.message, success: false })
    }
  },

  async cambiarEstado(req, res) {
    try {
      const { estado_venta_id } = req.body
      if (!estado_venta_id) {
        return res.status(400).json({ error: "Estado de venta es requerido" })
      }

      console.log("Cambiando estado de venta ID:", req.params.id, "a estado:", estado_venta_id)
      await VentaService.cambiarEstado(req.params.id, estado_venta_id)

      res.json({ message: "Estado de venta actualizado exitosamente", success: true })
    } catch (error) {
      console.error("Error al cambiar estado de venta:", error)
      res.status(400).json({ error: error.message, success: false })
    }
  },

  async vincularConCita(req, res) {
    try {
      const { cita_id, observaciones } = req.body
      if (!cita_id) {
        return res.status(400).json({ error: "ID de cita es requerido" })
      }

      const resultado = await VentaService.vincularConCita(req.params.id, cita_id, observaciones)
      res.json(resultado)
    } catch (error) {
      console.error("Error al vincular venta con cita:", error)
      res.status(400).json({ error: error.message, success: false })
    }
  },

  async obtenerHistorial(req, res) {
    try {
      const historial = await VentaService.obtenerHistorial(req.params.id)
      res.json(historial)
    } catch (error) {
      console.error("Error al obtener historial de venta:", error)
      res.status(500).json({ error: "Error al obtener el historial de la venta" })
    }
  },

  async obtenerHistorialPorCliente(req, res) {
    try {
      const historial = await VentaService.obtenerHistorialPorCliente(req.params.clienteId)
      res.json(historial)
    } catch (error) {
      console.error("Error al obtener historial por cliente:", error)
      res.status(500).json({ error: "Error al obtener el historial del cliente" })
    }
  },

  async obtenerHistorialPorVehiculo(req, res) {
    try {
      const historial = await VentaService.obtenerHistorialPorVehiculo(req.params.vehiculoId)
      res.json(historial)
    } catch (error) {
      console.error("Error al obtener historial por vehículo:", error)
      res.status(500).json({ error: "Error al obtener el historial del vehículo" })
    }
  },

  async obtenerMisVentas(req, res) {
    try {
      // El ID del cliente se obtiene del token de autenticación
      const clienteId = req.user.id;
      const ventas = await VentaService.obtenerPorCliente(clienteId);
      res.json(ventas);
    } catch (error) {
      console.error("Error al obtener mis ventas:", error);
      res.status(500).json({ error: "Error al obtener las ventas del cliente" });
    }
}

}

module.exports = VentaController
