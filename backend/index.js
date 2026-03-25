require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt')

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("¿Cloudinary configurado?:", cloudinary.config().cloud_name ? "✅ Sí" : "❌ No");
const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN INTELIGENTE DEL POOL
const isProduction = process.env.DATABASE_URL; // Si existe esta variable, estamos en Render

const pool = new Pool({
    // En Render usa la URL larga, en Local usa tus variables del .env
    connectionString: isProduction ? process.env.DATABASE_URL : undefined,
    user: isProduction ? undefined : process.env.DB_USER,
    host: isProduction ? undefined : process.env.DB_HOST,
    database: isProduction ? undefined : process.env.DB_NAME,
    password: isProduction ? undefined : process.env.DB_PASSWORD,
    port: isProduction ? undefined : process.env.DB_PORT,
    // SSL es obligatorio en Render, pero en Local da problemas, por eso lo condicionamos:
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Probar conexión
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error adquiriendo el cliente', err.stack);
    }
    console.log(`✅ Conexión exitosa a PostgreSQL (${isProduction ? 'Producción/Render' : 'Localhost'})`);
    release();
});

// Endpoint de prueba
app.get('/api/categorias', async (req, res) => {
    try {
        // Consultamos la tabla que acabas de crear en pgAdmin
        const result = await pool.query('SELECT * FROM categories WHERE status_id = 1');

        // Si todo sale bien, mandamos el JSON
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error en el query:', err);
        res.status(500).json({ error: 'Valió queso el servidor' });
    }
});

// 1. LA PRUEBA (Opcional, solo para loguear)
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error de conexión:', err.stack);
    }
    console.log('✅ Conexión exitosa a PostgreSQL');
    release();
});

// 1. Consultar todos los usuarios (Para Postman)
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Registro de usuario
app.post('/api/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    console.log("Recibiendo registro para:", email); // Debug

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log("Contraseña original:", password);
        console.log("Contraseña encriptada:", hashedPassword); // AQUÍ VERÁS EL HASH

        const result = await pool.query(
            'INSERT INTO users (nombre, email, password, status_id, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, email, hashedPassword, 1, 3]
        );

        res.status(201).json({
            message: "¡Usuario creado!",
            user: { nombre: result.rows[0].nombre, rol: 'cliente' }
        });
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Login de usuario 

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al usuario por email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "El correo no está registrado" });
        }

        const user = result.rows[0];

        // 2. Comparar la contraseña ingresada con el hash de la base de datos
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // 3. Si todo está bien, responder con los datos y el rol
        const rolAsignado = user.role_id === 1 ? 'admin' : 'cliente';

        return res.json({
            message: "¡Bienvenido de nuevo!",
            user: {
                nombre: user.nombre,
                email: user.email,
                rol: rolAsignado
            }
        });

    } catch (err) {
        console.error("❌ Error en Login:", err.message);
        res.status(500).json({ error: "Error en el servidor" });
    }

    if (!response.ok) {
    const textError = await response.text(); // Lee el HTML del error
    console.error("Respuesta del servidor:", textError);
    throw new Error("El servidor respondió con un error (ver consola)");
}

// Endpoint para obtener productos (Index)
app.get('/api/productos', async (req, res) => {
    try {
        // Traemos productos activos
        const result = await pool.query('SELECT * FROM products WHERE status_id = 1 ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al traer productos:', err);
        res.status(500).json({ error: 'Error al cargar el inventario' });
    }
});

// Traer solo los 5 productos más recientes para la Landing
app.get('/api/productos/destacados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE status_id = 1 ORDER BY id DESC LIMIT 5');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al cargar destacados' });
    }
});

const data = await response.json();
});

// --- AHORA SÍ, EL ENCENDIDO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});