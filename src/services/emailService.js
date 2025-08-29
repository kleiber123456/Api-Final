const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Cargar template HTML
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');
      
      // Reemplazar variables en el template
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, data[key]);
      });
      
      return template;
    } catch (error) {
      console.error('Error cargando template:', error);
      return this.getDefaultTemplate(data);
    }
  }

  // Template por defecto
  getDefaultTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${data.subject || 'Notificación del Sistema'}</h2>
        <p>${data.message || 'Mensaje del sistema'}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Este es un mensaje automático del sistema MotOrtega.
        </p>
      </div>
    `;
  }

  // Enviar correo de bienvenida
  async sendWelcomeEmail(userData) {
    const templateData = {
      nombre: userData.nombre,
      apellido: userData.apellido,
      correo: userData.correo,
      rol: userData.rol_nombre || 'Usuario',
      fecha: new Date().toLocaleDateString('es-ES')
    };

    const html = await this.loadTemplate('welcome', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userData.correo,
      subject: `¡Bienvenido a MotOrtega, ${userData.nombre}! 🚀`,
      html: html
    });
  }

  // Enviar código de recuperación
  async sendRecoveryCode(email, code) {
    const templateData = {
      codigo: code,
      fecha: new Date().toLocaleDateString('es-ES'),
      hora: new Date().toLocaleTimeString('es-ES')
    };

    const html = await this.loadTemplate('recovery-code', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 Código de recuperación - MotOrtega',
      html: html
    });
  }

  // Enviar confirmación de cita
  async sendAppointmentConfirmation(citaData) {
    const templateData = {
      cliente_nombre: citaData.cliente_nombre,
      fecha: citaData.fecha,
      hora: citaData.hora,
      mecanico_nombre: citaData.mecanico_nombre,
      vehiculo_placa: citaData.vehiculo_placa,
      observaciones: citaData.observaciones
    };

    const html = await this.loadTemplate('appointment-confirmation', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: citaData.cliente_correo,
      subject: `📅 Confirmación de cita - ${citaData.fecha}`,
      html: html
    });
  }

  // Enviar recordatorio de cita
  async sendAppointmentReminder(citaData) {
    const templateData = {
      cliente_nombre: citaData.cliente_nombre,
      fecha: citaData.fecha,
      hora: citaData.hora,
      vehiculo_placa: citaData.vehiculo_placa,
      observaciones: citaData.observaciones
    };

    const html = await this.loadTemplate('appointment-reminder', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: citaData.cliente_correo,
      subject: `⏰ Recordatorio de cita - ${citaData.fecha}`,
      html: html
    });
  }

  // Enviar factura/recibo
  async sendInvoice(ventaData) {
    const templateData = {
      cliente_nombre: ventaData.cliente_nombre,
      cliente_apellido: ventaData.cliente_apellido,
      numero_venta: ventaData.id,
      fecha: ventaData.fecha,
      total: ventaData.total,
      servicios: ventaData.servicios || [],
      repuestos: ventaData.repuestos || []
    };

    const html = await this.loadTemplate('invoice', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ventaData.cliente_correo,
      subject: `🧾 Factura #${ventaData.id} - MotOrtega`,
      html: html
    });
  }

  // Enviar notificación de cambio de estado
  async sendStatusChangeNotification(data) {
    const templateData = {
      nombre: data.nombre,
      tipo: data.tipo, // 'cita' o 'venta'
      estado_anterior: data.estado_anterior,
      estado_nuevo: data.estado_nuevo,
      fecha: new Date().toLocaleDateString('es-ES'),
      hora: new Date().toLocaleTimeString('es-ES')
    };

    const html = await this.loadTemplate('status-change', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.correo,
      subject: `🔄 Cambio de estado - ${data.tipo.toUpperCase()}`,
      html: html
    });
  }

  // Enviar alerta de stock bajo
  async sendLowStockAlert(repuestoData) {
    const templateData = {
      nombre_repuesto: repuestoData.nombre,
      cantidad_actual: repuestoData.cantidad,
      categoria: repuestoData.categoria_nombre
    };

    const html = await this.loadTemplate('low-stock', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `⚠️ Alerta: Stock bajo - ${repuestoData.nombre}`,
      html: html
    });
  }

  // Enviar reporte diario
  async sendDailyReport(reportData) {
    const templateData = {
      fecha: reportData.fecha,
      citas_totales: reportData.citas_totales,
      citas_completadas: reportData.citas_completadas,
      ventas_totales: reportData.ventas_totales,
      ingresos: reportData.ingresos,
      servicios_populares: reportData.servicios_populares || [],
      repuestos_vendidos: reportData.repuestos_vendidos || []
    };

    const html = await this.loadTemplate('daily-report', templateData);

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `📊 Reporte diario - ${reportData.fecha}`,
      html: html
    });
  }
}

module.exports = new EmailService();
