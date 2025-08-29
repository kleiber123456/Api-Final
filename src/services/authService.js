const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const UsuarioModel = require("../models/usuarioModel")
const EmailService = require("./emailService")
const db = require("../config/db")

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6 dígitos
}

const AuthService = {
  async login({ correo, password }) {
    const usuario = await UsuarioModel.findByEmail(correo)
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      throw new Error("Credenciales inválidas")
    }
    const token = jwt.sign({ id: usuario.id, rol: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    return { token: `${token}`, usuario }
  },

  async register(data) {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const hashed = await bcrypt.hash(data.password, 10)
      const rol = data.rol_id || 4 // Valor predeterminado: 2 (Cliente)

      // Insertar en usuario
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
          "Activo",
        ],
      )

      const usuarioId = usuarioResult.insertId

      // Si el rol es de cliente (ID 2)
      if (rol === 4) {
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
            "Activo",
          ],
        )
      }

      // Si el rol es de mecánico (ID 3)
      if (rol === 3) {
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
            "Activo",
          ],
        )
      }

      // Enviar correo de bienvenida usando EmailService
      await EmailService.sendWelcomeEmail({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo
      })

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  async solicitarCodigo(correo) {
    const usuario = await UsuarioModel.findByEmail(correo)
    if (!usuario) throw new Error("Correo no encontrado")

    const codigo = generarCodigo()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    await db.execute("INSERT INTO codigos (correo, codigo, expires_at) VALUES (?, ?, ?)", [correo, codigo, expiresAt])

    // Enviar correo de recuperación usando EmailService
    await EmailService.sendRecoveryCode(correo, codigo)
  },

  async verificarCodigo(correo, codigo) {
    const [rows] = await db.execute("SELECT * FROM codigos WHERE correo = ? AND codigo = ?", [correo, codigo])

    if (rows.length === 0) throw new Error("Código inválido o ya usado")

    const registro = rows[0]
    if (new Date() > new Date(registro.expires_at)) {
      throw new Error("El código ha expirado")
    }

    await db.execute("DELETE FROM codigos WHERE id = ?", [registro.id])
    return true
  },

  async actualizarPassword(correo, nuevaPassword) {
    const usuario = await UsuarioModel.findByEmail(correo)
    if (!usuario) throw new Error("Correo no encontrado")
    const hashed = await bcrypt.hash(nuevaPassword, 10)
    await UsuarioModel.updatePassword(usuario.id, hashed)
  },
}

module.exports = AuthService
