// src/lib/validators.js
import { z } from 'zod';

export const UserSchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    email: z.string().email("Correo electrónico no válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

// También agregamos uno para el Login de una vez
export const LoginSchema = z.object({
    email: z.string().email("Correo no válido"),
    password: z.string().min(1, "La contraseña es requerida")
});