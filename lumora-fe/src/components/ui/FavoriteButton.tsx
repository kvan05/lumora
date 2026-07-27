"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  eventId: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
}

export function FavoriteButton({ eventId, className, size = "default", variant = "ghost" }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: checkData } = useQuery({
    queryKey: ["favorite-check", eventId],
    queryFn: async () => {
      if (!session) return { isFavorited: false };
      const res = await api.get(`/favorites/${eventId}/check`);
      return res.data;
    },
    enabled: !!session,
  });

  const isFavorited = checkData?.isFavorited || false;

  const toggleMutation = useMutation({
    mutationFn: () => api.post(`/favorites/${eventId}/toggle`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["favorite-check", eventId] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(res.data.message);
    },
    onError: () => {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      toast.info("Vui lòng đăng nhập để thêm sự kiện yêu thích");
      router.push("/login");
      return;
    }

    toggleMutation.mutate();
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      disabled={toggleMutation.isPending}
      className={cn(
        "rounded-full transition-all duration-200",
        isFavorited ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-rose-500",
        className
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-200",
          isFavorited && "fill-current"
        )}
      />
    </Button>
  );
}
