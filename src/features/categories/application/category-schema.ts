import { z } from "zod";

export const categorySchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Informe uma cor hexadecimal válida."),
  icon: z.string().trim().max(40, "O ícone deve ter no máximo 40 caracteres.").optional(),
  name: z.string().trim().min(1, "Informe o nome da categoria.").max(60, "O nome deve ter no máximo 60 caracteres."),
});