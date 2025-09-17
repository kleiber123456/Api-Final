// src/services/usuarioService.js
const bcrypt = require("bcryptjs")
const UsuarioModel = require("../models/usuarioModel")
const MecanicoModel = require("../models/mecanicoModel") // Importar MecanicoModel
const ClienteModel = require("../models/clienteModel") // Importar ClienteModel
const VehiculoModel = require("../models/vehiculoModel") // Importar VehiculoModel
const CitaModel = require("../models/citaModel") // Importar CitaModel
const db = require("../config/db")
const transporter = require("../config/nodemailer")

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

      // Enviar correo de bienvenida
      if (data.correo) {
        try {
          await transporter.sendMail({
            to: data.correo,
            subject: `¡Bienvenido a la comunidad MotOrtega, ${data.nombre}! 🚀`,
            html: `
              <div style="background-color: #f9fafc; padding: 40px 0; font-family: 'Segoe UI', sans-serif;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
                  <h1 style="color: #333333;">¡Hola, ${data.nombre}!</h1>
                  <p style="color: #666666;">Gracias por unirte a nuestra comunidad en MotOrtega. Estamos emocionados de tenerte aquí.</p>
                  <p style="color: #666666;">Tu cuenta ha sido creada exitosamente.</p>
                </div>
              </div>
            `,
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

    // Si se intenta desactivar, verificar roles y datos asociados
    if (nuevoEstado === "Inactivo") {
      if (usuario.rol_id === 3) { // Mecánico
        const citasAsociadas = await CitaModel.findActiveByMecanico(id)
        if (citasAsociadas.length > 0) {
          throw new Error("El mecánico tiene citas asociadas y no puede ser desactivado.")
        }
      } else if (usuario.rol_id === 4) { // Cliente
        const vehiculosAsociados = await VehiculoModel.findByClienteId(id)
        const citasAsociadas = await CitaModel.findActiveByCliente(id)
        if (vehiculosAsociados.length > 0 || citasAsociadas.length > 0) {
          throw new Error("El cliente tiene vehículos o citas asociadas y no puede ser desactivado.")
        }
      }
    }

    await UsuarioModel.cambiarEstado(id, nuevoEstado)
    return nuevoEstado
  },
}

module.exports = UsuarioService
