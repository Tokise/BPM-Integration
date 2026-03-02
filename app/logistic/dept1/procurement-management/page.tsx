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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Procurement Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            RFQ → Quotation Review → PO Generation
            → Stock Receipt
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              (window.location.href =
                "/logistic/dept1/seller-verifications")
            }
            variant="outline"
            className="border-none shadow-sm rounded-xl h-11 px-6 bg-amber-50 text-amber-600 font-black hover:bg-amber-100"
          >
            <Store className="h-4 w-4 mr-2" />{" "}
            Seller Verifications
          </Button>

          <Dialog
            open={isNewPOOpen}
            onOpenChange={setIsNewPOOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                New PO Request
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Create Purchase Order
                </DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Send RFQ to supplier pipeline
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Product
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) =>
                      setSelectedProduct(
                        e.target.value,
                      )
                    }
                    className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold mt-1 px-4 text-slate-900"
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
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Supplier Name
                  </label>
                  <Input
                    value={supplier}
                    onChange={(e) =>
                      setSupplier(e.target.value)
                    }
                    placeholder="e.g. Global Supplies Inc."
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
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
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreatePO}
                  className="w-full h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 mt-2"
                >
                  Generate PO & Send RFQ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white relative group overflow-hidden"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${s.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8 relative flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-xl bg-${s.color}-50 flex items-center justify-center text-${s.color}-600`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {loading ? "..." : s.val}
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  {s.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search Purchase Orders..."
              className="pl-10 h-11 rounded-xl bg-white border-none font-medium shadow-sm"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    PO ID
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Vendor / Supplier
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Product
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
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
                      <td className="p-6">
                        <div className="font-bold text-slate-900">
                          #PO-
                          {request.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {request.status ===
                          "requested"
                            ? "RFQ Sent"
                            : request.status ===
                                "approved"
                              ? "PO Generated"
                              : "Completed"}
                        </div>
                      </td>
                      <td className="p-6 font-medium text-slate-700">
                        {request.supplier_name}
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${
                            request.status ===
                            "received"
                              ? "bg-green-50 text-green-600"
                              : request.status ===
                                  "approved"
                                ? "bg-blue-50 text-blue-600"
                                : request.status ===
                                    "rejected"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-6 text-sm text-slate-500">
                        {request.products?.name} (
                        {request.quantity} units)
                      </td>
                      <td className="p-6 text-right">
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
                              className="h-8 rounded-lg text-red-500 font-bold text-xs hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApproveQuotation(
                                  request,
                                )
                              }
                              className="h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
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
                            className="h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4"
                          >
                            Receive Stock
                          </Button>
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
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
