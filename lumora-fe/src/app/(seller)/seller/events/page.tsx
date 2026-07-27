"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  MoreHorizontal, 
  Edit, 
  Users, 
  Ticket,
  Eye,
  EyeOff,
  Image as ImageIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function SellerEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["seller-events"],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      return res.data.data.events;
    },
  });

  const filteredEvents = events?.filter((event: any) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sự kiện của bạn</h2>
          <p className="text-muted-foreground mt-1">Quản lý tất cả các sự kiện bạn đang tổ chức.</p>
        </div>
        <Button className="rounded-xl shadow-sm" asChild>
          <Link href="/seller/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Tạo sự kiện
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm sự kiện..." 
              className="pl-9 h-10 rounded-xl bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] font-bold text-muted-foreground uppercase tracking-wider text-xs">Sự kiện</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Thời gian & Địa điểm</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Trạng thái</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEvents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Không tìm thấy sự kiện nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents?.map((event: any) => (
                  <TableRow key={event.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted relative overflow-hidden flex-shrink-0 border border-border/50 flex items-center justify-center">
                          {event.bannerUrl ? (
                            <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <Link href={`/seller/events/${event.id}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-1">
                            {event.title}
                          </Link>
                          <Badge variant="outline" className="mt-1 text-[10px] uppercase font-semibold">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{event.venue}, {event.city}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.status === "PUBLISHED" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none px-2 py-0.5 rounded-full font-semibold">
                          <Eye className="w-3 h-3 mr-1" /> Đã duyệt & Mở bán
                        </Badge>
                      ) : event.status === "PENDING_APPROVAL" ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none px-2 py-0.5 rounded-full font-semibold">
                          <EyeOff className="w-3 h-3 mr-1" /> Chờ Admin duyệt
                        </Badge>
                      ) : event.status === "REJECTED" ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none px-2 py-0.5 rounded-full font-semibold">
                          Bị từ chối
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-none px-2 py-0.5 rounded-full font-semibold">
                          <EyeOff className="w-3 h-3 mr-1" /> Bản nháp
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-md">
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/seller/events/${event.id}`}>
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                              Quản lý chi tiết
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/events/${event.slug || event.id}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                              Xem trên web
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {event.hasSeatMap ? (
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/seller/events/${event.id}/seats`}>
                                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                Quản lý sơ đồ ghế
                              </Link>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/seller/events/${event.id}`}>
                                <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                                Quản lý loại vé
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
