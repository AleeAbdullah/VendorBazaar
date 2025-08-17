import { Timestamp } from "firebase/firestore";

export interface Seller {
  sid: string;
  shopName: string;
  shopBannerUrl?: string;
  bio?: string;
  memberSince: Timestamp;
  FollowersIds?: string[];
  PhotoURL?: string;
  fullName?: string;

  address?: {
    street: string;
    city: string;
    postalCode: string;
    province: string;
    latitude: number;
    longitude: number;
  };

  paystackAccountId: string;
  paystackSubaccountCode: string;

  // analytics fields here
  // TODO update
  avgRating: number;
  totalReviews: number;
  totalProducts: number;
  totalFollowers: number;

  totalSales: number;
  totalOrders: number;
  orderStatusCounts: {
    paid: number;
    processing: number;
    inTransit: number;
    completed: number;
    cancelled: number;
  };

  // Verification & Status
  verified: boolean; // Master verification status
  paystackVerified: boolean; // Tracks if the payout account is set up and verified
}
