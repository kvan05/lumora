"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import api from "@/lib/api";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Info, Tag, Armchair, Plus, Minus, ZoomIn, ZoomOut, Maximize, Lock, ShoppingCart, Star, Flag, Send, Image as ImageIcon } from "lucide-react";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [event, setEvent] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [isBooking, setIsBooking] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${slug}`);
      if (res.data.success) {
        setEvent(res.data.data);
        if (res.data.data.hasSeatMap) {
          fetchSeatMap(res.data.data.id);
        }
      }
    } catch (error) {
      toast.error("Event not found");
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatMap = async (eventId: string) => {
    try {
      const res = await api.get(`/events/${eventId}/seats`);
      if (res.data.success) {
        setSections(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch seat map", error);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  // Real-time socket connection for inventory updates
  useEffect(() => {
    if (event?.hasSeatMap) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001", {
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        newSocket.emit("join:event", event.id);
      });

      newSocket.on("inventory:update", (data) => {
        if (data.eventId === event.id) {
          fetchSeatMap(event.id);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit("leave:event", event.id);
        newSocket.disconnect();
      };
    }
  }, [event]);

  const getAvailableQty = (ticketType: any) => {
    const inv = ticketType.inventory;
    if (!inv) return 0;
    return Math.max(0, inv.totalQty - inv.reservedQty - inv.soldQty);
  };

  const handleUpdateTicketQty = (ticketTypeId: string, newQty: number, ticketType: any) => {
    const available = getAvailableQty(ticketType);
    const limit = Math.min(ticketType.maxPerOrder, available);
    
    if (newQty < 0 || newQty > limit) return;

    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: newQty
    }));
  };

  const toggleSeatSelection = (seatId: string, status: string) => {
    if (status !== "AVAILABLE") return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        if (prev.length >= 10) {
          toast.warning("Chỉ được chọn tối đa 10 ghế mỗi đơn");
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  const handleCheckout = async () => {
    if (!session) {
      toast.info("Vui lòng đăng nhập để tiếp tục");
      router.push(`/login?callbackUrl=/events/${slug}`);
      return;
    }

    if (event.hasSeatMap && selectedSeats.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ghế");
      return;
    }

    if (!event.hasSeatMap && Object.values(selectedTickets).every(qty => qty === 0)) {
      toast.error("Vui lòng chọn ít nhất một vé");
      return;
    }

    setIsBooking(true);
    try {
      // 1. Create Order (holds seats for 15m)
      const items = event.hasSeatMap
        ? selectedSeats.map(seatId => ({
            seatId: seatId,
            quantity: 1
          }))
        : Object.entries(selectedTickets)
            .filter(([_, qty]) => qty > 0)
            .map(([ticketTypeId, qty]) => ({
              ticketTypeId,
              quantity: qty
            }));

      const res = await api.post("/orders", {
        eventId: event.id,
        items
      });

      if (res.data.success) {
        toast.success("Đã giữ chỗ thành công! Đang chuyển hướng...");
        // 2. Redirect to checkout page / payment gateway
        const orderId = res.data.data.id;
        router.push(`/checkout/${orderId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi tạo đơn hàng");
      if (event.hasSeatMap) {
        fetchSeatMap(event.id);
        setSelectedSeats([]);
      } else {
        fetchEvent();
        setSelectedTickets({});
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!event) return null;

  // Calculate totals for rendering in sticky bar
  const totalSelectedTickets = event.hasSeatMap
    ? selectedSeats.length
    : Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  let totalPrice = 0;
  if (event.hasSeatMap) {
    selectedSeats.forEach(seatId => {
      sections.forEach(sec => {
        sec.rows?.forEach((row: any) => {
          if (row.seats?.some((s: any) => s.id === seatId)) {
            totalPrice += Number(sec.price);
          }
        });
      });
    });
  } else {
    Object.entries(selectedTickets).forEach(([ticketTypeId, qty]) => {
      const ticketType = event.ticketTypes?.find((t: any) => t.id === ticketTypeId);
      if (ticketType) {
        totalPrice += Number(ticketType.price) * qty;
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative pb-32 lg:pb-8">
      {/* Hero Banner */}
      <div className="relative h-[400px] w-full rounded-2xl overflow-hidden mb-8 shadow-xl">
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 flex items-center justify-center">
            <span className="text-white text-4xl font-bold opacity-50">{event.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent flex items-end p-8">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary text-primary-foreground text-sm px-3 py-1 font-bold tracking-wide uppercase shadow-sm">
              {event.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight drop-shadow-md mb-4 leading-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-foreground/90 font-medium">
              <div className="flex items-center gap-2 bg-background/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm">{format(new Date(event.startDate), "EEEE, dd/MM/yyyy • HH:mm")}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{event.venue}, {event.city}</span>
              </div>
            </div>
          </div>
          {/* Favorite button overlay on hero */}
          <div className="absolute top-4 right-4">
            <FavoriteButton
              eventId={event.id}
              variant="outline"
              className="bg-background/80 backdrop-blur border border-border/60 shadow-md h-10 w-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Seat Map */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card rounded-2xl p-6 shadow-sm border border-border/60">
            <h2 className="text-2xl font-extrabold flex items-center gap-2 mb-4">
              <Info className="h-6 w-6 text-primary" /> Giới thiệu sự kiện
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </section>

          {/* Event Detail Images & Gallery Section */}
          {(() => {
            let parsedImages: string[] = [];
            if (Array.isArray(event.imageUrls)) {
              parsedImages = event.imageUrls;
            } else if (typeof event.imageUrls === "string" && event.imageUrls.trim()) {
              try {
                parsedImages = JSON.parse(event.imageUrls);
              } catch {
                parsedImages = event.imageUrls.split(",").map((s: string) => s.trim());
              }
            }

            if (!parsedImages || parsedImages.length === 0) return null;

            return (
              <section className="bg-card rounded-2xl p-6 shadow-sm border border-border/60 space-y-4">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-primary" /> Sơ đồ khán đài & Thông tin chi tiết
                </h2>
                <p className="text-xs text-muted-foreground">
                  Hình ảnh bản đồ khán đài, sơ đồ chỗ ngồi, quy định và lưu ý trực quan từ Nhà tổ chức.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {parsedImages.map((url: string, i: number) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-border/60 shadow-xs bg-slate-900 group">
                      <img
                        src={url}
                        alt={`Ảnh chi tiết ${i + 1}`}
                        className="w-full h-auto max-h-[350px] object-contain mx-auto"
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Map Section */}
          <section className="bg-card rounded-2xl p-6 shadow-sm border border-border/60">
            <h2 className="text-2xl font-extrabold flex items-center gap-2 mb-4">
              <MapPin className="h-6 w-6 text-primary" /> Bản đồ địa điểm
            </h2>
            <div className="rounded-xl overflow-hidden border bg-muted aspect-[21/9] flex items-center justify-center">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(event.venue + ", " + event.city)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm font-medium">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
              <span>{event.venue}, {event.address && `${event.address}, `}{event.city}</span>
            </div>
          </section>

          {/* Terms Section */}
          <section className="bg-card rounded-2xl p-6 shadow-sm border border-border/60">
            <h2 className="text-2xl font-extrabold flex items-center gap-2 mb-4">
              <Info className="h-6 w-6 text-primary" /> Điều khoản tham gia
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
              <p>• Vé đã mua không thể hoàn trả hoặc đổi trả trong bất kỳ trường hợp nào trừ khi sự kiện bị hủy từ phía nhà tổ chức.</p>
              <p>• Trẻ em dưới độ tuổi quy định sẽ không được phép tham gia sự kiện (Vui lòng xem kỹ độ tuổi giới hạn nếu có).</p>
              <p>• Vui lòng đến trước giờ bắt đầu 30 phút để thực hiện các thủ tục check-in.</p>
              <p>• Vé mã vạch chỉ có giá trị cho một lần quét duy nhất. Vui lòng bảo mật vé mã vạch của bạn.</p>
              <p>• Ban tổ chức có quyền từ chối sự tham gia của bất kỳ cá nhân nào vi phạm nội quy sự kiện.</p>
            </div>
          </section>

          {!event.hasSeatMap && (
            <section className="bg-card rounded-2xl p-6 shadow-sm border border-border/60">
              <h2 className="text-2xl font-extrabold flex items-center gap-2 mb-6">
                <Tag className="h-6 w-6 text-primary" /> Chọn vé
              </h2>
              
              <div className="space-y-4">
                {event.ticketTypes?.map((ticketType: any) => {
                  const available = getAvailableQty(ticketType);
                  const isSoldOut = ticketType.status === "SOLD_OUT" || available <= 0;
                  const selectedQty = selectedTickets[ticketType.id] || 0;

                  return (
                    <div 
                      key={ticketType.id} 
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center p-5 border rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors gap-4 ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg">{ticketType.name}</span>
                          {ticketType.color && (
                            <Badge style={{ backgroundColor: ticketType.color, color: '#fff' }} className="shadow-sm">
                              {ticketType.name}
                            </Badge>
                          )}
                          {isSoldOut && <Badge variant="destructive">Hết vé</Badge>}
                        </div>
                        {ticketType.description && (
                          <p className="text-sm text-muted-foreground">{ticketType.description}</p>
                        )}
                        <div className="text-xs font-semibold text-muted-foreground flex gap-3">
                          <span>Còn trống: {available}</span>
                          <span>•</span>
                          <span>Tối đa {ticketType.maxPerOrder} vé/đơn</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl font-extrabold text-primary">
                              {Number(ticketType.price).toLocaleString("vi-VN")} ₫
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold">
                              Giá tham khảo
                            </Badge>
                          </div>
                          {ticketType.originalPrice && Number(ticketType.originalPrice) > Number(ticketType.price) && (
                            <span className="text-sm text-muted-foreground line-through font-medium">
                              {Number(ticketType.originalPrice).toLocaleString("vi-VN")} ₫
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 bg-background border rounded-full p-1 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleUpdateTicketQty(ticketType.id, selectedQty - 1, ticketType)}
                            disabled={selectedQty <= 0 || isSoldOut}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-extrabold text-lg w-6 text-center">{selectedQty}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => handleUpdateTicketQty(ticketType.id, selectedQty + 1, ticketType)}
                            disabled={selectedQty >= Math.min(ticketType.maxPerOrder, available) || isSoldOut}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {event.hasSeatMap && (
            <section className="bg-card rounded-2xl p-6 shadow-sm border border-border/60">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <Armchair className="h-6 w-6 text-primary" /> Chọn ghế ngồi
                </h2>
                <Badge variant="outline" className="text-muted-foreground font-medium">Sơ đồ có thể kéo/zoom</Badge>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 justify-center p-3 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-muted border-2 border-border" />
                  <span className="text-sm font-semibold text-muted-foreground">Trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-primary shadow-sm shadow-primary/20" />
                  <span className="text-sm font-semibold text-primary">Đang chọn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-muted-foreground/20 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground/60" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground opacity-70">Đã bán/Giữ</span>
                </div>
              </div>

              {/* Sections Legend */}
              <div className="flex flex-wrap gap-3 mb-6 justify-center">
                {sections.map(sec => (
                  <div key={sec.id} className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-full shadow-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.color }} />
                    <span className="text-xs font-bold text-foreground">{sec.name}</span>
                    <span className="text-xs text-muted-foreground">• {Number(sec.price).toLocaleString("vi-VN")} ₫ <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Giá tham khảo)</span></span>
                  </div>
                ))}
              </div>

              {/* Seat Map Visualizer using react-zoom-pan-pinch */}
              <div className="border-2 border-border/50 rounded-2xl overflow-hidden bg-muted/10 relative">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  centerOnInit
                  wheel={{ step: 0.1 }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur rounded-xl p-1 shadow-md border">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => zoomIn()}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => zoomOut()}>
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => resetTransform()}>
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>

                      <TransformComponent wrapperStyle={{ width: "100%", height: "500px", cursor: "grab" }}>
                        <div className="min-w-[800px] min-h-[500px] flex flex-col items-center p-12">
                          
                          {/* Premium Stage Design */}
                          <div className="w-3/4 h-16 relative mb-16 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-t-[100px] blur-xl opacity-60" />
                            <div className="relative w-full h-full bg-gradient-to-b from-border to-background border-t-4 border-primary rounded-t-[100px] shadow-2xl flex items-center justify-center text-muted-foreground font-black uppercase tracking-[0.3em]">
                              SÂN KHẤU
                            </div>
                          </div>

                          <div className="flex flex-col gap-12 items-center">
                            {sections.map((section) => (
                              <div key={section.id} className="relative p-8 rounded-3xl bg-background border-2 shadow-sm flex flex-col items-center" style={{ borderColor: `${section.color}30` }}>
                                <div className="absolute -top-4 bg-background px-4 py-1.5 border-2 rounded-full text-sm font-black shadow-sm flex items-center gap-2" style={{ borderColor: section.color }}>
                                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: section.color }} />
                                  {section.name}
                                </div>
                                
                                <div className="mt-4 flex flex-col items-center gap-4">
                                  {section.rows?.map((row: any) => (
                                    <div key={row.id} className="flex items-center gap-4">
                                      <div className="w-8 text-right text-sm font-black text-muted-foreground/60 bg-muted px-2 py-1 rounded-md">{row.rowLabel}</div>
                                      <div className="flex gap-2">
                                        {row.seats?.map((seat: any) => {
                                          const isSelected = selectedSeats.includes(seat.id);
                                          const isAvailable = seat.status === 'AVAILABLE';
                                          
                                          return (
                                            <Tooltip key={seat.id} delayDuration={0}>
                                              <TooltipTrigger asChild>
                                                <button
                                                  onClick={() => toggleSeatSelection(seat.id, seat.status)}
                                                  disabled={!isAvailable}
                                                  className={`w-9 h-9 rounded-t-xl rounded-b-md flex items-center justify-center text-[11px] font-bold transition-all duration-200 outline-none
                                                    ${isAvailable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'opacity-40 cursor-not-allowed'}
                                                    ${isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110 z-10 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'bg-muted border border-border/80'}
                                                  `}
                                                  style={{ 
                                                    backgroundColor: isSelected ? undefined : (isAvailable ? `${section.color}20` : undefined),
                                                    borderColor: isSelected ? undefined : (isAvailable ? section.color : undefined),
                                                    color: isSelected ? undefined : (isAvailable ? section.color : undefined)
                                                  }}
                                                >
                                                  {!isAvailable && !isSelected ? (
                                                    <Lock className="w-3 h-3 opacity-50" />
                                                  ) : (
                                                    seat.seatNumber
                                                  )}
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent className="font-semibold px-3 py-2 border-border shadow-xl">
                                                <div className="flex flex-col gap-1">
                                                  <div className="flex items-center gap-2">
                                                    <Badge style={{ backgroundColor: section.color }} className="text-[10px] h-4 px-1.5 rounded-sm shadow-none">{section.name}</Badge>
                                                    <span className="font-bold">Ghế {seat.seatLabel}</span>
                                                  </div>
                                                  <div className="text-primary font-black">{Number(section.price).toLocaleString("vi-VN")} ₫</div>
                                                  {!isAvailable && <span className="text-xs text-destructive">Đã được mua/giữ</span>}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                      <div className="w-8 text-left text-sm font-black text-muted-foreground/60 bg-muted px-2 py-1 rounded-md">{row.rowLabel}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Checkout Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <Card className="border-2 border-primary/20 shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/10">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Tổng quan đơn hàng
                </h3>
              </div>
              <CardContent className="p-6">
                {event.hasSeatMap ? (
                  selectedSeats.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                      <Armchair className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary" />
                      <p className="font-medium text-sm">Chưa có ghế nào được chọn.<br/>Vui lòng chọn ghế trên sơ đồ.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {selectedSeats.map(seatId => {
                          let seatLabel = "";
                          let price = 0;
                          sections.forEach(sec => {
                            sec.rows?.forEach((row: any) => {
                              const seat = row.seats?.find((s: any) => s.id === seatId);
                              if (seat) {
                                seatLabel = `${sec.name} - Ghế ${seat.seatLabel}`;
                                price = Number(sec.price);
                              }
                            });
                          });

                          return (
                            <div key={seatId} className="flex justify-between items-center text-sm p-3 bg-muted/40 rounded-xl border border-border/50">
                              <span className="font-bold flex items-center gap-2 text-foreground/80">
                                <Armchair className="h-4 w-4 text-primary" /> {seatLabel}
                              </span>
                              <span className="font-extrabold">{price.toLocaleString("vi-VN")} ₫</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-end text-lg font-bold">
                        <span className="text-muted-foreground text-sm flex flex-col">
                          Tổng cộng
                          <span className="text-foreground text-base">{selectedSeats.length} vé</span>
                        </span>
                        <span className="text-primary text-2xl font-black">
                          {totalPrice.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>

                      <Button 
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-md" 
                        onClick={handleCheckout}
                        disabled={isBooking}
                      >
                        {isBooking ? "Đang xử lý..." : "Tiếp tục thanh toán"}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground/80 font-medium bg-muted/50 p-2 rounded-lg">
                        Ghế sẽ được giữ trong 15 phút sau khi bấm Tiếp tục.
                      </p>
                    </div>
                  )
                ) : (
                  Object.values(selectedTickets).every(qty => qty === 0) ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                      <Tag className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary" />
                      <p className="font-medium text-sm">Chưa có vé nào được chọn.<br/>Vui lòng chọn số lượng vé.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {Object.entries(selectedTickets).map(([ticketTypeId, qty]) => {
                          if (qty <= 0) return null;
                          const ticketType = event.ticketTypes?.find((t: any) => t.id === ticketTypeId);
                          if (!ticketType) return null;

                          return (
                            <div key={ticketTypeId} className="flex justify-between items-center text-sm p-3 bg-muted/40 rounded-xl border border-border/50">
                              <div className="flex flex-col">
                                <span className="font-bold flex items-center gap-2 text-foreground/80">
                                  <Tag className="h-4 w-4 text-primary" /> {ticketType.name}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground mt-1 bg-background w-fit px-2 py-0.5 rounded-md border">SL: {qty}</span>
                              </div>
                              <span className="font-extrabold">{(Number(ticketType.price) * qty).toLocaleString("vi-VN")} ₫</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-end text-lg font-bold">
                        <span className="text-muted-foreground text-sm flex flex-col">
                          Tổng cộng
                          <span className="text-foreground text-base">{totalSelectedTickets} vé</span>
                        </span>
                        <span className="text-primary text-2xl font-black">
                          {totalPrice.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>

                      <Button 
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-md" 
                        onClick={handleCheckout}
                        disabled={isBooking}
                      >
                        {isBooking ? "Đang xử lý..." : "Tiếp tục thanh toán"}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground/80 font-medium bg-muted/50 p-2 rounded-lg">
                        Vé sẽ được giữ trong 15 phút sau khi bấm Tiếp tục.
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      {totalSelectedTickets > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 z-50 animate-in slide-in-from-bottom-full duration-300">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground">{totalSelectedTickets} vé đã chọn</span>
              <span className="text-xl font-black text-primary">{totalPrice.toLocaleString("vi-VN")} ₫</span>
            </div>
            <Button 
              size="lg" 
              className="h-12 px-8 font-bold rounded-xl shadow-md"
              onClick={handleCheckout}
              disabled={isBooking}
            >
              {isBooking ? "Đang xử lý..." : "Thanh toán"}
            </Button>
          </div>
        </div>
      )}

      {/* Review + Report Section */}
      <ReviewSection eventId={event.id} eventSlug={event.slug} />
    </div>
  );
}

// ─── Review Section Component ─────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-all"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSection({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}/reviews`);
      return res.data.data;
    },
  });

  const submitReview = useMutation({
    mutationFn: () => api.post("/reviews", { eventId, rating, content }),
    onSuccess: () => {
      toast.success("Đã gửi đánh giá thành công!");
      setRating(0);
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["reviews", eventId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Có lỗi xảy ra. Bạn cần đã tham dự sự kiện này để đánh giá.");
    },
  });

  const submitReport = useMutation({
    mutationFn: () => api.post("/reports", { targetType: "EVENT", targetId: eventId, reason: reportReason }),
    onSuccess: () => {
      toast.success("Báo cáo đã được gửi. Chúng tôi sẽ xem xét sớm nhất.");
      setShowReportModal(false);
      setReportReason("");
    },
    onError: () => {
      toast.error("Không thể gửi báo cáo. Vui lòng thử lại.");
    },
  });

  const reviews = data?.reviews || [];
  const stats = data?.stats;

  return (
    <div className="mt-10 space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-400 fill-amber-400" /> Đánh giá từ người tham dự
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-1.5"
          onClick={() => {
            if (!session) { toast.info("Vui lòng đăng nhập để báo cáo sự kiện"); return; }
            setShowReportModal(true);
          }}
        >
          <Flag className="h-4 w-4" /> Báo cáo sự kiện
        </Button>
      </div>

      {/* Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <div className="text-center">
            <p className="text-5xl font-black text-foreground">{stats.averageRating}</p>
            <div className="flex justify-center mt-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(stats.averageRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalReviews} đánh giá</p>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border/60 rounded-2xl">
          <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {review.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{review.user?.name || "Ẩn danh"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.createdAt), "dd/MM/yyyy")}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write review form */}
      {session ? (
        <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-base mb-4">Viết đánh giá của bạn</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Chọn số sao</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
              placeholder="Chia sẻ trải nghiệm của bạn về sự kiện này..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <Button
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending || rating === 0 || !content.trim()}
              className="gap-2 rounded-xl font-bold"
            >
              <Send className="h-4 w-4" />
              {submitReview.isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 border border-border rounded-2xl p-6 text-center">
          <p className="text-muted-foreground font-medium">
            <Link href={`/login?callbackUrl=/events/${eventSlug}`} className="text-primary font-bold hover:underline">Đăng nhập</Link> để viết đánh giá sự kiện.
          </p>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <Flag className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-extrabold text-lg">Báo cáo sự kiện</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Cho chúng tôi biết lý do bạn muốn báo cáo sự kiện này. Báo cáo sẽ được đội ngũ Admin xem xét.
            </p>
            <Textarea
              placeholder="Mô tả lý do báo cáo (nội dung vi phạm, thông tin sai lệch, ...)"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowReportModal(false)}>Huỷ</Button>
              <Button
                variant="destructive"
                onClick={() => submitReport.mutate()}
                disabled={submitReport.isPending || !reportReason.trim()}
                className="gap-2 rounded-xl"
              >
                <Flag className="h-4 w-4" />
                {submitReport.isPending ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
