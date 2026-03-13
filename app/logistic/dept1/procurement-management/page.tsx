"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Truck,
  Search,
  Plus,
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Store,
  XCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ProcurementManagementPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New PO form
  const [isNewPOOpen, setIsNewPOOpen] =
    useState(false);
  const [products, setProducts] = useState<any[]>(
    [],
  );
  const [selectedProduct, setSelectedProduct] =
    useState("");
  const [poQuantity, setPOQuantity] =
    useState("");
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    fetchRequests();
    fetchProducts();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .select(
        `
        id,
        supplier_name,
        quantity,
        status,
        product_id,
        products (name)
      `,
      )
      .neq("status", "pending_inbound");

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .select("id, name")
      .limit(100);
    if (data) setProducts(data);
  };

  const handleCreatePO = async () => {
    if (!selectedProduct || !poQuantity) return;

    const toastId = toast.loading(
      "Generating Purchase Order...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .insert({
        product_id: selectedProduct,
        supplier_name:
          supplier || "Pending Supplier",
        quantity: parseInt(poQuantity),
        status: "requested",
      });

    if (error) {
      toast.error("Failed to create PO", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success("Purchase Order Created!", {
        id: toastId,
        description:
          "RFQ sent to supplier pipeline.",
      });
      setIsNewPOOpen(false);
      setSelectedProduct("");
      setPOQuantity("");
      setSupplier("");
      fetchRequests();
    }
  };

  const handleApproveQuotation = async (
    request: any,
  ) => {
    const toastId = toast.loading(
      "Approving quotation & generating PO...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "approved" })
      .eq("id", request.id);

    if (error) {
      toast.error("Approval failed", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        "Quotation Approved — PO Generated!",
        {
          id: toastId,
          description: `Supplier ${request.supplier_name} notified. Delivery schedule pending.`,
        },
      );
      fetchRequests();
    }
  };

  const handleRejectQuotation = async (
    request: any,
  ) => {
    const toastId = toast.loading(
      "Rejecting quotation...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "rejected" })
      .eq("id", request.id);

    if (!error) {
      toast.info(
        "Quotation Rejected — seeking alternative supplier",
        { id: toastId },
      );
      fetchRequests();
    }
  };

  const handleReceiveStock = async (
    request: any,
  ) => {
    const toastId = toast.loading(
      "Processing stock arrival...",
    );

    try {
      // Update procurement status
      const { error: poError } = await supabase
        .schema("bpm-anec-global")
        .from("procurement")
        .update({ status: "received" })
        .eq("id", request.id);

      if (poError) throw poError;

      toast.success(
        "Stock Received & Inventory Updated!",
        { id: toastId },
      );
      fetchRequests();
    } catch (error: any) {
      toast.error("Failed to receive stock", {
        id: toastId,
        description: error.message,
      });
    }
  };

  const statusCounts = {
    requested: requests.filter(
      (r) => r.status === "requested",
    ).length,
    approved: requests.filter(
      (r) => r.status === "approved",
    ).length,
    received: requests.filter(
      (r) => r.status === "received",
    ).length,
  };

  const filtered = requests.filter(
    (r) =>
      r.supplier_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      r.products?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
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
              Procurement Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Procurement Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            RFQ → Quotation Review → PO Generation
            → Stock Receipt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              (window.location.href =
                "/logistic/dept1/seller-verifications")
            }
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-lg h-10 px-6 bg-white hover:bg-slate-50 text-[10px] uppercase tracking-widest"
          >
            <Store className="h-4 w-4 mr-2 text-amber-500" />{" "}
            Verifications
          </Button>

          <Dialog
            open={isNewPOOpen}
            onOpenChange={setIsNewPOOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white font-black rounded-lg h-10 px-6 shadow-sm hover:scale-[1.01] transition-transform text-[10px] uppercase tracking-widest">
                <Plus className="h-4 w-4 mr-2" />{" "}
                New PO Request
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg p-8 bg-white border shadow-sm max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Create Purchase Order
                </DialogTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Send RFQ to supplier pipeline
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Product
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) =>
                      setSelectedProduct(
                        e.target.value,
                      )
                    }
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg font-bold mt-1 px-4 text-xs text-slate-900"
                  >
                    <option value="">
                      Select product...
                    </option>
                    {products.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Supplier Name
                  </label>
                  <Input
                    value={supplier}
                    onChange={(e) =>
                      setSupplier(e.target.value)
                    }
                    placeholder="e.g. Global Supplies Inc."
                    className="h-10 bg-slate-50 border-slate-200 rounded-lg font-bold mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={poQuantity}
                    onChange={(e) =>
                      setPOQuantity(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. 100"
                    className="h-10 bg-slate-50 border-slate-200 rounded-lg font-bold mt-1 text-xs"
                  />
                </div>
                <Button
                  onClick={handleCreatePO}
                  className="w-full h-10 rounded-lg font-black bg-slate-900 text-white hover:bg-slate-800 mt-2 text-[10px] uppercase tracking-widest"
                >
                  Generate PO & Send RFQ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Pending / RFQ Sent",
            val: statusCounts.requested,
            icon: ShoppingBag,
            color: "amber",
            sub: "Awaiting quotation",
          },
          {
            label: "Approved POs",
            val: statusCounts.approved,
            icon: FileText,
            color: "blue",
            sub: "Delivery scheduled",
          },
          {
            label: "Received",
            val: statusCounts.received,
            icon: CheckCircle2,
            color: "emerald",
            sub: "Stock confirmed",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-lg overflow-hidden bg-white group"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                    s.color === "amber" &&
                      "bg-amber-50 text-amber-600",
                    s.color === "blue" &&
                      "bg-blue-50 text-blue-600",
                    s.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600",
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {loading ? "..." : s.val}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                    {s.sub}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">
            Purchase Orders
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Filter orders..."
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
                    PO ID
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Vendor / Supplier
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Product
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-slate-400 font-bold animate-pulse"
                    >
                      Loading requests...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-black text-xs text-slate-900 uppercase">
                          PO-
                          {request.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </div>
                        <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                          {request.status ===
                          "requested"
                            ? "RFQ Sent"
                            : request.status ===
                                "approved"
                              ? "PO Generated"
                              : "Completed"}
                        </div>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-slate-700 uppercase">
                        {request.supplier_name}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            request.status ===
                              "received"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : request.status ===
                                  "approved"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : request.status ===
                                    "rejected"
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100",
                          )}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] font-black text-slate-900 uppercase">
                          {request.products?.name}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                          {request.quantity} Units
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {request.status ===
                        "requested" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleRejectQuotation(
                                  request,
                                )
                              }
                              className="h-8 rounded-md text-rose-500 font-black text-[9px] uppercase tracking-widest hover:bg-rose-50"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApproveQuotation(
                                  request,
                                )
                              }
                              className="h-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest px-4"
                            >
                              Approve
                            </Button>
                          </div>
                        ) : request.status ===
                          "approved" ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleReceiveStock(
                                request,
                              )
                            }
                            className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest px-4"
                          >
                            Receive Stock
                          </Button>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                    >
                      No procurement requests
                      found
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
