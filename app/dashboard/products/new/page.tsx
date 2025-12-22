"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  productApi,
  handleApiError,
  CreateProductRequest,
} from "../../../lib/api";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateProductRequest>({
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
  });

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

  const handleImageUpload = async (
    files: FileList | File[],
    type: "thumbnail" | "image",
    index?: number
  ) => {
    if (
      !files ||
      (Array.isArray(files) ? files.length === 0 : files.length === 0)
    )
      return;

    try {
      if (type === "thumbnail") {
        setUploadingThumbnail(true);
      } else {
        setUploadingImages(prev => {
          const newStates = [...prev];
          if (index !== undefined) {
            newStates[index] = true;
          }
          return newStates;
        });
      }
      setUploadingImage(true);

      if (type === "thumbnail") {
        // For thumbnail, only use the first file
        const file = Array.isArray(files) ? files[0] : files[0];

        // Create FormData for file upload
        const uploadFormData = new FormData();
        uploadFormData.append("image", file);

        // Add API key from environment variables
        uploadFormData.append(
          "key",
          process.env.NEXT_PUBLIC_IMAGEBB_API_KEY as string
        );

        // Upload to imagebb
        const response = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.display_url) {
            setFormData(prev => ({
              ...prev,
              media: {
                ...prev.media,
                thumbnail: result.data.display_url,
              },
            }));
          } else {
            setError(
              "Image upload failed: " +
                (result.error?.message || "Unknown error")
            );
          }
        } else {
          setError("Image upload failed: Server error");
        }
      } else if (type === "image") {
        // For additional images, handle multiple files
        const fileArray = Array.isArray(files) ? files : Array.from(files);
        const currentImages = formData.media?.images || [];
        const newImages = [...currentImages];

        // Find the first empty slot or add to the end
        let startIndex =
          index !== undefined ? index : newImages.findIndex(img => !img);
        if (startIndex === -1) startIndex = newImages.length;

        // Upload each file
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const uploadFormData = new FormData();
          uploadFormData.append("image", file);
          uploadFormData.append(
            "key",
            process.env.NEXT_PUBLIC_IMAGEBB_API_KEY ||
              "7a991f0e970c5044644b6f954896045a"
          );

          const response = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.display_url) {
              const imageIndex = startIndex + i;
              if (imageIndex >= newImages.length) {
                newImages.push(result.data.display_url);
              } else {
                newImages[imageIndex] = result.data.display_url;
              }
            } else {
              setError(
                `Image upload failed for ${file.name}: ` +
                  (result.error?.message || "Unknown error")
              );
            }
          } else {
            setError(`Image upload failed for ${file.name}: Server error`);
          }
        }

        setFormData(prev => ({
          ...prev,
          media: {
            ...prev.media,
            images: newImages,
          },
        }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Image upload failed: " + (error as Error).message);
    } finally {
      setUploadingImage(false);
      if (type === "thumbnail") {
        setUploadingThumbnail(false);
      } else {
        setUploadingImages(prev => {
          const newStates = [...prev];
          if (index !== undefined) {
            newStates[index] = false;
          }
          return newStates;
        });
      }
    }
  };

  const handleImageRemove = (type: "thumbnail" | "image", index?: number) => {
    if (type === "thumbnail") {
      setFormData(prev => ({
        ...prev,
        media: {
          ...prev.media,
          thumbnail: "",
        },
      }));
    } else if (index !== undefined) {
      const newImages = [...(formData.media?.images || [])];
      newImages[index] = "";
      setFormData(prev => ({
        ...prev,
        media: {
          ...prev.media,
          images: newImages,
        },
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    type: "thumbnail" | "image",
    index?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files, type, index);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "thumbnail" | "image",
    index?: number
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files, type, index);
    }
  };

  const handleViewFullImage = (imageUrl: string) => {
    window.open(imageUrl, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty image URLs
      const filteredImages =
        formData.media?.images?.filter(img => img.trim() !== "") || [];

      const productData: CreateProductRequest = {
        ...formData,
        media: {
          thumbnail: formData.media?.thumbnail || undefined,
          images: filteredImages.length > 0 ? filteredImages : undefined,
        },
      };

      const response = await productApi.create(productData);
      if (response.data.success) {
        router.push("/dashboard/products");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Product
            </h1>
            <p className="mt-2 text-gray-600">
              Create a new product for your inventory
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
                  value={formData.pricing.buy}
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
                  value={formData.pricing.sell}
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
                  value={formData.pricing.discount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Media Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
            <div className="space-y-6">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Thumbnail
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                    dragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={e => handleDrop(e, "thumbnail")}
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <input
                    ref={thumbnailInputRef}
                    name="thumbnail-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "thumbnail")}
                  />
                  {formData.media?.thumbnail ? (
                    <div className="space-y-2">
                      <img
                        src={formData.media.thumbnail}
                        alt="Product thumbnail"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <div className="flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleViewFullImage(formData.media!.thumbnail!);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-2"
                        >
                          View Full
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            thumbnailInputRef.current?.click();
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                          disabled={uploadingThumbnail}
                        >
                          {uploadingThumbnail ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            "Change"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleImageRemove("thumbnail");
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Upload a file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Images
                </label>
                <div className="space-y-4">
                  {formData.media?.images?.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                            dragActive
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-300"
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={e => handleDrop(e, "image", index)}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.multiple = true; // Allow multiple file selection
                            input.onchange = e => {
                              const target = e.target as HTMLInputElement;
                              if (target.files && target.files.length > 0) {
                                handleImageUpload(target.files, "image", index);
                              }
                            };
                            input.click();
                          }}
                        >
                          {image ? (
                            <div className="space-y-2">
                              <img
                                src={image}
                                alt={`Product image ${index + 1}`}
                                className="mx-auto h-24 w-24 object-cover rounded-lg"
                              />
                              <div className="flex justify-center space-x-2">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleViewFullImage(image);
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                                >
                                  View Full
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    const input =
                                      document.createElement("input");
                                    input.type = "file";
                                    input.accept = "image/*";
                                    input.multiple = true;
                                    input.onchange = e => {
                                      const target =
                                        e.target as HTMLInputElement;
                                      if (
                                        target.files &&
                                        target.files.length > 0
                                      ) {
                                        handleImageUpload(
                                          target.files,
                                          "image",
                                          index
                                        );
                                      }
                                    };
                                    input.click();
                                  }}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                                  disabled={
                                    uploadingImages[index] || uploadingImage
                                  }
                                >
                                  {uploadingImages[index] ? (
                                    <>
                                      <svg
                                        className="animate-spin h-3 w-3"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                      Uploading...
                                    </>
                                  ) : (
                                    "Change"
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleImageRemove("image", index);
                                  }}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <svg
                                className="mx-auto h-8 w-8 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                              >
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                  Upload files
                                </span>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 10MB each. Multiple files
                                allowed.
                              </p>
                            </div>
                          )}
                        </div>
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
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageField}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Add Image Field
                  </button>
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
