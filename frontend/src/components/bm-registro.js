import { LitElement, html, css } from 'lit';
import { UserSchema } from '../lib/validators.js';
import { auth } from '../firebase-config.js'; 
import { createUserWithEmailAndPassword } from "firebase/auth";

export class BmRegistro extends LitElement {
    static styles = css`
        form {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 300px;
            margin: 20px auto;
        }
        input { padding: 8px; }
        button { padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    `;

    _handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const rawData = Object.fromEntries(formData);

        try {
            const validatedData = UserSchema.parse(rawData);
            this._registrarEnFirebase(validatedData);
        } catch (error) {
            alert(error.errors[0].message);
        }
    }

    async _registrarEnFirebase({ email, password }) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Usuario creado:", userCredential.user);
            alert("Usuario registrado correctamente.");
        } catch (error) {
            alert("Error: " + error.message);
        }
    }

    render() {
        return html`
            <form @submit="${this._handleSubmit}">
                <h3>Registro de Usuario</h3>
                <input type="text" name="nombre" placeholder="Nombre completo" required>
                <input type="email" name="email" placeholder="Correo" required>
                <input type="password" name="password" placeholder="Contraseña" required>
                <button type="submit">Crear cuenta</button>
            </form>
        `;
    }
}

customElements.define('bm-registro', BmRegistro);