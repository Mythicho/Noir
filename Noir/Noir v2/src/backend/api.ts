/**
 * NOIR PRODUCTION API CLIENT
 * 
 * Connects frontend to Node.js Express backend.
 * Handles authentication tokens, error handling, and rate limiting.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "noir-session-token";
const RATE_LIMIT_DELAY = 300; // ms between requests
let lastRequestTime = 0;

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
  notes: string;
  photo: string;
  isAdmin: boolean;
};

export type ApiError = {
  error: string;
};

/**
 * Rate limiting helper to prevent abuse
 */
async function rateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY) {
    await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Get stored authentication token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store authentication token
 */
function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear authentication token
 */
function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  await rateLimit();

  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error(`API Error [${endpoint}]:`, message);
    throw new Error(message);
  }
}

/**
 * AUTHENTICATION API
 */
export const authApi = {
  async signup(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    pin?: string;
  }): Promise<{ token: string; user: ApiUser }> {
    const result = await apiRequest<{ token: string; user: ApiUser }>(
      "/api/auth/signup",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    setStoredToken(result.token);
    return result;
  },

  async login(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
    const result = await apiRequest<{ token: string; user: ApiUser }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    setStoredToken(result.token);
    return result;
  },

  async getMe(): Promise<ApiUser> {
    return apiRequest<ApiUser>("/api/auth/me");
  },

  async updateProfile(data: Partial<ApiUser>): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<{ ok: boolean }> {
    const result = await apiRequest<{ ok: boolean }>("/api/auth/logout", {
      method: "POST",
    });
    clearStoredToken();
    return result;
  },

  isAuthenticated(): boolean {
    return !!getStoredToken();
  },
};

/**
 * PRODUCTS API
 */
export const productsApi = {
  async list(): Promise<any[]> {
    return apiRequest("/api/products");
  },

  async get(id: string): Promise<any> {
    return apiRequest(`/api/products/${id}`);
  },
};

/**
 * ORDERS API
 */
export const ordersApi = {
  async list(): Promise<any[]> {
    return apiRequest("/api/orders/my-orders");
  },

  async create(orderData: any): Promise<any> {
    return apiRequest("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  async getAll(): Promise<any[]> {
    return apiRequest("/api/orders");
  },

  async updateStatus(orderId: string, status: string): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

/**
 * SUBSCRIPTIONS API
 */
export const subscriptionsApi = {
  async create(data: any): Promise<any> {
    return apiRequest("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async list(): Promise<any[]> {
    return apiRequest("/api/subscriptions");
  },

  async update(id: string, data: any): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/api/subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async cancel(id: string): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/api/subscriptions/${id}/cancel`, {
      method: "POST",
    });
  },
};

/**
 * ADMIN API
 */
export const adminApi = {
  async getUsers(): Promise<ApiUser[]> {
    return apiRequest("/api/admin/users");
  },

  async getOrders(): Promise<any[]> {
    return apiRequest("/api/admin/orders");
  },

  async getStats(): Promise<any> {
    return apiRequest("/api/admin/stats");
  },
};
