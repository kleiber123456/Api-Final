// src/models/ventaPorRepuestoModel.js
const db = require("../config/db")

const VentaPorRepuestoModel = {
  findByVenta: async (ventaId) => {
    const [rows] = await db.query(
      `
      SELECT vpr.*, 
             r.nombre AS repuesto_nombre,
             r.descripcion AS repuesto_descripcion,
             r.precio_venta AS repuesto_precio,
             cr.nombre AS categoria_nombre
      FROM venta_por_repuesto vpr
      JOIN repuesto r ON vpr.repuesto_id = r.id
      JOIN categoria_repuesto cr ON r.categoria_repuesto_id = cr.id
      WHERE vpr.venta_id = ?
    `,
      [ventaId],
    )
    return rows
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `
      SELECT vpr.*, 
             r.nombre AS repuesto_nombre,
             r.descripcion AS repuesto_descripcion,
             r.precio_venta AS repuesto_precio,
             cr.nombre AS categoria_nombre
      FROM venta_por_repuesto vpr
      JOIN repuesto r ON vpr.repuesto_id = r.id
      JOIN categoria_repuesto cr ON r.categoria_repuesto_id = cr.id
      WHERE vpr.id = ?
    `,
      [id],
    )
    return rows[0]
  },

  create: async (data) => {
    const { venta_id, repuesto_id, cantidad, precio_unitario, subtotal } = data
    const [result] = await db.query(
      "INSERT INTO venta_por_repuesto (venta_id, repuesto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
      [venta_id, repuesto_id, cantidad, precio_unitario, subtotal],
    )
    return result.insertId
  },

  update: async (id, data) => {
    const { cantidad, precio_unitario, subtotal } = data
    await db.query("UPDATE venta_por_repuesto SET cantidad = ?, precio_unitario = ?, subtotal = ? WHERE id = ?", [
      cantidad,
      precio_unitario,
      subtotal,
      id,
    ])
  },

  delete: async (id) => {
    await db.query("DELETE FROM venta_por_repuesto WHERE id = ?", [id])
  },

  deleteByVenta: async (ventaId) => {
    await db.query("DELETE FROM venta_por_repuesto WHERE venta_id = ?", [ventaId])
  },
}

module.exports = VentaPorRepuestoModel
