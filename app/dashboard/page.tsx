"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../auth/context";
import { dashboardApi, handleApiError, Order } from "../lib/api";

interface InventoryAlert {
  code: string;
  name: string;
  quantity: number;
  status: string;
  category: string;
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<{
    products: {
      total: number;
      active: number;
      inactive: number;
      discontinued: number;
      soldOut: number;
      lowStock: number;
      outOfStock: number;
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
  }>({
    products: {
      total: 0,
      active: 0,
      inactive: 0,
      discontinued: 0,
      soldOut: 0,
      lowStock: 0,
      outOfStock: 0,
    },
    orders: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      thisYear: 0,
      last7Days: 0,
      last30Days: 0,
      last90Days: 0,
      byStatus: {},
      monthlyGrowth: 0,
    },
    revenue: {
      total: 0,
      totalSubtotal: 0,
      totalDiscount: 0,
      averageOrderValue: 0,
      currentMonth: {
        revenue: 0,
        subtotal: 0,
        discount: 0,
        orderCount: 0,
        averageOrderValue: 0,
      },
      lastMonth: {
        revenue: 0,
        subtotal: 0,
        discount: 0,
        orderCount: 0,
        averageOrderValue: 0,
      },
      yearToDate: {
        revenue: 0,
        orderCount: 0,
        averageOrderValue: 0,
      },
      monthlyGrowth: 0,
      revenueByMonth: [],
    },
    topSellingProducts: [],
    customers: {
      total: 0,
      topCustomers: [],
    },
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<{
    lowStock: { count: number; products: InventoryAlert[] };
    outOfStock: { count: number; products: InventoryAlert[] };
    highDiscount: { count: number; products: InventoryAlert[] };
    discontinued: { count: number; products: InventoryAlert[] };
    soldOut: { count: number; products: InventoryAlert[] };
  }>({
    lowStock: { count: 0, products: [] },
    outOfStock: { count: 0, products: [] },
    highDiscount: { count: 0, products: [] },
    discontinued: { count: 0, products: [] },
    soldOut: { count: 0, products: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode
    if (hasFetched) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard stats
        try {
          const statsResponse = await dashboardApi.getStats();
          if (statsResponse.data.success) {
            setStats(statsResponse.data.data);
          } else {
            setError(statsResponse.data.message);
            return;
          }
        } catch (statsError) {
          console.error("Error fetching stats:", statsError);
          const errorMessage = handleApiError(statsError);
          if (
            errorMessage.includes("timeout") ||
            errorMessage.includes("Unable to connect")
          ) {
            setError(errorMessage);
            return; // Stop further requests if backend is not available
          }
        }

        // Fetch recent orders
        try {
          const ordersResponse = await dashboardApi.getRecentOrders(5);
          if (ordersResponse.data.success) {
            setRecentOrders(ordersResponse.data.data.orders);
          } else {
            setError(ordersResponse.data.message);
            return;
          }
        } catch (ordersError) {
          console.error("Error fetching orders:", ordersError);
          const errorMessage = handleApiError(ordersError);
          if (
            errorMessage.includes("timeout") ||
            errorMessage.includes("Unable to connect")
          ) {
            setError(errorMessage);
            return;
          }
        }

        // Fetch inventory alerts
        try {
          const alertsResponse = await dashboardApi.getInventoryAlerts();
          if (alertsResponse.data.success) {
            setInventoryAlerts(alertsResponse.data.data);
          } else {
            setError(alertsResponse.data.message);
            return;
          }
        } catch (alertsError) {
          console.error("Error fetching alerts:", alertsError);
          const errorMessage = handleApiError(alertsError);
          if (
            errorMessage.includes("timeout") ||
            errorMessage.includes("Unable to connect")
          ) {
            setError(errorMessage);
            return;
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching dashboard data:", error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchDashboardData();
  }, [hasFetched]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    const isConnectionError =
      error.includes("timeout") ||
      error.includes("Unable to connect") ||
      error.includes("server is running");

    return (
      <div className="flex items-center justify-center h-64">
        <div
          className={`${
            isConnectionError
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
          } border rounded-lg p-6 max-w-md mx-4`}
        >
          <div className="flex items-center">
            <svg
              className={`w-6 h-6 ${
                isConnectionError ? "text-yellow-600" : "text-red-600"
              } mr-3`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694 1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3
                className={`text-lg font-medium ${
                  isConnectionError ? "text-yellow-800" : "text-red-800"
                }`}
              >
                {isConnectionError ? "Connection Error" : "Error Loading Data"}
              </h3>
              <p
                className={`text-sm ${
                  isConnectionError ? "text-yellow-600" : "text-red-600"
                } mt-2`}
              >
                {error}
              </p>
              {isConnectionError && (
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium mb-1">To resolve this issue:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Ensure the backend server is running on localhost:3000
                    </li>
                    <li>Check that MongoDB is connected</li>
                    <li>Verify the API endpoints are accessible</li>
                  </ul>
                </div>
              )}
              <button
                onClick={handleRetry}
                className={`mt-4 px-4 py-2 ${
                  isConnectionError
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white rounded-lg transition-colors`}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to OldenFyre Inventory Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.products.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.products.active} active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-50 rounded-xl p-3 border border-green-100">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.orders.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.orders.thisMonth} this month
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694 1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.products.lowStock}
              </p>
              <p className="text-xs text-red-500 mt-1">Requires attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-50 rounded-xl p-3 border border-purple-100">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Orders
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.orders.byStatus.pending || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Needs processing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      {(inventoryAlerts.lowStock.count > 0 ||
        inventoryAlerts.outOfStock.count > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Low Stock Alerts */}
            {inventoryAlerts.lowStock.products.map(alert => (
              <div
                key={alert.code}
                className="border rounded-lg p-4 bg-yellow-100 border-yellow-200 text-yellow-800"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334.213 2.98-1.732 3L13.732 4c-.77 1.333-.184 1.707.707 1.707H17m0 0a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 00-2-2V7a2 2 0 012 2h2A2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">
                      {alert.name} ({alert.code})
                    </p>
                    <p className="text-sm mt-1">
                      Low Stock:{" "}
                      <span className="font-semibold">{alert.quantity}</span>{" "}
                      items left
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Out of Stock Alerts */}
            {inventoryAlerts.outOfStock.products.map(alert => (
              <div
                key={alert.code}
                className="border rounded-lg p-4 bg-red-100 border-red-200 text-red-800"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334.213 2.98-1.732 3L13.732 4c-.77 1.333-.184 1.707.707 1.707H17m0 0a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 00-2-2V7a2 2 0 012 2h2A2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">
                      {alert.name} ({alert.code})
                    </p>
                    <p className="text-sm mt-1">
                      Out of Stock:{" "}
                      <span className="font-semibold">{alert.quantity}</span>{" "}
                      items
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h2>
              <a
                href="/dashboard/orders"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all
              </a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {order.code}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.customer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(order.totals.final)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/dashboard/products/new"
                className="flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Product
              </a>
              <a
                href="/dashboard/orders/new"
                className="flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                New Order
              </a>
              <a
                href="/dashboard/inventory"
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 012 2h2A2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Inventory
              </a>
              <button
                onClick={logout}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 00-2-2V7a2 2 0 012 2h2A2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
