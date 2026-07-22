"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// PayOS redirects to /checkout/cancel?orderId=xxx when user cancels
// We redirect to the status page with a cancel flag
export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      router.replace(`/checkout/${orderId}/status?cancel=true`);
    } else {
      router.replace("/");
    }
  }, [orderId, router]);

  return null;
}
