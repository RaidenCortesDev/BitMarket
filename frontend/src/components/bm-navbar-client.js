import { LitElement, html, css } from 'lit';

export class BmNavbarClient extends LitElement {
    static styles = css`
        nav { background: #1a1a1a; padding: 0.8rem; border-bottom: 2px solid #80DEEA; }
        ul { list-style: none; display: flex; gap: 25px; margin: 0; padding: 0; justify-content: center; }
        li { 
            cursor: pointer; 
            color: #ccc; 
            font-weight: 500; 
            transition: 0.3s;
        }
        li:hover { color: #4CAF50; }
        .active { color: #4CAF50; border-bottom: 2px solid #4CAF50; }
    `;

    render() {
        return html`
        <nav>
            <ul>
                <li @click="${() => this._changeSection('tienda')}">Tienda</li>
                <li @click="${() => this._changeSection('carrito')}">🛒 Carrito</li>
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
customElements.define('bm-navbar-client', BmNavbarClient);