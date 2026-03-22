import { LitElement, html, css } from 'lit';
// Importamos los componentes hijos (Asegúrate de que las rutas sean correctas)
import './components/bm-header.js';
import './components/bm-navbar-client.js';
import './components/bm-navbar-admin.js';

export class BitMarketApp extends LitElement {
    static properties = {
        rol: { type: String }
    };

    // 1. Definimos los estilos del Orquestador
    static styles = css`
    :host {
        display: block;
        /* Aquí usamos la variable del global.css */
        font-family: var(--main-font); 
        background-color: var(--bg-color);
        color: var(--text-color);
    }

    h2 {
        /* Usamos tu variable de acento */
        color: var(--accent-color);
        font-weight: 400; 
    }
`;

    constructor() {
        super();
        this.rol = 'cliente';
    }

    _toggleRol() {
        this.rol = this.rol === 'cliente' ? 'admin' : 'cliente';
    }

    render() {
        return html`
            <bm-header></bm-header>

            ${this.rol === 'admin'
                ? html`<bm-navbar-admin></bm-navbar-admin>`
                : html`<bm-navbar-client></bm-navbar-client>`
            }

            <main>
                <h2>Panel de ${this.rol}</h2>
                <p>Bienvenido a BitMarket. Estamos preparando el catálogo de periféricos.</p>
                
                <button @click="${this._toggleRol}">
                    Simular modo: ${this.rol === 'cliente' ? 'Administrador' : 'Cliente'}
                </button>
            </main>
        `;
    }
}
customElements.define('bit-market-app', BitMarketApp);