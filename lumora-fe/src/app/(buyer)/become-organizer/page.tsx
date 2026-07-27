"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, FileText, CreditCard, CheckCircle2,
  ChevronRight, ChevronLeft, Upload, User, Globe, Share2,
  MapPin, BadgeCheck, Banknote, AlertTriangle
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Thông tin tổ chức", icon: Building2 },
  { id: 2, title: "Giấy tờ xác minh", icon: FileText },
  { id: 3, title: "Tài khoản ngân hàng", icon: CreditCard },
  { id: 4, title: "Xác nhận & Gửi", icon: CheckCircle2 },
];

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "ACB", "VPBank",
  "BIDV", "Agribank", "VietinBank", "Sacombank", "TPBank",
  "VIB", "OCB", "HDBank", "SHB", "Nam A Bank"
];

export default function BecomeOrganizerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Org info
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgBanner, setOrgBanner] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [address, setAddress] = useState("");
  const [representative, setRepresentative] = useState("");

  // Step 2 — Documents
  const [docType, setDocType] = useState("CCCD"); // CCCD or BUSINESS_LICENSE
  const [docUrl, setDocUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  // Step 3 — Bank info
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Step 4 — Terms
  const [agreeTerms, setAgreeTerms] = useState(false);

  if (status === "loading") return null;
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Vui lòng <Link href="/login" className="text-primary font-bold">đăng nhập</Link> để tiếp tục.</p>
      </div>
    );
  }

  const validateStep = () => {
    if (step === 1) {
      if (!orgName.trim()) { toast.error("Vui lòng nhập tên tổ chức"); return false; }
      if (!representative.trim()) { toast.error("Vui lòng nhập tên người đại diện"); return false; }
      if (!address.trim()) { toast.error("Vui lòng nhập địa chỉ"); return false; }
    }
    if (step === 2) {
      if (!docUrl.trim()) { toast.error("Vui lòng cung cấp URL giấy tờ xác minh"); return false; }
      if (docType === "CCCD" && !selfieUrl.trim()) { toast.error("Vui lòng cung cấp URL ảnh selfie cầm CCCD"); return false; }
    }
    if (step === 3) {
      if (!bankName) { toast.error("Vui lòng chọn ngân hàng"); return false; }
      if (!accountNumber.trim()) { toast.error("Vui lòng nhập số tài khoản"); return false; }
      if (!accountHolder.trim()) { toast.error("Vui lòng nhập tên chủ tài khoản"); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!agreeTerms) { toast.error("Bạn cần đồng ý với Điều khoản bán vé của Lumora"); return; }

    const documents = [
      { docType, docUrl },
      ...(docType === "CCCD" && selfieUrl ? [{ docType: "SELFIE", docUrl: selfieUrl }] : []),
    ];

    setIsSubmitting(true);
    try {
      await api.post("/auth/become-organizer", {
        orgName, orgLogo, orgBanner, orgDescription, website, facebook,
        address, representative,
        bankName, accountNumber, accountHolder,
        documents,
        agreeTerms,
      });
      toast.success("Đã gửi đơn đăng ký thành công! Admin sẽ xét duyệt trong 1-3 ngày làm việc.");
      router.push("/profile");
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
            <BadgeCheck className="h-4 w-4" /> Đăng ký Nhà tổ chức sự kiện
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Trở thành Organizer trên Lumora</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Đăng ký một lần, tổ chức nhiều sự kiện. Chúng tôi sẽ xét duyệt trong 1–3 ngày làm việc.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm font-bold ${
                  isActive ? "bg-primary text-primary-foreground shadow-md" :
                  isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{s.title}</span>
                </div>
                {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="rounded-3xl border border-border/60 shadow-lg">
          <CardContent className="p-8 space-y-6">

            {/* STEP 1 — Org Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Thông tin tổ chức
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold">Tên tổ chức / Ban nhạc / Công ty <span className="text-destructive">*</span></label>
                    <Input placeholder="VD: Sun Group Entertainment" value={orgName} onChange={e => setOrgName(e.target.value)} />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold">Người đại diện <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="Họ và tên người đại diện" value={representative} onChange={e => setRepresentative(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Logo (URL ảnh)</label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="https://..." value={orgLogo} onChange={e => setOrgLogo(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Banner (URL ảnh)</label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="https://..." value={orgBanner} onChange={e => setOrgBanner(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Fanpage Facebook</label>
                    <div className="relative">
                      <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="https://facebook.com/..." value={facebook} onChange={e => setFacebook(e.target.value)} />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold">Địa chỉ trụ sở <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="Số nhà, đường, quận, thành phố" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold">Mô tả tổ chức</label>
                    <Textarea placeholder="Giới thiệu ngắn về tổ chức, loại sự kiện hay tổ chức..." value={orgDescription} onChange={e => setOrgDescription(e.target.value)} className="resize-none min-h-[80px]" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Documents */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Giấy tờ xác minh
                </h2>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-bold mb-1">Tại sao cần xác minh?</p>
                    <p>Nhằm bảo vệ người mua vé và đảm bảo tính hợp lệ của sự kiện, Lumora yêu cầu xác minh danh tính một lần duy nhất.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Loại tổ chức</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDocType("CCCD")}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${docType === "CCCD" ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <p className="font-bold text-sm">Cá nhân / Hộ kinh doanh</p>
                        <p className="text-xs text-muted-foreground mt-1">CCCD + Selfie cầm CCCD</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocType("BUSINESS_LICENSE")}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${docType === "BUSINESS_LICENSE" ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <p className="font-bold text-sm">Doanh nghiệp / Công ty</p>
                        <p className="text-xs text-muted-foreground mt-1">Giấy phép đăng ký kinh doanh</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">
                      {docType === "CCCD" ? "URL ảnh CCCD (cả 2 mặt)" : "URL ảnh Giấy phép kinh doanh"} <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="https://drive.google.com/... hoặc imgur.com/..." value={docUrl} onChange={e => setDocUrl(e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Tải ảnh lên Google Drive / Imgur rồi dán link vào đây</p>
                  </div>

                  {docType === "CCCD" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">URL ảnh Selfie cầm CCCD <span className="text-destructive">*</span></label>
                      <div className="relative">
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="https://..." value={selfieUrl} onChange={e => setSelfieUrl(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3 — Bank Info */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Thông tin tài khoản nhận tiền
                </h2>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300">
                  <p>Lumora sẽ chuyển tiền về tài khoản này sau khi sự kiện kết thúc và đối soát xong (3–7 ngày làm việc).</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Ngân hàng <span className="text-destructive">*</span></label>
                    <select
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    >
                      <option value="">-- Chọn ngân hàng --</option>
                      {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Số tài khoản <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="0123456789" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Tên chủ tài khoản <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10 uppercase" placeholder="NGUYEN VAN A" value={accountHolder} onChange={e => setAccountHolder(e.target.value.toUpperCase())} />
                    </div>
                    <p className="text-xs text-muted-foreground">Nhập IN HOA, khớp chính xác với tên trên thẻ ngân hàng</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — Review & Submit */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Xem lại & Xác nhận
                </h2>

                {/* Summary */}
                <div className="space-y-3">
                  {[
                    { label: "Tên tổ chức", value: orgName },
                    { label: "Người đại diện", value: representative },
                    { label: "Địa chỉ", value: address },
                    { label: "Website", value: website || "—" },
                    { label: "Fanpage", value: facebook || "—" },
                    { label: "Loại giấy tờ", value: docType === "CCCD" ? "CCCD cá nhân" : "Giấy phép kinh doanh" },
                    { label: "Ngân hàng", value: `${bankName} — ${accountNumber}` },
                    { label: "Chủ tài khoản", value: accountHolder },
                  ].map(item => (
                    <div key={item.label} className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
                      <span className="text-sm text-muted-foreground shrink-0 w-36">{item.label}</span>
                      <span className="text-sm font-semibold text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Terms */}
                <div className="bg-muted/50 rounded-2xl p-4 border border-border/60">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Bằng cách gửi đơn đăng ký, bạn xác nhận đồng ý với <strong>Điều khoản Nhà tổ chức sự kiện Lumora</strong>: tuân thủ quy định tổ chức sự kiện, chịu trách nhiệm về nội dung và chất lượng sự kiện, đồng ý với mô hình Escrow và phí nền tảng 5–8%.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="w-5 h-5 rounded accent-primary"
                    />
                    <span className="text-sm font-bold">Tôi đồng ý với Điều khoản bán vé của Lumora</span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
                className="gap-2 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? "Huỷ" : "Quay lại"}
              </Button>

              {step < 4 ? (
                <Button onClick={handleNext} className="gap-2 rounded-xl font-bold px-8">
                  Tiếp theo <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !agreeTerms}
                  className="gap-2 rounded-xl font-bold px-8 bg-gradient-to-r from-primary to-primary/80"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi đơn đăng ký"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
