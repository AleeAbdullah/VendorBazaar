// src/context/seller/SellerDashboardContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../AuthContext";
import { Review } from "../../constants/types.product";
import { Order } from "../../constants/types.order";
import { Seller } from "../../constants/types.seller";

// --- Interfaces ---
interface DashboardMetrics {
  salesToday: number;
  salesMonth: number;
  totalSales: number;
  newOrders: number;
  orderStatusCounts: {
    paid: number;
    processing: number;
    inTransit: number;
    completed: number;
    cancelled: number;
  };
}

interface ActivityItem {
  id: string;
  type: "order" | "review";
  title: string;
  subtitle: string;
  amount?: number;
  createdAt: Timestamp;
}

interface SellerDashboardContextType {
  metrics: DashboardMetrics;
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

// --- Context Definition ---
const SellerDashboardContext = createContext<
  SellerDashboardContextType | undefined
>(undefined);

// --- Provider Component ---
export function SellerDashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    salesToday: 0,
    salesMonth: 0,
    totalSales: 0,
    newOrders: 0,
    orderStatusCounts: {
      paid: 0,
      processing: 0,
      inTransit: 0,
      completed: 0,
      cancelled: 0,
    },
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "seller") {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    // 1. Listen to the seller document for pre-aggregated analytics
    const sellerDocRef = doc(db, "sellers", user.uid);
    const unsubscribeSeller = onSnapshot(
      sellerDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const sellerData = docSnapshot.data() as Seller;
          setMetrics((prev) => ({
            ...prev,
            totalSales: sellerData.totalSales || 0,
            newOrders: sellerData.orderStatusCounts?.paid || 0,
            orderStatusCounts: sellerData.orderStatusCounts || {
              paid: 0,
              processing: 0,
              inTransit: 0,
              completed: 0,
              cancelled: 0,
            },
          }));
        }
        setLoading(false); // Main stats loaded
      },
      (err) => {
        console.error("Failed to fetch seller analytics:", err);
        setError("Could not load seller analytics.");
        setLoading(false);
      }
    );
    unsubscribes.push(unsubscribeSeller);

    // 2. Listen to this month's orders for time-based sales calcs & recent order activity
    const ordersRef = collection(db, "orders");
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyOrdersQuery = query(
      ordersRef,
      where("sellerId", "==", user.uid),
      where("createdAt", ">=", Timestamp.fromDate(startOfMonth)),
      orderBy("createdAt", "desc")
    );

    const unsubscribeMonthlyOrders = onSnapshot(
      monthlyOrdersQuery,
      (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let salesToday = 0;
        let salesMonth = 0;

        const orderActivities = snapshot.docs.slice(0, 10).map((doc) => {
          const orderData = doc.data() as Order;
          const orderDate = orderData.createdAt.toDate();

          salesMonth += orderData.total;
          if (orderDate >= today) {
            salesToday += orderData.total;
          }

          return {
            id: doc.id,
            type: "order" as const,
            title: `New Order #${doc.id.substring(0, 6)}`,
            subtitle: `Total: $${orderData.total.toFixed(2)}`,
            amount: orderData.total,
            createdAt: orderData.createdAt,
          };
        });

        setMetrics((prev) => ({ ...prev, salesToday, salesMonth }));
        setActivities((prev) =>
          [...orderActivities, ...prev.filter((a) => a.type !== "order")].sort(
            (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
          )
        );
      },
      (err) => {
        console.error("Failed to fetch monthly orders:", err);
        setError("Could not load order data for sales calculation.");
      }
    );
    unsubscribes.push(unsubscribeMonthlyOrders);

    // 3. Fetch recent reviews for activity feed
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(
      reviewsRef,
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewActivities = snapshot.docs.map((doc) => {
        const reviewData = doc.data() as Review;
        return {
          id: doc.id,
          type: "review" as const,
          title: `${reviewData.userName} left a ${reviewData.rating}-star review`,
          subtitle: `"${reviewData.reviewText.substring(0, 40)}..."`,
          createdAt: reviewData.createdAt,
        };
      });
      setActivities((prev) =>
        [...reviewActivities, ...prev.filter((a) => a.type !== "review")].sort(
          (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
        )
      );
    });
    unsubscribes.push(unsubscribeReviews);

    // Cleanup listeners on unmount
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user]);

  const value = {
    metrics,
    activities,
    loading,
    error,
  };

  return (
    <SellerDashboardContext.Provider value={value}>
      {children}
    </SellerDashboardContext.Provider>
  );
}

// --- Hook ---
export function useSellerDashboard(): SellerDashboardContextType {
  const context = useContext(SellerDashboardContext);
  if (context === undefined) {
    throw new Error(
      "useSellerDashboard must be used within a SellerDashboardProvider"
    );
  }
  return context;
}
