// src/controllers/compraController.js
const CompraService = require("../services/compraService")

const CompraController = {
  async listar(req, res) {
    try {
      const compras = await CompraService.listar()
      res.json(compras)
    } catch (error) {
      res.status(500).json({ error: "Error al listar las compras" })
    }
  },

  async obtener(req, res) {
    try {
      const compra = await CompraService.obtener(req.params.id)
      if (!compra) {
        return res.status(404).json({ error: "Compra no encontrada" })
      }
      res.json(compra)
    } catch (error) {
      res.status(500).json({ error: "Error al obtener la compra" })
    }
  },

  async crear(req, res) {
    try {
      const id = await CompraService.crear(req.body)
      res.status(201).json({ message: "Compra creada", id })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async actualizar(req, res) {
    try {
      await CompraService.actualizar(req.params.id, req.body)
      res.json({ message: "Compra actualizada" })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  async eliminar(req, res) {
    try {
      await CompraService.eliminar(req.params.id)
      res.json({ message: "Compra eliminada" })
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar la compra" })
    }
  },

  
}

module.exports = CompraController
