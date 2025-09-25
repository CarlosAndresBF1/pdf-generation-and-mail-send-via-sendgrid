export interface JwtPayload {
  id: number;
  name: string;
  lastName: string;
  email: string;
  userName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<JwtPayload, 'iat' | 'exp'>;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  lastName: string;
  email: string;
  userName: string;
}
