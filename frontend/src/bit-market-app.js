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
        this.rol = 'cliente';
        this.view = 'landing';
        this.authMode = 'login'; // Por defecto mostramos login
    }

    // Funciones para cambiar de escena
    //_goToLogin() { this.view = 'login'; }
    _goToAuth(mode) {
        this.authMode = mode;
        this.view = 'auth';
    }

    // Modifica la función _goToDashboard para recibir el evento
    _goToDashboard(e) {
        if (e.detail && e.detail.rol) {
            this.rol = e.detail.rol; // Actualiza 'cliente' o 'admin'
        }
        this.view = 'dashboard';
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

    _renderLanding() {
        return html`
        <main>
            <h1>Bienvenido a BitMarket</h1>
            <p>La mejor tienda de teclados custom.</p>
            <!-- CAMBIA _goToLogin por _goToAuth('registro') -->
            <button @click="${() => this._goToAuth('registro')}">Empezar ahora</button>
        </main>
    `;
    }

    _renderDashboard() {
        return html`
            ${this.rol === 'admin'
                ? html`<bm-navbar-admin></bm-navbar-admin>`
                : html`<bm-navbar-client></bm-navbar-client>`}
            <main>
                <h2>Panel de ${this.rol}</h2>
                <button @click="${() => this.view = 'landing'}">Cerrar Sesión</button>
            </main>
        `;
    }
}
customElements.define('bit-market-app', BitMarketApp);