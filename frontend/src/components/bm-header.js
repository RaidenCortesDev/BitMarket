import { LitElement, html, css } from 'lit';

export class BmHeader extends LitElement {
    static styles = css`
        header {
            background: #1a1a1a;
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }
        .logo { 
            font-weight: bold; 
            font-size: 1.5rem; 
            color: #4CAF50; 
            cursor: pointer;
        }
        .nav-links {
            display: flex;
            gap: 20px;
        }
        .login-btn {
            cursor: pointer;
            color: #4CAF50;
            font-weight: bold;
            transition: 0.3s;
        }
        .login-btn:hover {
            text-shadow: 0 0 10px #4CAF50;
        }
    `;

    render() {
        return html`
        <header>
            <div class="logo" @click="${() => this._dispatchNav('home')}">BitMarket</div>
            <div class="nav-links">
                <div class="login-btn" @click="${this._handleLoginClick}">Mi Cuenta / Login</div>
            </div>
        </header>
        `;
    }

    _handleLoginClick() {
        // Disparamos un evento genérico para que la App decida qué mostrar
        this.dispatchEvent(new CustomEvent('open-login', { 
            bubbles: true, 
            composed: true 
        }));
    }

    _dispatchNav(view) {
        this.dispatchEvent(new CustomEvent('change-view', { 
            detail: { view }, 
            bubbles: true, 
            composed: true 
        }));
    }
}
customElements.define('bm-header', BmHeader);