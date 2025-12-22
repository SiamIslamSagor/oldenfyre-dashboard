"use client";

import { useState, useEffect } from "react";
import { dashboardApi, handleApiError, productApi } from "../../lib/api";

interface InventoryAlert {
  code: string;
  name: string;
  quantity: number;
  status: string;
  category: string;
}

interface InventoryItem {
  _id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  pricing: {
    buy: number;
    sell: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<{
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all products instead of inventory alerts for complete data
        const productsResponse = await productApi.getAll();
        console.log("products data:", productsResponse);

        if (productsResponse.data.success) {
          const allProducts = productsResponse.data.data;

          // Fetch inventory alerts for alert counts
          const alertsResponse = await dashboardApi.getInventoryAlerts();
          if (alertsResponse.data.success) {
            setAlerts(alertsResponse.data.data);
          }

          // Transform products to inventory format with proper status calculation
          const inventoryData = allProducts.map(
            (product): InventoryItem => ({
              _id: product._id,
              code: product.code,
              name: product.name,
              category: product.category,
              quantity: product.quantity,
              lowStockThreshold: 5, // Default threshold
              status:
                product.quantity === 0
                  ? "out_of_stock"
                  : product.quantity < 5
                  ? "low_stock"
                  : ("in_stock" as const),
              pricing: {
                buy: product.pricing.buy,
                sell: product.pricing.sell,
              },
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
            })
          );

          setInventory(inventoryData);
        } else {
          setError(productsResponse.data.message);
        }
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Priority order: out_of_stock first, then low_stock, then others
      const statusPriority = {
        out_of_stock: 0,
        low_stock: 1,
        in_stock: 2,
      };

      const aPriority = statusPriority[a.status] ?? 999;
      const bPriority = statusPriority[b.status] ?? 999;

      return aPriority - bPriority;
    });

  console.log("filteredInventory", filteredInventory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "bg-green-100 text-green-800";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockPercentage = (current: number, threshold: number) => {
    return Math.min((current / threshold) * 100, 200);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
                {isConnectionError
                  ? "Connection Error"
                  : "Error Loading Inventory Data"}
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
                    <li>Ensure backend server is running on localhost:3000</li>
                    <li>Check that MongoDB is connected</li>
                    <li>Verify API endpoints are accessible</li>
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
        <h1 className="text-3xl font-bold text-gray-900">
          Inventory Management
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor stock levels and manage inventory alerts
        </p>
      </div>

      {/* Inventory Alerts */}
      {(alerts.lowStock.count > 0 || alerts.outOfStock.count > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Low Stock Alerts */}
            {alerts.lowStock.products.map(alert => (
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
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334.213 2.98-1.732 3L13.732 4c-.77 1.333-.184 1.707.707 1.707H17m0 0a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 00-2-2V7a2 2 0 012-2h2A2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
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
            {alerts.outOfStock.products.map(alert => (
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
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334.213 2.98-1.732 3L13.732 4c-.77 1.333-.184 1.707.707 1.707H17m0 0a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 00-2-2V7a2 2 0 012-2h2A2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
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

      {/* Filters */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Restocked
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item, idx) => (
                <tr
                  key={item._id + idx * 999}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">{item.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 mr-4">
                        <div className="text-sm text-gray-900">
                          {item.quantity}
                        </div>
                        <div className="text-xs text-gray-500">
                          Threshold: {item.lowStockThreshold}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="italic">Will be implemented</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <svg
                          className="w-5 h-5"
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
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2h2a2 2 0 012 2"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No inventory items found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
