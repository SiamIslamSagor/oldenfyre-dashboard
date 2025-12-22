"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { productApi, handleApiError, Product } from "../../../lib/api";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productCode = params.code as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productApi.getByCode(productCode);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    if (productCode) {
      fetchProduct();
    }
  }, [productCode]);

  const handleDelete = async () => {
    if (
      !product ||
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await productApi.delete(product.code);
      if (response.data.success) {
        router.push("/dashboard/products");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setError(handleApiError(error));
    } finally {
      setDeleteLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
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
                Error Loading Product
              </h3>
              <p className="text-sm text-red-600 mt-2">
                {error || "Product not found"}
              </p>
              <button
                onClick={() => router.push("/dashboard/products")}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.quantity);

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
                {product.name}
              </h1>
              <p className="mt-1 text-gray-600">Product Code: {product.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href={`/dashboard/products/${product.code}/edit`}
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
              Edit Product
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
                  Delete Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Product Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-sm font-medium text-gray-900">
                  {product.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Series</p>
                <p className="text-sm font-medium text-gray-900">
                  {product.series || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    product.status
                  )}`}
                >
                  {product.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Quantity</p>
                <div className="flex items-center">
                  <p className="text-sm font-semibold text-gray-900 mr-2">
                    {product.quantity}
                  </p>
                  <span className={`text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>
            </div>
            {product.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-sm text-gray-900 mt-1">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Buy Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(product.pricing.buy)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sell Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(product.pricing.sell)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p className="text-lg font-semibold text-gray-900">
                  {product.pricing.discount
                    ? `${product.pricing.discount}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Media */}
          {product.media &&
            (product.media.thumbnail || product.media.images) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Images
                </h2>
                <div className="space-y-4">
                  {product.media.thumbnail && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Thumbnail</p>
                      <img
                        src={product.media.thumbnail}
                        alt="Product thumbnail"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        onError={e => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/128x128?text=No+Image";
                        }}
                      />
                    </div>
                  )}
                  {product.media.images && product.media.images.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Additional Images
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.media.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                            onError={e => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/96x96?text=No+Image";
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timestamps
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm text-gray-900">
                  {formatDate(product.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm text-gray-900">
                  {formatDate(product.updatedAt)}
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
                href={`/dashboard/products/${product.code}/edit`}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Product
              </a>
              <button
                onClick={() => router.push("/dashboard/products")}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
