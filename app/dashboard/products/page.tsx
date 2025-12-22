"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { productApi, handleApiError, Product } from "../../lib/api";
import Link from "next/link";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productApi.getAll();
        if (response.data.success) {
          setProducts(response.data.data);
          console.log("products:", response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        const errorMessage = handleApiError(error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "discontinued":
        return "bg-red-100 text-red-800";
      case "sold_out":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: "text-red-600", text: "Out of Stock" };
    if (quantity < 5) return { color: "text-yellow-600", text: "Low Stock" };
    return { color: "text-green-600", text: "In Stock" };
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

  const handleViewProduct = (code: string) => {
    router.push(`/dashboard/products/${code}`);
  };

  const handleEditProduct = (code: string) => {
    router.push(`/dashboard/products/${code}/edit`);
  };

  const handleDeleteProduct = async (code: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(code);
      const response = await productApi.delete(code);
      if (response.data.success) {
        // Remove the deleted product from the list
        setProducts(prev => prev.filter(product => product.code !== code));
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setError(handleApiError(error));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleShowProductDetails = async (code: string) => {
    try {
      setModalLoading(true);
      setModalError(null);
      setIsModalOpen(true);

      const response = await productApi.getByCode(code);
      if (response.data.success) {
        setSelectedProduct(response.data.data);
      } else {
        setModalError(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      setModalError(handleApiError(error));
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setModalError(null);
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
                  : "Error Loading Products"}
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
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-gray-600">Manage your inventory products</p>
          </div>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleShowProductDetails(product.code)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-28 w-28 flex-shrink-0">
                        {product.media?.thumbnail ? (
                          <Image
                            src={product.media.thumbnail}
                            alt={product.name}
                            width={112}
                            height={112}
                            className="h-28 w-28 rounded-lg object-cover border border-gray-200"
                            onError={e => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/48x48?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="h-28 w-28 rounded-lg bg-gray-200 flex items-center justify-center">
                            <svg
                              className="h-12 w-12 text-gray-400"
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.code}
                        </div>
                        {product.series && (
                          <div className="text-xs text-gray-400">
                            {product.series}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(product.pricing.sell)}
                      </div>
                      {product?.pricing?.discount !== undefined &&
                        product.pricing.discount > 0 && (
                          <div className="text-xs text-green-600">
                            ({formatCurrency(product.pricing.discount)} off)
                          </div>
                        )}

                      <div className="text-xs text-gray-500">
                        Buy: {formatCurrency(product.pricing.buy)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold ${stockStatus.color}`}
                      >
                        {product.quantity}
                      </div>
                      <div className={`text-xs ${stockStatus.color}`}>
                        {stockStatus.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleViewProduct(product.code);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Product"
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
                            handleEditProduct(product.code);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Product"
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
                            handleDeleteProduct(product.code, product.name);
                          }}
                          disabled={deleteLoading === product.code}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Product"
                        >
                          {deleteLoading === product.code ? (
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
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
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
              No products found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-hidden z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#00000067] bg-opacity-50 transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Modal Panel - Right Side */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Details
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {modalLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : modalError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-600 mr-3"
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
                        <h3 className="text-sm font-medium text-red-800">
                          Error Loading Product
                        </h3>
                        <p className="text-sm text-red-600 mt-1">
                          {modalError}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedProduct ? (
                  <div className="space-y-6">
                    {/* Product Image */}
                    <div className="flex justify-center">
                      {selectedProduct.media?.thumbnail ? (
                        <Image
                          src={selectedProduct.media.thumbnail}
                          alt={selectedProduct.name}
                          width={192}
                          height={192}
                          className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                          onError={e => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/192x192?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-24 h-24 text-gray-400"
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
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedProduct.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Code: {selectedProduct.code}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedProduct.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Series</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedProduct.series || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              selectedProduct.status
                            )}`}
                          >
                            {selectedProduct.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Stock Quantity
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedProduct.quantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedProduct.description && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Description
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}

                    {/* Pricing */}
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Pricing Information
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Buy Price</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(selectedProduct.pricing.buy)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sell Price</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(selectedProduct.pricing.sell)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Discount</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedProduct.pricing.discount
                              ? `${selectedProduct.pricing.discount}%`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Images */}
                    {selectedProduct.media?.images &&
                      selectedProduct.media.images.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-3">
                            Additional Images
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.media.images.map(
                              (image, index) => (
                                <Image
                                  key={index}
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  width={80}
                                  height={80}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  onError={e => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/80x80?text=No+Image";
                                  }}
                                />
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Timestamps */}
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Timestamps</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm text-gray-900">
                            {new Date(
                              selectedProduct.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm text-gray-900">
                            {new Date(
                              selectedProduct.updatedAt
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (selectedProduct) {
                        router.push(
                          `/dashboard/products/${selectedProduct.code}`
                        );
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Full Details
                  </button>
                  <button
                    onClick={() => {
                      if (selectedProduct) {
                        router.push(
                          `/dashboard/products/${selectedProduct.code}/edit`
                        );
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
