import axios, { AxiosInstance, AxiosResponse } from "axios";

// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
        products: {
          total: number;
          active: number;
          inactive: number;
          discontinued: number;
          soldOut: number;
          lowStock: number;
          outOfStock: number;
          totalInventoryValue: number;
          totalCostValue: number;
          totalPotentialRevenue: number;
          averageProductPrice: number;
          averageProductCost: number;
          byCategory: Array<{
            _id: string;
            count: number;
            totalQuantity: number;
            totalValue: number;
          }>;
          totalProductQuantity: number;
        };
        orders: {
          total: number;
          thisMonth: number;
          lastMonth: number;
          thisYear: number;
          last7Days: number;
          last30Days: number;
          last90Days: number;
          byStatus: Record<string, number>;
          monthlyGrowth: number;
        };
        revenue: {
          total: number;
          totalSubtotal: number;
          totalDiscount: number;
          averageOrderValue: number;
          currentMonth: {
            revenue: number;
            subtotal: number;
            discount: number;
            orderCount: number;
            averageOrderValue: number;
          };
          lastMonth: {
            revenue: number;
            subtotal: number;
            discount: number;
            orderCount: number;
            averageOrderValue: number;
          };
          yearToDate: {
            revenue: number;
            orderCount: number;
            averageOrderValue: number;
          };
          monthlyGrowth: number;
          revenueByMonth: Array<{
            _id: number;
            revenue: number;
            orderCount: number;
            averageOrderValue: number;
          }>;
        };
        topSellingProducts: Array<{
          _id: string;
          totalQuantity: number;
          totalRevenue: number;
          orderCount: number;
          productDetails: {
            name: string;
            category: string;
          };
        }>;
        customers: {
          total: number;
          topCustomers: Array<{
            _id: string;
            name: string;
            orderCount: number;
            totalSpent: number;
            averageOrderValue: number;
            firstOrderDate: string;
            lastOrderDate: string;
          }>;
        };
      }>
    >
  > => apiClient.get("/dashboard/stats"),

  // Get recent orders
  getRecentOrders: (
    limit: number = 5
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        orders: Order[];
        count: number;
        limit: number;
      }>
    >
  > => apiClient.get(`/dashboard/recent-orders?limit=${limit}`),

  // Get inventory alerts
  getInventoryAlerts: (): Promise<
    AxiosResponse<
      ApiResponse<{
        lowStock: {
          count: number;
          products: Array<{
            code: string;
            name: string;
            quantity: number;
            status: string;
            category: string;
          }>;
        };
        outOfStock: {
          count: number;
          products: Array<{
            code: string;
            name: string;
            quantity: number;
            status: string;
            category: string;
          }>;
        };
        highDiscount: {
          count: number;
          products: Array<{
            code: string;
            name: string;
            quantity: number;
            status: string;
            category: string;
          }>;
        };
        discontinued: {
          count: number;
          products: Array<{
            code: string;
            name: string;
            quantity: number;
            status: string;
            category: string;
          }>;
        };
        soldOut: {
          count: number;
          products: Array<{
            code: string;
            name: string;
            quantity: number;
            status: string;
            category: string;
          }>;
        };
      }>
    >
  > => apiClient.get("/dashboard/inventory-alerts"),
};

// Utility functions
export const handleApiError = (error: unknown): string => {
  // Handle timeout errors specifically
  if (error && typeof error === "object" && "code" in error) {
    const axiosError = error as { code?: string; message?: string };
    if (
      axiosError.code === "ECONNABORTED" ||
      axiosError.message?.includes("timeout")
    ) {
      return "Connection timeout. The server is taking too long to respond. Please check if the backend server is running.";
    }
  }

  // Handle network errors
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: { message?: string; error?: string };
        status?: number;
      };
    };
    if (axiosError.response?.status === 0 || !axiosError.response) {
      return "Unable to connect to the server. Please check if the backend server is running and accessible.";
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
  }

  // Handle other error types
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }

  return "An unexpected error occurred while connecting to the server.";
};

export const isNetworkError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "code" in error) {
    const axiosError = error as { code?: string };
    return (
      axiosError.code === "ECONNABORTED" ||
      axiosError.code === "NETWORK_ERROR" ||
      axiosError.code === "ERR_NETWORK"
    );
  }
  return false;
};

export const isTimeoutError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "code" in error) {
    const axiosError = error as { code?: string; message?: string };
    return (
      axiosError.code === "ECONNABORTED" ||
      !!axiosError.message?.includes("timeout")
    );
  }
  return false;
};

export default apiClient;
