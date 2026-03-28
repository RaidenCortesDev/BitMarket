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

    // ... (Estilos CSS se mantienen igual) ...
    static styles = css`
        :host { display: block; color: white; }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; background: #2a2a2a; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #444; }
        th { background: #333; color: #4CAF50; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-add { background: #4CAF50; color: white; }
        .btn-cancel { background: #666; color: white; }
        .empty-state { text-align: center; padding: 40px; background: #2a2a2a; border-radius: 8px; border: 1px dashed #444; }
        .chips-container { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
        .chip { padding: 6px 14px; background: #444; border-radius: 20px; cursor: pointer; border: 1px solid #666; }
        .chip.active { background: #4CAF50; border-color: #4CAF50; }
        .form-container { background: #333; padding: 20px; border-radius: 8px; }
        input, textarea { width: 100%; padding: 10px; margin: 10px 0; background: #1a1a1a; color: white; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; }
        .switch { position: relative; display: inline-block; width: 46px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #4CAF50; }
        input:checked + .slider:before { transform: translateX(22px); }
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
            const [resP, resC] = await Promise.all([
                fetch(`${API_URL}/productos`),
                fetch(`${API_URL}/categorias`)
            ]);
            this.productos = await resP.json();
            this.categoriasDisponibles = await resC.json();
        } catch (e) {
            console.error("Error:", e);
        } finally {
            this.loading = false;
        }
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
                                    <th>Precio</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.productos.map(p => html`
                                    <tr>
                                        <td>${p.nombre}</td> <td>$${p.precio}</td>
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

                    <label>Categorías:</label>
                    <div class="chips-container">
                        ${this.categoriasDisponibles.map(c => html`
                            <div class="chip ${this.productoActual.categorias?.includes(c.id) ? 'active' : ''}"
                                @click="${() => this._toggleCategory(c.id)}">
                                ${c.nombre}
                            </div>
                        `)}
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
            this.productoActual = { ...prod, categorias: prod.categorias || [] };
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
        const method = this.productoActual.id ? 'PUT' : 'POST';
        const url = this.productoActual.id ? `${API_URL}/productos/${this.productoActual.id}` : `${API_URL}/productos`;

        try {
            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.productoActual)
            });

            if (resp.ok) {
                this.isEditing = false;
                this._cargarDatos();
            }
        } catch (error) {
            console.error("Error al guardar:", error);
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
}
customElements.define('bm-admin-productos', BmAdminProductos);