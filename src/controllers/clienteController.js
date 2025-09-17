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
      if (error.message === "El cliente tiene vehículos o citas asociadas y no puede ser desactivado.") {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ error: "Error al cambiar el estado del cliente" })
    }
  },
}

module.exports = ClienteController
