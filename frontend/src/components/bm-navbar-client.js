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
                <li @click="${() => this._notificar('inicio')}">Inicio</li>
                <li @click="${() => this._notificar('productos')}">Productos</li>
                <li @click="${() => this._notificar('pedidos')}">Mis Pedidos</li>
                <li @click="${() => this._notificar('carrito')}">🛒 Carrito</li>
            </ul>
        </nav>
        `;
    }

    _notificar(seccion) {
        console.log("Cambiando a:", seccion);
        // Por ahora solo mandamos un aviso, luego haremos que cambie el contenido
        alert("Próximamente verás aquí: " + seccion);
    }
}
customElements.define('bm-navbar-client', BmNavbarClient);