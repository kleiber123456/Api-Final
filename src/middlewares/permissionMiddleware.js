const db = require('../config/db');

// Mapeo de roles a módulos por defecto
const defaultModulePermissions = {
  1: ['*'], // Administrador - todos los módulos
  2: ['*'], // Recepcionista - todos los módulos
  3: [ // Mecánico - módulos limitados
    'citas', 'ventas', 'servicios', 'repuestos', 'clientes', 'vehiculos', 'dashboard'
  ],
  4: [ // Cliente - módulos básicos
    'citas', 'ventas', 'clientes', 'vehiculos'
  ]
};

// Verificar permisos por módulo
const checkModulePermission = (requiredModule) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.rol;

      // Obtener permisos del usuario desde la base de datos
      const [permissions] = await db.query(`
        SELECT p.modulo
        FROM permiso p
        JOIN permiso_has_rol phr ON p.id = phr.permiso_id
        WHERE phr.rol_id = ?
      `, [userRole]);

      const userModules = permissions.map(p => p.modulo);

      // Si no hay permisos en BD, usar permisos por defecto
      if (userModules.length === 0) {
        userModules.push(...defaultModulePermissions[userRole] || []);
      }

      // Verificar si tiene el módulo requerido
      const hasPermission = userModules.includes('*') || 
                           userModules.includes(requiredModule);

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permisos insuficientes',
          required: requiredModule,
          userModules: userModules
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar múltiples módulos
const checkAnyModulePermission = (...modules) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.rol;

      const [userPermissions] = await db.query(`
        SELECT p.modulo
        FROM permiso p
        JOIN permiso_has_rol phr ON p.id = phr.permiso_id
        WHERE phr.rol_id = ?
      `, [userRole]);

      const userModules = userPermissions.map(p => p.modulo);
      
      if (userModules.length === 0) {
        userModules.push(...defaultModulePermissions[userRole] || []);
      }

      const hasAnyPermission = userModules.includes('*') || 
                              modules.some(module => userModules.includes(module));

      if (!hasAnyPermission) {
        return res.status(403).json({
          error: 'Permisos insuficientes',
          required: modules,
          userModules: userModules
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

module.exports = { checkModulePermission, checkAnyModulePermission };
