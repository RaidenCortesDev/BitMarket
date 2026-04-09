import { LitElement, html, css } from 'lit';
import { API_URL } from '../../config.js';

export class BmAdminProductos extends LitElement {
    static properties = {
        productos: { type: Array },
        categoriasDisponibles: { type: Array },
        loading: { type: Boolean },
        isEditing: { type: Boolean },
        productoActual: { type: Object }
    };
    
    static styles = css`
        :host { 
            display: block; 
            color: white; 
        }

        .header-actions { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
        }

        table { 
            width: 100%; 
            border-collapse: collapse; 
            background: #2a2a2a; 
            border-radius: 8px; 
            overflow: hidden; 
        }

        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #444; 
        }

        th { 
            background: #333; 
            color: #4CAF50; 
        }

        .btn { 
            padding: 8px 16px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-weight: bold; 
        }

        .btn-add { 
            background: #4CAF50; 
            color: white; 
        }

        .btn-cancel { 
            background: #666; 
            color: white; 
        }

        .empty-state { 
            text-align: center; 
            padding: 40px; 
            background: #2a2a2a; 
            border-radius: 8px; 
            border: 1px dashed #444; 
        }

        .chips-container { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            margin: 10px 0; 
        }

        .chip { 
            padding: 6px 14px; 
            background: #444; 
            border-radius: 20px; 
            cursor: pointer; 
            border: 1px solid #666; 
        }

        .chip.active {
            background: #4CAF50; 
            border-color: #4CAF50; 
        }

        .form-container { 
            background: #333; 
            padding: 20px; 
            border-radius: 8px; 
        }

        input, textarea { 
            width: 100%; 
            padding: 10px; 
            margin: 10px 0; 
            background: #1a1a1a; 
            color: white; 
            border: 1px solid #444; 
            border-radius: 4px; 
            box-sizing: border-box; 
        }

        .switch { 
            position: relative; 
            display: inline-block; 
            width: 46px; 
            height: 24px; 
        }

        .switch input { 
            opacity: 0; 
            width: 0; 
            height: 0; 
        }

        .slider { 
            position: absolute; 
            cursor: pointer; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background-color: #555; 
            transition: .4s;
            border-radius: 24px; 
        }

        .slider:before { 
            position: absolute; 
            content: ""; 
            height: 18px; 
            width: 18px; 
            left: 3px; 
            bottom: 3px; 
            background-color: white; 
            transition: .4s; 
            border-radius: 50%; 
        }

        input:checked + .slider { 
            background-color: #4CAF50; 
        }

        input:checked + .slider:before { 
            transform: translateX(22px); 
        }

        /* Mantén tus estilos actuales arriba y añade esto al final */

        @media (max-width: 768px) {
    :host {
        display: block;
        width: 100%;
        overflow-x: hidden; /* Evita que rebote toda la página */
    }

    /* Contenedor de la tabla con scroll horizontal */
    table {
        display: block;
        overflow-x: auto;
        white-space: nowrap; /* Evita que el texto se amontone en varias líneas */
        -webkit-overflow-scrolling: touch;
        border-radius: 8px;
    }

    /* Mantenemos el encabezado visible pero ajustado */
    th, td {
        padding: 10px 15px;
        min-width: 120px; /* Asegura que cada columna tenga su espacio */
        font-size: 0.85rem;
    }

    /* Columna de nombre fija o más ancha */
    td:first-child, th:first-child {
        min-width: 150px;
        position: sticky;
        left: 0;
        background: #333; /* Fondo sólido para que no se traslape al scrollear */
        z-index: 1;
    }

    /* Ajuste para que las imágenes no rompan el layout */
    td img {
        width: 40px !important;
        height: 40px !important;
    }

    /* Los switches y botones de acción */
    .switch {
        transform: scale(0.8);
    }

    button {
        padding: 5px;
    }
}

    `;

    constructor() {
        super();
        this.productos = [];
        this.categoriasDisponibles = [];
        this.loading = true;
        this.isEditing = false;
        this._initProducto();
        this._cargarDatos();
    }

    _initProducto() {
        const session = JSON.parse(localStorage.getItem('bm_session'));
        this.productoActual = {
            id: null,
            nombre: '', // <-- Asegurado como 'nombre'
            descripcion: '',
            precio: '',
            imagen_url: '',
            categorias: [],
            usuario_id: session ? session.id : null
        };
    }

    async _cargarDatos() {
        this.loading = true;
        try {
            const [resProd, resCat] = await Promise.all([
                fetch(`${API_URL}/productos`),
                fetch(`${API_URL}/categorias/activas`)
            ]);
            this.productos = await resProd.json();
            this.categoriasDisponibles = await resCat.json(); // Se guarda en la propiedad reactiva
        } catch (e) {
            console.error("Error cargando datos", e);
        } finally {
            this.loading = false;
        }
    }

    _seleccionarCategoria(catId) {
        console.log('Cambiando categoría a:', catId);
        this.productoActual = { ...this.productoActual, id_categoria: catId };
        this.requestUpdate(); // Asegura que Lit vuelva a renderizar con la nueva clase active
    }

    _editarProducto(p) {
        // Solo agregamos la asignación de categorias:
        this.productoActual = {
            ...p,
            // Si el backend nos mandó categoria_ids, los usamos, si no, array vacío
            categorias: Array.isArray(p.categoria_ids) ? p.categoria_ids : []
        };
        console.log("2. IDs procesados en productoActual.categorias:", this.productoActual.categorias)
        this.isEditing = true;
        this.requestUpdate();
    }
    render() {
        if (this.isEditing) return this._renderForm();

        return html`
            <div class="header-actions">
                <h3>Gestión de Inventario</h3>
                ${this.productos.length > 0
                ? html`<button class="btn btn-add" @click="${() => this._openForm()}">+ Nuevo Producto</button>`
                : ''}
            </div>

            ${this.loading ? html`<p>Cargando...</p>` : html`
                ${this.productos.length === 0
                    ? html`
                        <div class="empty-state">
                            <p>No hay productos registrados en BitMarket aún.</p>
                            <button class="btn btn-add" @click="${() => this._openForm()}">Crear el primer producto</button>
                        </div>
                    `
                    : html`
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Imagen</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Categoría</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.productos.map(p => html`
                                    <tr>
                                        <td>${p.nombre}</td>
                                        <td>
                                            ${p.imagen_url
                            ? html`<img src="${p.imagen_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
                            : html`<span>No img</span>`}
                                        </td>
                                        <td>$${p.precio}</td>
                                        <td>${p.stock}</td>
                                        <td>${p.categoria_nombres ? p.categoria_nombres.join(', ') : 'Sin categoría'}</td>
                                        <td>
                                            <label class="switch">
                                                <input type="checkbox" ?checked="${p.status_id === 1}" 
                                                    @change="${() => this._toggleStatus(p)}">
                                                <span class="slider"></span>
                                            </label>
                                        </td>
                                        <td>
                                            <button @click="${() => this._openForm(p)}" style="background:none; border:none; cursor:pointer;">✏️</button>
                                        </td>
                                    </tr>
                                `)}
                            </tbody>
                        </table>
                    `}
            `}
        `;
    }

    _renderForm() {
        return html`
            <div class="form-container">
                <h3>${this.productoActual.id ? 'Editar' : 'Nuevo'} Producto</h3>
                <form @submit="${this._saveProduct}">
                    <label>Nombre del Producto:</label>
                    <input type="text" .value="${this.productoActual.nombre || ''}" 
                        @input="${e => this.productoActual = { ...this.productoActual, nombre: e.target.value }}" required>
                    
                    <label>Descripción:</label>
                    <textarea @input="${e => this.productoActual = { ...this.productoActual, descripcion: e.target.value }}">${this.productoActual.descripcion}</textarea>

                    <label>Precio:</label>
                    <input type="number" step="0.01" .value="${this.productoActual.precio || ''}" 
                        @input="${e => this.productoActual = { ...this.productoActual, precio: e.target.value }}" required>

                    <div class="field">
                        <label>Stock disponible</label>
                        <input 
                            type="number" 
                            placeholder="Cantidad en almacén" 
                            .value="${this.productoActual.stock || 0}" 
                            @input="${e => this.productoActual.stock = parseInt(e.target.value) || 0}"
                        >
                    </div>

                    <label>Categorías:</label>
                    <div class="chips-container">
                        ${this.categoriasDisponibles.map(c => {
                        // 💡 CLAVE: Miramos siempre a 'categorias', no a 'categoria_ids'
                        const idsActivos = this.productoActual.categorias || [];
                        
                        // Convertimos ambos a String para evitar problemas de tipo (1 vs "1")
                        const isActive = idsActivos.some(id => String(id) === String(c.id));

                        return html`
                            <div 
                                class="chip ${isActive ? 'active' : ''}"
                                @click="${() => this._toggleCategory(c.id)}"
                            >
                                ${c.nombre}
                            </div>
                        `;
                    })}
                    </div>
                    
                    <div class="field">
                        <label>Imagen del Producto</label>
                        <input type="file" accept="image/*" @change="${this._handleImageUpload}">
                        ${this.loadingImage ? html`<p>Subiendo...</p>` : ''}
                    </div>

                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-add">Guardar Producto</button>
                        <button type="button" class="btn btn-cancel" @click="${() => this.isEditing = false}">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    }

    _openForm(prod = null) {
    if (prod) {
        this.productoActual = { 
            ...prod, 
            // Si existe categoria_ids del backend, lo asignamos a categorias.
            categorias: prod.categoria_ids || [] 
        };
    } else {
        this._initProducto();
    }
    this.isEditing = true;
}

_toggleCategory(id) {
    const actuales = this.productoActual.categorias || [];
    const cats = [...actuales];
    const idx = cats.indexOf(id);
    if (idx > -1) {
        cats.splice(idx, 1);
    } else {
        cats.push(id);
    }
    this.productoActual = { ...this.productoActual, categorias: cats };
    this.requestUpdate();
}


    async _saveProduct(e) {
        e.preventDefault();

        // 1. PRIMERO declaramos la URL y el método (Esto soluciona el error)
        const method = this.productoActual.id ? 'PUT' : 'POST';
        const url = this.productoActual.id ? `${API_URL}/productos/${this.productoActual.id}` : `${API_URL}/productos`;

        // 2. Obtenemos el usuario de la sesión correcta (tu localStorage usa 'bm_session')
        const session = JSON.parse(localStorage.getItem('bm_session'));

        // 2. Extraemos el ID explícitamente
        const currentUserId = session?.id;
        // Si no hay id en la sesión, avísale a la consola para que sepas qué pasa
        if (!currentUserId) {
            alert("⚠️ Sesión inválida. Por favor, sal y vuelve a entrar.");
            return;
        }

        // 3. Preparamos los datos incluyendo la imagen_url y el ID del usuario
        const datosAEnviar = {
            ...this.productoActual,
            user_id: currentUserId,      // Para el POST
            usuario_id: currentUserId    // Para el PUT
        };

        console.log("Datos exactos que se envían al backend:", datosAEnviar);

        // 4. Hacemos el envío de datos UNA sola vez
        try {
            const resp = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosAEnviar)
            });

            if (resp.ok) {
                this.isEditing = false;
                this._cargarDatos();
            } else {
                const errorData = await resp.json();
                console.error("El servidor rechazó los datos:", errorData);
            }
        } catch (error) {
            console.error("Error de red al intentar guardar:", error);
        }
    }

    async _toggleStatus(p) {
        const nuevoEstado = p.status_id === 1 ? 2 : 1;

        await fetch(`${API_URL}/products/${p.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_id: nuevoEstado })
        });
        this._cargarDatos();
    }

    async _handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.loadingImage = true;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'bitmarket_preset'); // Asegúrate que sea EXACTAMENTE este nombre en Cloudinary

        try {

            const cloudName = 'ddvit9qlh';
            const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await resp.json();

            if (data.secure_url) {
                this.productoActual = { ...this.productoActual, imagen_url: data.secure_url };
                console.log("Imagen subida con éxito:", data.secure_url);
            } else {
                console.error("Error en la respuesta de Cloudinary:", data);
            }
        } catch (err) {
            console.error("Error subiendo imagen:", err);
        } finally {
            this.loadingImage = false;
        }
    }
}
customElements.define('bm-admin-productos', BmAdminProductos);