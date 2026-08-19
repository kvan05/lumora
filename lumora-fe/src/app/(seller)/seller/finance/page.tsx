"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, Wallet, ArrowDownCircle, Clock, CheckCircle2,
  Banknote, RefreshCw, Building2, X, AlertCircle, CreditCard,
  Plus, Trash2, Edit, ShieldCheck, RotateCcw, AlertTriangle
} from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:    { label: "Chờ xử lý",  className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  PROCESSING: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  SETTLED:    { label: "Đã đối soát", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  COMPLETED:  { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  PAID_OUT:   { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  APPROVED:   { label: "Đã duyệt",   className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  REJECTED:   { label: "Bị từ chối", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "ACB", "VPBank",
  "BIDV", "Agribank", "VietinBank", "Sacombank", "TPBank",
  "VIB", "OCB", "HDBank", "SHB", "Nam A Bank"
];

export default function SellerFinancePage() {
  // Modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showBankModal, setShowBankModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  // Bank Form State
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [isDefaultAccount, setIsDefaultAccount] = useState<boolean>(false);
  const [isSavingBank, setIsSavingBank] = useState<boolean>(false);

  // Withdrawal Form State
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const [wAmount, setWAmount] = useState<string>("");
  const [wNote, setWNote] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // Filters
  const [settlementStatus, setSettlementStatus] = useState<string>("ALL");
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>("ALL");

  // Fetch Finance Overview & Settlements
  const { data: financeData, isLoading: isFinanceLoading, refetch: refetchFinance } = useQuery({
    queryKey: ["seller-finance", settlementStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (settlementStatus !== "ALL") params.set("status", settlementStatus);
      const res = await api.get(`/seller/finance?${params.toString()}`);
      return res.data.data;
    },
  });

  // Fetch Saved Bank Accounts
  const { data: bankAccounts, refetch: refetchBankAccounts } = useQuery({
    queryKey: ["seller-bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/seller/bank-accounts");
      return res.data.data as any[];
    },
  });

  // Fetch Withdrawals History
  const { data: withdrawals, isLoading: isWithdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["seller-withdrawals", withdrawalStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (withdrawalStatus !== "ALL") params.set("status", withdrawalStatus);
      const res = await api.get(`/seller/withdrawals?${params.toString()}`);
      return res.data.data as any[];
    },
  });

  const availableBalance = financeData?.availableBalance || 0;

  // Open Add / Edit Bank Modal
  const handleOpenBankModal = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setBankName(account.bankName);
      setAccountNumber(account.accountNumber);
      setAccountHolder(account.accountHolder);
      setIsDefaultAccount(account.isDefault);
    } else {
      setEditingAccount(null);
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
      setIsDefaultAccount((bankAccounts?.length || 0) === 0);
    }
    setShowBankModal(true);
  };

  // Save Bank Account (Create / Update)
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản");
      return;
    }
    setIsSavingBank(true);
    try {
      if (editingAccount) {
        await api.put(`/seller/bank-accounts/${editingAccount.id}`, {
          bankName,
          accountNumber,
          accountHolder,
          isDefault: isDefaultAccount,
        });
        toast.success("Cập nhật tài khoản ngân hàng thành công!");
      } else {
        await api.post("/seller/bank-accounts", {
          bankName,
          accountNumber,
          accountHolder,
          isDefault: isDefaultAccount,
        });
        toast.success("Thêm tài khoản ngân hàng thành công!");
      }
      setShowBankModal(false);
      refetchBankAccounts();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSavingBank(false);
    }
  };

  // Delete Bank Account
  const handleDeleteBank = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?")) return;
    try {
      await api.delete(`/seller/bank-accounts/${id}`);
      toast.success("Đã xóa tài khoản ngân hàng");
      refetchBankAccounts();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Không thể xóa tài khoản");
    }
  };

  // Open Withdrawal Request Modal
  const handleOpenWithdrawModal = () => {
    if (availableBalance <= 0) {
      toast.error("Số dư khả dụng của bạn hiện bằng 0 ₫. Chưa thể gửi yêu cầu rút tiền.");
      return;
    }
    const defaultAcc = bankAccounts?.find((a: any) => a.isDefault) || bankAccounts?.[0];
    if (defaultAcc) {
      setSelectedBankAccountId(defaultAcc.id);
    }
    setWAmount("");
    setWNote("");
    setShowWithdrawModal(true);
  };

  // Submit Withdrawal Request
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(wAmount);

    if (!amountNum || amountNum < 100000) {
      toast.error("Số tiền rút tối thiểu là 100,000 ₫");
      return;
    }
    if (amountNum > availableBalance) {
      toast.error(`Số tiền rút vượt quá số dư khả dụng (${availableBalance.toLocaleString("vi-VN")} ₫)`);
      return;
    }

    const selectedBank = bankAccounts?.find((b: any) => b.id === selectedBankAccountId);
    if (!selectedBank) {
      toast.error("Vui lòng chọn tài khoản ngân hàng nhận tiền");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await api.post("/seller/withdrawals", {
        amount: amountNum,
        bankName: selectedBank.bankName,
        accountNumber: selectedBank.accountNumber,
        accountHolder: selectedBank.accountHolder,
        note: wNote,
      });
      toast.success(res.data.message || "Yêu cầu rút tiền đã được gửi thành công!");
      setShowWithdrawModal(false);
      refetchFinance();
      refetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + " ₫";

  if (isFinanceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" /> Quản lý Tài chính & Rút tiền
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi tổng doanh thu, thực nhận đối soát, số dư khả dụng và yêu cầu rút tiền.
          </p>
        </div>

        <Button
          onClick={handleOpenWithdrawModal}
          disabled={availableBalance <= 0}
          className="gap-2 rounded-xl font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          <Banknote className="h-4 w-4" /> Yêu cầu rút tiền
        </Button>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Available Balance (Highlighted) */}
        <Card className="rounded-2xl border-2 border-emerald-500/50 shadow-md bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Số dư khả dụng</span>
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{fmt(availableBalance)}</p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium mt-1">Số tiền bạn có thể rút ngay</p>
          </CardContent>
        </Card>

        {/* Card 2: Gross Revenue */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng doanh thu</span>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">{fmt(financeData?.grossRevenue || 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Tổng tiền bán vé</p>
          </CardContent>
        </Card>

        {/* Card 3: Platform Fee */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hoa hồng Lumora</span>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">{fmt(financeData?.totalCommission || 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Phí vận hành hệ thống (~7%)</p>
          </CardContent>
        </Card>

        {/* Card 4: Pending Settlement */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chờ đối soát</span>
              <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">{fmt(financeData?.pendingSettlement || 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Đối soát sau sự kiện 3–7 ngày</p>
          </CardContent>
        </Card>

        {/* Card 5: Total Settled */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đã đối soát</span>
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">{fmt(financeData?.totalSettled || 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Đã cộng vào số dư khả dụng</p>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Banner Info */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200">
          <p className="font-extrabold mb-0.5 text-sm">Quy trình giữ tiền tạm (Escrow) của Lumora</p>
          <p>Doanh thu từ vé được giữ an toàn trong hệ thống và tự động chuyển sang <strong>Số dư khả dụng</strong> sau khi sự kiện kết thúc 3-7 ngày (trừ phí vận hành nền tảng). Bạn có thể thực hiện rút tiền về tài khoản ngân hàng đã lưu bất cứ lúc nào.</p>
        </div>
      </div>

      {/* Bank Account Management Section */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Quản lý Tài khoản Ngân hàng nhận tiền
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Lưu tài khoản ngân hàng chính chủ để phục vụ việc chuyển tiền và rút doanh thu.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => handleOpenBankModal()} className="gap-1.5 rounded-xl font-bold text-xs">
            <Plus className="h-4 w-4" /> Thêm tài khoản mới
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {!bankAccounts || bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
              <CreditCard className="h-8 w-8 mx-auto opacity-30" />
              <p className="font-semibold text-sm text-foreground">Chưa có tài khoản ngân hàng nào được lưu</p>
              <p>Vui lòng thêm ít nhất 1 tài khoản ngân hàng để thực hiện yêu cầu rút tiền.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bankAccounts.map((acc: any) => (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    acc.isDefault ? "border-primary bg-primary/5 shadow-xs" : "border-border/60 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-primary flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" /> {acc.bankName}
                    </span>
                    {acc.isDefault && (
                      <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">Mặc định</Badge>
                    )}
                  </div>
                  <p className="text-lg font-mono font-black tracking-wider text-foreground">{acc.accountNumber}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mt-0.5">{acc.accountHolder}</p>
                  
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-bold px-2 rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenBankModal(acc)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-bold px-2 rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteBank(acc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Settlement Breakdown Table */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Bảng đối soát theo sự kiện
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Chi tiết doanh thu, phí dịch vụ và tiền thực nhận sau khi sự kiện kết thúc.
            </CardDescription>
          </div>

          <div className="w-full sm:w-48">
            <Select value={settlementStatus} onValueChange={setSettlementStatus}>
              <SelectTrigger className="rounded-xl h-9 text-xs font-semibold bg-background">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="font-bold text-xs">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Chờ đối soát</SelectItem>
                <SelectItem value="SETTLED" className="text-xs">Đã đối soát</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">Đã thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Tên sự kiện</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Tổng doanh thu</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Phí Lumora</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Thực nhận</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!financeData?.settlements || financeData.settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                    Chưa có kỳ đối soát nào. Kỳ đối soát sẽ tự động tạo sau khi sự kiện diễn ra.
                  </TableCell>
                </TableRow>
              ) : (
                financeData.settlements.map((s: any) => {
                  const badgeInfo = STATUS_BADGE[s.status] || { label: s.status, className: "bg-gray-100" };
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <p className="font-bold text-sm text-foreground line-clamp-1">{s.event?.title || "Sự kiện"}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {s.event?.endDate ? `Kết thúc: ${format(new Date(s.event.endDate), "dd/MM/yyyy", { locale: vi })}` : "Đã kết thúc"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        {fmt(Number(s.grossRevenue))}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm text-amber-600">
                        -{fmt(Number(s.commissionFee))}
                      </TableCell>
                      <TableCell className="text-right font-black text-sm text-emerald-600">
                        {fmt(Number(s.netAmount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${badgeInfo.className} border-none font-bold text-xs py-0.5 px-2.5`}>
                          {badgeInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Withdrawal History Table */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" /> Lịch sử rút tiền
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Danh sách các yêu cầu rút tiền về tài khoản ngân hàng của bạn.
            </CardDescription>
          </div>

          <div className="w-full sm:w-48">
            <Select value={withdrawalStatus} onValueChange={setWithdrawalStatus}>
              <SelectTrigger className="rounded-xl h-9 text-xs font-semibold bg-background">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="font-bold text-xs">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Chờ xử lý</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">Đã thanh toán</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Bị từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Mã yêu cầu</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Số tiền rút</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Tài khoản nhận</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Ngày tạo</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isWithdrawalsLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !withdrawals || withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                    Chưa có yêu cầu rút tiền nào trong danh sách.
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((w: any) => {
                  const badgeInfo = STATUS_BADGE[w.status] || { label: w.status, className: "bg-gray-100" };
                  return (
                    <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary uppercase">
                        #{w.id.slice(-8)}
                      </TableCell>
                      <TableCell className="text-right font-black text-sm text-foreground">
                        {fmt(Number(w.amount))}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-xs text-foreground">{w.bankName} - {w.accountNumber}</p>
                        <p className="text-[11px] text-muted-foreground uppercase">{w.accountHolder}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${badgeInfo.className} border-none font-bold text-xs py-0.5 px-2.5`}>
                          {badgeInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal 1: Add / Edit Bank Account */}
      {showBankModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-extrabold text-base">
                  {editingAccount ? "Chỉnh sửa tài khoản ngân hàng" : "Thêm tài khoản ngân hàng mới"}
                </h3>
              </div>
              <button onClick={() => setShowBankModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Tên ngân hàng <span className="text-destructive">*</span></label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Số tài khoản <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Ví dụ: 0123456789"
                  className="rounded-xl text-xs font-mono font-bold"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Tên chủ tài khoản (Viết hoa không dấu) <span className="text-destructive">*</span></label>
                <Input
                  placeholder="NGUYEN VAN A"
                  className="rounded-xl text-xs uppercase font-bold"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefaultAccount}
                  onChange={(e) => setIsDefaultAccount(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isDefault" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  Đặt làm tài khoản nhận tiền mặc định
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="ghost" onClick={() => setShowBankModal(false)} className="rounded-xl text-xs font-bold">
                  Hủy
                </Button>
                <Button type="submit" disabled={isSavingBank} className="rounded-xl text-xs font-bold gap-2">
                  {isSavingBank && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {editingAccount ? "Lưu thay đổi" : "Thêm tài khoản"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Withdrawal Request */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-extrabold text-base">Tạo yêu cầu rút tiền</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <p className="text-muted-foreground font-semibold">Số dư khả dụng:</p>
                <p className="text-xl font-black text-emerald-600">{fmt(availableBalance)}</p>
              </div>

              {/* Bank Account Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Chọn tài khoản ngân hàng nhận <span className="text-destructive">*</span></label>
                {!bankAccounts || bankAccounts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs flex items-center justify-between">
                    <span>Bạn chưa có tài khoản ngân hàng nào.</span>
                    <Button size="sm" type="button" variant="outline" className="h-7 text-[10px] font-bold" onClick={() => { setShowWithdrawModal(false); handleOpenBankModal(); }}>
                      Thêm ngay
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    required
                  >
                    {bankAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber} ({acc.accountHolder}){acc.isDefault ? " [Mặc định]" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground">Số tiền muốn rút (₫) <span className="text-destructive">*</span></label>
                  <button
                    type="button"
                    onClick={() => setWAmount(String(availableBalance))}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Rút tối đa
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="Ví dụ: 500000"
                  className="rounded-xl text-sm font-bold"
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value)}
                  min="100000"
                  max={availableBalance}
                  required
                />
                <p className="text-[10px] text-muted-foreground">Số tiền tối thiểu: 100,000 ₫</p>
              </div>

              {/* Optional Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Ghi chú (tùy chọn)</label>
                <Input
                  placeholder="Nhập ghi chú cho Admin nếu có..."
                  className="rounded-xl text-xs"
                  value={wNote}
                  onChange={(e) => setWNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                <Button type="button" variant="ghost" onClick={() => setShowWithdrawModal(false)} className="rounded-xl text-xs font-bold">
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isWithdrawing || !selectedBankAccountId}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {isWithdrawing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Gửi yêu cầu rút tiền
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
