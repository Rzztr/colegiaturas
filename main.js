// main.js  (o app.js)
const express = require('express');
const Session = require('./estudiantes/session');
const db = require('./db');                    

class Main {
  constructor() {
    this.app = express();
    this.session = new Session(db);
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    // express-session
  }

  setupRoutes() {
    // Ruta de login
    this.app.post('/login', async (req, res) => {
      const { num_control, password } = req.body;

      const resultado = await this.session.login(num_control, password);

      if (!resultado.success) {
        return res.status(resultado.status).json({ error: resultado.error });
      }

      // Aquí puedes guardar en req.session si quieres
      // req.session.estudiante = resultado.estudiante;

      res.json({
        mensaje: 'Login exitoso',
        estudiante: resultado.estudiante
      });
    });

    // Ruta de logout (ejemplo)
    this.app.post('/logout', (req, res) => {
      const resultado = this.session.logout(req);
      res.json(resultado);
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  }
}

// Arrancar la aplicación
const app = new Main();
app.start();