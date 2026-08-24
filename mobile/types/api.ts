export interface UserDto {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

/** Response of POST /auth/register and POST /auth/login (API.md §9–10). */
export interface AuthSessionResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  user?: UserDto | null;
}

/** Response of POST /auth/refresh (API.md §11). */
export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: { field: string; message: string }[];
  };
}

export interface HealthResponse {
  status: string;
}

export interface DatabaseHealthResponse {
  status: string;
  database: string;
}

export type ConnectionState = 'loading' | 'online' | 'offline';
