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
            --main-green: #4CAF50;
            position: relative;
            z-index: 100;
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
            z-index: 101;
        }
        
        .nav-center {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            /* Eliminamos opacity 0 y visibility hidden de aquí para que se vea en escritorio */
            transition: all 0.3s ease-in-out;
        }

        .auth-section {
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 101;
        }

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
            justify-content: center;
            min-width: fit-content;
        }

        .btn-logout {
            background: #442727;
            color: #ff5252;
            border: 1px solid #ff5252;
            padding: 8px 15px;
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

        .menu-toggle {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.8rem;
            cursor: pointer;
        }

        /* --- Móvil --- */
        @media (max-width: 768px) {
            .menu-toggle { display: block; }

            .nav-center {
                /* Aquí es donde aplicamos el estado oculto para el sándwich */
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background: #1a1a1a;
                flex-direction: column;
                padding: 20px 0;
                border-bottom: 2px solid #333;
                
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                display: none; /* Asegura que no ocupe espacio ni bloquee clics */
            }

            :host(.menu-open) .nav-center {
                display: flex;
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .btn-logout {
                width: 80%;
                justify-content: center;
                margin-top: 10px;
            }

            .user-wallet-info {
                margin-left: auto;
                margin-right: 10px;
            }
        }
    `;

    _toggleMenu() {
        this.classList.toggle('menu-open');
    }

    _logout() {
        this.dispatchEvent(new CustomEvent('logout', { bubbles: true, composed: true }));
        this.classList.remove('menu-open');
    }

    render() {
        const isLoggedIn = this.view === 'dashboard';

        return html`
        <header>
            <div class="logo" @click="${this._handleLogoClick}">BitMarket</div>

            <div class="nav-center">
                ${isLoggedIn ? html`
                    ${this.rol === 'admin'
                        ? html`<bm-navbar-admin @click="${this._toggleMenu}"></bm-navbar-admin>`
                        : html`<bm-navbar-client @click="${this._toggleMenu}"></bm-navbar-client>`}
                    
                    <button class="btn-logout" @click="${this._logout}">
                        <span>⏻</span> Cerrar Sesión
                    </button>
                ` : ''}
            </div>

            <div class="auth-section">
                ${isLoggedIn ? html`
                    ${this.rol === 'cliente' ? html`
                        <div class="user-wallet-info">
                            Saldo: <span style="color:white; margin-left: 5px;">$${this.saldo || 0}</span>
                        </div>
                    ` : ''}
                    <button class="menu-toggle" @click="${this._toggleMenu}">☰</button>
                ` : html`
                    <button class="btn-logout" style="border-color: #4CAF50; color: #4CAF50; background: transparent;" 
                        @click="${() => this.dispatchEvent(new CustomEvent('open-login'))}">
                        Login
                    </button>
                `}
            </div>
        </header>
        `;
    }

    _handleLogoClick() {
        if (this.view !== 'dashboard') {
            this.dispatchEvent(new CustomEvent('nav-home', { bubbles: true, composed: true }));
            return;
        }
        const seccion = this.rol === 'cliente' ? 'tienda' : 'inicio';
        this.dispatchEvent(new CustomEvent('admin-nav', {
            detail: { seccion },
            bubbles: true,
            composed: true
        }));
    }
}
customElements.define('bm-header', BmHeader);