import { api } from "./api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export async function loginUser(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/auth/jwt/create/",
    payload,
  );

  localStorage.setItem("access_token", response.access);
  localStorage.setItem("refresh_token", response.refresh);

  return response;
}

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}