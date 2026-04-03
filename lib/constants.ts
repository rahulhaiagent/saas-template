export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "My SaaS App";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  dashboard: "/dashboard",
  profile: "/profile",
  settings: "/settings",
} as const;
