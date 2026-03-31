import { LitElement, html, css } from 'lit';
import { API_URL } from '../../config.js';

export class BmClienteCarrito extends LitElement {
    static properties = {
        userId: { type: Number },
        saldo: { type: Number },
        items: { type: Array },
        loading: { type: Boolean },
        // Nueva propiedad para controlar la notificación visual
        notification: { type: Object } 
    };

    constructor() {
        super();
        this.items = [];
        this.loading = true;
        this.notification = { show: false, message: '', type: '' };
    }

    async firstUpdated() {
        await this._cargarCarrito();
    }

    // Función auxiliar para mostrar la notificación estética
    _showNotification(message, type = 'success') {
        this.notification = { show: true, message, type };
        
        // Se oculta automáticamente tras 4 segundos
        setTimeout(() => {
            this.notification = { ...this.notification, show: false };
        }, 4000);
    }

    async _cargarCarrito() {
        if (!this.userId) return;
        try {
            const resp = await fetch(`${API_URL}/compra/${this.userId}`);
            const data = await resp.json();
            this.items = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error("Error al cargar carrito:", err);
        } finally {
            this.loading = false;
        }
    }

    get totalCompra() {
        return this.items.reduce((acc, item) => acc + (Number(item.precio) * item.cantidad), 0);
    }

    async _updateQty(productId, delta) {
        const item = this.items.find(i => i.producto_id === productId);
        if (!item) return;

        const nuevaCantidad = item.cantidad + delta;

        if (nuevaCantidad <= 0) {
            await this._removeItem(productId);
            return;
        }

        item.cantidad = nuevaCantidad;
        this.items = [...this.items];

        try {
            await fetch(`${API_URL}/carrito/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuer_id: this.userId,
                    product_id: productId,
                    cantidad: nuevaCantidad,
                    mode: 'set'
                })
            });
        } catch (err) {
            console.error("Error al sincronizar cantidad:", err);
            this._cargarCarrito();
        }
    }

    async _removeItem(productId) {
        try {
            const resp = await fetch(`${API_URL}/carrito/remove/${this.userId}/${productId}`, {
                method: 'DELETE'
            });
            if (resp.ok) {
                this.items = this.items.filter(i => i.producto_id !== productId);
                this._showNotification("Producto eliminado", "info");
            }
        } catch (err) {
            console.error("Error al eliminar item:", err);
        }
    }

    async _ejecutarCompra() {
        const total = this.totalCompra;
        if (!this.userId || total <= 0) return;

        try {
            const resp = await fetch(`${API_URL}/carrito/comprar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    total: total
                })
            });

            const result = await resp.json();

            if (resp.ok) {
                // Notificación estética en lugar de alert
                this._showNotification("✅ ¡Compra realizada con éxito!");

                this.dispatchEvent(new CustomEvent('update-balance-global', {
                    detail: { saldo: result.nuevoSaldo },
                    bubbles: true,
                    composed: true
                }));

                this.items = [];
                
                // Esperamos un poco para que vean la notificación antes de cambiar de sección
                setTimeout(() => {
                    this.dispatchEvent(new CustomEvent('admin-nav', {
                        detail: { seccion: 'tienda' },
                        bubbles: true,
                        composed: true
                    }));
                }, 1500);

            } else {
                this._showNotification("🚫 " + (result.error || "Error al procesar"), "error");
            }
        } catch (err) {
            this._showNotification("🔥 Error de conexión", "error");
        }
    }

    static styles = css`
        :host { display: block; padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; position: relative; }
        
        /* --- ESTILOS DE LA NOTIFICACIÓN (TOAST) --- */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: bold;
            z-index: 9999;
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .toast.show { transform: translateX(0); }
        .toast.success { background: #4CAF50; border-left: 5px solid #1b5e20; }
        .toast.error { background: #f44336; border-left: 5px solid #b71c1c; }
        .toast.info { background: #2196F3; border-left: 5px solid #0d47a1; }

        .carrito-lista { display: flex; flex-direction: column; gap: 12px; }
        .item-carrito { 
            display: flex; 
            align-items: center; 
            background: #1e1e1e; 
            padding: 12px; 
            border-radius: 12px;
            border: 1px solid #333;
            gap: 15px;
        }
        .prod-img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #000; }
        .info-prod { flex-grow: 1; }
        .info-prod h4 { margin: 0; color: #80deea; font-size: 1rem; }
        .info-prod p { margin: 2px 0; color: #4CAF50; font-weight: bold; }

        .stepper { display: flex; align-items: center; background: #252525; border-radius: 20px; border: 1px solid #444; }
        .btn-step { background: none; border: none; color: #4CAF50; padding: 5px 12px; cursor: pointer; font-weight: bold; font-size: 1.1rem; }
        .qty { width: 30px; text-align: center; font-size: 0.9rem; font-weight: bold; }

        .totales { 
            margin-top: 25px; 
            padding: 20px; 
            background: #252525;
            border-radius: 15px;
            text-align: right; 
            border: 1px solid #4CAF50;
        }
        .total-number { font-size: 2.2rem; color: #4CAF50; font-weight: bold; margin: 5px 0; }
        .btn-comprar {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
            transition: 0.2s;
        }
        .btn-comprar:hover { background: #45a049; transform: scale(1.01); }
    `;

    render() {
        if (this.loading) return html`<p>Sincronizando BitMarket...</p>`;

        return html`
            <div class="toast ${this.notification.type} ${this.notification.show ? 'show' : ''}">
                ${this.notification.message}
            </div>

            ${this.items.length === 0 ? html`
                <div style="text-align:center; padding: 40px;">
                    <h3 style="color: #666;">Tu carrito está vacío</h3>
                    <button class="btn-comprar" style="width:auto;" @click="${() => {
                        this.dispatchEvent(new CustomEvent('admin-nav', { 
                            detail: { seccion: 'tienda' }, 
                            bubbles: true, 
                            composed: true 
                        }));
                    }}">
                        Ir a comprar algo
                    </button>
                </div>
            ` : html`
                <h2>🛒 Mi Carrito Detallado</h2>
                <div class="carrito-lista">
                    ${this.items.map(item => html`
                        <div class="item-carrito">
                            <img class="prod-img" src="${item.imagen_url || 'https://via.placeholder.com/60'}" alt="${item.nombre}">
                            <div class="info-prod">
                                <h4>${item.nombre}</h4>
                                <p>$${item.precio}</p>
                            </div>
                            
                            <div class="stepper">
                                <button class="btn-step" @click="${() => this._updateQty(item.producto_id, -1)}">−</button>
                                <span class="qty">${item.cantidad}</span>
                                <button class="btn-step" @click="${() => this._updateQty(item.producto_id, 1)}">+</button>
                            </div>

                            <div style="min-width: 80px; text-align: right;">
                                <div style="font-size: 0.8rem; color: #888;">Subtotal</div>
                                <strong style="color: #4CAF50;">$${(Number(item.precio) * item.cantidad).toFixed(2)}</strong>
                            </div>
                        </div>
                    `)}
                </div>

                <div class="totales">
                    <div style="color: #80deea; margin-bottom: 10px;">
                        Saldo disponible: <strong>$${Number(this.saldo).toFixed(2)}</strong>
                    </div>
                    <div style="font-size: 0.9rem; color: #aaa;">TOTAL A PAGAR</div>
                    <div class="total-number">$${this.totalCompra.toFixed(2)}</div>
                    
                    <button class="btn-comprar" @click="${this._ejecutarCompra}">
                        CONFIRMAR PEDIDO
                    </button>
                </div>
            `}
        `;
    }
}
customElements.define('bm-cliente-carrito', BmClienteCarrito);