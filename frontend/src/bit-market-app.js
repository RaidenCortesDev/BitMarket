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
        authMode: { type: String }, // 'login' o 'registro'
        adminSection: { type: String }
    };

    constructor() {
        super();
        const savedUser = JSON.parse(localStorage.getItem('bm_session'));

        if (savedUser && savedUser.rol) {
            this.rol = savedUser.rol;
            this.view = 'dashboard';
        } else {
            this.rol = 'cliente';
            this.view = 'landing';
        }
    }

    _goToAuth(mode) {
        this.authMode = mode;
        this.view = 'auth';
    }

    _goToDashboard(e) {

        // Cambiamos la validación: ahora buscamos e.detail directamente
        if (e && e.detail && e.detail.rol) { 
            const user = e.detail; // El usuario ES el detail directamente

            // 1. Guardamos en LocalStorage
            localStorage.setItem('bm_session', JSON.stringify(user));

            // 2. Seteamos propiedades reactivas
            this.rol = user.rol;
            this.view = 'dashboard';

            console.log("✅ Sesión iniciada");

            this.requestUpdate();
        } else {
            console.error("❌ El evento no tiene la propiedad 'rol':", e.detail);
        }
    }

    render() {
        return html`
        <bm-header @open-login="${() => this._goToAuth('login')}"></bm-header>

        <main>
            ${this.view === 'landing' ? this._renderLanding() : ''}
            
            ${this.view === 'auth' ? html`
                <section class="auth-container">
                    ${this.authMode === 'login'
                    ? html`<bm-login @success="${(e) => this._goToDashboard(e)}"></bm-login>`
                    : html`<bm-registro @success="${(e) => this._goToDashboard(e)}"></bm-registro>`
                }
                </section>
            ` : ''}

            ${this.view === 'dashboard' ? this._renderDashboard() : ''}
        </main>
        `;
    }

    // Para cerrar sesión
    _logout() {
        localStorage.removeItem('bm_session');
        this.view = 'landing';
        this.rol = 'cliente';
    }


    _renderDashboard() {
        return html`
        ${this.rol === 'admin'
                ? html`<bm-navbar-admin @admin-nav="${(e) => this.adminSection = e.detail.seccion}"></bm-navbar-admin>`
                : html`<bm-navbar-client></bm-navbar-client>`}
        
        <main class="dashboard-container">
            <header>
                <h2>Bienvenido, <span style="color: #4CAF50">${this.rol}</span></h2>
                <button @click="${this._logout}">Cerrar Sesión</button>
            </header>

            <div class="dashboard-content">
                ${this.rol === 'admin'
                ? html`
                        <section class="admin-tools">
                            <h3>Gestión de Inventario (Modo Admin)</h3>
                            <p>Aquí saldrá la tabla para editar precios y stock.</p>
                        </section>`
                : html`
                        <section class="client-shop">
                            <h3>Explora nuestro catálogo (Modo Cliente)</h3>
                            <p>Aquí saldrán TODOS los productos con botón de carrito.</p>
                        </section>`
            }
            </div>
        </main>

        <style>
            .dashboard-container { padding: 20px; }
            header { display: flex; justify-content: space-between; align-items: center; }
            .admin-tools { border: 2px solid red; padding: 10px; } /* Temporal para visualizar */
        </style>
        `;
    }

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