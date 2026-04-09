import { LitElement, html, css } from 'lit';
import { animate, fadeInSlow } from '@lit-labs/motion';
import { API_URL } from '../../../config.js';

export class BmCatalogo extends LitElement {
    static properties = {
        userId: { type: Number },
        productos: { type: Array },
        carrito: { type: Array },
        loading: { type: Boolean },
        selectedProduct: { type: Object },
        toastMsg: { type: String },
        tempQuantities: { type: Object }
    };

    constructor() {
        super();
        this.productos = [];
        this.carrito = [];
        this.loading = true;
        this.selectedProduct = null;
        this.toastMsg = '';
        this.tempQuantities = {};
    }

    async firstUpdated() {
        console.log("🚀 [Lifecycle] firstUpdated: Iniciando carga de datos...");
        console.log("👤 [User Context] userId actual:", this.userId);

        await this._cargarProductos();
        if (this.userId) {
            await this._cargarCarrito();
        } else {
            console.warn("⚠️ [User Context] No hay userId, no se cargará el carrito personal.");
        }
    }

    async _cargarProductos() {
        console.time("⏱️ [API] Tiempo carga productos");
        try {
            const resp = await fetch(`${API_URL}/productos/publicos`);
            if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);

            const data = await resp.json();
            this.productos = data;

            console.group("📦 [Data] Productos cargados del Catálogo");
            console.table(data.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio })));
            console.groupEnd();

            const temps = { ...this.tempQuantities };
            data.forEach(p => {
                if (temps[p.id] === undefined) temps[p.id] = 1;
            });
            this.tempQuantities = temps;
        } catch (err) {
            console.error("❌ [Error] Falló _cargarProductos:", err);
        } finally {
            console.timeEnd("⏱️ [API] Tiempo carga productos");
            this.loading = false;
        }
    }

    async _cargarCarrito() {
        console.log(`🛒 [API] Cargando carrito para userId: ${this.userId}...`);
        try {
            const resp = await fetch(`${API_URL}/carrito/${this.userId}`);
            const data = await resp.json();

            const itemsRecibidos = Array.isArray(data) ? data : (data.items || []);
            this.carrito = itemsRecibidos;

            console.group("🛍️ [Data] Estado actual del Carrito en DB");
            console.table(itemsRecibidos);
            console.groupEnd();

            const temps = { ...this.tempQuantities };
            itemsRecibidos.forEach(item => {
                temps[item.product_id] = item.cantidad;
            });
            this.tempQuantities = temps;
            console.log("🔄 [Sync] Cantidades temporales sincronizadas con DB.");
        } catch (err) {
            console.error("❌ [Error] Falló _cargarCarrito:", err);
        }
    }

    async _addToCart(product) {
        console.group("🆕 [Action] Agregando al carrito...");
        if (!this.userId) {
            console.error("❌ [Auth] Intento de agregar sin userId");
            console.groupEnd();
            return this._showToast("Inicia sesión para comprar");
        }

        const qtyToAdd = this.tempQuantities[product.id] || 1;
        const payload = {
            usuer_id: Number(this.userId),
            product_id: Number(product.id),
            cantidad: Number(qtyToAdd)
        };

        console.log("📤 [Request] Enviando a POST /api/carrito/add:", payload);

        try {
            const response = await fetch(`${API_URL}/carrito/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("📥 [Response] Servidor respondió:", result);

            if (response.ok) {
                console.log("✅ [Success] Carrito actualizado en servidor.");
                this._showToast(`✓ Carrito actualizado`);
                await this._cargarCarrito();
                if (this.selectedProduct) this.selectedProduct = null;
            } else {
                console.error("🚫 [Server Error] La API rechazó la petición:", result.error);
                this._showToast("Error: " + (result.error || "No se pudo guardar"));
            }
        } catch (err) {
            console.error("🔥 [Network Error] Error crítico de conexión:", err);
            this._showToast("Error de conexión");
        } finally {
            console.groupEnd();
        }
    }

    async _removeItem(productId, nombre) {
        console.group(`🗑️ [Action] Eliminando producto ${productId}`);
        try {
            const resp = await fetch(`${API_URL}/carrito/remove/${this.userId}/${productId}`, {
                method: 'DELETE'
            });
            console.log("📥 [Response] Status:", resp.status);

            if (resp.ok) {
                console.log(`✅ [Success] ${nombre} eliminado.`);
                this._showToast(`Eliminado: ${nombre}`);
                this.tempQuantities = { ...this.tempQuantities, [productId]: 1 };
                await this._cargarCarrito();
            }
        } catch (err) {
            console.error("❌ [Error] Falló _removeItem:", err);
        } finally {
            console.groupEnd();
        }
    }

_handleTempQty(product, delta) {
    const stock = product.stock ?? 0;
    const actual = this.tempQuantities[product.id] || 1;
    let nuevo = actual + delta;

    // Ajuste automático a los límites reales
    if (nuevo < 1) nuevo = 1;
    if (nuevo > stock) nuevo = stock; 

    this.tempQuantities = { ...this.tempQuantities, [product.id]: nuevo };
}


    _getQtyInCart(productId) {
        const item = this.carrito.find(i => i.product_id === productId);
        return item ? item.cantidad : 0;
    }

    _showToast(msg) {
        this.toastMsg = msg;
        setTimeout(() => this.toastMsg = '', 3000);
    }

    static styles = css`
        :host { 
            display: block; 
            padding: 1rem; 
            color: white; 
            font-family: 'Segoe UI', sans-serif; 
        }

        .toast { 
            position: fixed; 
            top: 80px; 
            right: 20px; 
            background: #4CAF50; 
            color: white; 
            padding: 1rem 2rem; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.5); 
            z-index: 3000; 
        }

        .catalogo-container { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 25px; 
            padding: 20px; 
        }

        .product-card { 
            background: #1a1a1a; 
            border: 1px solid #333; 
            border-radius: 16px; 
            overflow: hidden; 
            transition: 0.3s; 
            position: relative; 
            display: flex; 
            flex-direction: column; 
        }

        .product-card:hover { b
            order-color: #4CAF50; 
            transform: translateY(-5px); 
        }

        .img-box { 
            width: 100%; 
            height: 200px; 
            background: #fff; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            cursor: pointer; 
        }

        .img-box img { 
            max-width: 80%; 
            max-height: 80%; 
            object-fit: contain; 
        }

        .info { 
            padding: 1.2rem; 
            flex-grow: 1; 
            display: flex; 
            flex-direction: column; 
        }

        .price { 
            color: #4CAF50; 
            font-size: 1.4rem; 
            font-weight: bold; 
            margin: 5px 0; 
        }

        .subtotal-label { 
            color: #80deea; 
            font-size: 0.8rem; 
            margin-bottom: 8px; 
            font-weight: bold; 
        }

        .stepper { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: #252525; 
            border-radius: 25px; 
            border: 1px solid #444; 
            margin-bottom: 10px; 
            width: fit-content; 
            align-self: center; 
        }

        .stepper-btn { 
            background: none; 
            border: none; 
            color: #4CAF50; 
            padding: 8px 15px; 
            cursor: pointer; 
            font-size: 1.2rem; 
            font-weight: bold; 
        }

        .qty-val { 
            width: 40px; 
            text-align: center; 
            font-weight: bold; 
            font-size: 1.1rem; 
        }

        .btn-add { 
            background: #4CAF50; 
            color: white; 
            border: none; 
            padding: 10px; 
            border-radius: 20px; 
            font-weight: bold; 
            cursor: pointer; 
            transition: 0.2s; 
        }

        .btn-add:hover { 
            background: #45a049; 
        }

        .btn-trash { 
            background: none; 
            border: none; 
            color: #ff5252; 
            cursor: pointer; 
            margin-left: 10px; 
            font-size: 1.2rem; 
        }

        .in-cart-badge { 
            position: absolute; 
            top: 10px; 
            left: 10px; 
            background: #4CAF50; 
            color: white; 
            padding: 4px 10px; 
            border-radius: 12px; 
            font-size: 0.75rem; 
            font-weight: bold; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.5); 
        }

        .modal-overlay { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.85); 
            backdrop-filter: 
            blur(8px); display: flex; 
            align-items: center; 
            justify-content: center; 
            z-index: 2000; 
        }

        .modal-content { 
            background: #1a1a1a; 
            width: 90%; 
            max-width: 600px; 
            border-radius: 24px; 
            border: 1px solid #444; 
            padding: 2rem; 
            position: relative; 
            color: white; 
            max-height: 90vh; 
            overflow-y: auto; 
        }

        .close-btn { 
            position: absolute; 
            top: 15px; 
            right: 20px; 
            background: #333; 
            border: none; 
            color: white; 
            width: 35px; 
            height: 35px; 
            border-radius: 50%; 
            font-size: 1.2rem; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            z-index: 10; 
        }

        .badge { 
            background: #333; 
            color: #80deea; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.7rem; 
            margin-right: 5px; 
        }

        .product-card.no-stock {
            opacity: 0.7;
            filter: grayscale(0.5);
        }

        .stock-info {
            font-size: 0.8rem;
            font-weight: bold;
            margin-top: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }

        .stock-low {
            color: #ff9800; /* Naranja para avisar */
            background: rgba(255, 152, 0, 0.1);
        }

        .stock-none {
            color: #ff5252; /* Rojo */
            background: rgba(255, 82, 82, 0.1);
        }

        .btn-disabled {
            background: #444 !important;
            color: #888 !important;
            cursor: not-allowed !important;
        }

        @media (max-width: 768px) {
            .catalogo-container {
                grid-template-columns: 1fr;
                padding: 10px;
                gap: 15px;
            }

            .product-card {
                flex-direction: row;
                height: auto; /* Cambiado de 180px a auto para que no se coma el contenido */
                min-height: 170px; 
            }

            .img-box {
                width: 35%; /* Reducimos un poco la imagen para dar espacio al texto */
                height: auto;
                min-height: 170px;
            }

            .info {
                width: 65%; /* Más espacio para el precio y botones */
                padding: 0.6rem; /* Menos espacio interno para ganar lugar */
                justify-content: space-between; /* Distribuye mejor los elementos de arriba a abajo */
            }

            .info h3 { 
                font-size: 0.95rem; 
                margin: 0 0 4px 0 !important; 
                line-height: 1.2;
            }

            .price { 
                font-size: 1.1rem; 
                margin: 2px 0;
            }
            
            .stepper {
                transform: scale(0.85); /* Un poco más pequeño para Nexus */
                margin: 5px 0;
                width: 100%; /* Que ocupe el ancho disponible del contenedor info */
                max-width: 120px; /* Pero con un tope para que no se vea gigante */
            }

            .btn-add {
                padding: 6px;
                font-size: 0.8rem;
                width: 100%; /* Botón a lo ancho para que sea más fácil de tocar */
            }
        }
    `;

    render() {
        if (this.loading) return html`<div style="text-align:center; padding: 5rem;">📡 Cargando catálogo...</div>`;

        return html`
        ${this.toastMsg ? html`<div class="toast">${this.toastMsg}</div>` : ''}

        <div class="catalogo-container">
            ${this.productos.map(p => {
            const cartQty = this._getQtyInCart(p.id);
            const tempQty = this.tempQuantities[p.id] || 1;
            const precio = p.precio || p.price || 0;

            // --- LÓGICA DE STOCK ---
            const stock = p.stock ?? 0;
            const hasStock = stock > 0;

            return html`
                <div class="product-card ${!hasStock ? 'no-stock' : ''}">
                    ${cartQty > 0 ? html`<div class="in-cart-badge">En carrito: ${cartQty}</div>` : ''}
                    
                    <div class="img-box" @click="${() => this.selectedProduct = p}">
                        <img src="${p.imagen_url || 'https://via.placeholder.com/200'}" alt="${p.nombre}">
                    </div>

                    <div class="info">
                        <div>${p.categoria_nombres?.map(cat => html`<span class="badge">${cat}</span>`)}</div>
                        <h3 style="margin: 5px 0; cursor:pointer;" @click="${() => this.selectedProduct = p}">${p.nombre}</h3>
                        <div class="price">$${precio}</div>
                        
                        ${stock <= 50 ? html`
                            <div class="stock-info ${stock === 0 ? 'stock-none' : 'stock-low'}">
                                ${stock === 0 ? '🚫 Agotado' : `⚠️ Solo quedan ${stock} unidades`}
                            </div>
                        ` : ''}

                        <div style="margin-top: auto; display: flex; flex-direction: column;">
                            <div style="display: flex; align-items: center; justify-content: center;">
                                <div class="stepper">
                                    <button class="stepper-btn" 
                                        ?disabled="${!hasStock}"
                                        @click="${() => this._handleTempQty(p, -1)}">−</button>
                                    <span class="qty-val">${tempQty}</span>
                                    <button class="stepper-btn" 
                                        ?disabled="${!hasStock}"
                                        @click="${() => this._handleTempQty(p, 1)}">+</button>
                                </div>
                                ${cartQty > 0 ? html`
                                    <button class="btn-trash" title="Eliminar del carrito" @click="${() => this._removeItem(p.id, p.nombre)}">🗑️</button>
                                ` : ''}
                            </div>

                            <button 
                                class="btn-add ${!hasStock ? 'btn-disabled' : ''}" 
                                ?disabled="${!hasStock}"
                                @click="${() => this._addToCart(p)}">
                                ${!hasStock ? 'Sin existencias' : (cartQty > 0 ? 'Actualizar cantidad' : 'Agregar al carrito')}
                            </button>
                        </div>
                    </div>
                </div>`;
        })}
        </div>
        ${this.selectedProduct ? this._renderModal() : ''}
    `;
    }

    _renderModal() {
        const p = this.selectedProduct;
        const tempQty = this.tempQuantities[p.id] || 1;
        const precio = p.precio || p.price || 0;
        const stock = p.stock ?? 0;
        const hasStock = stock > 0;

        return html`
        <div class="modal-overlay" @click="${() => this.selectedProduct = null}">
            <div class="modal-content" @click="${e => e.stopPropagation()}" ${animate({ in: fadeInSlow })}>
                <button class="close-btn" @click="${() => this.selectedProduct = null}">✕</button>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <img src="${p.imagen_url}" style="width: 200px; height: 200px; object-fit: contain; background: white; border-radius: 10px;">
                    <div style="flex: 1; min-width: 250px; text-align: left;">
                        <h2 style="margin: 0;">${p.nombre}</h2>
                        <div class="price" style="font-size: 1.8rem;">$${precio}</div>
                        
                        <div style="margin-bottom: 10px;">
                             ${stock <= 50 ? html`
                                <span class="stock-info ${stock === 0 ? 'stock-none' : 'stock-low'}">
                                    ${stock === 0 ? 'Producto Agotado' : `Disponibles: ${stock}`}
                                </span>
                            ` : ''}
                        </div>

                        <p style="color: #bbb; font-size: 0.9rem;">${p.descripcion || 'Sin descripción disponible.'}</p>
                        
                        <div style="background: #252525; padding: 15px; border-radius: 12px; margin-top: 15px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="stepper" style="margin-bottom: 0;">
                                    <button class="stepper-btn" ?disabled="${!hasStock}" @click="${() => this._handleTempQty(p, -1)}">−</button>
                                    <span class="qty-val">${tempQty}</span>
                                    <button class="stepper-btn" ?disabled="${!hasStock}" @click="${() => this._handleTempQty(p, 1)}">+</button>
                                </div>
                                <button 
                                    class="btn-add ${!hasStock ? 'btn-disabled' : ''}" 
                                    style="flex-grow: 1;" 
                                    ?disabled="${!hasStock}"
                                    @click="${() => this._addToCart(p)}">
                                    ${hasStock ? 'Confirmar' : 'No disponible'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }
}
customElements.define('bm-cliente-tienda', BmCatalogo);