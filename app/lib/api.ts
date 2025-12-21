import axios, { AxiosInstance, AxiosResponse } from "axios";

// API Configuration
// const BASE_URL = "https://oldenfyre-inventory.vercel.app/api";
const BASE_URL = "http://localhost:3000/api";

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  error => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// Types based on backend API documentation
export interface Product {
  _id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  series?: string;
  pricing: {
    buy: number;
    sell: number;
    discount?: number;
  };
  media?: {
    thumbnail?: string;
    images?: string[];
  };
  status: "active" | "inactive" | "discontinued" | "sold_out" | "deleted";
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  code: string;
  customer: {
    name: string;
    phone: string;
    alt_phone?: string;
    address: string;
  };
  items: Array<{
    productCode: string;
    quantity: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    discount?: number;
    final: number;
  };
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  series?: string;
  pricing: {
    buy: number;
    sell: number;
    discount?: number;
  };
  media?: {
    thumbnail?: string;
    images?: string[];
  };
  quantity: number;
}

export interface CreateOrderRequest {
  customer: {
    name: string;
    phone: string;
    alt_phone?: string;
    address: string;
  };
  items: Array<{
    productCode: string;
    quantity: number;
    price?: number;
  }>;
  totals?: {
    discount?: number;
  };
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  series?: string;
  pricing?: {
    buy?: number;
    sell?: number;
    discount?: number;
  };
  media?: {
    thumbnail?: string;
    images?: string[];
  };
  quantity?: number;
  status?: "active" | "inactive" | "discontinued" | "sold_out";
}

export interface UpdateOrderRequest {
  customer?: {
    name?: string;
    phone?: string;
    alt_phone?: string;
    address?: string;
  };
  items?: Array<{
    productCode: string;
    quantity: number;
    price?: number;
  }>;
  totals?: {
    discount?: number;
  };
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  errors?: string[];
}

// Product API endpoints
export const productApi = {
  // Get all products
  getAll: (): Promise<AxiosResponse<ApiResponse<Product[]>>> =>
    apiClient.get("/products"),

  // Get single product by code
  getByCode: (code: string): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.get(`/products/${code}`),

  // Create new product
  create: (
    product: CreateProductRequest
  ): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.post("/products", product),

  // Update product by code
  update: (
    code: string,
    product: UpdateProductRequest
  ): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.put(`/products/${code}`, product),

  // Delete product (soft delete) by code
  delete: (code: string): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.delete(`/products/${code}`),
};

// Order API endpoints
export const orderApi = {
  // Get all orders
  getAll: (): Promise<AxiosResponse<ApiResponse<Order[]>>> =>
    apiClient.get("/orders"),

  // Get single order by code
  getByCode: (code: string): Promise<AxiosResponse<ApiResponse<Order>>> =>
    apiClient.get(`/orders/${code}`),

  // Create new order
  create: (
    order: CreateOrderRequest
  ): Promise<AxiosResponse<ApiResponse<Order>>> =>
    apiClient.post("/orders", order),

  // Update order by code
  update: (
    code: string,
    order: UpdateOrderRequest
  ): Promise<AxiosResponse<ApiResponse<Order>>> =>
    apiClient.put(`/orders/${code}`, order),

  // Delete order (soft delete) by code
  delete: (code: string): Promise<AxiosResponse<ApiResponse<Order>>> =>
    apiClient.delete(`/orders/${code}`),

  // Update order status
  updateStatus: (
    code: string,
    status: { status: string }
  ): Promise<AxiosResponse<ApiResponse<Order>>> =>
    apiClient.patch(`/orders/${code}/status`, status),
};

// Dashboard API endpoints (for stats and overview)
export const dashboardApi = {
  // Get dashboard statistics
  getStats: (): Promise<
    AxiosResponse<
      ApiResponse<{
        totalProducts: number;
        totalOrders: number;
        lowStockItems: number;
        pendingOrders: number;
      }>
    >
  > => apiClient.get("/dashboard/stats"),

  // Get recent orders
  getRecentOrders: (
    limit: number = 5
  ): Promise<AxiosResponse<ApiResponse<Order[]>>> =>
    apiClient.get(`/dashboard/recent-orders?limit=${limit}`),

  // Get inventory alerts
  getInventoryAlerts: (): Promise<
    AxiosResponse<
      ApiResponse<
        Array<{
          productCode: string;
          productName: string;
          currentStock: number;
          threshold: number;
          severity: "low" | "critical";
        }>
      >
    >
  > => apiClient.get("/dashboard/inventory-alerts"),
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.code === "NETWORK_ERROR";
};

export default apiClient;
