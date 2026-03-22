require('dotenv').config(); // Carga las variables del .env
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración del Pool de conexión
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Probar conexión al iniciar
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error adquiriendo el cliente', err.stack);
    }
    console.log('✅ Conexión exitosa a PostgreSQL (bitmarket_db)');
    release();
});

// --- TU PRIMERA API REAL: LISTAR CATEGORÍAS ---
app.get('/api/categorias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories WHERE status_id = 1');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});