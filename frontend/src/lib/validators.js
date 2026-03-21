import { z } from "zod";

export const UserSchema = z.object({
    nombre: z.string()
        .min(3, "El nombre es muy corto")
        .max(50)
        .trim(), // Sanitiza quitando espacios extra
    email: z.string()
        .email("Correo no válido")
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
});