import { LitElement, html, css } from 'lit';

export class BmHeader extends LitElement {
    static properties = {
        rol: { type: String },
        view: { type: String },
        adminSection: { type: String },
        saldo: { type: Number }
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            background: #1a1a1a;
            border-bottom: 1px solid #333;
        }
        header {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0.8rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo { 
            font-weight: bold; 
            font-size: 1.6rem; 
            color: #4CAF50; 
            cursor: pointer;
            user-select: none;
        }
        
        .nav-center {
            flex-grow: 1;
            display: flex;
            justify-content: center;
        }

        .auth-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        /* --- Estilos para el Saldo --- */
        .user-wallet-info {
            color: #4CAF50;
            font-weight: bold;
            background: #2a2a2a;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.9rem;
            border: 1px solid #444;
            display: flex;
            align-items: center;
        }
        .balance { 
            color: white; 
            margin-left: 5px; 
        }

        /* --- Botón de Apagado --- */
        .btn-logout {
            background: #442727;
            color: #ff5252;
            border: 1px solid #ff5252;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: 0.3s;
        }
        .btn-logout:hover {
            background: #ff5252;
            color: white;
        }

        .login-link {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
        }
    `;

    _handleLogoClick() {

        if (this.view !== 'dashboard') {
            this.dispatchEvent(new CustomEvent('nav-home', { bubbles: true, composed: true }));
            return;
        }

        let seccionDestino = 'inicio';

        if (this.rol === 'cliente') {
            seccionDestino = 'tienda';
        }

        this.dispatchEvent(new CustomEvent('admin-nav', {
            detail: { seccion: seccionDestino },
            bubbles: true,
            composed: true
        }));
    }

    _logout() {
        this.dispatchEvent(new CustomEvent('logout', { bubbles: true, composed: true }));
    }

    render() {
        const isLoggedIn = this.view === 'dashboard';

        return html`
        <header>
            <div class="logo" @click="${this._handleLogoClick}">BitMarket</div>

            <div class="nav-center">
                ${isLoggedIn ? html`
                    ${this.rol === 'admin'
                    ? html`<bm-navbar-admin></bm-navbar-admin>`
                    : html`<bm-navbar-client></bm-navbar-client>`}
                ` : ''}
            </div>

            <div class="auth-section">
                ${isLoggedIn ? html`
                    ${this.rol === 'cliente' ? html`
                        <div class="user-wallet-info">
                            Saldo: <span class="balance">$${this.saldo || 0}</span>
                        </div>
                    ` : ''}

                    <button class="btn-logout" @click="${this._logout}">
                        <span style="font-size: 1.2rem;">⏻</span> Cerrar Sesión
                    </button>
                ` : html`
                    <span class="login-link" @click="${() => this.dispatchEvent(new CustomEvent('open-login'))}">
                        Mi Cuenta / Login
                    </span>
                `}
            </div>
        </header>
        `;
    }
}
customElements.define('bm-header', BmHeader);