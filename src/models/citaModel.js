// src/models/citaModel.js
const db = require("../config/db")

const CitaModel = {
  findAll: async () => {
    const [rows] = await db.query(`
      SELECT c.*, 
             ec.nombre AS estado_nombre,
             v.placa AS vehiculo_placa,
             v.color AS vehiculo_color,
             cl.nombre AS cliente_nombre,
             cl.apellido AS cliente_apellido,
             cl.documento AS cliente_documento,
             cl.tipo_documento AS cliente_tipo_documento,
             m.nombre AS mecanico_nombre,
             m.apellido AS mecanico_apellido,
             r.nombre AS referencia_nombre,
             ma.nombre AS marca_nombre,
             s.nombre AS servicio_nombre
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN mecanico m ON c.mecanico_id = m.id
      JOIN referencia r ON v.referencia_id = r.id
      JOIN marca ma ON r.marca_id = ma.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      ORDER BY c.fecha DESC, c.hora
    `)
    return rows
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `
      SELECT c.*, 
             ec.nombre AS estado_nombre,
             v.placa AS vehiculo_placa,
             v.color AS vehiculo_color,
             v.cliente_id AS cliente_id,
             cl.nombre AS cliente_nombre,
             cl.apellido AS cliente_apellido,
             cl.documento AS cliente_documento,
             cl.tipo_documento AS cliente_tipo_documento,
             cl.correo AS cliente_correo,
             cl.telefono AS cliente_telefono,
             m.nombre AS mecanico_nombre,
             m.apellido AS mecanico_apellido,
             r.nombre AS referencia_nombre,
             ma.nombre AS marca_nombre,
             s.nombre AS servicio_nombre
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN mecanico m ON c.mecanico_id = m.id
      JOIN referencia r ON v.referencia_id = r.id
      JOIN marca ma ON r.marca_id = ma.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      WHERE c.id = ?
    `,
      [id],
    )
    return rows[0]
  },

  findByCliente: async (clienteId) => {
    const [rows] = await db.query(
      `
      SELECT c.*, 
             ec.nombre AS estado_nombre,
             v.placa AS vehiculo_placa,
             v.color AS vehiculo_color,
             m.nombre AS mecanico_nombre,
             m.apellido AS mecanico_apellido,
             r.nombre AS referencia_nombre,
             ma.nombre AS marca_nombre,
             s.nombre AS servicio_nombre
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN mecanico m ON c.mecanico_id = m.id
      JOIN referencia r ON v.referencia_id = r.id
      JOIN marca ma ON r.marca_id = ma.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      WHERE v.cliente_id = ? AND c.estado_cita_id = 1
      ORDER BY c.fecha DESC, c.hora
    `,
      [clienteId],
    )
    return rows
  },

  findByMecanico: async (mecanicoId) => {
    const [rows] = await db.query(
      `
      SELECT c.*, 
             ec.nombre AS estado_nombre,
             v.placa AS vehiculo_placa,
             v.color AS vehiculo_color,
             cl.nombre AS cliente_nombre,
             cl.apellido AS cliente_apellido,
             cl.documento AS cliente_documento,
             cl.tipo_documento AS cliente_tipo_documento,
             r.nombre AS referencia_nombre,
             ma.nombre AS marca_nombre,
             s.nombre AS servicio_nombre
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN referencia r ON v.referencia_id = r.id
      JOIN marca ma ON r.marca_id = ma.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      WHERE c.mecanico_id = ?
      ORDER BY c.fecha DESC, c.hora
    `,
      [mecanicoId],
    )
    return rows
  },

  findByFecha: async (fecha) => {
    const [rows] = await db.query(
      `
      SELECT c.*, 
             ec.nombre AS estado_nombre,
             v.placa AS vehiculo_placa,
             v.color AS vehiculo_color,
             cl.nombre AS cliente_nombre,
             cl.apellido AS cliente_apellido,
             cl.documento AS cliente_documento,
             cl.tipo_documento AS cliente_tipo_documento,
             m.nombre AS mecanico_nombre,
             m.apellido AS mecanico_apellido,
             r.nombre AS referencia_nombre,
             ma.nombre AS marca_nombre,
             s.nombre AS servicio_nombre
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN mecanico m ON c.mecanico_id = m.id
      JOIN referencia r ON v.referencia_id = r.id
      JOIN marca ma ON r.marca_id = ma.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      WHERE c.fecha = ?
      ORDER BY c.hora
    `,
      [fecha],
    )
    return rows
  },

  findByEstado: async (estadoId) => {
    const [rows] = await db.query(
      `
      SELECT c.*, 
             ec.nombre AS estado_nombre,
             v.placa AS vehiculo_placa,
             v.color AS vehiculo_color,
             cl.nombre AS cliente_nombre,
             cl.apellido AS cliente_apellido,
             cl.documento AS cliente_documento,
             cl.tipo_documento AS cliente_tipo_documento,
             m.nombre AS mecanico_nombre,
             m.apellido AS mecanico_apellido,
             r.nombre AS referencia_nombre,
             ma.nombre AS marca_nombre,
             s.nombre AS servicio_nombre
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN mecanico m ON c.mecanico_id = m.id
      JOIN referencia r ON v.referencia_id = r.id
      JOIN marca ma ON r.marca_id = ma.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      WHERE c.estado_cita_id = ?
      ORDER BY c.fecha DESC, c.hora
    `,
      [estadoId],
    )
    return rows
  },

  create: async (data) => {
    const { fecha, hora, observaciones, estado_cita_id, vehiculo_id, mecanico_id, servicio_id, subtotal } = data
    const [result] = await db.query(
      "INSERT INTO cita (fecha, hora, observaciones, estado_cita_id, vehiculo_id, mecanico_id, servicio_id, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [fecha, hora, observaciones, estado_cita_id, vehiculo_id, mecanico_id, servicio_id || null, subtotal || null],
    )
    return result.insertId
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = [...Object.values(data), id]

    if (fields.length === 0) {
      return
    }

    const query = `UPDATE cita SET ${setClause} WHERE id = ?`
    await db.query(query, values)
  },

  delete: async (id) => {
    await db.query("DELETE FROM cita WHERE id = ?", [id])
  },

  cambiarEstado: async (id, estadoId) => {
    await db.query("UPDATE cita SET estado_cita_id = ? WHERE id = ?", [estadoId, id])
  },

  // Verificar si un mecánico ya tiene una cita en una fecha y hora específicas
  verificarDisponibilidadMecanico: async (mecanicoId, fecha, hora, citaId = null) => {
    let query = `
      SELECT COUNT(*) as total
      FROM cita
      WHERE mecanico_id = ? AND fecha = ? AND hora = ?
    `

    const params = [mecanicoId, fecha, hora]

    // Si estamos actualizando una cita existente, excluirla de la verificación
    if (citaId) {
      query += " AND id != ?"
      params.push(citaId)
    }

    const [rows] = await db.query(query, params)
    return rows[0].total === 0 // Retorna true si está disponible (no hay citas)
  },
}

module.exports = CitaModel


module.exports = CitaModel