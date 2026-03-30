import { LitElement, html, css } from 'lit';
import './components/bm-header.js';
import './components/bm-navbar-client.js';
import './components/bm-navbar-admin.js';
import './components/bm-registro.js';
import './components/bm-login.js';
import './components/bm-admin-categorias.js';
import './components/bm-admin-productos.js';
import './components/bm-admin-wallet.js';

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
        rol: { type: String },
        view: { type: String }, // 'landing', 'auth', 'dashboard'
        authMode: { type: String }, // 'login' o 'registro'
        adminSection: { type: String }
    };



    constructor() {
        super();
        const savedUser = JSON.parse(localStorage.getItem('bm_session'));

        if (savedUser && savedUser.rol) {
            this.id = savedUser.id;
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
        // 1. Extraemos los datos que vienen del componente login (e.detail)
        if (e && e.detail) {
            // IMPORTANTE: Si el backend devuelve { message, user: {...} }, 
            // entonces la info real está en e.detail.user
            const userData = e.detail.user || e.detail;

            console.log("Dato real del usuario:", userData);

            // 2. Guardamos el objeto completo en LocalStorage
            localStorage.setItem('bm_session', JSON.stringify(userData));

            // 3. Seteamos propiedades reactivas
            this.id = userData.id;
            this.rol = userData.rol;
            this.view = 'dashboard';

            console.log("✅ ID de sesión guardado:", this.id);
            this.requestUpdate();
        }
    }

    render() {
        return html`
            <bm-header 
                .rol="${this.rol}" 
                .view="${this.view}"
                @open-login="${() => this._goToAuth('login')}"
                @logout="${this._logout}"
                @nav-home="${() => this.view = 'landing'}"
                @admin-nav="${(e) => this.adminSection = e.detail.seccion}">
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
    return html`
        <div class="dashboard-container"> <div class="dashboard-content">
                ${this.rol === 'admin'
                    ? html`
                        <section class="admin-tools">
                            <h2>Panel Admin: <span style="color: #4CAF50">${this.adminSection || 'Inicio'}</span></h2>
                            ${this.adminSection === 'categorias'
                                ? html`<bm-admin-categorias></bm-admin-categorias>`
                                : this.adminSection === 'productos'
                                    ? html`<bm-admin-productos></bm-admin-productos>`
                                    : this.adminSection === 'wallet'
                                        ? html`<bm-admin-wallet></bm-admin-wallet>`
                                        : html`<p>Bienvenido al centro de control.</p>`
                            }
                        </section>`
                    : html`
                        <section class="client-shop">
                            <h2>¡Hola de nuevo!</h2>
                            <p>Explora los mejores periféricos del mercado.</p>
                        </section>`
                }
            </div>
        </div>
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

    // Para cerrar sesión
    _logout() {
        localStorage.removeItem('bm_session');
        this.view = 'landing';
        this.rol = 'cliente';
    }
}
customElements.define('bit-market-app', BitMarketApp);