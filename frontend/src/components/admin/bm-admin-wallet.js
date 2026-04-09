import { LitElement, html, css } from 'lit';
import { API_URL } from '../../../config.js';

export class BmAdminWallet extends LitElement {
    static properties = {
        clientes: { type: Array },
        loading: { type: Boolean },
        clienteSeleccionado: { type: Object },
        feedback: { type: Object } // { msg: string, type: 'error'|'success' }
    };

    static styles = css`
        :host { 
            display: grid; 
            grid-template-columns: 1fr 350px; 
            gap: 20px; 
            padding: 20px; 
            color: white; 
            font-family: sans-serif;
        }

        /* Tabla Original */
        .table-container { 
            background: #2a2a2a; 
            border-radius: 8px; 
            padding: 20px; 
            border: 1px solid #444; 
        }
        table { width: 100%; border-collapse: collapse; background: #2a2a2a; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #444; }
        th { background: #333; color: #4CAF50; text-transform: uppercase; font-size: 0.85rem; }

        .btn-manage { 
            padding: 8px 16px; border: none; border-radius: 4px; 
            cursor: pointer; font-weight: bold; background: #2196F3; color: white;
        }

        /* Formulario Lateral */
        .form-sidebar { 
            background: #1e1e1e; border: 1px solid #4CAF50; border-radius: 8px; 
            padding: 25px; position: sticky; top: 20px; height: fit-content;
        }
        .form-sidebar h3 { margin-top: 0; color: #4CAF50; border-bottom: 1px solid #333; padding-bottom: 10px; }
        
        .info-saldo { 
            background: #333; padding: 15px; border-radius: 4px; 
            margin-bottom: 20px; text-align: center; border-left: 4px solid #2196F3;
        }

        .input-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 8px; }
        input { 
            width: 100%; padding: 12px; background: #121212; border: 1px solid #555; 
            color: white; border-radius: 4px; box-sizing: border-box; 
        }

        .btn-save { 
            width: 100%; padding: 12px; border: none; border-radius: 4px; 
            cursor: pointer; font-weight: bold; background: #4CAF50; color: white;
        }

        /* MENSAJES DE FEEDBACK (Discretos) */
        .alert {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 0.9rem;
            text-align: center;
            animation: fadeIn 0.3s ease;
        }
        .alert-error { background: #442727; color: #ff5252; border: 1px solid #ff5252; }
        .alert-success { background: #223a22; color: #4CAF50; border: 1px solid #4CAF50; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        
        /* --- RESPONSIVE DESIGN --- */
        @media (max-width: 768px) {
            :host {
                grid-template-columns: 1fr; /* Una sola columna en tablets y móvil */
                padding: 10px;
                gap: 30px;
            }

            .table-container {
                padding: 10px;
                overflow: hidden;
            }

            /* Hacemos que la tabla sea scrolleable horizontalmente */
            table {
                display: block;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                width: 100%;
            }

            /* Evita que los textos se amontonen */
            th, td {
                white-space: nowrap;
                padding: 10px 15px;
                font-size: 0.8rem;
            }

            /* Ajuste del Formulario Lateral en móvil */
            .form-sidebar {
                position: relative; /* Quita el sticky para que fluya en el scroll */
                top: 0;
                width: 100%;
                box-sizing: border-box;
                padding: 20px;
            }

            .info-saldo {
                margin-bottom: 15px;
                font-size: 1.1rem;
            }

            input {
                font-size: 16px; /* Evita el zoom automático en iOS al hacer focus */
            }
        }

        /* Ajustes extra para celulares muy pequeños */
        @media (max-width: 480px) {
            th { font-size: 0.7rem; padding: 8px; }
            td { padding: 8px; }
            .btn-manage { padding: 6px 10px; font-size: 0.75rem; }
        }
    `;

    constructor() {
        super();
        this.clientes = [];
        this.loading = false;
        this.clienteSeleccionado = null;
        this.feedback = { msg: '', type: '' };
    }

    connectedCallback() {
        super.connectedCallback();
        this._cargarClientes();
    }

    async _cargarClientes() {
        try {
            const resp = await fetch(`${API_URL}/admin/customers`);
            this.clientes = await resp.json();
        } catch (err) {
            this._setFeedback("Error al conectar con el servidor", "error");
        }
    }

    _setFeedback(msg, type) {
        this.feedback = { msg, type };
        // Auto-limpiar después de 4 segundos
        setTimeout(() => {
            this.feedback = { msg: '', type: '' };
        }, 4000);
    }

    async _procesar() {
        const montoInput = this.shadowRoot.getElementById('montoInput');
        const descInput = this.shadowRoot.getElementById('descInput');

        const monto = parseFloat(montoInput.value);
        const desc = descInput.value.trim();
        const session = JSON.parse(localStorage.getItem('bm_session'));

        // 1. Validaciones básicas de campos
        if (!monto || monto === 0) {
            return this._setFeedback("Por favor, ingresa un monto válido para el ajuste.", "error");
        }
        if (!desc || desc.length < 5) {
            return this._setFeedback("La descripción es obligatoria para el historial.", "error");
        }

        // 2. VALIDACIÓN LÓGICA: Evitar saldos negativos
        const saldoActual = parseFloat(this.clienteSeleccionado.saldo);
        const saldoResultante = saldoActual + monto;

        if (saldoResultante < 0) {
            return this._setFeedback(
                `Operación no permitida: El ajuste de $${monto} dejaría la cuenta con un saldo negativo ($${saldoResultante.toFixed(2)}). El saldo mínimo permitido es $0.00.`,
                "error"
            );
        }

        try {
            const res = await fetch(`${API_URL}/wallet/recharge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emitter_id: session.id,
                    target_user_id: this.clienteSeleccionado.id,
                    monto: monto,
                    descripcion: desc
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            this._setFeedback("Ajuste aplicado con éxito. El saldo ha sido actualizado.", "success");

            // Limpiar formulario y refrescar datos
            montoInput.value = "";
            descInput.value = "";
            this._cargarClientes();

            // Cerramos el panel después de un breve momento para que vean el éxito
            setTimeout(() => { this.clienteSeleccionado = null; }, 2500);

        } catch (err) {
            this._setFeedback(err.message, "error");
        }
    }

    render() {
        return html`
            <div class="table-container">
                <h2>Gestión de Clientes</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Saldo</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.clientes?.map(c => html`
                            <tr>
                                <td>${c.nombre}</td>
                                <td>${c.email}</td>
                                <td style="color: ${c.saldo < 0 ? '#ff5252' : '#4CAF50'}">
                                    $${parseFloat(c.saldo).toFixed(2)}
                                </td>
                                <td>
                                    <button class="btn-manage" @click="${() => this.clienteSeleccionado = c}">
                                        Gestionar
                                    </button>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>

            <div class="form-sidebar">
                <h3>Ajustar Saldo</h3>
                ${this.clienteSeleccionado ? html`
                    <div class="info-saldo">
                        <span>${this.clienteSeleccionado.nombre}</span><br>
                        <strong>Saldo Actual: $${this.clienteSeleccionado.saldo}</strong>
                    </div>

                    ${this.feedback.msg ? html`
                        <div class="alert alert-${this.feedback.type}">
                            ${this.feedback.msg}
                        </div>
                    ` : ''}

                    <div class="input-group">
                        <label>Monto (usa "-" para restar)</label>
                        <input type="number" id="montoInput" placeholder="Ej: 100 o -50">
                    </div>
                    <div class="input-group">
                        <label>Descripción del ajuste</label>
                        <input type="text" id="descInput" placeholder="Motivo del cambio">
                    </div>
                    <button class="btn-save" @click="${this._procesar}">Confirmar Movimiento</button>
                ` : html`
                    <p style="text-align: center; color: #666; margin-top: 20px;">
                        Selecciona un cliente para operar.
                    </p>
                `}
            </div>
        `;
    }
}
customElements.define('bm-admin-wallet', BmAdminWallet);