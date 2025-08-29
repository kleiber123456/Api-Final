// src/services/usuarioService.js
const bcrypt = require("bcryptjs")
const UsuarioModel = require("../models/usuarioModel")
const db = require("../config/db")
const EmailService = require("./emailService")

const UsuarioService = {
  listar: () => UsuarioModel.findAll(),
  obtener: (id) => UsuarioModel.findById(id),

  crear: async (data) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const hashed = await bcrypt.hash(data.password, 10)
      const rol = data.rol_id || 4 // rol cliente por defecto
      data.password = hashed

      // Crear usuario principal
      const [usuarioResult] = await connection.query(
        "INSERT INTO usuario (nombre, apellido, correo, tipo_documento, documento, password, rol_id, telefono, direccion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          data.nombre,
          data.apellido,
          data.correo,
          data.tipo_documento,
          data.documento,
          hashed,
          rol,
          data.telefono,
          data.direccion,
          data.estado || "Activo",
        ],
      )

      const usuarioId = usuarioResult.insertId

      // Crear registro en tabla específica según el rol
      if (rol === 4) {
        // Cliente
        await connection.query(
          "INSERT INTO cliente (id, nombre, apellido, direccion, tipo_documento, documento, correo, telefono, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            usuarioId,
            data.nombre,
            data.apellido,
            data.direccion,
            data.tipo_documento,
            data.documento,
            data.correo,
            data.telefono,
            data.estado || "Activo",
          ],
        )
      }

      if (rol === 3) {
        // Mecánico
        await connection.query(
          "INSERT INTO mecanico (id, nombre, apellido, tipo_documento, documento, direccion, telefono, telefono_emergencia, correo, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            usuarioId,
            data.nombre,
            data.apellido,
            data.tipo_documento,
            data.documento,
            data.direccion,
            data.telefono,
            data.telefono_emergencia || data.telefono,
            data.correo,
            data.estado || "Activo",
          ],
        )
      }

      // Enviar correo de bienvenida usando EmailService
      if (data.correo) {
        try {
          await EmailService.sendWelcomeEmail({
            nombre: data.nombre,
            apellido: data.apellido,
            correo: data.correo
          })
        } catch (emailError) {
          console.log("Error enviando correo:", emailError.message)
          // No fallar la transacción por error de correo
        }
      }

      await connection.commit()
      return usuarioId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  actualizar: (id, data) => UsuarioModel.update(id, data),

  eliminar: (id) => UsuarioModel.delete(id),

  cambiarEstado: async (id) => {
    const usuario = await UsuarioModel.findById(id)
    if (!usuario) throw new Error("Usuario no encontrado")

    const nuevoEstado = usuario.estado === "Activo" ? "Inactivo" : "Activo"
    await UsuarioModel.cambiarEstado(id, nuevoEstado)
    return nuevoEstado
  },
}

module.exports = UsuarioService
