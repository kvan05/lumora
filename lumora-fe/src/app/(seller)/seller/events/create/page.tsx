"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Type,
  Armchair,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Layers,
  Eye,
  X,
  Tag,
  DollarSign
} from "lucide-react";

interface TicketTypeConfig {
  name: string;
  price: number;
  quantity: number;
  description: string;
}

interface SeatSectionConfig {
  name: string;
  label: string;
  price: number;
  rowCount: number;
  seatsPerRow: number;
  color: string;
}

const CATEGORIES = [
  "Concert & Live Show",
  "Music Festival",
  "Nightlife & Party",
  "Sân khấu & Kịch",
  "Hài kịch & Stand-up",
  "Phim ảnh & Cinema",
  "Triển lãm & Nghệ thuật",
  "Bảo tàng & Di sản",
  "Trải nghiệm văn hóa",
  "Creative Workshop",
  "Thể thao & Giải đấu",
  "Fitness & Yoga",
  "Hoạt động ngoài trời",
  "Workshop & Lớp học",
  "Hội thảo & Summit",
  "Networking & Kết nối",
  "Cộng đồng & Xã hội",
  "City Tour & Bus 2 tầng",
  "Tham quan địa điểm",
  "Tour & Trải nghiệm du lịch",
  "Water Bus & Du thuyền",
  "Tour tham quan",
  "Địa điểm du lịch",
  "Công viên chủ đề",
  "Khu vui chơi giải trí",
  "Hoạt động gia đình",
  "Vui chơi trẻ em",
  "Lễ hội Ẩm thực",
  "Food Tour & Khám phá",
  "Trải nghiệm ăn uống",
  "Lớp học nấu ăn",
  "Lifestyle & Phong cách sống",
  "Làm đẹp & Spa",
  "Sức khỏe & Wellness",
  "Khác",
];

const CITIES = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Nha Trang",
  "Cần Thơ",
  "Hải Phòng",
  "Đà Lạt",
  "Vũng Tàu"
];

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Âm nhạc & Concert");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Media File Upload States (Local PC Upload)
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [bannerFileName, setBannerFileName] = useState<string>("");
  const [venueMapUrl, setVenueMapUrl] = useState<string>("");
  const [venueMapFileName, setVenueMapFileName] = useState<string>("");
  const [detailImages, setDetailImages] = useState<{ url: string; name: string }[]>([]);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const mapFileInputRef = useRef<HTMLInputElement>(null);
  const detailFilesInputRef = useRef<HTMLInputElement>(null);

  // Ticket & Seat Map State
  const [hasSeatMap, setHasSeatMap] = useState<boolean>(false);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeConfig[]>([
    { name: "Vé Tiêu Chuẩn (GA)", price: 250000, quantity: 200, description: "Vé tham dự tự do" },
    { name: "Vé VIP Thượng Đỉnh", price: 850000, quantity: 50, description: "Vé ưu tiên vị trí đẹp & quà tặng" },
  ]);

  const [seatSections, setSeatSections] = useState<SeatSectionConfig[]>([
    { name: "Khu Vực VIP Trung Tâm", label: "V", price: 1200000, rowCount: 4, seatsPerRow: 10, color: "#F59E0B" },
    { name: "Khu Vực Standard A", label: "A", price: 500000, rowCount: 6, seatsPerRow: 12, color: "#3B82F6" },
  ]);

  // Helper for image compression
  const compressImage = (file: File, maxWidth = 900, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Banner Image File Upload from Computer
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Dung lượng tệp vượt quá 15MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }

    try {
      toast.loading("Đang nén và tối ưu hóa ảnh...", { id: "upload-banner" });
      const compressedDataUrl = await compressImage(file, 900, 0.75);
      setBannerUrl(compressedDataUrl);
      setBannerFileName(file.name);
      toast.success(`Đã tải ảnh bìa "${file.name}" thành công!`, { id: "upload-banner" });
    } catch {
      toast.error("Không thể xử lý tệp ảnh này.", { id: "upload-banner" });
    }
  };

  // Handle Venue Map File Upload from Computer
  const handleVenueMapFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Dung lượng tệp vượt quá 15MB.");
      return;
    }

    try {
      toast.loading("Đang nén ảnh sơ đồ...", { id: "upload-map" });
      const compressedDataUrl = await compressImage(file, 900, 0.75);
      toast.success(`Đã tải ảnh sơ đồ địa điểm "${file.name}" thành công!`, { id: "upload-map" });
    } catch {
      toast.error("Không thể xử lý tệp ảnh này.", { id: "upload-map" });
    }
  };

  // Handle Multiple Detail Images Upload from Computer
  const handleDetailImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    toast.loading(`Đang xử lý ${files.length} ảnh chi tiết...`, { id: "upload-details" });
    try {
      const newImages: { url: string; name: string }[] = [];
      for (const file of files) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} quá 15MB, đã bỏ qua.`);
          continue;
        }
        const compressed = await compressImage(file, 900, 0.75);
        newImages.push({ url: compressed, name: file.name });
      }
      setDetailImages((prev) => [...prev, ...newImages]);
      toast.success(`Đã tải lên ${newImages.length} ảnh chi tiết thành công!`, { id: "upload-details" });
    } catch {
      toast.error("Lỗi khi tải ảnh chi tiết", { id: "upload-details" });
    }
  };

  const handleRemoveDetailImage = (index: number) => {
    setDetailImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Ticket Type
  const handleAddTicketType = () => {
    setTicketTypes(prev => [
      ...prev,
      { name: `Hạng vé ${prev.length + 1}`, price: 300000, quantity: 100, description: "" }
    ]);
  };

  const handleRemoveTicketType = (index: number) => {
    if (ticketTypes.length <= 1) {
      toast.error("Sự kiện cần ít nhất 1 hạng vé.");
      return;
    }
    setTicketTypes(prev => prev.filter((_, i) => i !== index));
  };

  // Add Seat Section
  const handleAddSeatSection = () => {
    const labels = ["B", "C", "D", "E", "F"];
    const nextLabel = labels[seatSections.length % labels.length];
    const colors = ["#10B981", "#8B5CF6", "#EC4899", "#6366F1", "#06B6D4"];
    const nextColor = colors[seatSections.length % colors.length];

    setSeatSections(prev => [
      ...prev,
      {
        name: `Khu Vực ${nextLabel}`,
        label: nextLabel,
        price: 450000,
        rowCount: 5,
        seatsPerRow: 10,
        color: nextColor
      }
    ]);
  };

  const handleRemoveSeatSection = (index: number) => {
    if (seatSections.length <= 1) {
      toast.error("Cần giữ ít nhất 1 khu vực sơ đồ ghế.");
      return;
    }
    setSeatSections(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmitEvent = async () => {
    if (!title.trim()) { toast.error("Vui lòng nhập Tên sự kiện"); return; }
    if (!description.trim()) { toast.error("Vui lòng nhập Mô tả sự kiện"); return; }
    if (!venue.trim()) { toast.error("Vui lòng nhập Tên địa điểm"); return; }
    if (!address.trim()) { toast.error("Vui lòng nhập Địa chỉ"); return; }
    if (!startDate) { toast.error("Vui lòng chọn Thời gian bắt đầu"); return; }
    if (!endDate) { toast.error("Vui lòng chọn Thời gian kết thúc"); return; }
    if (!bannerUrl) {
      toast.error("Vui lòng tải lên ảnh bìa cho sự kiện từ máy tính");
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const allDetailUrls = [
        ...(venueMapUrl ? [venueMapUrl] : []),
        ...detailImages.map((img) => img.url),
      ];

      // Create Event Payload
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        venue: venue.trim(),
        address: address.trim(),
        city,
        startDate,
        endDate,
        bannerUrl,
        imageUrls: allDetailUrls,
        hasSeatMap,
      };

      const res = await api.post("/events", payload);

      if (res.data.success) {
        const eventId = res.data.data.id;
        toast.success("Tạo sự kiện thành công!");

        // Create Ticket Types
        if (!hasSeatMap && ticketTypes.length > 0) {
          for (const tt of ticketTypes) {
            await api.post(`/events/${eventId}/tickets`, tt).catch(() => null);
          }
        }

        // Create Seat Map Sections if enabled
        if (hasSeatMap && seatSections.length > 0) {
          for (const sec of seatSections) {
            try {
              const secRes = await api.post(`/seller/events/${eventId}/seats/sections`, sec);
              if (secRes.data.success) {
                const sectionId = secRes.data.data.id;
                await api.post(`/seller/events/${eventId}/seats/sections/${sectionId}/generate`).catch(() => null);
              }
            } catch (secErr) {
              console.error("Create section error:", secErr);
            }
          }
        }

        router.push(hasSeatMap ? `/seller/events/${eventId}/seats` : `/seller/events/${eventId}`);
      }
    } catch (err: any) {
      console.error("Create Event error:", err?.response?.data || err);
      const serverMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message;
      toast.error(serverMsg || "Không thể tạo sự kiện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations for Seat Map Preview
  const totalSeatsInMap = seatSections.reduce((sum, sec) => sum + (sec.rowCount * sec.seatsPerRow), 0);
  const totalEstimatedRevenue = seatSections.reduce((sum, sec) => sum + (sec.rowCount * sec.seatsPerRow * sec.price), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" /> Tạo Sự Kiện Mới
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Đăng tải sự kiện, tải ảnh bìa từ máy tính và thiết kế sơ đồ ghế ngồi trực quan cho khách hàng mua vé.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl h-10 text-xs font-bold" onClick={() => router.push("/seller/events")}>
          Quản lý sự kiện
        </Button>
      </div>

      {/* STEP PROGRESS WIZARD BAR */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { num: 1, title: "Thông tin cơ bản", icon: Type },
          { num: 2, title: "Hình ảnh & Sơ đồ", icon: ImageIcon },
          { num: 3, title: "Địa điểm & Thời gian", icon: MapPin },
          { num: 4, title: "Hạng vé & Seat Map", icon: Armchair },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : isDone
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-400"
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <div className="hidden md:block overflow-hidden">
                <p className="text-xs font-bold truncate">{s.title}</p>
                <p className="text-[10px] opacity-75">Bước {s.num}/4</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN FORM STEPS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: THÔNG TIN CƠ BẢN */}
          {step === 1 && (
            <Card className="rounded-3xl border border-border/60 shadow-lg overflow-hidden animate-in fade-in">
              <CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                  <Type className="h-5 w-5 text-primary" /> Bước 1: Thông tin cơ bản & Phân loại
                </CardTitle>
                <CardDescription>Điền tên sự kiện, chọn danh mục phù hợp và viết mô tả cuốn hút.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Tên sự kiện <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="VD: Live Concert Sky Dec 2026 — Đêm Nhạc Mùa Hè..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 rounded-xl text-base font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Danh mục sự kiện <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <Badge
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          category === cat
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Mô tả chi tiết sự kiện <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Giới thiệu nội dung sự kiện, dàn nghệ sĩ tham gia, lịch trình chi tiết và các quy định cho người tham dự..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[160px] rounded-2xl leading-relaxed text-sm"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!title.trim() || !description.trim()) {
                        toast.error("Vui lòng nhập Tên sự kiện và Mô tả.");
                        return;
                      }
                      setStep(2);
                    }}
                    className="rounded-xl font-bold gap-2 px-6 h-11"
                  >
                    Tiếp theo: Hình ảnh & Sơ đồ <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* STEP 2: TẢI ẢNH BÌA & SƠ ĐỒ ĐỊA ĐIỂM TỪ MÁY */}
          {step === 2 && (
            <Card className="rounded-3xl border border-border/60 shadow-lg overflow-hidden animate-in fade-in">
              <CardHeader className="bg-blue-500/5 border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" /> Bước 2: Tải ảnh bìa & Sơ đồ địa điểm từ máy tính
                </CardTitle>
                <CardDescription>Tải ảnh Banner sự kiện sắc nét và hình ảnh Sơ đồ khu vực (Venue Map).</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                
                {/* UPLOAD BANNER FROM PC */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" /> Ảnh Bìa Sự Kiện (Banner) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">Khuyên dùng tỷ lệ 16:9 (1200 x 675 px)</span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    onChange={handleBannerFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {bannerUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md group">
                      <img src={bannerUrl} alt="Banner Preview" className="w-full h-56 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-xl font-bold gap-2"
                          onClick={() => bannerFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" /> Đổi Ảnh Khác
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-xl font-bold gap-2"
                          onClick={() => { setBannerUrl(""); setBannerFileName(""); }}
                        >
                          <X className="h-4 w-4" /> Xóa
                        </Button>
                      </div>
                      {bannerFileName && (
                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-mono">
                          📁 {bannerFileName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="border-2 border-dashed border-primary/40 rounded-2xl p-8 text-center bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer space-y-3 flex flex-col items-center justify-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                        <Upload className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-foreground">Nhấp vào đây để chọn ảnh bìa từ máy tính</p>
                        <p className="text-xs text-muted-foreground mt-1">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 8MB)</p>
                      </div>
                      <Button type="button" size="sm" className="rounded-xl font-bold gap-2 mt-2">
                        <Upload className="h-4 w-4" /> Chọn tệp từ máy
                      </Button>
                    </div>
                  )}
                </div>

                {/* UPLOAD MULTIPLE DETAIL IMAGES FROM PC */}
                <div className="space-y-3 border-t border-border/40 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-500" /> Ảnh chi tiết sự kiện & Sơ đồ thông tin
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Có thể tải lên nhiều ảnh về bản đồ khán đài, quy định, lưu ý và thông tin sự kiện.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold gap-2 self-start sm:self-auto shrink-0"
                      onClick={() => detailFilesInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 text-primary" /> + Thêm ảnh chi tiết
                    </Button>
                  </div>

                  <input
                    type="file"
                    multiple
                    ref={detailFilesInputRef}
                    onChange={handleDetailImagesUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {detailImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                      {detailImages.map((img, idx) => (
                        <div key={idx} className="relative rounded-2xl overflow-hidden border border-border/60 bg-slate-900 group h-32">
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 rounded-xl font-bold gap-1 text-xs"
                              onClick={() => handleRemoveDetailImage(idx)}
                            >
                              <X className="h-3.5 w-3.5" /> Xóa ảnh
                            </Button>
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-mono truncate">
                            {img.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailImages.length === 0 && (
                    <div
                      onClick={() => detailFilesInputRef.current?.click()}
                      className="border-2 border-dashed border-border/60 rounded-2xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-foreground">Tải ảnh chi tiết từ máy tính (Có thể chọn nhiều tệp)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Sơ đồ chỗ ngồi, quy định, lưu ý và hướng dẫn tham dự</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl font-bold gap-2">
                    <ChevronLeft className="h-4 w-4" /> Quay lại
                  </Button>
                  <Button onClick={() => setStep(3)} className="rounded-xl font-bold gap-2 px-6">
                    Tiếp theo: Địa điểm & Thời gian <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* STEP 3: ĐỊA ĐIỂM & THỜI GIAN */}
          {step === 3 && (
            <Card className="rounded-3xl border border-border/60 shadow-lg overflow-hidden animate-in fade-in">
              <CardHeader className="bg-orange-500/5 border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" /> Bước 3: Địa điểm & Thời gian diễn ra
                </CardTitle>
                <CardDescription>Cung cấp chính xác địa chỉ và thời gian bắt đầu/kết thúc sự kiện.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Tên địa điểm / Trung tâm <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="VD: Nhà thi đấu Phú Thọ, Sân vận động Mỹ Đình..."
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Thành phố <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CITIES.map((c) => (
                        <Badge
                          key={c}
                          onClick={() => setCity(c)}
                          className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            city === c ? "bg-orange-500 text-white" : "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Địa chỉ chi tiết <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="VD: Số 219 Lý Thường Kiệt, Phường 15, Quận 11..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-orange-500" /> Bắt đầu lúc <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-orange-500" /> Kết thúc lúc <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl font-bold gap-2">
                    <ChevronLeft className="h-4 w-4" /> Quay lại
                  </Button>
                  <Button
                    onClick={() => {
                      if (!venue.trim() || !address.trim() || !startDate || !endDate) {
                        toast.error("Vui lòng nhập đầy đủ tên địa điểm, địa chỉ và thời gian.");
                        return;
                      }
                      setStep(4);
                    }}
                    className="rounded-xl font-bold gap-2 px-6"
                  >
                    Tiếp theo: Vé & Sơ đồ ghế <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* STEP 4: CẤU HÌNH VÉ & SEAT MAP BUILDER */}
          {step === 4 && (
            <Card className="rounded-3xl border border-border/60 shadow-lg overflow-hidden animate-in fade-in">
              <CardHeader className="bg-purple-500/5 border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-extrabold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Armchair className="h-5 w-5 text-purple-500" /> Bước 4: Cấu hình Vé & Bộ tạo Sơ đồ ghế (Seat Map)
                  </span>
                </CardTitle>
                <CardDescription>Chọn mô hình bán vé tự do hoặc cho phép khách chọn ghế theo vị trí.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                
                {/* TOGGLE SEAT MAP OPTION */}
                <div className="p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <span>Sử dụng Sơ đồ ghế ngồi cụ thể (Seat Map Grid)</span>
                      {hasSeatMap && <Badge className="bg-purple-600 text-white font-bold">ĐANG BẬT SEAT MAP</Badge>}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {hasSeatMap
                        ? "Khách hàng sẽ chọn vị trí cụ thể trên sơ đồ ghế (Ví dụ: Hàng A - Ghế 05)."
                        : "Khách hàng chọn số lượng vé theo hạng (Ví dụ: 2 Vé VIP, 3 Vé Thường)."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setHasSeatMap(!hasSeatMap)}
                    className={`rounded-xl font-bold shadow-md transition-all ${
                      hasSeatMap ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {hasSeatMap ? "Tắt Sơ đồ ghế" : "Bật Sơ đồ ghế"}
                  </Button>
                </div>

                {/* MODE A: NON-SEAT MAP TICKET TYPES */}
                {!hasSeatMap ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" /> Danh sách Hạng Vé
                      </h3>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1" onClick={handleAddTicketType}>
                        <Plus className="h-3.5 w-3.5" /> Thêm hạng vé
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {ticketTypes.map((tt, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-primary">Hạng vé #{idx + 1}</span>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => handleRemoveTicketType(idx)}>
                              <Trash2 className="h-3.5 w-3.5" /> Xóa
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Tên vé</label>
                              <Input
                                value={tt.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTicketTypes(prev => prev.map((t, i) => i === idx ? { ...t, name: val } : t));
                                }}
                                className="h-10 rounded-xl text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Giá vé (₫)</label>
                              <Input
                                type="number"
                                value={tt.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setTicketTypes(prev => prev.map((t, i) => i === idx ? { ...t, price: val } : t));
                                }}
                                className="h-10 rounded-xl text-sm font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Số lượng phát hành</label>
                              <Input
                                type="number"
                                value={tt.quantity}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setTicketTypes(prev => prev.map((t, i) => i === idx ? { ...t, quantity: val } : t));
                                }}
                                className="h-10 rounded-xl text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* MODE B: VISUAL SEAT MAP BUILDER */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-purple-600" /> Thiết lập Khu vực & Hàng ghế Sơ đồ
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Tạo các dãy ghế (VIP, Standard, Khán đài) và màu phân biệt</p>
                      </div>
                      <Button size="sm" className="rounded-xl text-xs font-bold gap-1 bg-purple-600 hover:bg-purple-700" onClick={handleAddSeatSection}>
                        <Plus className="h-3.5 w-3.5" /> Thêm khu vực ghế
                      </Button>
                    </div>

                    {/* SEAT SECTION CONFIG LIST */}
                    <div className="space-y-4">
                      {seatSections.map((sec, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-card space-y-3 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border shadow-xs" style={{ backgroundColor: sec.color }} />
                              <span className="font-bold text-sm text-foreground">{sec.name}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => handleRemoveSeatSection(idx)}>
                              <Trash2 className="h-3.5 w-3.5" /> Xóa khu vực
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                              <label className="text-[11px] font-bold text-muted-foreground">Tên khu vực</label>
                              <Input
                                value={sec.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSeatSections(prev => prev.map((s, i) => i === idx ? { ...s, name: val } : s));
                                }}
                                className="h-10 rounded-xl text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Ký hiệu hàng</label>
                              <Input
                                value={sec.label}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSeatSections(prev => prev.map((s, i) => i === idx ? { ...s, label: val } : s));
                                }}
                                className="h-10 rounded-xl text-xs font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Giá ghế (₫)</label>
                              <Input
                                type="number"
                                value={sec.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSeatSections(prev => prev.map((s, i) => i === idx ? { ...s, price: val } : s));
                                }}
                                className="h-10 rounded-xl text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Số hàng ghế</label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={sec.rowCount}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSeatSections(prev => prev.map((s, i) => i === idx ? { ...s, rowCount: val } : s));
                                }}
                                className="h-10 rounded-xl text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground">Ghế / hàng</label>
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                value={sec.seatsPerRow}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSeatSections(prev => prev.map((s, i) => i === idx ? { ...s, seatsPerRow: val } : s));
                                }}
                                className="h-10 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* LIVE VISUAL SEAT MAP PREVIEW */}
                    <div className="border border-purple-200 dark:border-purple-900/40 rounded-3xl p-6 bg-slate-950 text-white space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-purple-400" />
                          <h4 className="font-black text-sm uppercase tracking-wider text-purple-300">Xem Trước Sơ Đồ Ghế Khán Đài</h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span>Tổng số ghế: <strong className="text-amber-400 font-extrabold">{totalSeatsInMap} ghế</strong></span>
                          <span>Doanh thu dự kiến: <strong className="text-emerald-400 font-extrabold">{totalEstimatedRevenue.toLocaleString("vi-VN")} ₫</strong></span>
                        </div>
                      </div>

                      {/* STAGE INDICATOR */}
                      <div className="w-full flex justify-center">
                        <div className="w-3/4 py-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 rounded-b-3xl text-center text-xs font-black tracking-widest text-white shadow-lg uppercase border-b-2 border-purple-300">
                          🎭 SÂN KHẤU CHÍNH (STAGE) 🎭
                        </div>
                      </div>

                      {/* SEAT GRID DISPLAY */}
                      <div className="py-4 space-y-6 overflow-x-auto flex flex-col items-center">
                        {seatSections.map((sec, sIdx) => (
                          <div key={sIdx} className="w-full space-y-2 flex flex-col items-center">
                            <div className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.color }} />
                              {sec.name} ({sec.label}) — {sec.price.toLocaleString("vi-VN")} ₫ / ghế
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {Array.from({ length: Math.min(sec.rowCount, 10) }).map((_, rIdx) => {
                                const rowLetter = String.fromCharCode(65 + rIdx);
                                return (
                                  <div key={rIdx} className="flex items-center justify-center gap-1.5 text-[10px]">
                                    <span className="w-5 text-right font-bold text-slate-400">{sec.label}{rowLetter}</span>
                                    <div className="flex gap-1">
                                      {Array.from({ length: Math.min(sec.seatsPerRow, 15) }).map((_, cIdx) => (
                                        <div
                                          key={cIdx}
                                          className="w-5 h-5 rounded-t-md rounded-b-xs flex items-center justify-center font-bold text-[9px] text-slate-900 border shadow-2xs hover:scale-110 transition-transform"
                                          style={{ backgroundColor: sec.color, borderColor: "rgba(255,255,255,0.4)" }}
                                          title={`${sec.label}${rowLetter}-${cIdx + 1}`}
                                        >
                                          {cIdx + 1}
                                        </div>
                                      ))}
                                    </div>
                                    <span className="w-5 text-left font-bold text-slate-400">{sec.label}{rowLetter}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                )}

                <div className="pt-6 flex justify-between border-t border-border/40">
                  <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl font-bold gap-2">
                    <ChevronLeft className="h-4 w-4" /> Quay lại
                  </Button>
                  <Button
                    onClick={handleSubmitEvent}
                    disabled={isSubmitting}
                    className="rounded-xl font-extrabold text-base gap-2 px-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  >
                    {isSubmitting ? "Đang xử lý tạo sự kiện..." : "🚀 Xuất Bản & Tạo Sự Kiện Mới"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

        {/* SIDEBAR: LIVE EVENT CARD PREVIEW (1 COL) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="rounded-3xl border border-border/60 shadow-lg overflow-hidden bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Xem trước Thẻ Sự kiện (Buyer View)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Simulated Buyer Event Card */}
                <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-md flex flex-col">
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary/80 to-purple-600 flex items-center justify-center text-white/50 text-xs font-bold">
                        Chưa chọn ảnh bìa
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold">
                      {category}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-extrabold text-base line-clamp-2 text-foreground leading-tight">
                      {title || "Tên sự kiện của bạn..."}
                    </h3>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{startDate ? new Date(startDate).toLocaleString("vi-VN") : "Thời gian chưa chọn"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{venue ? `${venue}, ${city}` : "Địa điểm chưa nhập"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Giá từ:</span>
                      <span className="font-black text-sm text-primary">
                        {hasSeatMap
                          ? `${Math.min(...seatSections.map(s => s.price)).toLocaleString("vi-VN")} ₫`
                          : `${Math.min(...ticketTypes.map(t => t.price)).toLocaleString("vi-VN")} ₫`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40 text-xs text-muted-foreground space-y-1 leading-relaxed">
                  <p className="font-bold text-foreground">💡 Lưu ý quan trọng:</p>
                  <p>• Bạn có thể chỉnh sửa lại thông tin sự kiện sau khi tạo.</p>
                  <p>• Ảnh bìa từ máy tính sẽ được hiển thị ngay lập tức cho người mua vé.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
