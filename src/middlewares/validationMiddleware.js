const Joi = require('joi');

// Esquemas de validación
const schemas = {
  // Usuario
  usuario: Joi.object({
    nombre: Joi.string().min(2).max(45).required(),
    apellido: Joi.string().min(2).max(45).required(),
    correo: Joi.string().email().max(90).required(),
    password: Joi.string().min(6).required(),
    tipo_documento: Joi.string().valid('Cédula de ciudadanía', 'Tarjeta de identidad', 'Cédula de extranjería', 'Pasaporte', 'NIT', 'Otro').required(),
    documento: Joi.string().min(5).max(45).required(),
    telefono: Joi.string().min(7).max(45).required(),
    direccion: Joi.string().min(10).max(100).required(),
    rol_id: Joi.number().integer().min(1).max(4).optional()
  }),

  // Cita
  cita: Joi.object({
    vehiculo_id: Joi.number().integer().required(),
    mecanico_id: Joi.number().integer().required(),
    fecha: Joi.date().min('now').required(),
    hora: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    observaciones: Joi.string().max(500).optional(),
    estado_cita_id: Joi.number().integer().default(1)
  }),

  // Venta
  venta: Joi.object({
    cliente_id: Joi.number().integer().required(),
    mecanico_id: Joi.number().integer().optional(),
    estado_venta_id: Joi.number().integer().default(1),
    fecha: Joi.date().default('now'),
    total: Joi.number().positive().required(),
    servicios: Joi.array().items(
      Joi.object({
        servicio_id: Joi.number().integer().required()
      })
    ).min(1).required(),
    repuestos: Joi.array().items(
      Joi.object({
        repuesto_id: Joi.number().integer().required(),
        cantidad: Joi.number().integer().min(1).required()
      })
    ).optional()
  }),

  // Vehículo
  vehiculo: Joi.object({
    placa: Joi.string().max(6).required(),
    color: Joi.string().max(45).required(),
    tipo_vehiculo: Joi.string().valid('Carro', 'Moto', 'Camioneta').required(),
    referencia_id: Joi.number().integer().required(),
    cliente_id: Joi.number().integer().required(),
    estado: Joi.string().valid('Activo', 'Inactivo').default('Activo')
  }),

  // Login
  login: Joi.object({
    correo: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

// Middleware de validación
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Esquema de validación no encontrado' });
    }

    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Error de validación',
        details: errorMessage
      });
    }

    next();
  };
};

module.exports = { validate, schemas };
