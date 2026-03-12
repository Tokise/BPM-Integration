"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  Mail,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function SellerVerificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [applications, setApplications] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seller_applications")
        .select(
          `
          *,
          profile:user_id (
            full_name,
            email
          )
        `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error(
        "Error fetching applications:",
        error,
      );
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (
    id: string,
    userId: string,
    status: "approved" | "rejected",
    shopName: string,
    fulfillmentType?: string,
  ) => {
    const toastId = toast.loading(
      `${status === "approved" ? "Approving" : "Rejecting"}...`,
    );

    try {
      // 1. Update application status
      const { error: appError } = await supabase
        .from("seller_applications")
        .update({ status })
        .eq("id", id);

      if (appError) throw appError;

      if (status === "approved") {
        // 2. Update user role to 'seller'
        const { error: roleError } =
          await supabase
            .from("profiles")
            .update({ role: "seller" })
            .eq("id", userId);

        if (roleError) throw roleError;

        // 3. Create shop entry
        const { error: shopError } =
          await supabase.from("shops").insert({
            owner_id: userId,
            name: shopName,
            status: "active",
            fulfillment_type:
              fulfillmentType || "seller",
          });

        if (shopError) {
          // If shop already exists, it's fine
          console.warn(
            "Shop create note:",
            shopError.message,
          );
        }

        // 4. Send Notification
        await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            title: "Application Approved!",
            message: `Congratulations! Your shop "${shopName}" has been approved. You can now start selling on ANEC Global.`,
            type: "seller_approved",
            is_read: false,
          });
      }

      toast.success(
        `Application ${status} successfully!`,
        { id: toastId },
      );
      fetchApplications();
    } catch (error: any) {
      console.error(
        "Error processing application:",
        error,
      );
      toast.error(
        error.message || "Action failed",
        { id: toastId },
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 max-w-7xl mx-auto pb-20 p-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept1"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Seller Verifications
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Seller Verifications
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Review & Merchant Onboarding • Dept 1
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Pending Review
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {
                    applications.filter(
                      (a) =>
                        a.status === "pending",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">
            Application Repository
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              placeholder="Filter applicants..."
              className="pr-10 h-9 rounded-lg bg-white border-slate-200 font-bold text-slate-900 text-xs"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Applicant
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Shop Details
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Applied Date
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-white transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-black text-xs text-slate-900 uppercase">
                            {
                              app.profile
                                ?.full_name
                            }
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                            {app.profile?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-[10px] text-slate-700 uppercase">
                        {app.shop_name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold truncate max-w-[150px] uppercase opacity-60">
                        {app.shop_description}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                          app.status ===
                            "approved"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : app.status ===
                                "rejected"
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-amber-50 text-amber-600 border-amber-100",
                        )}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-[10px] text-slate-500 font-bold uppercase">
                      {new Date(
                        app.created_at,
                      ).toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {app.status ===
                      "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleAction(
                                app.id,
                                app.user_id,
                                "rejected",
                                app.shop_name,
                                app.fulfillment_type,
                              )
                            }
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 rounded-md px-3 font-black text-[9px] uppercase tracking-widest"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAction(
                                app.id,
                                app.user_id,
                                "approved",
                                app.shop_name,
                                app.fulfillment_type,
                              )
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-8 rounded-md px-4 text-[9px] uppercase tracking-widest"
                          >
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end pr-4">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 &&
                  !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-12 text-center text-slate-400 font-bold"
                      >
                        No applications found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
