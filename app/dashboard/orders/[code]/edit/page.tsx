"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  orderApi,
  productApi,
  handleApiError,
  Order,
  UpdateOrderRequest,
  Product,
} from "../../../../lib/api";

interface OrderItem {
  productCode: string;
  quantity: number;
  price: number;
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderCode = params.code as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateOrderRequest>({
    customer: {
      name: "",
      phone: "",
      alt_phone: "",
      address: "",
    },
    items: [
      {
        productCode: "",
        quantity: 1,
        price: 0,
      },
    ],
    totals: {
      discount: 0,
    },
    status: "pending",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        const orderResponse = await orderApi.getByCode(orderCode);
        if (orderResponse.data.success) {
          const orderData = orderResponse.data.data;
          setOrder(orderData);
          setFormData({
            customer: {
              name: orderData.customer.name,
              phone: orderData.customer.phone,
              alt_phone: orderData.customer.alt_phone || "",
              address: orderData.customer.address,
            },
            items: orderData.items,
            totals: {
              discount: orderData.totals.discount || 0,
            },
            status: orderData.status,
          });
        } else {
          setError(orderResponse.data.message);
          return;
        }

        // Fetch all products
        const productsResponse = await productApi.getAll();
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    if (orderCode) {
      fetchData();
    }
  }, [orderCode]);

  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [name]: value,
      },
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...(formData.items || [])];

    if (field === "productCode") {
      newItems[index] = {
        ...newItems[index],
        [field]: value as string,
      };

      // Auto-fill price when product is selected
      const selectedProduct = products.find(p => p.code === value);
      if (selectedProduct) {
        newItems[index].price = selectedProduct.pricing.sell;
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
    }

    setFormData(prev => ({
      ...prev,
      items: newItems,
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          productCode: "",
          quantity: 1,
          price: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if ((formData.items?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        items: (prev.items || []).filter((_, i) => i !== index),
      }));
    }
  };

  const handleTotalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      totals: {
        ...prev.totals,
        [name]: value,
      },
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value as UpdateOrderRequest["status"],
    }));
  };

  const calculateSubtotal = () => {
    return (formData.items || []).reduce(
      (sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
      0
    );
  };

  const calculateFinal = () => {
    const subtotal = calculateSubtotal();
    const discount = formData.totals?.discount || 0;
    return Math.max(0, subtotal - discount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate items
      const validItems = (formData.items || []).filter(
        item => item.productCode && (item?.quantity || 0) > 0
      );
      if (validItems.length === 0) {
        setError("Please add at least one valid item to order");
        return;
      }

      const orderData: UpdateOrderRequest = {
        ...formData,
        items: validItems,
      };

      const response = await orderApi.update(orderCode, orderData);
      if (response.data.success) {
        router.push(`/dashboard/orders/${orderCode}`);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      setError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency: "BDT",
    }).format(amount);
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Order</h1>
            <p className="mt-2 text-gray-600">
              Update order information for {order.customer.name}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.customer?.name || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.customer?.phone || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="alt_phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Alternative Phone
                </label>
                <input
                  type="tel"
                  id="alt_phone"
                  name="alt_phone"
                  value={formData.customer?.alt_phone || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={2}
                  value={formData.customer?.address || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Order Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {(formData.items || []).map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        value={item.productCode}
                        onChange={e =>
                          handleItemChange(index, "productCode", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product.code} value={product.code}>
                            {product.name} ({product.code}) - Stock:{" "}
                            {product.quantity}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e =>
                          handleItemChange(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="text-sm text-gray-900">
                        Total:{" "}
                        {formatCurrency((item.price || 0) * item.quantity)}
                      </div>
                      {(formData.items?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
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
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Totals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="discount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Discount
                </label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  min="0"
                  step="0.01"
                  value={formData.totals?.discount || 0}
                  onChange={handleTotalsChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Order Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Final Total:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(calculateFinal())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating..." : "Update Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
