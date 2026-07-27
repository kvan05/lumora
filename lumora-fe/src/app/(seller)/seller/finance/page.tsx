"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp, Wallet, ArrowDownCircle, Clock, CheckCircle2,
  Banknote, RefreshCw, Building2, X, AlertCircle
} from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:    { label: "Chờ xử lý",  className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  PROCESSING: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  COMPLETED:  { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  REJECTED:   { label: "Bị từ chối", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "ACB", "VPBank",
  "BIDV", "Agribank", "VietinBank", "Sacombank", "TPBank",
  "VIB", "OCB", "HDBank", "SHB", "Nam A Bank"
];

export default function SellerFinancePage() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [wAmount, setWAmount] = useState("");
  const [wBankName, setWBankName] = useState("");
  const [wAccountNumber, setWAccountNumber] = useState("");
  const [wAccountHolder, setWAccountHolder] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["seller-finance"],
    queryFn: async () => {
      const res = await api.get("/seller/finance");
      return res.data.data;
    },
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["seller-withdrawals"],
    queryFn: async () => {
      const res = await api.get("/seller/withdrawals");
      return res.data.data as any[];
    },
  });

  const handleWithdraw = async () => {
    if (!wAmount || !wBankName || !wAccountNumber || !wAccountHolder) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (Number(wAmount) < 100000) {
      toast.error("Số tiền rút tối thiểu là 100,000 ₫");
      return;
    }
    setIsWithdrawing(true);
    try {
      const res = await api.post("/seller/withdrawals", {
        amount: Number(wAmount),
        bankName: wBankName,
        accountNumber: wAccountNumber,
        accountHolder: wAccountHolder,
      });
      toast.success(res.data.message || "Yêu cầu rút tiền đã được gửi");
      setShowWithdrawModal(false);
      setWAmount(""); setWBankName(""); setWAccountNumber(""); setWAccountHolder("");
      refetch();
      refetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Có lỗi xảy ra");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " ₫";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const stats = [
    {
      label: "Tổng doanh thu (Gross)",
      value: fmt(data?.grossRevenue || 0),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      description: "Tổng tiền vé bán được",
    },
    {
      label: "Hoa hồng Lumora",
      value: fmt(data?.totalCommission || 0),
      icon: Building2,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      description: "Phí nền tảng (~7%)",
    },
    {
      label: "Đang chờ đối soát",
      value: fmt(data?.pendingSettlement || 0),
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      description: "Sau sự kiện kết thúc 3–7 ngày",
    },
    {
      label: "Đã thanh toán",
      value: fmt(data?.totalSettled || 0),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      description: "Đã chuyển về tài khoản",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" /> Tài chính
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý doanh thu, đối soát và yêu cầu rút tiền
          </p>
        </div>
        <Button onClick={() => setShowWithdrawModal(true)} className="gap-2 rounded-xl font-bold shadow-md">
          <Banknote className="h-4 w-4" /> Yêu cầu rút tiền
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-2xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                <p className="text-xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Escrow Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-bold mb-1">Mô hình Escrow của Lumora</p>
          <p>Tiền bán vé được Lumora giữ tạm (Escrow) đến sau khi sự kiện kết thúc. Sau 3–7 ngày đối soát, phần tiền (sau khi trừ phí 7% + 5.000đ/vé) sẽ được chuyển về tài khoản đăng ký của bạn.</p>
        </div>
      </div>

      {/* Settlement Table */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold">Bảng đối soát theo sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.settlements || data.settlements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowDownCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Chưa có bảng đối soát nào. Admin sẽ tạo sau khi sự kiện kết thúc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Sự kiện</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Doanh thu</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Hoa hồng</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Thực nhận</th>
                    <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.settlements.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-3 px-3">
                        <p className="font-semibold">{s.event?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.event?.endDate ? format(new Date(s.event.endDate), "dd/MM/yyyy", { locale: vi }) : "—"}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">{Number(s.grossRevenue).toLocaleString("vi-VN")} ₫</td>
                      <td className="py-3 px-3 text-right text-destructive">{Number(s.commissionFee).toLocaleString("vi-VN")} ₫</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600">{Number(s.netAmount).toLocaleString("vi-VN")} ₫</td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={STATUS_BADGE[s.status]?.className || ""}>
                          {STATUS_BADGE[s.status]?.label || s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold">Lịch sử rút tiền</CardTitle>
        </CardHeader>
        <CardContent>
          {!withdrawals || withdrawals.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Chưa có yêu cầu rút tiền nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div>
                    <p className="font-bold">{Number(w.amount).toLocaleString("vi-VN")} ₫</p>
                    <p className="text-xs text-muted-foreground">{w.bankName} — {w.accountNumber}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(w.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
                  </div>
                  <Badge className={STATUS_BADGE[w.status]?.className || ""}>
                    {STATUS_BADGE[w.status]?.label || w.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-extrabold text-lg">Yêu cầu rút tiền</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Số tiền muốn rút (₫) <span className="text-destructive">*</span></label>
                <Input
                  type="number"
                  min="100000"
                  placeholder="500000"
                  value={wAmount}
                  onChange={e => setWAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Tối thiểu: 100,000 ₫</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Ngân hàng <span className="text-destructive">*</span></label>
                <select
                  value={wBankName}
                  onChange={e => setWBankName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Số tài khoản <span className="text-destructive">*</span></label>
                <Input placeholder="0123456789" value={wAccountNumber} onChange={e => setWAccountNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Tên chủ tài khoản <span className="text-destructive">*</span></label>
                <Input
                  placeholder="NGUYEN VAN A"
                  value={wAccountHolder}
                  onChange={e => setWAccountHolder(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              <Separator />
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>Huỷ</Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="gap-2 rounded-xl font-bold"
                >
                  {isWithdrawing ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Đang gửi...</>
                  ) : (
                    "Gửi yêu cầu"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
