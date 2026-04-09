import { LitElement, html, css } from 'lit';
import { API_URL } from '../../../config.js';

export class BmClienteWallet extends LitElement {
    static properties = {
        userId: { type: Number },
        saldo: { type: Number },
        loading: { type: Boolean },
        successMessage: { type: String },
        errorMessage: { type: String }
    };

    static styles = css`
        :host { display: block; padding: 1rem; }
        
        .wallet-container {
            max-width: 500px;
            margin: 2rem auto;
            background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid #333;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            text-align: center;
            position: relative; /* Para posicionar la notificación si quisiéramos */
        }

        /* Notificación de éxito estilizada */
        .notification {
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            animation: fadeIn 0.3s ease-in-out;
        }

        .success { background: rgba(76, 175, 80, 0.2); color: #4CAF50; border: 1px solid #4CAF50; }
        .error { background: rgba(255, 82, 82, 0.2); color: #ff5252; border: 1px solid #ff5252; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .balance-display {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: rgba(76, 175, 80, 0.1);
            border-radius: 15px;
            border: 1px dashed #4CAF50;
        }

        .balance-display h3 { color: white; margin-top: 0; }
        .balance-display h4 { color: #aaa; margin: 0; text-transform: uppercase; font-size: 0.8rem; }
        .balance-amount { color: #4CAF50; font-size: 2.5rem; font-weight: bold; display: block; margin-top: 0.5rem; }

        .input-group { margin-top: 1.5rem; }
        label { display: block; color: #ccc; margin-bottom: 0.5rem; font-size: 0.9rem; }
        
        input {
            width: 100%;
            padding: 15px;
            background: #000;
            border: 1px solid #444;
            color: #4CAF50;
            border-radius: 10px;
            font-size: 1.2rem;
            text-align: center;
            box-sizing: border-box;
            outline: none;
            transition: border 0.3s;
        }

        input:focus { border-color: #4CAF50; }

        /* Quitar flechas de número en Chrome/Safari/Edge */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

        .btn-recharge {
            width: 100%;
            margin-top: 1.5rem;
            padding: 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s, background 0.3s;
        }

        .btn-recharge:hover { background: #45a049; transform: translateY(-2px); }
        .btn-recharge:disabled { background: #666; cursor: not-allowed; }
        .input-error { border-color: #ff5252 !important; color: #ff5252; }
        
        @media (max-width: 480px) {
            .wallet-container { padding: 1.5rem; margin: 1rem; }
            .balance-amount { font-size: 2rem; }
        }
    `;

    _preventInvalidChars(e) {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
            this.errorMessage = "Solo se permiten montos positivos";
            setTimeout(() => { this.errorMessage = ''; }, 3000);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.userId) this._fetchSaldo();
    }

    async _fetchSaldo() {
        try {
            const resp = await fetch(`${API_URL}/usuarios/${this.userId}/saldo`);
            const data = await resp.json();
            this.saldo = data.saldo;

            this.dispatchEvent(new CustomEvent('update-balance-global', {
                detail: { saldo: data.saldo },
                bubbles: true,
                composed: true
            }));
        } catch (err) { console.error("Error al obtener saldo", err); }
    }

    async _handleRecharge() {
        const inputMonto = this.shadowRoot.querySelector('#amount');
        const monto = parseFloat(inputMonto.value);

        if (!monto || monto <= 0) {
            this.errorMessage = "El monto debe ser mayor a 0";
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        try {
            const resp = await fetch(`${API_URL}/wallet/recharge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emitter_id: this.userId,
                    target_user_id: this.userId,
                    monto: monto,
                    descripcion: 'Recarga de saldo propia'
                })
            });

            if (resp.ok) {
                inputMonto.value = '';
                await this._fetchSaldo();
                this.successMessage = "¡Recarga exitosa!";
                setTimeout(() => { this.successMessage = ''; }, 4000);
            } else {
                const errorData = await resp.json();
                this.errorMessage = errorData.error || "Error en la operación";
            }
        } catch (err) {
            this.errorMessage = "Error de conexión con el servidor";
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
            <div class="wallet-container">
                
                ${this.successMessage ? html`<div class="notification success">✅ ${this.successMessage}</div>` : ''}
                ${this.errorMessage ? html`<div class="notification error">⚠️ ${this.errorMessage}</div>` : ''}

                <div class="balance-display">
                    <h3>Recargar B-Coins 💰</h3>
                    <span class="balance-amount">$${this.saldo ?? '...'}</span>
                </div>

                <div class="input-group">
                    <label>Monto a recargar</label>
                    <input 
                        type="number" 
                        id="amount" 
                        placeholder="0.00" 
                        min="0.01" 
                        step="0.01"
                        class="${this.errorMessage ? 'input-error' : ''}"
                        ?disabled="${this.loading}"
                        @keydown="${this._preventInvalidChars}" 
                        @input="${() => this.errorMessage = ''}"
                    >
                </div>

                <button class="btn-recharge" ?disabled="${this.loading}" @click="${this._handleRecharge}">
                    ${this.loading ? 'Procesando...' : 'Confirmar Recarga'}
                </button>
            </div>
        `;
    }
}
customElements.define('bm-cliente-wallet', BmClienteWallet);