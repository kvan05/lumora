"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, ShieldCheck, Ticket, ChevronRight } from "lucide-react";
import Link from "next/link";

const profileSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.success) {
          const data = res.data.data;
          setProfile(data);
          profileForm.reset({
            name: data.name || "",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        toast.error("Không thể tải thông tin hồ sơ");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    } else if (session === null) {
      router.push("/login");
    }
  }, [session, profileForm, router]);

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    setIsSavingProfile(true);
    try {
      const res = await api.put("/auth/profile", values);
      if (res.data.success) {
        toast.success("Cập nhật hồ sơ thành công!");
        await update({ name: values.name });
        setProfile((prev: any) => ({ ...prev, ...values }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Cập nhật thất bại");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setIsSavingPassword(true);
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (res.data.success) {
        toast.success("Đổi mật khẩu thành công!");
        passwordForm.reset();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Đổi mật khẩu thất bại");
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[280px] w-full rounded-2xl" />
        <Skeleton className="h-[260px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-6 p-6 bg-card rounded-2xl border border-border/60 shadow-sm">
        <Avatar className="h-16 w-16 ring-2 ring-primary/30">
          <AvatarImage src={profile?.avatar || ""} alt={profile?.name || ""} />
          <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
            {profile?.name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-foreground">{profile?.name}</h1>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
            <Mail className="h-4 w-4" />
            <span>{profile?.email}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link href="/orders">
            <Ticket className="h-4 w-4 mr-2 text-primary" />
            Vé của tôi
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Personal Info Card */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
          </div>
          <CardDescription>Cập nhật họ tên và số điện thoại liên lạc.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Họ và tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Số điện thoại</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="0901 234 567" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSavingProfile} className="rounded-full">
                {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
          </div>
          <CardDescription>Đảm bảo tài khoản của bạn được bảo mật bằng mật khẩu mạnh.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Mật khẩu hiện tại</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ít nhất 6 ký tự" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Xác nhận mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nhập lại mật khẩu mới" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isSavingPassword}
                className="rounded-full"
              >
                {isSavingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
