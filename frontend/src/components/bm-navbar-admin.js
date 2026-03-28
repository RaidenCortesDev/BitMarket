import { LitElement, html, css } from 'lit';

export class BmNavbarAdmin extends LitElement {
    static styles = css`
        nav { background: #1a1a1a; padding: 0.8rem; border-bottom: 2px solid #B39DDB; }
        ul { list-style: none; display: flex; gap: 20px; margin: 0; padding: 0; justify-content: center; }
        li { 
            cursor: pointer; 
            color: #ffffff; 
            font-weight: bold; .
            transition: 0.3s;
            text-transform: uppercase;
            font-size: 0.8rem;
        }
        li:hover { color: #B39DDB; }
    `;



    render() {
        return html`
    <nav>
        <ul>
            <li @click="${() => this._changeSection('inicio')}">Dashboard</li>
            <li @click="${() => this._changeSection('productos')}">Productos</li>
            <li @click="${() => this._changeSection('categorias')}">Categorías</li>
            <li @click="${() => this._changeSection('cupones')}">Cupones</li>
        </ul>
    </nav>
    `;
    }

    // Cambia _notificar por _changeSection
    _changeSection(seccion) {
        this.dispatchEvent(new CustomEvent('admin-nav', {
            detail: { seccion },
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('bm-navbar-admin', BmNavbarAdmin);