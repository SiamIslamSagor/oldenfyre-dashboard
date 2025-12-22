"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  orderApi,
  productApi,
  handleApiError,
  Order,
  Product,
} from "../../../lib/api";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderCode = params.code as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        const orderResponse = await orderApi.getByCode(orderCode);
        if (orderResponse.data.success) {
          setOrder(orderResponse.data.data);
        } else {
          setError(orderResponse.data.message);
          return;
        }

        // Fetch all products to get product details
        const productsResponse = await productApi.getAll();
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    if (orderCode) {
      fetchData();
    }
  }, [orderCode]);

  const handleDelete = async () => {
    if (
      !order ||
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await orderApi.delete(order.code);
      if (response.data.success) {
        router.push("/dashboard/orders");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      setError(handleApiError(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setStatusLoading(true);
      const response = await orderApi.updateStatus(order.code, {
        status: newStatus,
      });
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(handleApiError(error));
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency: "BDT",
    }).format(amount);
  };

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

  const getProductDetails = (productCode: string) => {
    return products.find(p => p.code === productCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-red-600 mr-3"
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
              <h3 className="text-lg font-medium text-red-800">
                Error Loading Order
              </h3>
              <p className="text-sm text-red-600 mt-2">
                {error || "Order not found"}
              </p>
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Back to Orders
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
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order Details
              </h1>
              <p className="mt-1 text-gray-600">Order Code: {order.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href={`/dashboard/orders/${order.code}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1h2a1 1 0 011 1"
                />
              </svg>
              Edit Order
            </a>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Delete Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.customer.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.customer.phone}
                </p>
              </div>
              {order.customer.alt_phone && (
                <div>
                  <p className="text-sm text-gray-600">Alternative Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.customer.alt_phone}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.customer.address}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => {
                    const productDetails = getProductDetails(item.productCode);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {productDetails?.name || item.productCode}
                            </div>
                            <div className="text-gray-500">
                              {item.productCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.quantity}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(item.price)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-sm font-medium text-gray-900"
                    >
                      Subtotal:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                      {formatCurrency(order.totals.subtotal)}
                    </td>
                  </tr>
                  {order.totals.discount && order.totals.discount > 0 && (
                    <tr className="bg-gray-50">
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right text-sm font-medium text-gray-900"
                      >
                        Discount:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        -{formatCurrency(order.totals.discount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-100">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-sm font-medium text-gray-900"
                    >
                      Final Total:
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-gray-900">
                      {formatCurrency(order.totals.final)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Status
            </h2>
            <div className="space-y-4">
              <div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="space-y-2">
                  {[
                    "pending",
                    "confirmed",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={statusLoading || status === order.status}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        status === order.status
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {statusLoading
                        ? "Updating..."
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timestamps
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm text-gray-900">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm text-gray-900">
                  {formatDate(order.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <a
                href={`/dashboard/orders/${order.code}/edit`}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Order
              </a>
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
