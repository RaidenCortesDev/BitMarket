require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const isProduction = process.env.DATABASE_URL;
const bcrypt = require('bcrypt');


// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// TU LOG DE CLOUDINARY
console.log("¿Cloudinary configurado?:", cloudinary.config().cloud_name ? "✅ Sí" : "❌ No");

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DEL POOL

const pool = new Pool({
    // Si detecta DATABASE_URL (Render), la usa. Si no, usa las variables locales.
    connectionString: isProduction ? process.env.DATABASE_URL : undefined,
    user: isProduction ? undefined : process.env.DB_USER,
    host: isProduction ? undefined : process.env.DB_HOST,
    database: isProduction ? undefined : process.env.DB_NAME,
    password: isProduction ? undefined : process.env.DB_PASSWORD,
    port: isProduction ? undefined : process.env.DB_PORT,
    // SSL obligatorio para Render (producción), pero desactivado en local para evitar errores
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
    if (err) return console.error('❌ Error adquiriendo el cliente', err.stack);
    console.log(`✅ Conexión exitosa a PostgreSQL (${isProduction ? 'Producción/Render' : 'Localhost'})`);
    release();
});

// --- ENDPOINTS ---

app.get('/api/categorias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories WHERE status_id = 1');
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error en el query:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            'INSERT INTO users (nombre, email, password, status_id, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, email, hashedPassword, 1, 3]
        );
        res.status(201).json({
            message: "¡Usuario creado!",
            user: { nombre: result.rows[0].nombre, rol: 'cliente' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: "El correo no está registrado" });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

        // LOG DE DEPURACIÓN PARA TI
        console.log(`Usuario: ${user.email} | role_id en DB: ${user.role_id}`);

        const rolAsignado = (user.role_id == 1 || user.role_id == 2) ? 'admin' : 'cliente';

        return res.json({
            message: "¡Bienvenido de nuevo!",
            user: {
                nombre: user.nombre,
                email: user.email,
                rol: rolAsignado // <--- ESTO es lo que lee el frontend
            }
        });
    } catch (err) {
        console.error("❌ Error en Login:", err.message);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE status_id = 1 ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al traer productos:', err);
        res.status(500).json({ error: 'Error al cargar el inventario' });
    }
});

app.get('/api/productos/destacados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE status_id = 1 ORDER BY id DESC LIMIT 5');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al cargar destacados' });
    }
});

// --- EL ENCENDIDO CON TU LOG ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});