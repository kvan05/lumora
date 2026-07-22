"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const sectionSchema = z.object({
  name: z.string().min(2, "Name required (e.g., VIP)"),
  label: z.string().min(1, "Label required (e.g., V)"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  rowCount: z.coerce.number().min(1, "At least 1 row"),
  seatsPerRow: z.coerce.number().min(1, "At least 1 seat per row"),
  color: z.string().optional(),
});

export default function SeatMapBuilderPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema) as any,
    defaultValues: {
      name: "",
      label: "",
      price: 0,
      rowCount: 5,
      seatsPerRow: 10,
      color: "#F7DDD5",
    },
  });

  const fetchSeatMap = async () => {
    try {
      const res = await api.get(`/events/${eventId}/seats`);
      if (res.data.success) {
        setSections(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load seat map");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatMap();
  }, [eventId]);

  async function onSubmit(values: z.infer<typeof sectionSchema>) {
    setIsSubmitting(true);
    try {
      // Create section
      const res = await api.post(`/seller/events/${eventId}/seats/sections`, values);
      if (res.data.success) {
        const sectionId = res.data.data.id;
        // Generate seats for section
        const genRes = await api.post(`/seller/events/${eventId}/seats/sections/${sectionId}/generate`);
        if (genRes.data.success) {
          toast.success(`Section created and seats generated: ${genRes.data.message}`);
          form.reset({ name: "", label: "", price: 0, rowCount: 5, seatsPerRow: 10, color: "#F7DDD5" });
          fetchSeatMap();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to create section");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Are you sure? This will delete all seats in this section.")) return;
    try {
      const res = await api.delete(`/seller/events/${eventId}/seats/sections/${sectionId}`);
      if (res.data.success) {
        toast.success("Section deleted");
        fetchSeatMap();
      }
    } catch (error: any) {
      toast.error("Failed to delete section");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seat Map Builder</h2>
          <p className="text-muted-foreground">Add sections to auto-generate seat rows.</p>
        </div>
        <Button onClick={() => router.push("/seller/events")}>Done</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form: Add Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Section</CardTitle>
            <CardDescription>Define a zone with rows and seats.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name (e.g. VIP)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label (e.g. V)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl><Input type="color" className="h-10 p-1 w-full" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control as any}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Price (VND)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="rowCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rows</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="seatsPerRow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seats / Row</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Generating..." : "Generate Seats"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview: Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Seat Map Preview</CardTitle>
            <CardDescription>Visual representation of your sections.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {sections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No sections added yet.
              </div>
            ) : (
              <div className="space-y-8 min-w-[600px] flex flex-col items-center">
                {/* Stage Indicator */}
                <div className="w-2/3 h-12 bg-muted rounded-b-3xl flex items-center justify-center text-muted-foreground font-semibold uppercase tracking-widest shadow-inner mb-8">
                  Stage
                </div>

                {sections.map((section) => (
                  <div key={section.id} className="w-full mb-8 relative p-4 border rounded-lg bg-card">
                    <div className="absolute -top-3 left-4 bg-background px-2 text-sm font-bold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                      {section.name} — {Number(section.price).toLocaleString("vi-VN")} ₫
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute -top-3 right-4 h-6 text-xs px-2"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      Delete
                    </Button>
                    
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {section.rows?.map((row: any) => (
                        <div key={row.id} className="flex items-center gap-2">
                          <div className="w-6 text-right text-xs font-bold text-muted-foreground">{row.rowLabel}</div>
                          <div className="flex gap-1">
                            {row.seats?.map((seat: any) => (
                              <div
                                key={seat.id}
                                title={`${seat.seatLabel} - ${seat.status}`}
                                className={`w-6 h-6 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] cursor-pointer hover:opacity-80 transition-opacity border
                                  ${seat.status === 'AVAILABLE' ? '' : 'opacity-30 cursor-not-allowed bg-muted'}
                                `}
                                style={{ 
                                  backgroundColor: seat.status === 'AVAILABLE' ? section.color : undefined,
                                  borderColor: section.color 
                                }}
                              >
                                {seat.seatNumber}
                              </div>
                            ))}
                          </div>
                          <div className="w-6 text-left text-xs font-bold text-muted-foreground">{row.rowLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
