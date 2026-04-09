import { LitElement, html, css } from 'lit';

export class BmNavbarClient extends LitElement {

    static styles = css`
        nav { 
            background: transparent; /* Hereda el fondo oscuro del nav-center */
            padding: 0; 
            width: 100%;
        }
        ul { 
            list-style: none; 
            display: flex; 
            gap: 25px; 
            margin: 0; 
            padding: 0.8rem; 
            justify-content: center; 
        }
        li { 
            cursor: pointer; 
            color: #ccc; 
            font-weight: 500; 
            transition: all 0.3s ease;;
            padding: 5px 10px; /* Área de click más grande */
        }
        li:hover { color: #4CAF50; }
        .active { color: #4CAF50; border-bottom: 2px solid #4CAF50; }

        /* --- Sándwich View (Vertical) --- */
        @media (max-width: 768px) {
            ul {
            text-align: center;    
            flex-direction: column;
                gap: 5px;
                padding: 1.5rem 0;
                animation: fadeInSlide 0.4s ease-out forwards;
            }
            li {
                text-align: center;
                font-size: 1.2rem;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
                width: 100%;
            }
            li:last-child {
                border-bottom: none;
            }
            .active { 
                border-bottom: 2px solid #4CAF50; 
                background-color: rgba(76, 175, 80, 0.1);
            }
        }
    `;

    render() {
        return html`
        <nav>
            <ul>
                <li @click="${() => this._changeSection('tienda')}">Tienda</li>
                <li @click="${() => this._changeSection('🛒 Mi Carrito Detallado')}">🛒 Carrito</li>
                <li @click="${() => this._changeSection('👝 Mi Wallet')}">👝 Wallet</li>
            </ul>
        </nav>
        `;
    }

    _changeSection(seccion) {
        this.dispatchEvent(new CustomEvent('admin-nav', {
            detail: { seccion: seccion },
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('bm-navbar-client', BmNavbarClient);