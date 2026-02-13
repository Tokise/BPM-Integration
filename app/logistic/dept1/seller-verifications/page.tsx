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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl bg-slate-100/50 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Seller Verifications
            </h1>
            <p className="text-slate-500 font-medium">
              Review and verify applications to
              become a merchant.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pending Review
              </p>
              <p className="text-2xl font-black text-slate-900">
                {
                  applications.filter(
                    (a) => a.status === "pending",
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applications..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Applicant
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Shop Details
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Applied Date
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {
                              app.profile
                                ?.full_name
                            }
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Mail className="h-3 w-3" />{" "}
                            {app.profile?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-700">
                        {app.shop_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                        {app.shop_description}
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-lg font-black text-[10px] border-none uppercase px-3 py-1",
                          app.status ===
                            "approved"
                            ? "bg-green-50 text-green-600"
                            : app.status ===
                                "rejected"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600",
                        )}
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="p-6 text-sm text-slate-500 font-medium">
                      {new Date(
                        app.created_at,
                      ).toLocaleDateString()}
                    </td>
                    <td className="p-6 text-right">
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
                              )
                            }
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 rounded-lg px-3"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />{" "}
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
                              )
                            }
                            className="bg-green-500 hover:bg-green-600 text-white font-bold h-9 rounded-lg px-4"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />{" "}
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 h-9"
                          disabled
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
