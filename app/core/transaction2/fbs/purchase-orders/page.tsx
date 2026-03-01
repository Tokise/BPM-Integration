"use client";

import { useUser } from "@/context/UserContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export default function FBSPurchaseOrdersPage() {
  const { shop } = useUser();
  const [pos, setPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPOs = useCallback(async () => {
    if (!shop?.name) return;
    setLoading(true);

    // POs where the seller is the supplier
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .select("*, products (name, barcode)")
      .eq("supplier_name", shop.name)
      .order("id", { ascending: false });

    if (!error && data) setPOs(data);
    setLoading(false);
  }, [shop]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const handleAcceptPO = async (po: any) => {
    const toastId = toast.loading(
      "Accepting PO and preparing shipment...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "approved" })
      .eq("id", po.id);

    if (error) {
      toast.error("Failed to accept PO", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success("PO Accepted!", {
        id: toastId,
        description:
          "Ship the requested quantity to the warehouse. Stock will update on receipt.",
      });
      fetchPOs();
    }
  };

  const handleDeclinePO = async (po: any) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "rejected" })
      .eq("id", po.id);

    if (!error) {
      toast.info("PO declined");
      fetchPOs();
    }
  };

  const filtered = pos.filter(
    (p) =>
      p.products?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.status
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const pendingCount = pos.filter(
    (p) => p.status === "requested",
  ).length;
  const acceptedCount = pos.filter(
    (p) => p.status === "approved",
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Purchase Orders
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
          Replenishment requests from warehouse —
          accept & ship inventory
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pending POs
              </p>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "..." : pendingCount}
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                Awaiting your confirmation
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Accepted — Ship Now
              </p>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "..." : acceptedCount}
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                Ready to ship to warehouse
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search POs..."
              className="pl-10 h-11 rounded-xl bg-white border-none font-medium shadow-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/50">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  PO #
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Product
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Qty Required
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center p-12 text-slate-400 font-bold animate-pulse"
                  >
                    Loading purchase orders...
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((po) => (
                  <TableRow
                    key={po.id}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="p-5 font-bold text-slate-900">
                      #PO-
                      {po.id
                        .slice(0, 8)
                        .toUpperCase()}
                    </TableCell>
                    <TableCell className="p-5">
                      <div>
                        <p className="font-black text-sm text-slate-900">
                          {po.products?.name ||
                            "Unknown"}
                        </p>
                        {po.products?.barcode && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {po.products.barcode}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-5 font-black text-slate-900">
                      {po.quantity} units
                    </TableCell>
                    <TableCell className="p-5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          po.status === "approved"
                            ? "bg-blue-50 text-blue-600"
                            : po.status ===
                                "received"
                              ? "bg-emerald-50 text-emerald-600"
                              : po.status ===
                                  "rejected"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {po.status === "requested"
                          ? "Pending"
                          : po.status}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 text-right">
                      {po.status ===
                        "requested" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDeclinePO(po)
                            }
                            className="h-8 rounded-lg text-red-500 font-bold text-xs hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAcceptPO(po)
                            }
                            className="h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Accept & Ship
                          </Button>
                        </div>
                      )}
                      {po.status ===
                        "approved" && (
                        <span className="text-[10px] font-black text-blue-500 uppercase">
                          Ship to warehouse →
                        </span>
                      )}
                      {po.status ===
                        "received" && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center p-12"
                  >
                    <FileText className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      No purchase orders
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
