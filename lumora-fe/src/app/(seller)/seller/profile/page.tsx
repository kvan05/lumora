"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldCheck,
  CreditCard,
  KeyRound,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Camera,
  Save,
  RefreshCw,
  Lock,
  Award,
} from "lucide-react";

const BANKS = [
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "MB Bank (MB)",
  "ACB",
  "VPBank",
  "BIDV",
  "Agribank",
  "VietinBank",
  "Sacombank",
  "TPBank",
  "VIB",
  "OCB",
  "HDBank",
  "SHB",
];

export default function SellerProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Tab 1 & General Profile State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [orgName, setOrgName] = useState("");
  const [representative, setRepresentative] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [address, setAddress] = useState("");

  // Compress Avatar Image Client-side
  const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<string> => {
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
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSellerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng ảnh đại diện vượt quá 10MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }

    setIsUploadingAvatar(true);
    toast.loading("Đang nén và lưu ảnh đại diện...", { id: "seller-avatar-upload" });
    try {
      const compressedDataUrl = await compressImage(file, 400, 0.85);
      const res = await api.put("/auth/profile", {
        name: session?.user?.name,
        avatar: compressedDataUrl,
      });

      if (res.data.success) {
        toast.success("Cập nhật ảnh đại diện Nhà tổ chức thành công!", { id: "seller-avatar-upload" });
        await updateSession({ image: compressedDataUrl });
        setAvatar(compressedDataUrl);
      }
    } catch {
      toast.error("Lỗi khi tải ảnh đại diện lên CSDL.", { id: "seller-avatar-upload" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Tab 2: Bank State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Tab 3: Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Fetch Seller Profile Data
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ["seller-profile-detail"],
    queryFn: async () => {
      const res = await api.get("/seller/profile");
      return res.data.data;
    },
  });

  // Populate state when profile loads
  useEffect(() => {
    if (profileData) {
      const u = profileData.user || {};
      const p = profileData.profile || {};
      const b = p.bankInfo || {};

      setName(u.name || "");
      setPhone(u.phone || "");
      setAvatar(u.avatar || "");

      setOrgName(p.orgName || u.name || "");
      setRepresentative(p.representative || u.name || "");
      setOrgDescription(p.orgDescription || "");
      setWebsite(p.website || "");
      setFacebook(p.facebook || "");
      setAddress(p.address || "");

      setBankName(b.bankName || "");
      setAccountNumber(b.accountNumber || "");
      setAccountHolder(b.accountHolder || "");
    }
  }, [profileData]);

  const handleSaveProfile = async () => {
    if (!orgName.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu / nhà tổ chức.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.put("/seller/profile", {
        name,
        phone,
        avatar,
        orgName,
        representative,
        orgDescription,
        website,
        facebook,
        address,
        bankName,
        accountNumber,
        accountHolder: accountHolder.toUpperCase(),
      });

      toast.success(res.data.message || "Cập nhật thông tin tài khoản thành công!");
      await updateSession();
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Không thể cập nhật thông tin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ các trường mật khẩu.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success(res.data.message || "Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Mật khẩu hiện tại không chính xác.");
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const userEmail = profileData?.user?.email || session?.user?.email || "";
  const verifyStatus = profileData?.profile?.verifyStatus || "APPROVED";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#93C453]" /> Thông tin tài khoản
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý hồ sơ thương hiệu, thông tin ngân hàng nhận tiền và bảo mật tài khoản Nhà tổ chức.
          </p>
        </div>
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="rounded-xl font-black bg-[#93C453] text-slate-950 hover:bg-[#82B342] gap-2 shadow-md px-6 h-11"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Lưu thông tin
            </>
          )}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        id="seller-avatar-file-input"
        accept="image/*"
        onChange={handleSellerAvatarUpload}
        className="hidden"
      />

      {/* Main Profile Summary Banner Card */}
      <Card className="rounded-3xl border border-border/80 shadow-sm bg-gradient-to-r from-card via-muted/30 to-primary/5 p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Preview */}
          <div
            className="relative group shrink-0 cursor-pointer"
            onClick={() => document.getElementById("seller-avatar-file-input")?.click()}
          >
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-xl">
              <AvatarImage src={avatar || (session?.user as any)?.image} alt={orgName} />
              <AvatarFallback className="text-2xl font-black bg-primary text-primary-foreground">
                {orgName ? orgName.substring(0, 2).toUpperCase() : "NT"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
              <Camera className="h-6 w-6" />
              <span>{isUploadingAvatar ? "..." : "Đổi ảnh"}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 bg-card rounded-full border border-border shadow-md">
              <Sparkles className="h-4 w-4 text-[#93C453]" />
            </div>
          </div>

          {/* User & Org Metadata */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-black text-foreground">{orgName || "Nhà tổ chức Lumora"}</h2>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-none px-3 py-1 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực
              </Badge>
              <Badge variant="outline" className="font-extrabold text-xs">
                NHÀ TỔ CHỨC
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
              <Mail className="h-4 w-4 text-primary" /> {userEmail}
              {phone && (
                <>
                  <span className="text-border">•</span>
                  <Phone className="h-4 w-4 text-primary" /> {phone}
                </>
              )}
            </p>

            {/* Avatar Upload Button */}
            <div className="pt-2 flex justify-center md:justify-start">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold gap-2 border-primary/30 text-primary"
                onClick={() => document.getElementById("seller-avatar-file-input")?.click()}
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4" />
                {isUploadingAvatar ? "Đang xử lý ảnh..." : "Chọn ảnh đại diện từ máy tính"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="brand" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto rounded-full bg-muted/80 p-1">
          <TabsTrigger value="brand" className="rounded-full font-bold text-xs sm:text-sm gap-1.5">
            <Building2 className="h-4 w-4" /> Hồ sơ Thương hiệu
          </TabsTrigger>
          <TabsTrigger value="bank" className="rounded-full font-bold text-xs sm:text-sm gap-1.5">
            <CreditCard className="h-4 w-4" /> Tài khoản Ngân hàng
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full font-bold text-xs sm:text-sm gap-1.5">
            <KeyRound className="h-4 w-4" /> Bảo mật & MK
          </TabsTrigger>
          <TabsTrigger value="legal" className="rounded-full font-bold text-xs sm:text-sm gap-1.5">
            <FileCheck className="h-4 w-4" /> Xác minh Pháp lý
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: HỒ SƠ THƯƠNG HIỆU */}
        <TabsContent value="brand" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Thông tin Thương hiệu & Nhà tổ chức</CardTitle>
              <CardDescription>
                Thông tin này sẽ được hiển thị công khai trên trang chi tiết sự kiện để người mua vé tin tưởng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tên Thương hiệu / Tổ chức <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ví dụ: SkyDec Entertainment"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="rounded-xl h-11 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Người đại diện liên hệ
                  </label>
                  <Input
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={representative}
                    onChange={(e) => setRepresentative(e.target.value)}
                    className="rounded-xl h-11 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Số điện thoại Hotline
                  </label>
                  <Input
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl h-11 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Website chính thức
                  </label>
                  <Input
                    placeholder="https://skydec.vn"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="rounded-xl h-11 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Địa chỉ Trụ sở / Văn phòng
                </label>
                <Input
                  placeholder="Ví dụ: Tầng 12, Tòa nhà Landmark 81, Bình Thạnh, TP. Hồ Chí Minh"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl h-11 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mô tả giới thiệu Thương hiệu
                </label>
                <Textarea
                  placeholder="Giới thiệu đôi nét về kinh nghiệm tổ chức sự kiện, các đêm nhạc hoặc giải chạy tiêu biểu..."
                  rows={4}
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  className="rounded-2xl resize-none font-medium"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="rounded-full font-black bg-[#93C453] text-slate-950 hover:bg-[#82B342] px-8 shadow-md"
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG */}
        <TabsContent value="bank" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Thông tin Ngân hàng Nhận Doanh thu đối soát</CardTitle>
              <CardDescription>
                Hệ thống Lumora sẽ tự động chuyển khoản đối soát tiền bán vé vào tài khoản này.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ngân hàng thụ hưởng <span className="text-destructive">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:outline-none"
                >
                  <option value="">-- Chọn ngân hàng thương mại --</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Số tài khoản ngân hàng <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="rounded-xl h-11 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tên chủ tài khoản (Viết hoa không dấu) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="NGUYEN VAN A"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    className="rounded-xl h-11 font-bold uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="rounded-full font-black bg-[#93C453] text-slate-950 hover:bg-[#82B342] px-8 shadow-md"
                >
                  {isSaving ? "Đang lưu..." : "Lưu tài khoản ngân hàng"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU */}
        <TabsContent value="security" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Bảo mật & Đổi Mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu thường xuyên để bảo vệ an toàn cho tài khoản Nhà tổ chức.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu hiện tại</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPass}
                  className="rounded-full font-black bg-primary text-primary-foreground px-8 shadow-md"
                >
                  {isChangingPass ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: HỒ SƠ PHÁP LÝ & XÁC MINH */}
        <TabsContent value="legal" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Hồ sơ Xác minh Pháp lý Nhà tổ chức</CardTitle>
              <CardDescription>Trạng thái kiểm duyệt hồ sơ pháp lý từ Admin ban quản trị Lumora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
                <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-base text-foreground">Hồ sơ đã được Phê duyệt Xác thực (Verified)</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tài khoản của bạn đã được Admin kiểm duyệt thông tin pháp lý thành công. Bạn có thể tự do tạo sự kiện, mở bán vé và rút tiền đối soát không giới hạn.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
