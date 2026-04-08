import { LitElement, html, css } from 'lit';

export class BmNavbarAdmin extends LitElement {
    static styles = css`
        nav { 
            background: transparent; 
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
            transition: 0.3s;
            padding: 5px 10px;
        }
        li:hover { color: #4CAF50; }
        .active { color: #4CAF50; border-bottom: 2px solid #4CAF50; }

        /* --- Sándwich View (Copia exacta del comportamiento cliente) --- */
        @media (max-width: 768px) {
            ul {
                flex-direction: column;
                gap: 15px;
                padding: 1rem 0;
                /* Aplicamos la transición para que no entre de golpe */
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

        /* Definición de la animación suave */
        @keyframes fadeInSlide {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    render() {
        return html`
        <nav>
            <ul>
                <li @click="${() => this._changeSection('inicio')}">Dashboard</li>
                <li @click="${() => this._changeSection('productos')}">Productos</li>
                <li @click="${() => this._changeSection('categorias')}">Categorías</li>
                <li @click="${() => this._changeSection('wallet')}">Wallet</li>
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
customElements.define('bm-navbar-admin', BmNavbarAdmin);