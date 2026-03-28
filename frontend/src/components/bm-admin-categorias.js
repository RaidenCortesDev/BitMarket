import { LitElement, html, css } from 'lit';
import { API_URL } from '../../config.js';

export class BmAdminCategorias extends LitElement {
    static properties = {
        categorias: { type: Array },
        loading: { type: Boolean },
        isEditing: { type: Boolean },
        categoriaActual: { type: Object },
        errorMsg: { type: String }
    };

    static styles = css`
        :host { display: block; color: white; }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; background: #2a2a2a; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #444; }
        th { background: #333; color: #4CAF50; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-add { background: #4CAF50; color: white; }
        .btn-edit { background: #2196F3; color: white; margin-right: 5px; }
        .btn-status { background: #ff9800; color: white; }
        .btn-cancel { background: #666; color: white; }
        .status-pill { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; }
        .active { background: #2e7d32; }
        .inactive { background: #f85f5f; }
        
        .form-container { background: #333; padding: 20px; border-radius: 8px; }
        input { width: 100%; padding: 10px; margin: 10px 0; background: #1a1a1a; color: white; border: 1px solid #444; border-radius: 4px; box-sizing: border-box;}
        
        .empty-state { text-align: center; padding: 40px; background: #2a2a2a; border-radius: 8px; border: 1px dashed #444; }
        .action-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; transition: transform 0.2s; }
        .action-btn:hover { transform: scale(1.2); }

        /* El contenedor del switch */
        .switch {
        position: relative;
        display: inline-block;
        width: 46px;
        height: 24px;
        }

        /* Ocultar el checkbox original */
        .switch input {
        opacity: 0;
        width: 0;
        height: 0;
        }

        /* El slider */
        .slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
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
    `;

    constructor() {
        super();
        this.categorias = [];
        this.loading = true;
        this.isEditing = false;
        this.categoriaActual = { id: null, name: '', status_id: 1 };
        this._cargarCategorias();
        this.errorMsg = '';
    }

    async _cargarCategorias() {
        try {
            // Usamos template strings con la variable API_URL
            const resp = await fetch(`${API_URL}/categorias`);
            const data = await resp.json();
            this.categorias = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Error cargando categorías:", error);
        } finally {
            this.loading = false;
        }
    }

    _openForm(cat = { id: null, name: '', status_id: 1 }) {
        this.categoriaActual = { ...cat };
        this.isEditing = true;
    }

    _closeForm() {
        this.isEditing = false;
        this.errorMsg = ''; // Limpiar mensaje al cerrar
        this.categoriaActual = { id: null, name: '', status_id: 1 };
    }

    async _saveCategory(e) {
        e.preventDefault();
        this.errorMsg = ''; // Limpiamos errores previos

        // 1. Validación local (No mandamos nada al servidor si está vacío)
        if (!this.categoriaActual.name || this.categoriaActual.name.trim() === "") {
            this.errorMsg = "El nombre no puede estar vacío";
            return;
        }

        try {
            const method = this.categoriaActual.id ? 'PUT' : 'POST';
            const url = this.categoriaActual.id
                ? `${API_URL}/categorias/${this.categoriaActual.id}`
                : `${API_URL}/categorias`;

            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: this.categoriaActual.name })
            });

            const data = await resp.json();

            if (!resp.ok) {
                // ERROR DE NEGOCIO (Ej: "Ya existe"): Se muestra en el formulario
                this.errorMsg = data.error || 'Error al guardar';
                return;
            }

            // Si todo sale bien:
            this._cargarCategorias();
            this._closeForm();

        } catch (error) {
            // ERROR DE SERVIDOR/CONEXIÓN: Estos sí mándalos a la consola
            console.error("❌ Falla técnica en BitMarket:", error);
        }
    }

    async _toggleStatus(cat) {
        // Calculamos el nuevo estado (Baja lógica)
        const nuevoEstado = cat.status_id === 1 ? 2 : 1;

        try {
            const resp = await fetch(`${API_URL}/categories/${cat.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_id: nuevoEstado })
            });

            if (resp.ok) {
                // Actualizamos la lista local para ver el cambio
                this._cargarCategorias();
            } else {
                const error = await resp.json();
                alert("Error: " + error.error);
            }
        } catch (error) {
            console.error("Error en la conexión:", error);
        }
    }

    render() {
        // SI ESTAMOS EDITANDO O CREANDO, MOSTRAR FORMULARIO
        if (this.isEditing) return this._renderForm();

        // SI NO, MOSTRAR LISTA O MENSAJE DE TABLA VACÍA
        return html`
            <div class="header-actions">
                <h3>Gestión de Categorías</h3>
                <button class="btn btn-add" @click="${() => this._openForm()}">+ Nueva Categoría</button>
            </div>

            ${this.loading ? html`<p>Cargando...</p>` : html`
                ${this.categorias.length === 0
                    ? html`
                        <div class="empty-state">
                            <p>Actualmente no cuentas con categorías activas.</p>
                            <button class="btn btn-add" @click="${() => this._openForm()}">Crear la primera</button>
                        </div>`
                    : html`
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.categorias.map(cat => html`
                                    <tr>
                                        <td>${cat.nombre}</td>
                                        <td>
                                            <label class="switch">
                                                <input type="checkbox" 
                                                    ?checked="${cat.status_id === 1}" 
                                                    @change="${() => this._toggleStatus(cat)}">
                                                <span class="slider"></span>
                                            </label>
                                        </td>
                                        <td>
                                            <button class="action-btn" title="Editar" @click="${() => this._openForm(cat)}">
                                                <span style="font-size: 1.2rem;">✏️</span>
                                            </button>
                                        </td>
                                    </tr>
                                `)}
                            </tbody>
                        </table>
                    `
                }
            `}
        `;
    }

    _renderForm() {
        return html`
            <div class="form-container">
                <h3>${this.categoriaActual.id ? 'Editar' : 'Nueva'} Categoría</h3>
                <form @submit="${this._saveCategory}">
                    <label>Nombre de la categoría:</label>
                    ${this.errorMsg ? html`<p style="color:     #ff8383; background: #422; padding: 8px; border-radius: 4px; font-size: 0.9rem;">⚠️ ${this.errorMsg}</p>` : ''}
                    <input 
                        type="text" 
                        .value="${this.categoriaActual.name || ''}" 
                        @input="${e => {
                // Actualizamos el objeto para que el fetch lo encuentre en _saveCategory
                this.categoriaActual = { ...this.categoriaActual, name: e.target.value };
            }}"
                        placeholder="Ej: Teclados Mecánicos" 
                        required
                    >
                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-add">Guardar Cambios</button>
                        <button type="button" class="btn btn-cancel" @click="${this._closeForm}">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    }
}
customElements.define('bm-admin-categorias', BmAdminCategorias);