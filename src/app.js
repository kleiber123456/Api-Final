const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/authRoutes")
const usuarioRoutes = require("./routes/usuarioRoutes")
const rolRoutes = require("./routes/rolRoutes")
const proveedorRoutes = require("./routes/proveedorRoutes")
const servicioRoutes = require("./routes/servicioRoutes")
const repuestoRoutes = require("./routes/repuestoRoutes")
const categoriaRepuestoRoutes = require("./routes/categoriaRepuestoRoutes")

const marcaRoutes = require("./routes/marcaRoutes")
const referenciaRoutes = require("./routes/referenciaRoutes")
const vehiculoRoutes = require("./routes/vehiculoRoutes")
const compraRoutes = require("./routes/compraRoutes")
const clienteRoutes = require("./routes/clienteRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")

const estadoVentaRoutes = require("./routes/estadoVentaRoutes")
const estadoCitaRoutes = require("./routes/estadoCitaRoutes")
const horarioRoutes = require("./routes/horarioRoutes")
const mecanicoRoutes = require("./routes/mecanicoRoutes")
const ventaRoutes = require("./routes/ventaRoutes")
const citaRoutes = require("./routes/citaRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuarioRoutes)
app.use("/api/roles", rolRoutes)
app.use("/api/proveedores", proveedorRoutes)
app.use("/api/servicios", servicioRoutes)
app.use("/api/repuestos", repuestoRoutes)
app.use("/api/categorias-repuestos", categoriaRepuestoRoutes)

app.use("/api/marcas", marcaRoutes)
app.use("/api/referencias", referenciaRoutes)
app.use("/api/vehiculos", vehiculoRoutes)
app.use("/api/compras", compraRoutes)
app.use("/api/clientes", clienteRoutes)
app.use("/api/dashboard", dashboardRoutes)

app.use("/api/estados-venta", estadoVentaRoutes)
app.use("/api/estados-cita", estadoCitaRoutes)
app.use("/api/horarios", horarioRoutes)
app.use("/api/mecanicos", mecanicoRoutes)
app.use("/api/ventas", ventaRoutes)
app.use("/api/citas", citaRoutes)

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a la API del Taller MotOrtega",
    version: "4.0.0 - Sistema completo de historial y vinculación venta-cita",
    endpoints: {
      // Autenticación
      login: "/api/auth/login (POST)",
      register: "/api/auth/register (POST)",
      enviarCodigo: "/api/auth/solicitar-codigo (POST)",
      verificarCodigo: "/api/auth/verificar-codigo (POST)",
      actualizarPassword: "/api/auth/nueva-password (POST)",

      // Perfil de usuario
      miPerfil: "/api/usuarios/mi-perfil (GET/PUT)",

      // Endpoints específicos para clientes autenticados
      misVehiculos: "/api/vehiculos/cliente/:clienteId (GET)",
      crearMiVehiculo: "/api/vehiculos/cliente/crear (POST) - Requiere autenticación",
      editarMiVehiculo: "/api/vehiculos/cliente/editar/:id (PUT) - Requiere autenticación",
      detalleMiVehiculo: "/api/vehiculos/cliente/detalle/:id (GET) - Requiere autenticación",

      // Endpoints de citas para clientes autenticados
      misCitas: "/api/citas/cliente/mis-citas (GET) - Requiere autenticación",
      crearMiCita: "/api/citas/cliente/crear (POST) - Requiere autenticación",
      editarMiCita: "/api/citas/cliente/editar/:id (PUT) - Requiere autenticación",

      // Cambios de estado
      cambiarEstadoUsuario: "/api/usuarios/:id/cambiar-estado (PUT)",
      cambiarEstadoRol: "/api/roles/:id/cambiar-estado (PUT)",
      cambiarEstadoProveedor: "/api/proveedores/:id/cambiar-estado (PUT)",
      cambiarEstadoServicio: "/api/servicios/:id/cambiar-estado (PUT)",
      cambiarEstadoRepuesto: "/api/repuestos/:id/cambiar-estado (PUT)",
      cambiarEstadoCategoriaRepuesto: "/api/categorias-repuestos/:id/cambiar-estado (PUT)",

      // CRUD básico
      proveedores: "/api/proveedores",
      servicios: "/api/servicios",
      roles: "/api/roles",
      usuarios: "/api/usuarios",
      repuestos: "/api/repuestos",
      categoriasRepuestos: "/api/categorias-repuestos",
      clientes: "/api/clientes",
      marcas: "/api/marcas",
      referencias: "/api/referencias",
      vehiculos: "/api/vehiculos",
      compras: "/api/compras",

      // Consultas específicas
      referenciasPorMarca: "/api/referencias/marca/:marcaId (GET)",
      vehiculosPorCliente: "/api/vehiculos/cliente/:clienteId (GET)",
      cambiarEstadoVehiculo: "/api/vehiculos/:id/cambiar-estado (PUT)",
      cambiarEstadoCompra: "/api/compras/:id/cambiar-estado (PUT)",

      // Dashboard
      dashboard: "/api/dashboard",
      estadisticasCompletas: "/api/dashboard/estadisticas (GET)",
      ventasRecientes: "/api/dashboard/ventas-recientes (GET)",
      citasHoy: "/api/dashboard/citas-hoy (GET)",
      citasProximaSemana: "/api/dashboard/citas-proxima-semana (GET)",
      topServicios: "/api/dashboard/top-servicios (GET)",
      topRepuestos: "/api/dashboard/top-repuestos (GET)",
      mecanicosActivos: "/api/dashboard/mecanicos-activos (GET)",
      clientesFrecuentes: "/api/dashboard/clientes-frecuentes (GET)",
      tendenciasVentas: "/api/dashboard/tendencias-ventas?año=2024 (GET)",
      tendenciasCitas: "/api/dashboard/tendencias-citas?año=2024 (GET)",
      tendenciasCompras: "/api/dashboard/tendencias-compras?año=2024 (GET)",

      // Estados
      estadosVenta: "/api/estados-venta",
      estadosCita: "/api/estados-cita",

      // HORARIOS - Sistema de novedades/excepciones
      horarios: "/api/horarios (GET/POST)",
      horariosPorMecanico: "/api/horarios/mecanico/:mecanicoId (GET)",
      horariosPorFecha: "/api/horarios/fecha/:fecha (GET)",
      horariosPorDia: "/api/horarios/dia/:dia (GET)",
      verificarDisponibilidad: "/api/horarios/disponibilidad?fecha=&hora= (GET)",

      // Mecánicos
      mecanicos: "/api/mecanicos",
      mecanicosPorEstado: "/api/mecanicos/estado/:estado (GET)",
      cambiarEstadoMecanico: "/api/mecanicos/:id/cambiar-estado (PUT)",
      citasPorMecanico: "/api/mecanicos/:id/citas (GET)",
      estadisticasMecanico: "/api/mecanicos/:id/estadisticas (GET)",

      // VENTAS - Sistema completo con historial
      ventas: "/api/ventas (GET/POST)",
      ventasPorCliente: "/api/ventas/cliente/:clienteId (GET)",
      ventasPorEstado: "/api/ventas/estado/:estadoId (GET)",
      ventasPorRango: "/api/ventas/rango?fechaInicio=&fechaFin= (GET)",
      cambiarEstadoVenta: "/api/ventas/:id/cambiar-estado (PUT)",
      vincularVentaCita: "/api/ventas/:id/vincular-cita (POST)",

      // HISTORIAL DE VENTAS
      historialVenta: "/api/ventas/:id/historial (GET)",
      historialVentasPorCliente: "/api/ventas/historial/cliente/:clienteId (GET)",
      historialVentasPorVehiculo: "/api/ventas/historial/vehiculo/:vehiculoId (GET)",

      // CITAS - Sistema actualizado con historial
      citas: "/api/citas (GET/POST)",
      citasPorMecanico: "/api/citas/mecanico/:mecanicoId (GET)",
      citasPorFecha: "/api/citas/fecha/:fecha (GET)",
      citasPorEstado: "/api/citas/estado/:estadoId (GET)",
      disponibilidadMecanicos: "/api/citas/disponibilidad/mecanicos?fecha=&hora= (GET)",
      cambiarEstadoCita: "/api/citas/:id/cambiar-estado (PUT)",

      // HISTORIAL DE CITAS
      historialCita: "/api/citas/:id/historial (GET)",
      historialCitasPorCliente: "/api/citas/historial/cliente/:clienteId (GET)",
      historialCitasPorVehiculo: "/api/citas/historial/vehiculo/:vehiculoId (GET)",
    },

    // Información del sistema de estados
    sistemasEstados: {
      ventasCitas: {
        descripcion: "Sistema de sincronización automática entre ventas y citas",
        estadosVenta: {
          1: "Pendiente",
          2: "Pagada",
          3: "Cancelada",
        },
        estadosCita: {
          1: "Programada",
          2: "En Proceso",
          3: "Completada",
          4: "Cancelada",
        },
        sincronizacion: {
          "Venta Pendiente": "Cita En Proceso",
          "Venta Pagada": "Cita Completada",
          "Venta Cancelada": "Cita Cancelada",
        },
      },
    },

    // Información del sistema de historial
    sistemaHistorial: {
      descripcion: "Sistema completo de trazabilidad y historial",
      caracteristicas: [
        "Historial detallado de ventas con servicios y repuestos",
        "Historial completo de citas con cambios de estado",
        "Vinculación automática y manual entre ventas y citas",
        "Filtros por cliente, vehículo, fecha y estado",
        "Trazabilidad completa de todas las operaciones",
      ],
      filtrosDisponibles: ["Por venta específica", "Por cliente", "Por vehículo", "Por rango de fechas", "Por estado"],
    },

    // Ejemplos de uso
    ejemplosUso: {
      clienteVehiculos: {
        descripcion: "Gestión de vehículos por cliente autenticado",
        endpoints: {
          listar: "GET /api/vehiculos/cliente/:clienteId",
          crear: "POST /api/vehiculos/cliente/crear (Headers: Authorization: Bearer <token>)",
          editar: "PUT /api/vehiculos/cliente/editar/:id (Headers: Authorization: Bearer <token>)",
          detalle: "GET /api/vehiculos/cliente/detalle/:id (Headers: Authorization: Bearer <token>)",
        },
        ejemploCrear: {
          marca_id: 1,
          referencia_id: 1,
          placa: "ABC123",
          año: 2020,
          color: "Rojo",
          kilometraje: 50000,
        },
      },
      gestionCitasCliente: {
        descripcion: "Gestión de citas por cliente autenticado (usa token)",
        endpoints: {
          listar: "GET /api/citas/cliente/mis-citas",
          crear: "POST /api/citas/cliente/crear",
          editar: "PUT /api/citas/cliente/editar/:id",
        },
        ejemploCrear: {
          fecha: "2024-12-15",
          hora: "14:00:00",
          vehiculo_id: 1,
          mecanico_id: 2,
          observaciones: "Revisión de frenos.",
        },
        ejemploEditar: {
          fecha: "2024-12-16",
          hora: "09:00:00",
        },
      },
      ventaSinCita: {
        descripcion: "Crear venta independiente sin vincular a cita",
        endpoint: "POST /api/ventas",
        ejemplo: {
          cliente_id: 1,
          estado_venta_id: 1,
          mecanico_id: 2,
          servicios: [{ servicio_id: 1 }],
          repuestos: [{ repuesto_id: 1, cantidad: 2 }],
        },
      },
      ventaConCita: {
        descripcion: "Crear venta vinculada automáticamente a una cita",
        endpoint: "POST /api/ventas",
        ejemplo: {
          cliente_id: 1,
          estado_venta_id: 1,
          mecanico_id: 2,
          cita_id: 5,
          servicios: [{ servicio_id: 1 }],
          repuestos: [{ repuesto_id: 1, cantidad: 2 }],
        },
      },
      vincularExistente: {
        descripcion: "Vincular venta existente con cita",
        endpoint: "POST /api/ventas/:id/vincular-cita",
        ejemplo: {
          cita_id: 5,
          observaciones: "Vinculación manual",
        },
      },
    },

    horariosTrabajo: {
      dias: "Lunes a Sábado",
      horario: "8:00 AM - 6:00 PM",
      noDisponible: "Domingos",
      novedades: "Se registran como excepciones en el sistema",
    },
  })
})

module.exports = app
