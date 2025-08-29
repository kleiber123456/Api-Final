const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Errores de autenticación
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Token inválido o expirado'
    });
  }

  // Errores de base de datos
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Conflicto',
      message: 'El registro ya existe'
    });
  }

  // Errores de permisos
  if (err.name === 'PermissionError') {
    return res.status(403).json({
      error: 'Permisos insuficientes',
      message: err.message
    });
  }

  // Error por defecto
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
};

module.exports = errorHandler;
