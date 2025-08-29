// src/controllers/clienteController.js
const ClienteService = require("../services/clienteService")

const ClienteController = {
  async listar(req, res) {
    try {
      const clientes = await ClienteService.listar()
      res.json(clientes)
    } catch (error) {
      res.status(500).json({ error: "Error al listar los clientes" })
    }
  },

  async obtener(req, res) {
    try {
      const cliente = await ClienteService.obtener(req.params.id)
      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" })
      }
      res.json(cliente)
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el cliente" })
    }
  },

  async crear(req, res) {
    try {
      const id = await ClienteService.crear(req.body)
      res.status(201).json({ message: "Cliente creado", id })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async actualizar(req, res) {
    try {
      await ClienteService.actualizar(req.params.id, req.body)
      res.json({ message: "Cliente actualizado" })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async eliminar(req, res) {
    try {
      await ClienteService.eliminar(req.params.id)
      res.json({ message: "Cliente eliminado" })
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar el cliente" })
    }
  },

  async cambiarEstado(req, res) {
    try {
      const nuevoEstado = await ClienteService.cambiarEstado(req.params.id)
      res.json({ message: `Estado actualizado a ${nuevoEstado}` })
    } catch (error) {
      res.status(500).json({ error: "Error al cambiar el estado del cliente" })
    }
  },

  // Métodos para rutas prioritarias
  async registrarVehiculo(req, res) {
    try {
      const vehiculoData = { ...req.body, cliente_id: req.user.id }
      const id = await ClienteService.registrarVehiculo(vehiculoData)
      res.status(201).json({ message: "Vehículo registrado exitosamente", id })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async obtenerMisCitas(req, res) {
    try {
      const citas = await ClienteService.obtenerMisCitas(req.user.id)
      res.json(citas)
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las citas" })
    }
  },

  async obtenerMisVentas(req, res) {
    try {
      const ventas = await ClienteService.obtenerMisVentas(req.user.id)
      res.json(ventas)
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las ventas" })
    }
  },

  async actualizarPerfil(req, res) {
    try {
      await ClienteService.actualizarPerfil(req.user.id, req.body)
      res.json({ message: "Perfil actualizado exitosamente" })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },
}

module.exports = ClienteController
