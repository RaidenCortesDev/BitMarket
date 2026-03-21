import { LitElement, html, css } from 'lit';

export class BmNavbarClient extends LitElement {
    static styles = css`
    nav { background: #e8f5e9; padding: 0.5rem; border-bottom: 2px solid #4CAF50; }
    ul { list-style: none; display: flex; gap: 15px; margin: 0; }
    li { cursor: pointer; color: #2e7d32; font-weight: 500; }
  `;

    render() {
        return html`
    <nav>
        <ul>
            <li>Inicio</li>
            <li>Productos</li>
            <li>Mis Pedidos</li>
            <li>Carrito</li>
        </ul>
    </nav>
    `;
    }
}
customElements.define('bm-navbar-client', BmNavbarClient);