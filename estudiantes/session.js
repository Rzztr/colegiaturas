// session.js
const bcrypt = require('bcrypt');

class Session {
  /**
   * Regex para validar fortaleza de contraseña:
   * - Al menos 1 mayúscula
   * - Al menos 1 minúscula
   * - Al menos 1 número
   * - Al menos 1 carácter especial (#?!@$%^&*-)
   * - Mínimo 8 caracteres
   */
  static passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

  /**
   * @param {object} db - Instancia de la base de datos (better-sqlite3 u otra)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Valida si una contraseña cumple con los requisitos de seguridad
   * @param {string} password 
   * @returns {boolean}
   */
  static isPasswordValid(password) {
    return Session.passwordRegex.test(password);
  }

  /**
   * Intenta iniciar sesión con número de control y contraseña
   * @param {string} numControl 
   * @param {string} password 
   * @returns {Promise<object>} Resultado del login
   */
  async login(numControl, password) {
    // Validaciones básicas
    if (!numControl || !password) {
      return {
        success: false,
        error: 'Número de control y contraseña son obligatorios',
        status: 400
      };
    }

    // Validar formato de la contraseña (opcional pero recomendado)
    if (!Session.isPasswordValid(password)) {
      return {
        success: false,
        error: 'La contraseña no cumple con los requisitos de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial)',
        status: 400
      };
    }

    try {
      // Buscar estudiante
      const estudiante = this.db.prepare(`
        SELECT num_control, password_hash, nombre, apellido_paterno, 
               apellido_materno, grupo_id, activo
        FROM estudiantes
        WHERE num_control = ?
      `).get(numControl);

      if (!estudiante) {
        return {
          success: false,
          error: 'Credenciales incorrectas',
          status: 401
        };
      }

      // Verificar si está activo
      if (estudiante.activo !== 1) {
        return {
          success: false,
          error: 'Cuenta desactivada',
          status: 403
        };
      }

      // Comparar contraseña
      const passwordValida = await bcrypt.compare(password, estudiante.password_hash);

      if (!passwordValida) {
        return {
          success: false,
          error: 'Credenciales incorrectas',
          status: 401
        };
      }

      // Login exitoso
      return {
        success: true,
        status: 200,
        estudiante: {
          num_control: estudiante.num_control,
          nombre: estudiante.nombre,
          apellido_paterno: estudiante.apellido_paterno,
          apellido_materno: estudiante.apellido_materno,
          grupo_id: estudiante.grupo_id
        }
      };

    } catch (error) {
      console.error('Error en Session.login:', error);
      return {
        success: false,
        error: 'Error interno del servidor',
        status: 500
      };
    }
  }

  /**
   * Cierra la sesión
   * @param {object} req - Request de Express (opcional)
   */
  logout(req = null) {
    if (req && req.session) {
      req.session.destroy();
    }
    return { success: true, mensaje: 'Sesión cerrada' };
  }
}

module.exports = Session;