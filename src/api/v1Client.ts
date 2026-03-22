import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Well-known admin key for the admin dashboard.
 * Not a secret — CORS-restricted to admin origins, rate limited per IP.
 */
const ADMIN_API_KEY = 'bvk_admin_public'

export const v1Client = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ADMIN_API_KEY
  }
})
