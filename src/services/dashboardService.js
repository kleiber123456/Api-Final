// src/services/dashboardService.js
const db = require('../config/db');

const DashboardService = {
  // Métricas básicas actuales
  async obtenerEstadisticas() {
    const connection = await db.getConnection();
    
    try {
      // Estadísticas generales
      const [ventasHoy] = await connection.query(`
        SELECT COUNT(*) as total, SUM(total) as ingresos
        FROM venta 
        WHERE DATE(fecha) = CURDATE()
      `);

      const [citasHoy] = await connection.query(`
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN estado_cita_id = 3 THEN 1 ELSE 0 END) as completadas
        FROM cita 
        WHERE DATE(fecha) = CURDATE()
      `);

      const [clientesActivos] = await connection.query(`
        SELECT COUNT(*) as total
        FROM cliente 
        WHERE estado = 'Activo'
      `);

      const [mecanicosActivos] = await connection.query(`
        SELECT COUNT(*) as total
        FROM mecanico 
        WHERE estado = 'Activo'
      `);

      return {
        ventas: {
          hoy: ventasHoy[0].total || 0,
          ingresos: ventasHoy[0].ingresos || 0
        },
        citas: {
          hoy: citasHoy[0].total || 0,
          completadas: citasHoy[0].completadas || 0
        },
        usuarios: {
          clientes: clientesActivos[0].total || 0,
          mecanicos: mecanicosActivos[0].total || 0
        }
      };
    } finally {
      connection.release();
    }
  },

  // MÉTRICAS HISTÓRICAS - NUEVAS FUNCIONES

  // Tendencias de ventas por período
  async obtenerTendenciasVentas(periodo = 'mes', año = new Date().getFullYear()) {
    const connection = await db.getConnection();
    
    try {
      let query = '';
      let params = [año];

      switch(periodo) {
        case 'mes':
          query = `
            SELECT 
              MONTH(fecha) as mes,
              COUNT(*) as total_ventas,
              SUM(total) as ingresos,
              AVG(total) as promedio_venta
            FROM venta 
            WHERE YEAR(fecha) = ?
            GROUP BY MONTH(fecha)
            ORDER BY mes
          `;
          break;
        case 'semana':
          query = `
            SELECT 
              WEEK(fecha) as semana,
              COUNT(*) as total_ventas,
              SUM(total) as ingresos,
              AVG(total) as promedio_venta
            FROM venta 
            WHERE YEAR(fecha) = ?
            GROUP BY WEEK(fecha)
            ORDER BY semana
          `;
          break;
        case 'dia':
          query = `
            SELECT 
              DATE(fecha) as fecha,
              COUNT(*) as total_ventas,
              SUM(total) as ingresos,
              AVG(total) as promedio_venta
            FROM venta 
            WHERE YEAR(fecha) = ?
            GROUP BY DATE(fecha)
            ORDER BY fecha DESC
            LIMIT 30
          `;
          break;
      }

      const [resultados] = await connection.query(query, params);
      return resultados;
    } finally {
      connection.release();
    }
  },

  // Análisis de servicios más populares
  async obtenerAnalisisServicios(periodo = 'mes', año = new Date().getFullYear()) {
    const connection = await db.getConnection();
    
    try {
      const [servicios] = await connection.query(`
        SELECT 
          s.nombre as servicio,
          COUNT(vps.servicio_id) as veces_vendido,
          SUM(s.precio) as ingresos_totales,
          AVG(s.precio) as precio_promedio
        FROM servicio s
        LEFT JOIN venta_por_servicio vps ON s.id = vps.servicio_id
        LEFT JOIN venta v ON vps.venta_id = v.id
        WHERE YEAR(v.fecha) = ?
        GROUP BY s.id, s.nombre
        ORDER BY veces_vendido DESC
        LIMIT 10
      `, [año]);

      return servicios;
    } finally {
      connection.release();
    }
  },

  // Análisis de repuestos más vendidos
  async obtenerAnalisisRepuestos(periodo = 'mes', año = new Date().getFullYear()) {
    const connection = await db.getConnection();
    
    try {
      const [repuestos] = await connection.query(`
        SELECT 
          r.nombre as repuesto,
          r.categoria_repuesto_id,
          cr.nombre as categoria,
          SUM(vpr.cantidad) as unidades_vendidas,
          SUM(vpr.cantidad * r.precio_venta) as ingresos_totales,
          AVG(r.precio_venta) as precio_promedio
        FROM repuesto r
        LEFT JOIN categoria_repuesto cr ON r.categoria_repuesto_id = cr.id
        LEFT JOIN venta_por_repuesto vpr ON r.id = vpr.repuesto_id
        LEFT JOIN venta v ON vpr.venta_id = v.id
        WHERE YEAR(v.fecha) = ?
        GROUP BY r.id, r.nombre, r.categoria_repuesto_id, cr.nombre
        ORDER BY unidades_vendidas DESC
        LIMIT 10
      `, [año]);

      return repuestos;
    } finally {
      connection.release();
    }
  },

  // Rendimiento de mecánicos
  async obtenerRendimientoMecanicos(periodo = 'mes', año = new Date().getFullYear()) {
    const connection = await db.getConnection();
    
    try {
      const [mecanicos] = await connection.query(`
        SELECT 
          m.nombre,
          m.apellido,
          COUNT(c.id) as total_citas,
          SUM(CASE WHEN c.estado_cita_id = 3 THEN 1 ELSE 0 END) as citas_completadas,
          COUNT(DISTINCT v.id) as total_ventas,
          SUM(v.total) as ingresos_generados,
          AVG(v.total) as promedio_venta
        FROM mecanico m
        LEFT JOIN cita c ON m.id = c.mecanico_id
        LEFT JOIN venta v ON m.id = v.mecanico_id
        WHERE (YEAR(c.fecha) = ? OR YEAR(v.fecha) = ?)
        GROUP BY m.id, m.nombre, m.apellido
        ORDER BY citas_completadas DESC
      `, [año, año]);

      return mecanicos;
    } finally {
      connection.release();
    }
  },

  // Análisis de clientes
  async obtenerAnalisisClientes(periodo = 'mes', año = new Date().getFullYear()) {
    const connection = await db.getConnection();
    
    try {
      const [clientes] = await connection.query(`
        SELECT 
          c.nombre,
          c.apellido,
          COUNT(DISTINCT v.id) as total_ventas,
          SUM(v.total) as total_gastado,
          AVG(v.total) as promedio_compra,
          COUNT(DISTINCT cit.id) as total_citas,
          MAX(v.fecha) as ultima_compra
        FROM cliente c
        LEFT JOIN venta v ON c.id = v.cliente_id
        LEFT JOIN vehiculo veh ON c.id = veh.cliente_id
        LEFT JOIN cita cit ON veh.id = cit.vehiculo_id
        WHERE (YEAR(v.fecha) = ? OR YEAR(cit.fecha) = ?)
        GROUP BY c.id, c.nombre, c.apellido
        ORDER BY total_gastado DESC
        LIMIT 10
      `, [año, año]);

      return clientes;
    } finally {
      connection.release();
    }
  },

  // Métricas de inventario
  async obtenerMetricasInventario() {
    const connection = await db.getConnection();
    
    try {
      const [inventario] = await connection.query(`
        SELECT 
          COUNT(*) as total_repuestos,
          SUM(cantidad) as stock_total,
          SUM(CASE WHEN cantidad <= 5 THEN 1 ELSE 0 END) as bajo_stock,
          SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as sin_stock,
          SUM(cantidad * precio_venta) as valor_inventario
        FROM repuesto
      `);

      const [categorias] = await connection.query(`
        SELECT 
          cr.nombre as categoria,
          COUNT(r.id) as total_repuestos,
          SUM(r.cantidad) as stock_total,
          AVG(r.precio_venta) as precio_promedio
        FROM categoria_repuesto cr
        LEFT JOIN repuesto r ON cr.id = r.categoria_repuesto_id
        GROUP BY cr.id, cr.nombre
        ORDER BY total_repuestos DESC
      `);

      return {
        resumen: inventario[0],
        por_categoria: categorias
      };
    } finally {
      connection.release();
    }
  },

  // Predicciones y tendencias
  async obtenerPredicciones() {
    const connection = await db.getConnection();
    
    try {
      // Predicción de ventas basada en tendencias históricas
      const [prediccionVentas] = await connection.query(`
        SELECT 
          AVG(ventas_diarias) as promedio_ventas_diarias,
          AVG(ingresos_diarios) as promedio_ingresos_diarios
        FROM (
          SELECT 
            DATE(fecha) as fecha,
            COUNT(*) as ventas_diarias,
            SUM(total) as ingresos_diarios
          FROM venta
          WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(fecha)
        ) as ventas_diarias
      `);

      // Servicios con mayor demanda
      const [serviciosDemanda] = await connection.query(`
        SELECT 
          s.nombre,
          COUNT(vps.servicio_id) as demanda_actual,
          ROUND(
            (COUNT(vps.servicio_id) * 100.0 / (
              SELECT COUNT(*) FROM venta_por_servicio 
              WHERE venta_id IN (
                SELECT id FROM venta 
                WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
              )
            )), 2
          ) as porcentaje_demanda
        FROM servicio s
        LEFT JOIN venta_por_servicio vps ON s.id = vps.servicio_id
        LEFT JOIN venta v ON vps.venta_id = v.id
        WHERE v.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY s.id, s.nombre
        ORDER BY demanda_actual DESC
        LIMIT 5
      `);

      return {
        prediccion: prediccionVentas[0],
        servicios_demanda: serviciosDemanda
      };
    } finally {
      connection.release();
    }
  },

  // Reporte ejecutivo mensual
  async obtenerReporteEjecutivo(mes = new Date().getMonth() + 1, año = new Date().getFullYear()) {
    const connection = await db.getConnection();
    
    try {
      const [resumen] = await connection.query(`
        SELECT 
          COUNT(DISTINCT v.id) as total_ventas,
          SUM(v.total) as ingresos_totales,
          AVG(v.total) as promedio_venta,
          COUNT(DISTINCT c.id) as total_citas,
          SUM(CASE WHEN c.estado_cita_id = 3 THEN 1 ELSE 0 END) as citas_completadas,
          COUNT(DISTINCT v.cliente_id) as clientes_unicos,
          COUNT(DISTINCT v.mecanico_id) as mecanicos_activos
        FROM venta v
        LEFT JOIN cita c ON MONTH(c.fecha) = ? AND YEAR(c.fecha) = ?
        WHERE MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
      `, [mes, año, mes, año]);

      const [comparacion] = await connection.query(`
        SELECT 
          'actual' as periodo,
          COUNT(DISTINCT v.id) as ventas,
          SUM(v.total) as ingresos
        FROM venta v
        WHERE MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
        UNION ALL
        SELECT 
          'anterior' as periodo,
          COUNT(DISTINCT v.id) as ventas,
          SUM(v.total) as ingresos
        FROM venta v
        WHERE MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
      `, [mes, año, mes - 1, año]);

      return {
        resumen: resumen[0],
        comparacion: comparacion
      };
    } finally {
      connection.release();
    }
  },

  // Métricas existentes (mantener compatibilidad)
  async obtenerServiciosActivos() {
    const [rows] = await db.query('SELECT * FROM servicio WHERE estado = "Activo"');
    return rows;
  },

  async obtenerRepuestosBajoStock(limite = 10) {
    const [rows] = await db.query(`
      SELECT r.*, cr.nombre as categoria_nombre
      FROM repuesto r
      JOIN categoria_repuesto cr ON r.categoria_repuesto_id = cr.id
      WHERE r.cantidad <= 5
      ORDER BY r.cantidad ASC
      LIMIT ?
    `, [limite]);
    return rows;
  },

  async obtenerRepuestosCriticos() {
    const [rows] = await db.query(`
      SELECT r.*, cr.nombre as categoria_nombre
      FROM repuesto r
      JOIN categoria_repuesto cr ON r.categoria_repuesto_id = cr.id
      WHERE r.cantidad = 0
      ORDER BY r.nombre
    `);
    return rows;
  },

  async obtenerComprasRecientes(limite = 5) {
    const [rows] = await db.query(`
      SELECT c.*, p.nombre as proveedor_nombre
      FROM compras c
      JOIN proveedor p ON c.proveedor_id = p.id
      ORDER BY c.fecha DESC
      LIMIT ?
    `, [limite]);
    return rows;
  },

  async obtenerVentasRecientes(limite = 5) {
    const [rows] = await db.query(`
      SELECT v.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido
      FROM venta v
      JOIN cliente c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
      LIMIT ?
    `, [limite]);
    return rows;
  },

  async obtenerCitasHoy() {
    const [rows] = await db.query(`
      SELECT c.*, 
             ec.nombre as estado_nombre,
             v.placa as vehiculo_placa,
             cl.nombre as cliente_nombre,
             cl.apellido as cliente_apellido,
             m.nombre as mecanico_nombre,
             m.apellido as mecanico_apellido
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN mecanico m ON c.mecanico_id = m.id
      WHERE DATE(c.fecha) = CURDATE()
      ORDER BY c.hora
    `);
    return rows;
  },

  async obtenerCitasProximasSemana() {
    const [rows] = await db.query(`
      SELECT c.*, 
             ec.nombre as estado_nombre,
             v.placa as vehiculo_placa,
             cl.nombre as cliente_nombre,
             cl.apellido as cliente_apellido,
             m.nombre as mecanico_nombre,
             m.apellido as mecanico_apellido
      FROM cita c
      JOIN estado_cita ec ON c.estado_cita_id = ec.id
      JOIN vehiculo v ON c.vehiculo_id = v.id
      JOIN cliente cl ON v.cliente_id = cl.id
      JOIN mecanico m ON c.mecanico_id = m.id
      WHERE c.fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY c.fecha, c.hora
    `);
    return rows;
  },

  async obtenerTopServicios(limite = 5) {
    const [rows] = await db.query(`
      SELECT s.nombre, COUNT(vps.servicio_id) as veces_vendido
      FROM servicio s
      JOIN venta_por_servicio vps ON s.id = vps.servicio_id
      GROUP BY s.id, s.nombre
      ORDER BY veces_vendido DESC
      LIMIT ?
    `, [limite]);
    return rows;
  },

  async obtenerTopRepuestos(limite = 5) {
    const [rows] = await db.query(`
      SELECT r.nombre, SUM(vpr.cantidad) as unidades_vendidas
      FROM repuesto r
      JOIN venta_por_repuesto vpr ON r.id = vpr.repuesto_id
      GROUP BY r.id, r.nombre
      ORDER BY unidades_vendidas DESC
      LIMIT ?
    `, [limite]);
    return rows;
  },

  async obtenerMecanicosActivos() {
    const [rows] = await db.query(`
      SELECT m.*, COUNT(c.id) as citas_asignadas
      FROM mecanico m
      LEFT JOIN cita c ON m.id = c.mecanico_id AND c.estado_cita_id IN (1, 2)
      WHERE m.estado = 'Activo'
      GROUP BY m.id, m.nombre, m.apellido
      ORDER BY citas_asignadas DESC
    `);
    return rows;
  },

  async obtenerClientesFrecuentes(limite = 5) {
    const [rows] = await db.query(`
      SELECT c.nombre, c.apellido, COUNT(v.id) as total_ventas
      FROM cliente c
      JOIN venta v ON c.id = v.cliente_id
      GROUP BY c.id, c.nombre, c.apellido
      ORDER BY total_ventas DESC
      LIMIT ?
    `, [limite]);
    return rows;
  }
};

module.exports = DashboardService;
