require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

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

// 2. EL ENCENDIDO (Obligatorio para que Render no falle)
const PORT = process.env.PORT || 10000; // Render usa el 10000 por defecto
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});