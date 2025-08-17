import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

export interface AppUser extends User {
  fullName?: string;
  role?: "customer" | "seller";
  OnboardingCompleted: string;
  address: Address[];
  dob?: Date;
  gender?: "male" | "female";
  likedProductIds: string[];
  FollowingSellersIds: string[];

  isBanned?: boolean;
  pushToken?: string;
}

export interface Address {
  nickname: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Notification {
  id: string;
  type: "discount" | "wallet" | "service" | "card" | "account" | string;
  title: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  userId: string;
}

export type Theme = "light" | "dark" | "system";
