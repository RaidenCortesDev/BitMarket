import { LitElement, html, css } from 'lit';

export class BmNavbarAdmin extends LitElement {
    static styles = css`
    nav { background: #ffebee; padding: 0.5rem; border-bottom: 2px solid #f44336; }
    ul { list-style: none; display: flex; gap: 15px; margin: 0; }
    li { cursor: pointer; color: #c62828; font-weight: bold; }
`;

    render() {
        return html`
    <nav>
        <ul>
            <li>Dashboard</li>
            <li>Gestión de Productos</li>
            <li>Categorías</li>
            <li>Cupones</li>
            <li>Reportes</li>
        </ul>
    </nav>
    `;
    }
}
customElements.define('bm-navbar-admin', BmNavbarAdmin);