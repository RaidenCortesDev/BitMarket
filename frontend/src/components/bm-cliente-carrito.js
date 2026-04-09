import { LitElement, html, css } from 'lit';
import { API_URL } from '../../config.js';

export class BmClienteCarrito extends LitElement {
    static properties = {
        userId: { type: Number },
        saldo: { type: Number },
        items: { type: Array },
        loading: { type: Boolean },
        // Nueva propiedad para controlar la notificación visual
        notifications: { type: Array }
    };

    constructor() {
        super();
        this.items = [];
        this.loading = true;
        this.notifications = [];
    }

    async firstUpdated() {
        await this._cargarCarrito();
    }

    // Función auxiliar para mostrar la notificación estética
    _showNotification(message, type = 'success') {
        const id = Date.now(); // ID único para cada globo
        const nuevaNotificacion = { id, message, type, show: true };

        this.notifications = [...this.notifications, nuevaNotificacion];

        // Quitarla individualmente después de 4 segundos
        setTimeout(() => {
            this.notifications = this.notifications.filter(n => n.id !== id);
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
                // Si el error contiene el separador '|', significa que hay varios productos mal
                if (result.error && result.error.includes('|')) {
                    const listaErrores = result.error.split('|');

                    listaErrores.forEach((msg, index) => {
                        // Ponemos un intervalo de 1.2 segundos entre cada notificación
                        setTimeout(() => {
                            this._showNotification("🚫 " + msg, "error");
                        }, index * 1200);
                    });
                } else {
                    // Si es un error normal (solo uno), se muestra directo
                    this._showNotification("🚫 " + (result.error || "Error al procesar"), "error");
                }
            }
        } catch (err) {
            this._showNotification("🔥 Error de conexión", "error");
        }
    }

    static styles = css`
        :host { 
            display: block; 
            padding: 20px; 
            color: white; 
            font-family: 'Segoe UI', sans-serif; 
            position: relative; 
        }
        
        /* --- ESTILOS DE LA NOTIFICACIÓN (TOAST) --- */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            left: 20px; 
            max-width: 400px; 
            margin-left: auto; 
            padding: 15px 25px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: bold;
            z-index: 9999;
            transform: translateY(-150%); 
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }

        .toast.show { 
            transform: translateY(0); 
        }

        .toast.success { 
            background: #4CAF50;
            border-left: 5px solid #1b5e20; 
        }

        .toast.error { 
            background: #f44336; 
            border-left: 5px solid #b71c1c; 
        }

        .toast.info {
            background: #2196F3; 
            border-left: 5px solid #0d47a1; 
        }

        .carrito-lista { 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
        }

        .item-carrito { 
            display: flex; 
            flex-wrap: wrap;
            align-items: center; 
            background: #1e1e1e; 
            padding: 12px; 
            border-radius: 12px;
            border: 1px solid #333;
            gap: 15px;
        }

        .prod-img {
            width: 65px; 
            height: 65px; 
            object-fit: cover; 
            border-radius: 8px; 
            background: #000; 
        }

        .info-prod { 
            flex-grow: 1;
            min-width: 120px;
            display: flex;
            flex-direction: column;
        }

        .info-prod h4 { 
            margin: 0; 
            color: #80deea; 
            font-size: 0.95rem; 
            line-height: 1.2; 
        }

        .info-prod p {
            margin: 2px 0; 
            color: #4CAF50; 
            font-weight: bold; 
        }

        .stepper { 
            display: flex; 
            align-items: center; 
            background: #252525; 
            border-radius: 20px; 
            border: 1px solid #444;
            height: fit-content; 
        }

        .btn-step { 
            background: none; 
            border: none; 
            color: #4CAF50; 
            padding: 5px 12px; 
            cursor: pointer; 
            font-weight: bold; 
            font-size: 1.1rem; 
        }

        .qty { 
            width: 25px; 
            text-align: center; 
            font-size: 0.9rem; 
            font-weight: bold; 
        }

        .totales { 
            margin-top: 25px; 
            padding: 20px; 
            background: #252525;
            border-radius: 15px;
            text-align: right; 
            border: 1px solid #4CAF50;
        }

        .total-number { 
            font-size: clamp(1.8rem, 5vw, 2.2rem);
            color: #4CAF50; 
            font-weight: bold; 
            margin: 5px 0; 
        }
        
        .btn-comprar {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            width: auto;
            max-width: 300px;
            margin-top: 10px;
            display: block;
            transition: 0.2s;
        }

        .btn-comprar:hover { 
            background: #45a049; 
            transform: scale(1.01); 
        }

        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            left: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column; /* Apila uno abajo de otro */
            gap: 10px; /* Espacio entre globos */
            pointer-events: none; /* No estorba clics abajo */
        }

        .toast {
            position: relative; /* Cambia de fixed a relative */
            max-width: 400px;
            margin-left: auto;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            transform: translateX(120%); /* Aparecen desde la derecha */
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            pointer-events: auto;
        }

        .toast.show { 
            transform: translateX(0); 
        }

        /* --- MODIFICACIÓN EXCLUSIVA PARA CELULAR --- */
        @media (max-width: 768px) {
            .item-carrito {
                flex-wrap: wrap; 
                justify-content: center; /* Centra los elementos si sobran espacios */
            }
            .prod-img { 
                order: 1; 
                width: 60px; 
                height: 60px; 
            }
            .info-prod { 
                order: 2; 
                flex: 1 1 calc(100% - 80px); 
                margin-left: 0; 
            }
            
            /* Ajuste del Stepper (Botones) */
            .stepper { 
                order: 4; /* Lo regresé a 3 para que vaya a la izquierda del subtotal */
                flex: 1;  /* Toma la mitad del ancho */
                justify-content: center; /* Centra los botones dentro de su espacio */
                transform: scale(0.9);
                margin-top: 15px;
            }

            /* Ajuste del Subtotal (Div sin clase) */
            .item-carrito > div:last-child {
                order: 3;
                flex: 1; /* Toma la otra mitad del ancho */
                display: flex;
                flex-direction: column;
                align-items: center; /* Centra el texto "Subtotal" y el monto */
                justify-content: center;
                margin-top: 15px;
                margin-left: 0 !important; /* Quitamos el auto para que no se pegue a la derecha */
                text-align: center;
            }

            .totales { 
                text-align: center; 
            }
            .btn-comprar {
                width: 100%;
                max-width: none;
            }
        }
    `;

    render() {
        if (this.loading) return html`<p>Sincronizando BitMarket...</p>`;

        return html`
        <div class="toast-container">
            ${this.notifications.map(n => html`
                <div class="toast ${n.type} ${n.show ? 'show' : ''}">
                    ${n.message}
                </div>
            `)}
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