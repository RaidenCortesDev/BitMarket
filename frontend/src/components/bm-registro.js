import { LitElement, html, css } from 'lit';
import { UserSchema } from '../lib/validators.js';
import { auth } from '../firebase-config.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { API_URL } from '../../config.js';

export class BmRegistro extends LitElement {
    static properties = {
        loading: { type: Boolean },
        errorMessage: { type: String },
        successMessage: { type: String }
    };

static styles = css`
        :host {
            display: block;
            font-family: var(--main-font, sans-serif);
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
            /* Subimos a 450px para escritorio y 90% para móviles */
            width: 90%;
            max-width: 450px; 
            margin: 60px auto; /* Centrado y con aire arriba/abajo */
            padding: 35px; /* Más espacio interno para que se vea premium */
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }

        h3 { 
            text-align: center; 
            color: var(--accent-color, #4CAF50); 
            margin: 0 0 15px 0; 
            font-size: 1.8rem;
        }
        
        .error-tag, .success-tag {
            padding: 12px;
            border-radius: 4px;
            font-size: 0.9rem;
            text-align: center;
            margin-bottom: 5px;
        }

        .error-tag {
            background: #ff525222;
            color: #ff5252;
            border: 1px solid #ff5252;
        }

        .success-tag {
            background: #4CAF5022;
            color: var(--accent-color);
            border: 1px solid var(--accent-color);
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        input { 
            padding: 14px; 
            background: #0d0d0d; 
            border: 1px solid #444; 
            color: white; 
            border-radius: 6px;
            outline: none;
            transition: 0.3s;
            font-size: 1rem;
        }

        input:focus { border-color: var(--accent-color); background: #121212; }
        input:disabled { opacity: 0.5; cursor: not-allowed; }
        
        button { 
            padding: 14px; 
            background: var(--accent-color, #4CAF50); 
            color: #ffffff;
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: bold;
            font-size: 1rem;
            transition: 0.3s;
            margin-top: 10px;
        }

        button:hover:not(:disabled) {
            filter: brightness(1.2);
            box-shadow: 0 0 20px var(--accent-color);
        }

        button:disabled {
            background: #333;
            color: #777;
            cursor: not-allowed;
        }

        /* --- Ajustes para Celular --- */
        @media (max-width: 768px) {
            form {
                margin: 30px auto; 
                padding: 25px;
                width: 85%; /* Mantenemos la separación lateral */
            }

            h3 {
                font-size: 1.5rem;
            }

            input, button {
                font-size: 16px; /* Evita zoom molesto en móviles */
            }
        }
    `;

    constructor() {
        super();
        this.loading = false;
        this.errorMessage = '';
        this.successMessage = '';
    }

    _handleSubmit(e) {
        e.preventDefault();
        this.errorMessage = '';
        this.successMessage = '';
        const formData = new FormData(e.target);
        const rawData = Object.fromEntries(formData);

        try {
            const validatedData = UserSchema.parse(rawData);
            this._registrarEnFirebase(validatedData, e.target);
        } catch (error) {
            this.errorMessage = error.errors ? error.errors[0].message : "Datos inválidos";
        }
    }

    async _registrarEnFirebase(validatedData, formElement) {
        const { email, password, nombre } = validatedData;
        this.loading = true;
        this.errorMessage = '';

        try {
            // 1. Registro en Firebase
            await createUserWithEmailAndPassword(auth, email, password);

            // 2. Registro en tu Backend (Postgres)
            const response = await fetch(`${API_URL}/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nombre })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error en el servidor local");
            }

            // Obtenemos la respuesta del backend que ya incluye el rol
            const data = await response.json();
            // ---------------------------

            // 3. ÉXITO: Mostramos el mensaje visual
            this.successMessage = `🚀 ¡Bienvenido, ${nombre}! Redirigiendo...`;
            formElement.reset();

            // 4. REDIRECCIÓN AUTOMÁTICA
            setTimeout(() => {
                this.dispatchEvent(new CustomEvent('success', {
                    detail: {
                        email,
                        nombre,
                        rol: data.user.rol // <-- Ahora sí pasamos el rol real del backend
                    },
                    bubbles: true,
                    composed: true
                }));
            }, 2000);

        } catch (error) {
            this.errorMessage = error.code === 'auth/email-already-in-use'
                ? "Este correo ya está registrado."
                : error.message;
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
            <form @submit="${this._handleSubmit}">
                <h3>Crea tu cuenta</h3>
                
                ${this.errorMessage ? html`<div class="error-tag">${this.errorMessage}</div>` : ''}
                ${this.successMessage ? html`<div class="success-tag">${this.successMessage}</div>` : ''}

                <input type="text" name="nombre" placeholder="Nombre completo" 
                    ?disabled="${this.loading}" required>
                
                <input type="email" name="email" placeholder="Correo electrónico" 
                    ?disabled="${this.loading}" required>
                
                <input type="password" name="password" placeholder="Contraseña (mín. 6)" 
                    ?disabled="${this.loading}" required>
                
                <button type="submit" ?disabled="${this.loading}">
                    ${this.loading ? 'Registrando...' : 'Registrarme'}
                </button>
            </form>
        `;
    }
}

customElements.define('bm-registro', BmRegistro);