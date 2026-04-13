import { LitElement, html, css } from 'lit';
// --- Componentes Globales (Shared) ---
import './components/shared/bm-header.js';
import './components/shared/bm-destacados.js';

// --- Autenticación ---
import './components/auth/bm-registro.js';
import './components/auth/bm-login.js';

// --- Módulo de Administración ---
import './components/admin/bm-navbar-admin.js';
import './components/admin/bm-admin-categorias.js';
import './components/admin/bm-admin-productos.js';
import './components/admin/bm-admin-wallet.js';

// --- Módulo de Cliente ---
import './components/client/bm-navbar-client.js';
import './components/client/bm-cliente-tienda.js';
import './components/client/bm-cliente-carrito.js';
import './components/client/bm-cliente-wallet.js';


export class BitMarketApp extends LitElement {


    static styles = css`
        :host {
            display: block;
            min-height: 100vh;
            background-color: var(--bg-color);
        }

        main {
            width: 100%; 
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Contenedor del Dashboard: asegura que el fondo sea total */
        .dashboard-container {
            width: 100%;
            min-height: calc(100vh - 80px); /* Ajusta según el alto de tu header */
            background-color: var(--bg-color);
        }

        /* Contenido del Dashboard: AQUÍ limitamos el ancho para que no se vea "estirado" */
        .dashboard-content {
            max-width: var(--max-allowed-width, 1600px);
            margin: 0 auto;
            padding: 2rem;
            box-sizing: border-box;
        }

        @media (max-width: 768px) {
            .dashboard-content {
                padding: 1rem;
            }
        }

        .auth-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
        }
    `;


    static properties = {
        id: { type: Number },
        nombre: { type: String },
        correo: { type: String },
        rol: { type: String },
        view: { type: String }, // 'landing', 'auth', 'dashboard'
        authMode: { type: String }, // 'login' o 'registro'
        adminSection: { type: String },
        clientSection: { type: String },
        saldo: { type: Number }
    };



    constructor() {
        super();
        const rawData = localStorage.getItem('bm_session');
        let savedUser = null;

        if (rawData) {
            try {
                savedUser = JSON.parse(atob(rawData));
            } catch (e) {
                console.error('Error parsing session data:', e);
                localStorage.removeItem('bm_session');
            }
        }

        if (savedUser && savedUser.rol) {
            this.id = savedUser.id;
            this.nombre = savedUser.nombre;
            this.rol = savedUser.rol;
            this.correo = savedUser.email || savedUser.correo;
            this.saldo = Number(savedUser.saldo || 0);
            this.view = 'dashboard';

            // SOLUCIÓN: Si es cliente, forzamos que la sección inicial sea tienda
            if (this.rol === 'cliente') {
                this.adminSection = 'tienda';
            } else {
                this.adminSection = 'inicio';
            }
        } else {
            this.rol = 'cliente';
            this.view = 'landing';
        }
    }
    // En el constructor o connectedCallback añade el listener
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('update-balance-global', (e) => {
            this.saldo = e.detail.saldo; // Actualizamos el estado global
        });

        this.addEventListener('admin-nav', (e) => {
            this.adminSection = e.detail.seccion;
            this.requestUpdate();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('update-balance', this._actualizarSaldo.bind(this));
    }

    _goToAuth(mode) {
        this.authMode = mode;
        this.view = 'auth';
    }

    _goToDashboard(e) {
        if (e && e.detail) {
            const userData = e.detail.user || e.detail;

            this.id = userData.id;
            this.nombre = userData.nombre;
            this.correo = userData.email || userData.correo;
            this.rol = userData.rol;

            const saldoCrudo = userData.saldo;
            this.saldo = this.rol === 'cliente' ? Number(saldoCrudo || 0) : 0;

            // SOLUCIÓN: Al entrar al dashboard, definimos la sección según el rol
            if (this.rol === 'cliente') {
                this.adminSection = 'tienda';
            } else {
                this.adminSection = 'inicio';
            }

            this.view = 'dashboard';

        const sessionData = {
            id: this.id,
            nombre: this.nombre,
            email: this.correo,
            rol: this.rol,
            saldo: this.saldo
        };

        // Convertimos el objeto a texto y luego a un "código" (Base64)
        const encodedData = btoa(JSON.stringify(sessionData));
        
        // Lo guardamos con un nombre menos obvio si quieres, ej: 'bm_data'
        localStorage.setItem('bm_session', encodedData);

        this.view = 'dashboard';
        this.requestUpdate();

        }
    }


    async _actualizarSaldo() {
        if (!this.id) return;

        try {
            // Asegúrate de usar la URL correcta de tu API. 
            // Si usas un archivo de config, impórtalo, o pon la ruta directa.
            const response = await fetch(`${API_URL}/usuarios/${this.id}/saldo`);

            if (response.ok) {
                const data = await response.json();
                this.saldo = Number(data.saldo); // Convertimos a número por seguridad

                // Actualizamos el localStorage para que F5 no regrese el saldo viejo
                const session = JSON.parse(localStorage.getItem('bm_session')) || {};
                session.saldo = this.saldo;
                localStorage.setItem('bm_session', JSON.stringify(session));

                console.log("💰 Saldo actualizado dinámicamente:", this.saldo);
                this.requestUpdate(); // Forzamos a Lit a re-dibujar la interfaz
            }
        } catch (error) {
            console.error("❌ Error al refrescar el saldo:", error);
        }
    }

    render() {
        return html`
            <bm-header 
                .rol="${this.rol}" 
                .view="${this.view}"
                .saldo="${this.saldo}"
                @open-login="${() => this._goToAuth('login')}"
                @logout="${this._logout}"
                @nav-home="${() => this.view = 'landing'}"
                @admin-nav="${(e) => {
                // Forzamos que adminSection cambie para ambos (admin y cliente)
                this.adminSection = e.detail.seccion;
                this.requestUpdate();
            }}">
            </bm-header>

            <main>
                ${this.view === 'landing' ? this._renderLanding() : ''}
                
                ${this.view === 'auth' ? html`
                    <section class="auth-container">
                        ${this.authMode === 'login'
                    ? html`<bm-login @success="${(e) => this._goToDashboard(e)}"></bm-login>`
                    : html`<bm-registro @success="${(e) => this._goToDashboard(e)}"></bm-registro>`
                }

                        <div class="auth-toggle" style="text-align: center; margin-top: 20px; color: #fff;">
                            ${this.authMode === 'login'
                    ? html`
                                    <p>¿No tienes cuenta? 
                                        <span @click="${() => this.authMode = 'registro'}" 
                                            style="color: #4CAF50; cursor: pointer; font-weight: bold; text-decoration: underline;">
                                            Regístrate aquí
                                        </span>
                                    </p>`
                    : html`
                                    <p>¿Ya tienes cuenta? 
                                        <span @click="${() => this.authMode = 'login'}" 
                                            style="color: #4CAF50; cursor: pointer; font-weight: bold; text-decoration: underline;">
                                            Inicia sesión
                                        </span>
                                    </p>`
                }
                        </div>
                    </section>
                ` : ''}

                ${this.view === 'dashboard' ? this._renderDashboard() : ''}
            </main>
            `;
    }


    _renderDashboard() {
        // Definimos qué mostrar para el Administrador
        const adminView = html`
        <section class="admin-tools">
            <h2>Panel Admin: <span style="color: #4CAF50">${this.adminSection || 'Inicio'}</span></h2>
            ${this.adminSection === 'categorias' ? html`<bm-admin-categorias></bm-admin-categorias>` : ''}
            ${this.adminSection === 'productos' ? html`<bm-admin-productos></bm-admin-productos>` : ''}
            ${this.adminSection === 'wallet' ? html`<bm-admin-wallet></bm-admin-wallet>` : ''}
            ${!this.adminSection || this.adminSection === 'inicio' ? html`<p>Bienvenido al centro de control.</p>` : ''}
        </section>
    `;

        // Definimos qué mostrar para el Cliente
        const clientView = html`
        <section class="client-shop">
            <h2><span style="color: #80deea">${this.adminSection === 'tienda' ? 'Tienda' : (this.adminSection || 'Inicio')}</span></h2>
            
            ${this.adminSection === '👝 Mi Wallet' ? html`
                <bm-cliente-wallet 
                    .userId="${this.id}" 
                    .saldo="${this.saldo}"
                    @update-balance="${() => this._actualizarSaldo()}">
                </bm-cliente-wallet>
            ` : ''}

            ${this.adminSection === 'tienda' ? html`
                <bm-cliente-tienda
                    .userId="${this.id}" >
                </bm-cliente-tienda> 
            ` : ''}

            ${this.adminSection === '🛒 Mi Carrito Detallado' ? html`
                <bm-cliente-carrito
                    .userId="${this.id}" 
                    .saldo="${this.saldo}">
                </bm-cliente-carrito> 
            ` : ''}

            <!-- ${(!this.adminSection || this.adminSection === 'inicio') ? html`
                <h2>¡Hola de nuevo!</h2>
                <p>Explora los mejores periféricos del mercado.</p>
                <bm-destacados></bm-destacados>
            ` : ''} -->
        </section>
    `;

        return html`
        <div class="dashboard-container">
            <div class="dashboard-content">
                ${this.rol === 'admin' ? adminView : clientView}
            </div>
        </div>
    `;
    }

    _renderLanding() {
        return html`
            <section class="hero">
                <div class="promo-text">
                    <img src="https://res.cloudinary.com/ddvit9qlh/image/upload/v1775712413/BitMarket_z4oon5.png" alt="BitMarket Logo" class="hero-logo">
                    
                    <h1>¿Te quieres unos periféricos nuevos? ⌨️</h1>
                    <p>Eleva tu setup al siguiente nivel con BitMarket. Calidad premium para gamers de verdad.</p>
                    <button class="btn-main" @click="${() => this._goToAuth('login')}">
                        Ver Catálogo Completo
                    </button>
                </div>
            </section>

            <section class="products-section">
                <h2>🔥 Los más buscados</h2>
                <div class="product-grid">
                    <bm-destacados></bm-destacados>
                </div>
                <div class="product-grid">
                    <p>Inicia sesión para ver nuestras ofertas exclusivas.</p>
                </div>
            </section>

            <style>
                /* Agregué el selector :host para que el CSS no flote raro */
                :host { --main-green: #4CAF50; } 
                .hero {
                    background: #1a1a1a;
                    color: white;
                    padding: 4rem 2rem;
                    text-align: center;
                }
                .hero-logo {
                    max-width: 400px; /* Tamaño grande para escritorio */
                    width: 100%;      /* Responsivo */
                    height: auto;
                    margin-bottom: 1.5rem;
                    filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.2)); /* Un brillo verde sutil */
                    transition: transform 0.3s ease;
                }

                .hero-logo:hover {
                    transform: scale(1.02);
                }

                .promo-text h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }
                .btn-main {
                    background: var(--main-green);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    font-size: 1.2rem;
                    cursor: pointer;
                    border-radius: 8px;
                    font-weight: bold;
                    margin-top: 1rem;
                }

                .btn-main:hover { background: #45a049; }

                .products-section {
                    padding: 2rem;
                    background: #f4f4f4;
                    color: black;
                    min-height: 200px;
                    text-align: center;
                }

                @media (max-width: 768px) {
                    .hero {
                        padding: 2rem 1rem;
                    }
                    .hero-logo {
                        max-width: 220px; /* Tamaño moderado para móvil */
                    }
                    .promo-text h1 {
                        font-size: 1.8rem;
                    }
                }
            </style>
    `;
    }

    // Para cerrar sesión
    _logout() {
        localStorage.removeItem('bm_session');
        this.view = 'landing';
        this.rol = 'cliente';
    }
}
customElements.define('bit-market-app', BitMarketApp);