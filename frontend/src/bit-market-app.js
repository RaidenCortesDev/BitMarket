import { LitElement, html, css } from 'lit';
// Importamos los componentes hijos
import './components/bm-header.js';
import './components/bm-navbar-client.js';
import './components/bm-navbar-admin.js';

export class BitMarketApp extends LitElement {
    static properties = {
        rol: { type: String }
    };

    constructor() {
        super();
        this.rol = 'cliente'; // Estado inicial
    }

    // Método para cambiar de rol (Solo para probar la lógica ahora)
    _toggleRol() {
        this.rol = this.rol === 'cliente' ? 'admin' : 'cliente';
    }

    render() {
        return html`
            <!-- Header fijo -->
            <bm-header></bm-header>
            <!-- Navbar dinámico según el rol -->
            ${this.rol === 'admin'
                        ? html`<bm-navbar-admin></bm-navbar-admin>`
                        : html`<bm-navbar-client></bm-navbar-client>`
                    }
            <main style="padding: 20px;">
                <h2>Panel de ${this.rol.toUpperCase()}</h2>
                <p>Aquí irá el contenido principal del E-commerce.</p>
                
                <!-- Botón temporal para que veas la magia del cambio de estado -->
                <button @click="${this._toggleRol}">Cambiar a modo ${this.rol === 'cliente' ? 'Admin' : 'Cliente'}</button>
            </main>
            `;
    }
}
customElements.define('bit-market-app', BitMarketApp);