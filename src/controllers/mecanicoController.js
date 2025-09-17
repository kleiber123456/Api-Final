// src/controllers/mecanicoController.js
const MecanicoService = require("../services/mecanicoService");

const MecanicoController = {
  async listar(req, res) {
    try {
      const mecanicos = await MecanicoService.listar();
      res.json(mecanicos);
    } catch (error) {
      res.status(500).json({ error: "Error al listar los mecánicos" });
    }
  },

  async obtener(req, res) {
    try {
      const mecanico = await MecanicoService.obtener(req.params.id);
      if (!mecanico) {
        return res.status(404).json({ error: "Mecánico no encontrado" });
      }
      res.json(mecanico);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el mecánico" });
    }
  },

  async obtenerPorEstado(req, res) {
    try {
      const mecanicos = await MecanicoService.obtenerPorEstado(req.params.estado);
      res.json(mecanicos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los mecánicos por estado" });
    }
  },

  async crear(req, res) {
    try {
      const id = await MecanicoService.crear(req.body);
      res.status(201).json({ message: "Mecánico creado", id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async actualizar(req, res) {
    try {
      await MecanicoService.actualizar(req.params.id, req.body);
      res.json({ message: "Mecánico actualizado" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      await MecanicoService.eliminar(req.params.id);
      res.json({ message: "Mecánico eliminado" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar el mecánico" });
    }
  },

  async cambiarEstado(req, res) {
    try {
      const nuevoEstado = await MecanicoService.cambiarEstado(req.params.id);
      res.json({ message: `Estado actualizado a ${nuevoEstado}` });
    } catch (error) {
      if (error.message === "El mecánico tiene citas asociadas y no puede ser desactivado.") {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ error: "Error al cambiar el estado del mecánico" });
    }
  },

  async obtenerCitas(req, res) {
    try {
      const citas = await MecanicoService.obtenerCitas(req.params.id);
      res.json(citas);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las citas del mecánico" });
    }
  },

  // MÉTODO ELIMINADO: obtenerNovedades ya no es necesario
  // async obtenerNovedades(req, res) {
  //   try {
  //     const novedades = await MecanicoService.obtenerNovedades(req.params.id);
  //     res.json(novedades);
  //   } catch (error) {
  //     res.status(500).json({ error: "Error al obtener las novedades del mecánico" });
  //   }
  // },

  // Nuevo método para obtener estadísticas del mecánico (opcional)
  async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await MecanicoService.obtenerEstadisticas(req.params.id);
      res.json(estadisticas);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las estadísticas del mecánico" });
    }
  },
};

module.exports = MecanicoController;
