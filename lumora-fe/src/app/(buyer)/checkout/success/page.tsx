"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// PayOS redirects to /checkout/success?orderId=xxx
// We immediately redirect to the status page for polling
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      router.replace(`/checkout/${orderId}/status`);
    } else {
      router.replace("/");
    }
  }, [orderId, router]);

  return null;
}
