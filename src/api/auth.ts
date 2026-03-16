import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface LoginResponse {
  token: string
  expiresIn: number
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // Use axios directly without interceptor for login
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
    email,
    password
  })
  return response.data
}
