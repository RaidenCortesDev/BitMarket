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
    connectionString: isProduction ? process.env.DATABASE_URL : undefined,
    user: isProduction ? undefined : process.env.DB_USER,
    host: isProduction ? undefined : process.env.DB_HOST,
    database: isProduction ? undefined : process.env.DB_NAME,
    password: isProduction ? undefined : process.env.DB_PASSWORD,
    port: isProduction ? undefined : process.env.DB_PORT,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
    if (err) return console.error('❌ Error adquiriendo el cliente', err.stack);
    console.log(`✅ Conexión exitosa a PostgreSQL (${isProduction ? 'Producción/Render' : 'Localhost'})`);
    release();
});

// --- ENDPOINTS ---

app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Sección de registro de usuarios ---

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

// --- Sección de inicio de sesión ---

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: "El correo no está registrado" });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

        console.log(`ID Usuario: ${user.id}`);
        console.log(`Usuario: ${user.email} | role_id en DB: ${user.role_id}`);

        const rolAsignado = (user.role_id == 1 || user.role_id == 2) ? 'admin' : 'cliente';

        return res.json({
            message: "¡Bienvenido de nuevo!",
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: rolAsignado
            }
        });
    } catch (err) {
        console.error("❌ Error en Login:", err.message);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --- SECCIÓN DE CATEGORÍAS ---

app.get('/api/categorias', async (req, res) => {
    try {
        // Traemos solo las activas (status_id = 1)
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});


// POST: Crear sin duplicados
app.post('/api/categorias', async (req, res) => {
    const { name } = req.body;
    try {
        const check = await pool.query('SELECT * FROM categories WHERE LOWER(nombre) = LOWER($1)', [name.trim()]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'Esa categoría ya existe, Brandon.' });

        const result = await pool.query('INSERT INTO categories (nombre, status_id) VALUES ($1, 1) RETURNING *', [name.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT: Editar validando contra OTROS
app.put('/api/categorias/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        // Buscamos si el nombre existe en alguien que NO sea este ID
        const check = await pool.query('SELECT * FROM categories WHERE LOWER(nombre) = LOWER($1) AND id != $2', [name.trim(), id]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'Ya hay otra categoría con ese nombre.' });

        const result = await pool.query('UPDATE categories SET nombre = $1 WHERE id = $2 RETURNING *', [name.trim(), id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Error al actualizar' }); }
});


app.patch('/api/categorias/:id/desactivar', async (req, res) => {
    const { id } = req.params;
    try {
        // No borramos de la DB, solo cambiamos status_id a 2 (Inactivo)
        await pool.query('UPDATE categories SET status_id = 2 WHERE id = $1', [id]);
        res.json({ message: "Categoría desactivada con éxito" });
    } catch (err) {
        res.status(500).json({ error: 'Error al desactivar' });
    }
});

// --- Sección de productos ---

// Actualiza este endpoint en index.js
app.get('/api/productos', async (req, res) => {
    try {
        const query = `
            SELECT p.*,
                    ARRAY_AGG(c.id) FILTER (WHERE c.id IS NOT NULL) as categoria_ids, 
                    ARRAY_AGG(c.nombre) AS categoria_nombres,
                    ARRAY_AGG(c.id) AS categoria_ids
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al traer productos:', err);
        res.status(500).json({ error: 'Error al cargar el inventario' });
    }
});


app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, stock, imagen_url, categorias, user_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Insertar el producto con la URL de la imagen
        const productRes = await client.query(
            'INSERT INTO products (nombre, descripcion, precio, stock, imagen_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [nombre, descripcion, precio, stock, imagen_url]
        );
        const productId = productRes.rows[0].id;

        // 2. Insertar categorías en la tabla intermedia
        if (categorias && categorias.length > 0) {
            for (const catId of categorias) {
                await client.query(
                    'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)',
                    [productId, catId]
                );
            }
        }

        // 3. Registrar en historial de precios (usando user_id)
        await client.query(
            'INSERT INTO price_history (product_id, user_id, precio_anterior, precio_nuevo) VALUES ($1, $2, $3, $4)',
            [productId, user_id || null, 0, precio]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Producto creado con éxito', id: productId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error al registrar el producto' });
    } finally {
        client.release();
    }
});

app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, imagen_url, categorias, usuario_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener el precio que tenía antes de actualizar
        const prodActual = await client.query('SELECT precio FROM products WHERE id = $1', [id]);
        const precioViejo = prodActual.rows[0].precio;

        // 2. Actualizar tabla products
        await client.query(
            'UPDATE products SET nombre = $1, descripcion = $2, precio = $3, stock=$4, imagen_url = $5 WHERE id = $6',
            [nombre, descripcion, precio, stock || 0, imagen_url, id]
        );

        // 3. Si el precio cambió, registramos el historial de quién fue
        if (parseFloat(precioViejo) !== parseFloat(precio)) {
            await client.query(
                'INSERT INTO price_history (product_id, user_id, precio_anterior, precio_nuevo, fecha_cambio) VALUES ($1, $2, $3, $4, NOW())',
                [id, usuario_id, precioViejo, precio]
            );
        }

        // 4. Actualizar categorías: Borramos las que tenía y ponemos las nuevas
        await client.query('DELETE FROM product_categories WHERE product_id = $1', [id]);
        for (let catId of categorias) {
            await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)', [id, catId]);
        }

        await client.query('COMMIT');
        res.json({ message: "Producto y categorías actualizados" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- Sección Productos destacados ---
app.get('/api/productos/destacados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE status_id = 1 ORDER BY id DESC LIMIT 5');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al cargar destacados' });
    }
});


// Endpoint para rescatar las categorías activas
app.get('/api/categorias/activas', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre FROM categories WHERE status_id = 1 ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener categorías activas:', err);
        res.status(500).json({ error: 'Error al cargar categorías' });
    }
});

// ... End po Para consultar clientes (para la Wallet) - Solo trae los clientes, no los admins

app.get('/api/wallet/customers', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, saldo FROM users WHERE role_id = 3');
        console.log("✅ Datos obtenidos:", result.rowCount);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error real:", err.message);
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/admin/customers', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, email, saldo, status_id FROM users WHERE role_id = 3'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error en customers:', err);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Endpoint Universal para cambiar estados (Baja Lógica)
app.patch('/api/:tabla/:id/status', async (req, res) => {
    const { tabla, id } = req.params;
    const { status_id } = req.body;

    // 1. Lista blanca de tablas permitidas (Seguridad)
    const tablasPermitidas = ['categories', 'products', 'users'];

    if (!tablasPermitidas.includes(tabla)) {
        return res.status(400).json({ error: 'Tabla no permitida' });
    }

    try {
        // 2. Ejecutar el update genérico
        const query = `UPDATE ${tabla} SET status_id = $1 WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [status_id, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        res.json({ message: `Estado en ${tabla} actualizado con éxito`, data: result.rows[0] });
    } catch (err) {
        console.error(`❌ Error en PATCH /api/${tabla}:`, err.message);
        res.status(500).json({ error: 'Error al actualizar el estado' });
    }
});

// Endpoint Universal para cambiar estados (Baja Lógica)

app.post('/api/wallet/recharge', async (req, res) => {
    const { emitter_id, target_user_id, monto, descripcion } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener info de emisor y receptor
        const usersInfo = await client.query(
            'SELECT id, role_id, email, saldo FROM users WHERE id IN ($1, $2)', 
            [emitter_id, target_user_id]
        );
        
        const emitter = usersInfo.rows.find(u => u.id === emitter_id);
        const target = usersInfo.rows.find(u => u.id === target_user_id);

        if (!target) throw new Error('Usuario destino no encontrado');

        // 2. VALIDACIÓN DE NEGATIVOS: No dejar la cuenta en menos de 0
        const nuevoSaldo = parseFloat(target.saldo) + parseFloat(monto);
        if (nuevoSaldo < 0) {
            throw new Error(`Operación inválida: El saldo insuficiente ($${target.saldo}). No puede quedar en negativo.`);
        }

        // 3. Regla Admin
        if (emitter.role_id === 1 && emitter_id === target_user_id) {
            throw new Error('Un administrador no puede modificar su propio saldo');
        }

        // 4. Determinar tipo (Recarga o Ajuste/Resta)
        let tipo = monto >= 0 ? 'recarga' : 'ajuste_negativo';
        if (emitter.role_id === 1) tipo = `admin_${tipo}`;

        // 5. Aplicar cambio
        await client.query(
            'UPDATE users SET saldo = saldo + $1 WHERE id = $2',
            [monto, target_user_id]
        );

        // 6. Registro en Wallet
        await client.query(
            'INSERT INTO wallet (user_id, admin_id, monto, tipo, descripcion) VALUES ($1, $2, $3, $4, $5)',
            [target_user_id, emitter.role_id === 1 ? emitter_id : null, monto, tipo, descripcion || 'Movimiento de saldo']
        );

        await client.query('COMMIT');
        res.json({ message: 'Movimiento procesado correctamente', saldo_final: nuevoSaldo });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});


// --- Encendido del log del backend ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});