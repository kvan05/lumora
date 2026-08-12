"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { Calendar, MapPin, Heart, ArrowRight, Ticket } from "lucide-react";
import { redirect } from "next/navigation";

export default function FavoritesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) redirect("/login?callbackUrl=/profile/favorites");

  return <FavoritesContent />;
}

function FavoritesContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await api.get("/favorites");
      return res.data.data;
    },
  });

  const favorites = data?.favorites || [];
  const total = data?.pagination?.total || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
          <Heart className="h-6 w-6 text-rose-500 fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">Sự kiện yêu thích</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} sự kiện đã lưu</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        /* Empty State */
        <div className="text-center py-24 rounded-3xl border-2 border-dashed border-border bg-muted/20">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-2xl font-bold text-muted-foreground">Chưa có sự kiện yêu thích</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Bấm vào biểu tượng trái tim trên các sự kiện bạn quan tâm để lưu lại tại đây.
          </p>
          <Button className="mt-8 rounded-full font-semibold shadow-md" asChild>
            <Link href="/events">
              Khám phá sự kiện <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav: any) => {
            const event = fav.event;
            const isPast = new Date(event.endDate) < new Date();

            return (
              <Link
                key={fav.id}
                href={`/events/${event.slug}`}
                className="group block bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Banner */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {event.bannerUrl ? (
                    <Image
                      src={event.bannerUrl}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Ticket className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-white/90 text-foreground text-[11px] font-bold shadow-sm border-0">
                      {event.category}
                    </Badge>
                    {isPast && (
                      <Badge variant="secondary" className="text-[11px] font-bold">Đã kết thúc</Badge>
                    )}
                  </div>

                  {/* Remove favorite button */}
                  <div className="absolute top-3 right-3">
                    <FavoriteButton
                      eventId={event.id}
                      variant="outline"
                      className="bg-white/90 border-0 shadow-sm h-8 w-8"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <h3 className="font-extrabold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{format(new Date(event.startDate), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="line-clamp-1">{event.venue}, {event.city}</span>
                    </div>
                  </div>

                  {event.minPrice !== null && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-sm font-extrabold text-primary">
                        {event.minPrice === 0
                          ? "Miễn phí"
                          : `Từ ${Number(event.minPrice).toLocaleString("vi-VN")} ₫`}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
