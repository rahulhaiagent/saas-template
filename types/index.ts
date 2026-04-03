export type { Profile } from "./database.types";

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };
