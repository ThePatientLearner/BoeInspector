/**
 * Resultado explícito de una operación que puede fallar.
 * El dominio y los casos de uso devuelven Result en lugar de lanzar
 * excepciones: el fallo forma parte de la firma.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
