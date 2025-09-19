// src/services/compraService.js
const CompraModel = require("../models/compraModel")
const CompraPorRepuestoModel = require("../models/compraPorRepuestoModel")
const RepuestoModel = require("../models/repuestoModel")
const db = require("../config/db")

const CompraService = {
  listar: () => CompraModel.findAll(),

  obtener: async (id) => {
    const compra = await CompraModel.findById(id)
    if (compra) {
      compra.detalles = await CompraPorRepuestoModel.findByCompra(id)
    }
    return compra
  },

  crear: async (data) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const { proveedor_id, detalles, numerofactura } = data

      // 1. Crear la compra con datos iniciales
      const compraId = await CompraModel.create({
        proveedor_id,
        fecha: new Date(),
        total: 0,
        numerofactura,
      })

      let total = 0

      // 2. Procesar detalles y actualizar stock
      if (detalles && detalles.length > 0) {
        for (const detalle of detalles) {
          const { repuesto_id, cantidad, precio_compra, porcentaje_ganancia } = detalle

          const repuesto = await RepuestoModel.findById(repuesto_id)
          if (!repuesto) {
            throw new Error(`Repuesto con ID ${repuesto_id} no encontrado`)
          }

          const precioCompraFinal = precio_compra !== undefined ? precio_compra : repuesto.precio_compra
          const porcentaje = porcentaje_ganancia !== undefined ? porcentaje_ganancia : 0
          const precioVentaFinal = precioCompraFinal * (1 + porcentaje / 100)
          const subtotal = cantidad * precioCompraFinal
          total += subtotal

          // Crear el detalle de la compra
          await CompraPorRepuestoModel.create({
            compras_id: compraId,
            repuesto_id,
            cantidad,
            precio_compra: precioCompraFinal,
            precio_venta: precioVentaFinal,
            subtotal,
          })

          // 3. Actualizar el stock y precios del repuesto INMEDIATAMENTE
          const nuevaCantidad = repuesto.cantidad + cantidad
          const nuevoTotalRepuesto = nuevaCantidad * precioVentaFinal

          await RepuestoModel.update(repuesto_id, {
            ...repuesto,
            cantidad: nuevaCantidad,
            precio_venta: precioVentaFinal,
            precio_compra: precioCompraFinal,
            total: nuevoTotalRepuesto,
          })
        }
      }

      // 4. Actualizar el total final de la compra
      await CompraModel.update(compraId, {
        proveedor_id,
        fecha: new Date(),
        total,
        numerofactura,
      })

      await connection.commit()
      return compraId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  actualizar: async (id, data) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const { proveedor_id, detalles, numerofactura } = data
      const detallesActuales = await CompraPorRepuestoModel.findByCompra(id)

      // 1. Revertir el stock de la compra original
      for (const detalle of detallesActuales) {
        const repuesto = await RepuestoModel.findById(detalle.repuesto_id)
        if (repuesto) {
          const nuevaCantidad = Math.max(0, repuesto.cantidad - detalle.cantidad)
          const nuevoTotal = nuevaCantidad * repuesto.precio_venta
          await RepuestoModel.update(detalle.repuesto_id, {
            ...repuesto,
            cantidad: nuevaCantidad,
            total: nuevoTotal,
          })
        }
      }

      // 2. Eliminar los detalles antiguos
      await CompraPorRepuestoModel.deleteByCompra(id)

      let total = 0

      // 3. Crear los nuevos detalles y actualizar stock
      if (detalles && detalles.length > 0) {
        for (const detalle of detalles) {
          const { repuesto_id, cantidad, precio_compra, porcentaje_ganancia } = detalle
          const repuesto = await RepuestoModel.findById(repuesto_id)
          if (!repuesto) {
            throw new Error(`Repuesto con ID ${repuesto_id} no encontrado`)
          }

          const precioCompraFinal = precio_compra !== undefined ? precio_compra : repuesto.precio_compra
          const porcentaje = porcentaje_ganancia !== undefined ? porcentaje_ganancia : 0
          const precioVentaFinal = precioCompraFinal * (1 + porcentaje / 100)
          const subtotal = cantidad * precioCompraFinal
          total += subtotal

          await CompraPorRepuestoModel.create({
            compras_id: id,
            repuesto_id,
            cantidad,
            precio_compra: precioCompraFinal,
            precio_venta: precioVentaFinal,
            subtotal,
          })

          // Actualizar stock con la nueva cantidad
          const nuevaCantidadRepuesto = repuesto.cantidad + cantidad
          const nuevoTotalRepuesto = nuevaCantidadRepuesto * precioVentaFinal
          await RepuestoModel.update(repuesto_id, {
            ...repuesto,
            cantidad: nuevaCantidadRepuesto,
            precio_venta: precioVentaFinal,
            precio_compra: precioCompraFinal,
            total: nuevoTotalRepuesto,
          })
        }
      }

      // 4. Actualizar la compra principal
      const compraActual = await CompraModel.findById(id)
      await CompraModel.update(id, {
        proveedor_id,
        fecha: compraActual.fecha,
        total,
        numerofactura,
      })

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  eliminar: async (id) => {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      const detalles = await CompraPorRepuestoModel.findByCompra(id)

      // 1. Revertir el stock
      for (const detalle of detalles) {
        const repuesto = await RepuestoModel.findById(detalle.repuesto_id)
        if (repuesto) {
          const nuevaCantidad = Math.max(0, repuesto.cantidad - detalle.cantidad)
          const nuevoTotal = nuevaCantidad * repuesto.precio_venta
          await RepuestoModel.update(detalle.repuesto_id, {
            ...repuesto,
            cantidad: nuevaCantidad,
            total: nuevoTotal,
          })
        }
      }

      // 2. Eliminar detalles y luego la compra
      await CompraPorRepuestoModel.deleteByCompra(id)
      await CompraModel.delete(id)

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },
}

module.exports = CompraService