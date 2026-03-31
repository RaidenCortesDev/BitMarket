import { LitElement, html, css } from 'lit';
import { API_URL } from '../../config.js';

export class BmClienteCarrito extends LitElement {
    static properties = {
        userId: { type: Number },
        saldo: { type: Number },
        items: { type: Array },
        loading: { type: Boolean }
    };

    constructor() {
        super();
        this.items = [];
        this.loading = true;
    }

    async firstUpdated() {
        await this._cargarCarrito();
    }

    async _cargarCarrito() {
        if (!this.userId) return;
        try {
            // Asegúrate que el endpoint sea /carrito/ (como en la tienda) o /compra/ según tu API corregida
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

    // --- SINCRONIZACIÓN AUTOMÁTICA ---
    async _updateQty(productId, delta) {
        const item = this.items.find(i => i.producto_id === productId);
        if (!item) return;

        const nuevaCantidad = item.cantidad + delta;

        // Si la cantidad llega a 0, eliminamos automáticamente
        if (nuevaCantidad <= 0) {
            await this._removeItem(productId);
            return;
        }

        // Actualización optimista en la UI para que se sienta rápido
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
                    mode: 'set' // Indicamos a la API que sobreescriba la cantidad
                })
            });
        } catch (err) {
            console.error("Error al sincronizar cantidad:", err);
            this._cargarCarrito(); // Revertir si falla
        }
    }

    async _removeItem(productId) {
        try {
            const resp = await fetch(`${API_URL}/carrito/remove/${this.userId}/${productId}`, {
                method: 'DELETE'
            });
            if (resp.ok) {
                this.items = this.items.filter(i => i.producto_id !== productId);
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
                alert("✅ ¡Compra realizada con éxito! Tu saldo ha sido actualizado.");

                // Actualizar el saldo en el estado global de la app
                this.dispatchEvent(new CustomEvent('update-balance-global', {
                    detail: { saldo: result.nuevoSaldo },
                    bubbles: true,
                    composed: true
                }));

                // Limpiar los items localmente y mandar al usuario a la tienda
                this.items = [];
                this.dispatchEvent(new CustomEvent('admin-nav', {
                    detail: { seccion: 'tienda' },
                    bubbles: true,
                    composed: true
                }));
            } else {
                alert("🚫 Error: " + result.error);
            }
        } catch (err) {
            alert("🔥 Error de conexión al procesar la compra.");
        }
    }

    static styles = css`
        :host { display: block; padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; }
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

        /* Stepper pequeño para el carrito */
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
        }
        .btn-comprar:hover { background: #45a049; }
    `;

    render() {
        if (this.loading) return html`<p>Sincronizando BitMarket...</p>`;
        if (this.items.length === 0) return html`
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
        `;

        return html`
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
        `;
    }
}
customElements.define('bm-cliente-carrito', BmClienteCarrito);