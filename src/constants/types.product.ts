import { Timestamp } from "firebase/firestore";

export interface ProductOptionValue {
  name: string;
  priceModifier?: number;
}

export interface ProductOption {
  name: string;
  values: ProductOptionValue[];
}

export interface Product {
  pid: string;
  price: number;
  name: string;
  description?: string;
  imagesUrl: string[];
  stockQuantity?: number;

  options?: ProductOption[];

  sellerId: string;
  sellerName: string;
  sellerImgUrl: string;

  category: string;
  condition: "new" | "used" | "refurbished";

  ratingAvg: number;
  totalReviews: number;
  createdAt: Timestamp;

  disabled?: boolean; // For seller's own products
  deleted?: boolean; // For seller's own products
  disabledAdmin?: boolean; // For admin

  // analytics fields
  // These fields are optional and may not be present for all products
  totalViews?: number; // For seller's own products
  totalSales?: number; // For seller's own products
  totalRevenue?: number; // For seller's own products
}

export interface CartItem {
  pid: string;
  name: string;
  price: number;
  imagesUrl: string[];
  sellerId: string;
  quantity: number;
  selectedOptions?: { [key: string]: ProductOptionValue };
}

export interface Review {
  productId: string;
  sellerId: string;
  userId: string;
  rating: number;
  userName: string;
  reviewText: string;
  createdAt: Timestamp;
  // ImageUrls: string[];
  id: string;
}
