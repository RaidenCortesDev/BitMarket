import { LitElement, html, css } from 'lit';
import { LoginSchema } from '../lib/validators.js'; // Importamos el que acabamos de crear
import { auth } from '../firebase-config.js';
import { signInWithEmailAndPassword } from "firebase/auth";
import { API_URL } from '../../config.js';

export class BmLogin extends LitElement {
    static properties = {
        loading: { type: Boolean },
        errorMessage: { type: String }
    };

    /*
    static styles = css`
        :host {
            display: block;
            font-family: var(--main-font, sans-serif);
        }
        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-width: 350px;
            margin: 40px auto;
            padding: 25px;
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        h3 { text-align: center; color: var(--accent-color, #4CAF50); margin: 0 0 10px 0; }
        
        .error-tag {
            background: #ff525222;
            color: #ff5252;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.9rem;
            border: 1px solid #ff5252;
            text-align: center;
        }

        input { 
            padding: 12px; 
            background: #0d0d0d; 
            border: 1px solid #444; 
            color: white; 
            border-radius: 6px;
            outline: none;
            transition: 0.3s;
        }
        input:focus { border-color: var(--accent-color); }
        
        button { 
            padding: 12px; 
            background: var(--accent-color, #4CAF50); 
            color: #ffffff;
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: bold;
            transition: 0.3s;
        }
        button:hover:not(:disabled) {
            filter: brightness(1.2);
            box-shadow: 0 0 15px var(--accent-color);
        }
    `;
    */

    static styles = css`
        :host {
            display: block;
            font-family: var(--main-font, sans-serif);
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
            /* Aumentamos a 450px para que luzca más imponente en PC */
            width: 90%;
            max-width: 450px; 
            margin: 80px auto; /* Más espacio arriba y abajo */
            padding: 35px; /* Más aire interno */
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }

        h3 { 
            text-align: center; 
            color: var(--accent-color, #4CAF50); 
            margin: 0 0 15px 0; 
            font-size: 1.8rem; /* Título un poco más grande */
        }
        
        .error-tag {
            background: #ff525222;
            color: #ff5252;
            padding: 12px;
            border-radius: 4px;
            font-size: 0.9rem;
            border: 1px solid #ff5252;
            text-align: center;
            margin-bottom: 10px;
        }

        input { 
            padding: 14px; /* Inputs más altos para mejor click/touch */
            background: #0d0d0d; 
            border: 1px solid #444; 
            color: white; 
            border-radius: 6px;
            outline: none;
            transition: 0.3s;
            font-size: 1rem;
        }

        input:focus { 
            border-color: var(--accent-color);
            background: #121212; 
        }
        
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

        /* --- Ajustes para Celular --- */
        @media (max-width: 768px) {
            form {
                margin: 40px auto; /* Reducimos el margen superior en móvil */
                padding: 25px;
                width: 85%; /* Le damos más separación de los bordes laterales */
            }

            h3 {
                font-size: 1.5rem;
            }

            input, button {
                font-size: 16px; /* Evita zoom automático en iOS */
            }
        }
    `;

    constructor() {
        super();
        this.loading = false;
        this.errorMessage = '';
    }

    async _handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const rawData = Object.fromEntries(formData);

        try {
            // Validar con Zod
            const validatedData = LoginSchema.parse(rawData);
            this.loading = true;

            // 1. Login en Firebase
            await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);

            // 2. Login en tu Backend
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validatedData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // 3. Notificar éxito a la app principal
            this.dispatchEvent(new CustomEvent('success', {
                detail: { id: data.user.id, nombre: data.user.nombre, rol: data.user.rol,saldo: data.user.saldo },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                this.errorMessage = "Correo o contraseña incorrectos. Inténtalo de nuevo.";
            } else if (error.errors) {
                // Errores de validación de Zod
                this.errorMessage = error.errors[0].message;
            } else {
                // Cualquier otro error (del backend o de red)
                this.errorMessage = error.message || "Ocurrió un error inesperado.";
            }
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
            <form @submit="${this._handleSubmit}">
                <h3>Iniciar Sesión</h3>
                ${this.errorMessage ? html`<div class="error-tag">${this.errorMessage}</div>` : ''}
                
                <input type="email" name="email" placeholder="Correo electrónico" ?disabled="${this.loading}" required>
                <input type="password" name="password" placeholder="Contraseña" ?disabled="${this.loading}" required>
                
                <button type="submit" ?disabled="${this.loading}">
                    ${this.loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        `;
    }
}
customElements.define('bm-login', BmLogin);