"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  productApi,
  handleApiError,
  Product,
  UpdateProductRequest,
} from "../../../../lib/api";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productCode = params.code as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProductRequest>({
    name: "",
    description: "",
    category: "",
    series: "",
    pricing: {
      buy: 0,
      sell: 0,
      discount: 0,
    },
    media: {
      thumbnail: "",
      images: [""],
    },
    quantity: 0,
    status: "active",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productApi.getByCode(productCode);
        if (response.data.success) {
          const productData = response.data.data;
          setProduct(productData);
          setFormData({
            name: productData.name,
            description: productData.description || "",
            category: productData.category,
            series: productData.series || "",
            pricing: {
              buy: productData.pricing.buy,
              sell: productData.pricing.sell,
              discount: productData.pricing.discount || 0,
            },
            media: {
              thumbnail: productData.media?.thumbnail || "",
              images: productData.media?.images || [""],
            },
            quantity: productData.quantity,
            status:
              productData.status === "deleted" ? "active" : productData.status,
          });
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => {
        if (parent === "pricing") {
          return {
            ...prev,
            pricing: {
              ...prev.pricing,
              [child]: value,
            },
          };
        } else if (parent === "media") {
          return {
            ...prev,
            media: {
              ...prev.media,
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        images: prev.media?.images?.map((img, i) =>
          i === index ? value : img
        ) || [value],
      },
    }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        images: [...(prev.media?.images || []), ""],
      },
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: {
        ...prev.media,
        images: prev.media?.images?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Filter out empty image URLs
      const filteredImages =
        formData.media?.images?.filter(img => img.trim() !== "") || [];

      const productData: UpdateProductRequest = {
        ...formData,
        media: {
          thumbnail: formData.media?.thumbnail || undefined,
          images: filteredImages.length > 0 ? filteredImages : undefined,
        },
      };

      const response = await productApi.update(productCode, productData);
      if (response.data.success) {
        router.push(`/dashboard/products/${productCode}`);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-2 text-gray-600">
              Update product information for {product.name}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
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
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category *
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="series"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Series
                  </label>
                  <input
                    type="text"
                    id="series"
                    name="series"
                    value={formData.series}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="pricing.buy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Buy Price *
                </label>
                <input
                  type="number"
                  id="pricing.buy"
                  name="pricing.buy"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricing?.buy || 0}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="pricing.sell"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sell Price *
                </label>
                <input
                  type="number"
                  id="pricing.sell"
                  name="pricing.sell"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricing?.sell || 0}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="pricing.discount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Discount (%)
                </label>
                <input
                  type="number"
                  id="pricing.discount"
                  name="pricing.discount"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.pricing?.discount || 0}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Media Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="media.thumbnail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  id="media.thumbnail"
                  name="media.thumbnail"
                  value={formData.media?.thumbnail || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Images
                </label>
                {formData.media?.images?.map((image, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="url"
                      value={image}
                      onChange={e => handleImageChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    {formData.media?.images &&
                      formData.media.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Add Image
                </button>
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
              {submitting ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
