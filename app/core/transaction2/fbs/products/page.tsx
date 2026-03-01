"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  Truck,
  Warehouse,
  ArrowRight,
} from "lucide-react";
import {
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function FBSProductsPage() {
  const { shop } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add product dialog
  const [isAddOpen, setIsAddOpen] =
    useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] =
    useState("");
  const [newBarcode, setNewBarcode] =
    useState("");
  const [newQuantity, setNewQuantity] =
    useState("");

  const fetchProducts = useCallback(async () => {
    if (!shop?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  }, [shop]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = async () => {
    if (!shop?.id || !newName || !newPrice) {
      toast.error("Name and price are required");
      return;
    }

    const toastId = toast.loading(
      "Adding FBS product...",
    );

    const slug = newName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .insert({
        shop_id: shop.id,
        name: newName,
        slug,
        price: parseFloat(newPrice),
        category: newCategory || "General",
        barcode: newBarcode || null,
        stock_qty: 0, // FBS: stock starts at 0
        status: "active",
        low_stock_threshold: parseInt(
          newQuantity || "10",
        ),
      });

    if (error) {
      toast.error("Failed to add product", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success("FBS Product Added!", {
        id: toastId,
        description:
          "Stock is 0 until warehouse receives your outbound shipment.",
      });
      setIsAddOpen(false);
      setNewName("");
      setNewPrice("");
      setNewCategory("");
      setNewBarcode("");
      setNewQuantity("");
      fetchProducts();
    }
  };

  const handleSendToWarehouse = async (
    product: any,
  ) => {
    const toastId = toast.loading(
      "Creating outbound shipment request...",
    );

    // Create a procurement entry as outbound request
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .insert({
        product_id: product.id,
        supplier_name: shop?.name || "FBS Seller",
        quantity:
          product.low_stock_threshold * 2 || 20,
        status: "requested",
      });

    if (error) {
      toast.error("Failed to create request", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        "Outbound Shipment Requested!",
        {
          id: toastId,
          description:
            "Ship your products to the warehouse. Stock will update once received.",
        },
      );
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.barcode
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.category
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const getStockStatus = (product: any) => {
    const qty = product.stock_qty || 0;
    const threshold =
      product.low_stock_threshold || 10;
    if (qty === 0)
      return {
        label: "Pending Inbound",
        cls: "bg-slate-100 text-slate-500",
      };
    if (qty <= threshold)
      return {
        label: "Low Stock",
        cls: "bg-amber-50 text-amber-600",
      };
    return {
      label: "In Stock",
      cls: "bg-emerald-50 text-emerald-600",
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            FBS Products
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
            Manage warehouse-fulfilled product
            catalog
          </p>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />{" "}
              Add FBS Product
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                Add FBS Product
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Stock starts at 0 — ship to
                warehouse to go live
              </p>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                  Product Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) =>
                    setNewName(e.target.value)
                  }
                  placeholder="e.g. Premium Rice 25kg"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Price (₱)
                  </label>
                  <Input
                    type="number"
                    value={newPrice}
                    onChange={(e) =>
                      setNewPrice(e.target.value)
                    }
                    placeholder="0.00"
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Category
                  </label>
                  <Input
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Food"
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Barcode
                  </label>
                  <Input
                    value={newBarcode}
                    onChange={(e) =>
                      setNewBarcode(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. 4800100..."
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Low Stock Threshold
                  </label>
                  <Input
                    type="number"
                    value={newQuantity}
                    onChange={(e) =>
                      setNewQuantity(
                        e.target.value,
                      )
                    }
                    placeholder="10"
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddProduct}
                className="w-full h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 mt-2"
              >
                Add to FBS Catalog
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              placeholder="Search by name, barcode, category..."
              className="pl-10 h-11 rounded-xl bg-white border-none font-medium shadow-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/50">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Product
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Barcode
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Category
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Price
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Stock
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
                    colSpan={7}
                    className="text-center p-12 text-slate-400 font-bold animate-pulse"
                  >
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((product) => {
                  const status =
                    getStockStatus(product);
                  return (
                    <TableRow
                      key={product.id}
                      className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Package className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-5 font-mono text-xs text-slate-500">
                        {product.barcode || "—"}
                      </TableCell>
                      <TableCell className="p-5 text-xs font-bold text-slate-500 capitalize">
                        {product.category ||
                          "General"}
                      </TableCell>
                      <TableCell className="p-5 font-black text-slate-900">
                        ₱
                        {Number(
                          product.price,
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="p-5 font-black text-slate-900">
                        {product.stock_qty || 0}
                      </TableCell>
                      <TableCell className="p-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="p-5 text-right">
                        {(product.stock_qty ||
                          0) === 0 && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSendToWarehouse(
                                product,
                              )
                            }
                            className="h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4"
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            Send to Warehouse
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center p-12"
                  >
                    <Package className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      No products yet — add your
                      first FBS product
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
