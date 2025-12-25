"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  orderApi,
  productApi,
  handleApiError,
  Order,
  Product,
} from "../../lib/api";
import Link from "next/link";
import Image from "next/image";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  console.log("loading products:", productsLoading);

  const fetchProductsByCodes = async (productCodes: string[]) => {
    try {
      setProductsLoading(true);
      const uniqueCodes = [...new Set(productCodes)];
      const productMap: Record<string, Product> = {};

      for (const code of uniqueCodes) {
        try {
          const response = await productApi.getByCode(code);
          if (response.data.success) {
            productMap[code] = response.data.data;
          }
        } catch (err) {
          console.error(`Error fetching product ${code}:`, err);
        }
      }

      setProducts(productMap);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await orderApi.getAll();
        if (response.data.success) {
          const ordersData = response.data.data;
          setOrders(ordersData);
          console.log("orders:", ordersData);

          const allProductCodes = ordersData.flatMap(order =>
            order.items.map(item => item.productCode)
          );

          if (allProductCodes.length > 0) {
            await fetchProductsByCodes(allProductCodes);
          }
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        const errorMessage = handleApiError(error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm);
    const matchesFilter =
      filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency: "BDT",
    }).format(amount);
  };

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  const handleViewOrder = (code: string) => {
    router.push(`/dashboard/orders/${code}`);
  };

  const handleEditOrder = (code: string) => {
    router.push(`/dashboard/orders/${code}/edit`);
  };

  const handleDeleteOrder = async (code: string, customerName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete order for "${customerName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(code);
      const response = await orderApi.delete(code);
      if (response.data.success) {
        // Remove deleted order from list
        setOrders(prev => prev.filter(order => order.code !== code));
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      setError(handleApiError(error));
    } finally {
      setDeleteLoading(null);
    }
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
                  : "Error Loading Orders"}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="mt-2 text-gray-600">
              Manage customer orders and fulfillment
            </p>
          </div>
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
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
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr
                  key={order._id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleViewOrder(order.code)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.customer.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 mb-2">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, index) => {
                        const product = products[item.productCode];
                        const productImage =
                          product?.media?.thumbnail ||
                          product?.media?.images?.[0];

                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                            onClick={e => e.stopPropagation()}
                          >
                            {productImage ? (
                              <Image
                                width={80}
                                height={80}
                                src={productImage}
                                alt={product?.name || item.productCode}
                                className="w-20 h-20 object-cover rounded border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                <svg
                                  className="w-8 h-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-xs text-gray-900 font-medium">
                                {product?.name || item.productCode}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.productCode} × {item.quantity}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(order.totals.final)}
                    </div>

                    {order?.totals?.discount !== undefined &&
                      order.totals.discount > 0 && (
                        <div className="text-xs text-green-600">
                          ({formatCurrency(order.totals.discount)} off)
                        </div>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleViewOrder(order.code);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Order"
                      >
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleEditOrder(order.code);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Order"
                      >
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1h2a1 1 0 011 1"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteOrder(order.code, order.customer.name);
                        }}
                        disabled={deleteLoading === order.code}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Order"
                      >
                        {deleteLoading === order.code ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
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
              No orders found
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
