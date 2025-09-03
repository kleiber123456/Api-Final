// src/models/vehiculoModel.js
const db = require("../config/db")

const VehiculoModel = {
  findAll: async () => {
    const [rows] = await db.query(
      `SELECT v.*, r.nombre AS referencia_nombre, m.nombre AS marca_nombre, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido FROM vehiculo v JOIN referencia r ON v.referencia_id = r.id JOIN marca m ON r.marca_id = m.id JOIN cliente c ON v.cliente_id = c.id ORDER BY v.placa`,
    )
    return rows
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT v.*, r.nombre AS referencia_nombre, m.nombre AS marca_nombre, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido FROM vehiculo v JOIN referencia r ON v.referencia_id = r.id JOIN marca m ON r.marca_id = m.id JOIN cliente c ON v.cliente_id = c.id WHERE v.id = ?`,
      [id],
    )
    return rows[0]
  },

  findByClienteId: async (clienteId) => {
    const [rows] = await db.query(
      `SELECT v.*, r.nombre AS referencia_nombre, m.nombre AS marca_nombre 
       FROM vehiculo v 
       JOIN referencia r ON v.referencia_id = r.id 
       JOIN marca m ON r.marca_id = m.id 
       WHERE v.cliente_id = ? 
       ORDER BY v.placa`,
      [clienteId],
    )
    return rows
  },

  create: async (data) => {
    const { placa, color, tipo_vehiculo, referencia_id, cliente_id, estado } = data
    const [result] = await db.query(
      "INSERT INTO vehiculo (placa, color, tipo_vehiculo, referencia_id, cliente_id, estado) VALUES (?, ?, ?, ?, ?, ?)",
      [placa, color, tipo_vehiculo, referencia_id, cliente_id, estado || "Activo"],
    )
    return result.insertId
  },

  update: async (id, data) => {
    const { placa, color, tipo_vehiculo, referencia_id, cliente_id, estado } = data
    await db.query(
      "UPDATE vehiculo SET placa = ?, color = ?, tipo_vehiculo = ?, referencia_id = ?, cliente_id = ?, estado = ? WHERE id = ?",
      [placa, color, tipo_vehiculo, referencia_id, cliente_id, estado, id],
    )
  },

  delete: async (id) => {
    await db.query("DELETE FROM vehiculo WHERE id = ?", [id])
  },

  cambiarEstado: async (id, estado) => {
    await db.query("UPDATE vehiculo SET estado = ? WHERE id = ?", [estado, id])
  },

  findByUsuarioId: async (clienteId) => {
    const [rows] = await db.query(
      `SELECT v.*, r.nombre AS referencia_nombre, m.nombre AS marca_nombre 
       FROM vehiculo v 
       JOIN referencia r ON v.referencia_id = r.id 
       JOIN marca m ON r.marca_id = m.id 
       WHERE v.cliente_id = ? 
       ORDER BY v.placa`,
      [clienteId],
    )
    return rows
  },

  verifyOwnership: async (vehiculoId, clienteId) => {
    const [rows] = await db.query("SELECT id FROM vehiculo WHERE id = ? AND cliente_id = ?", [vehiculoId, clienteId])
    return rows[0]
  },

  updateByOwner: async (vehiculoId, data, clienteId) => {
    const { placa, color, tipo_vehiculo, referencia_id, estado } = data
    await db.query(
      "UPDATE vehiculo SET placa = ?, color = ?, tipo_vehiculo = ?, referencia_id = ?, estado = ? WHERE id = ? AND cliente_id = ?",
      [placa, color, tipo_vehiculo, referencia_id, estado, vehiculoId, clienteId],
    )
  },
}

module.exports = VehiculoModel
