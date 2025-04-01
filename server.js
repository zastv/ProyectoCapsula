const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configuración del emulador (añadir al .env)
const AVD_NAME = process.env.AVD_NAME || 'Pixel_3a_API_34';

// Conexión a MongoDB (existente)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mi-base-de-datos')
  .then(() => console.log('Conectado a MongoDB'))
  .catch((error) => {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  });

// Middleware (existente)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Modelos (existente)
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  _id: Number,
  name: String,
  price: Number,
  description: String,
  stock: Number,
}));

const Cart = mongoose.model('Cart', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  products: [{
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true },
  }],
}));

// Rutas existentes (registro, login, carrito)
app.post('/register', async (req, res) => { /* ... */ });
app.post('/login', async (req, res) => { /* ... */ });
app.post('/cart', async (req, res) => { /* ... */ });
app.get('/cart', async (req, res) => { /* ... */ });

// Nuevas rutas para el control del emulador
app.post('/api/emulator', async (req, res) => {
  const { action } = req.body;
  
  if (!['start', 'stop'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Acción no válida' });
  }

  try {
    const command = action === 'start' 
      ? `emulator -avd ${AVD_NAME} -no-snapshot-load &` 
      : 'adb emu kill';

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ 
        success: true, 
        message: action === 'start' ? 'Emulador iniciado' : 'Emulador detenido'
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/emulator-status', async (req, res) => {
  exec('adb devices', (error, stdout, stderr) => {
    const isRunning = stdout.includes('emulator');
    res.json({ running: isRunning });
  });
});

// Ruta principal con selector de interfaz
app.get('/', (req, res) => {
  const userAgent = req.headers['user-agent'];
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent.toLowerCase());

  if (req.query.interface === 'mobile') {
    return res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
  } else if (req.query.interface === 'web') {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  // Redirección automática para móviles (opcional)
  if (isMobile && !req.query.noredirect) {
    return res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
  }

  // Página principal por defecto
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de errores (existente)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal en el servidor', error: err.message });
});

// Iniciar servidor (existente)
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Control emulador disponible en /api/emulator`);
  console.log(`Interfaz móvil: http://localhost:${port}/?interface=mobile`);
});