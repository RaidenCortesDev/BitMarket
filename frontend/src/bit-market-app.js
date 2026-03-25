import { LitElement, html, css } from 'lit';
import './components/bm-header.js';
import './components/bm-navbar-client.js';
import './components/bm-navbar-admin.js';
import './components/bm-registro.js';
import './components/bm-login.js';

export class BitMarketApp extends LitElement {
    static properties = {
        rol: { type: String },
        view: { type: String }, // 'landing', 'auth', 'dashboard'
        authMode: { type: String } // 'login' o 'registro'
    };

    constructor() {
        super();
        // Intentamos recuperar la sesión guardada
        const savedUser = JSON.parse(localStorage.getItem('bm_session'));

        if (savedUser) {
            this.rol = savedUser.rol;
            this.view = 'dashboard';
        } else {
            this.rol = 'cliente';
            this.view = 'landing';
        }
        this.authMode = 'login';
    }

    // Funciones para cambiar de escena
    //_goToLogin() { this.view = 'login'; }
    _goToAuth(mode) {
        this.authMode = mode;
        this.view = 'auth';
    }

    // Modifica la función _goToDashboard para recibir el evento
    _goToDashboard(e) {
        if (e.detail && e.detail.user) {
            this.rol = e.detail.user.rol;
            // GUARDAMOS EN EL NAVEGADOR
            localStorage.setItem('bm_session', JSON.stringify(e.detail.user));
        }
        this.view = 'dashboard';
    }

    // Para cerrar sesión
    _logout() {
        localStorage.removeItem('bm_session');
        this.view = 'landing';
        this.rol = 'cliente';
    }

    render() {
        return html`
        <!-- Escuchamos el evento del header para ir a login -->
        <bm-header @open-login="${() => this._goToAuth('login')}"></bm-header>

        ${this.view === 'landing' ? this._renderLanding() : ''}
        
        ${this.view === 'auth' ? html`
            <section class="auth-container">
                ${this.authMode === 'login'
                    ? html`
                        <bm-login @success="${(e) => this._goToDashboard(e)}"></bm-login>
                        <p style="text-align:center; color:gray; cursor:pointer" @click="${() => this.authMode = 'registro'}">
                            ¿No tienes cuenta? Regístrate aquí
                        </p>`
                    : html`
                        <bm-registro @success="${(e) => this._goToDashboard(e)}"></bm-registro>
                        <p style="text-align:center; color:gray; cursor:pointer" @click="${() => this.authMode = 'login'}">
                            ¿Ya tienes cuenta? Inicia sesión
                        </p>`
                }
            </section>
        ` : ''}

        ${this.view === 'dashboard' ? this._renderDashboard() : ''}
    `;
    }

    _renderDashboard() {
        return html`
        ${this.rol === 'admin'
                ? html`<bm-navbar-admin></bm-navbar-admin>`
                : html`<bm-navbar-client></bm-navbar-client>`}
        
        <main class="dashboard-container">
            <header>
                <h2>Bienvenido, ${this.rol}</h2>
                <button @click="${this._logout}">Cerrar Sesión</button>
            </header>

            ${this.rol === 'admin'
                ? html`
                    <section class="admin-tools">
                        <h3>Gestión de Inventario</h3>
                        <p>Aquí saldrá la tabla para editar precios y stock.</p>
                        </section>`
                : html`
                    <section class="client-shop">
                        <h3>Explora nuestro catálogo</h3>
                        <p>Aquí saldrán TODOS los productos con botón de carrito.</p>
                        </section>`
            }
        </main>
    `;
    }

    // Dentro de bit-market-app.js
    _renderLanding() {
        return html`
            <section class="hero">
                <div class="promo-text">
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
                .btn-main {
                    background: var(--main-green);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    font-size: 1.2rem;
                    cursor: pointer;
                    border-radius: 8px;
                    font-weight: bold;
                }
                .btn-main:hover { background: #45a049; }
                .products-section {
                    padding: 2rem;
                    background: #f4f4f4;
                    color: black;
                    min-height: 200px;
                    text-align: center;
                }
            </style>
    `;
    }
}
customElements.define('bit-market-app', BitMarketApp);