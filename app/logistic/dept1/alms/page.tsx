"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wrench,
  ShieldAlert,
  History,
  Activity,
  PenTool,
  Database,
  Plus,
  Car,
  CalendarDays,
  ImagePlus,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type AssetActivity = {
  id: string;
  plate_number: string;
  vehicle_type: string;
  status: string;
  image_url: string | null;
};

type Maintenance = {
  id: string;
  asset_name: string;
  last_service: string;
  next_service: string;
};

export default function ALMSPage() {
  const supabase = createClient();

  const [maintenance, setMaintenance] = useState<
    Maintenance[]
  >([]);
  const [assets, setAssets] = useState<
    AssetActivity[]
  >([]);
  const [loading, setLoading] = useState(true);

  // New Asset Form
  const [isAssetModalOpen, setIsAssetModalOpen] =
    useState(false);
  const [plateNumber, setPlateNumber] =
    useState("");
  const [vehicleType, setVehicleType] =
    useState("");
  const [assetImage, setAssetImage] =
    useState<File | null>(null);
  const [imagePreview, setImagePreview] =
    useState<string | null>(null);
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // Maintenance Form
  const [isMaintModalOpen, setIsMaintModalOpen] =
    useState(false);
  const [maintAsset, setMaintAsset] =
    useState("");
  const [lastService, setLastService] =
    useState("");
  const [nextService, setNextService] =
    useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [maintRes, assetRes] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("asset_maintenance")
          .select("*")
          .order("next_service", {
            ascending: true,
          }),
        supabase
          .schema("bpm-anec-global")
          .from("vehicles")
          .select("*"),
      ]);

    if (maintRes.data)
      setMaintenance(maintRes.data);
    if (assetRes.data) setAssets(assetRes.data);

    setLoading(false);
  };

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setAssetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddAsset = async () => {
    if (!plateNumber || !vehicleType) return;

    const toastId = toast.loading(
      "Registering asset...",
    );

    let imageUrl: string | null = null;

    // Upload image if provided
    if (assetImage) {
      const ext = assetImage.name
        .split(".")
        .pop();
      const filePath = `${plateNumber.replace(/\s+/g, "-")}-${Date.now()}.${ext}`;

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from("asset-images")
        .upload(filePath, assetImage);

      if (uploadError) {
        toast.error("Image upload failed", {
          id: toastId,
          description: uploadError.message,
        });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("asset-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("vehicles")
      .insert({
        plate_number: plateNumber,
        vehicle_type: vehicleType,
        status: "available",
        image_url: imageUrl,
      });

    if (error) {
      toast.error("Error tracking asset", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success("Asset Registered!", {
        id: toastId,
        description: `${plateNumber} added to fleet.`,
      });
      setIsAssetModalOpen(false);
      setPlateNumber("");
      setVehicleType("");
      setAssetImage(null);
      setImagePreview(null);
      fetchData();
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!maintAsset || !nextService) return;

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("asset_maintenance")
      .insert({
        asset_name: maintAsset,
        last_service:
          lastService ||
          new Date().toISOString().split("T")[0],
        next_service: nextService,
      });

    if (error) {
      toast.error("Error scheduling", {
        description: error.message,
      });
    } else {
      toast.success("Maintenance Scheduled!", {
        description: `Scheduled for ${nextService}`,
      });
      setIsMaintModalOpen(false);
      setMaintAsset("");
      setLastService("");
      setNextService("");
      fetchData();
    }
  };

  const stats = [
    {
      label: "Fleet Capacity",
      val: assets.length.toString(),
      icon: Car,
      color: "blue",
    },
    {
      label: "Available",
      val: assets
        .filter((a) => a.status === "available")
        .length.toString(),
      icon: CheckCircle2,
      color: "emerald",
    },
    {
      label: "In Service",
      val: assets
        .filter((a) => a.status !== "available")
        .length.toString(),
      icon: Wrench,
      color: "amber",
    },
    {
      label: "Health Index",
      val: "94%",
      icon: Activity,
      color: "green",
    },
  ];

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
              Asset Lifecycle (ALMS)
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Asset Lifecycle (ALMS)
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Asset Management • Dept 1
          </p>
        </div>

        <div className="flex gap-2">
          {/* Schedule Maint Button */}
          <Dialog
            open={isMaintModalOpen}
            onOpenChange={setIsMaintModalOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-200 text-slate-600 font-bold rounded-lg h-10 px-6 bg-white hover:bg-slate-50 text-[10px] uppercase tracking-widest"
              >
                <CalendarDays className="h-4 w-4 mr-2" />{" "}
                Schedule Maint
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg p-8 bg-white border shadow-sm max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Schedule Maintenance
                </DialogTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Book a service date for assets
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Asset Name / Plate Ref
                  </label>
                  <Input
                    value={maintAsset}
                    onChange={(e) =>
                      setMaintAsset(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Forklift A or TXZ-1234"
                    className="h-10 bg-slate-50/50 border-slate-200 rounded-lg font-bold mt-1 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                      Last Service
                    </label>
                    <Input
                      type="date"
                      value={lastService}
                      onChange={(e) =>
                        setLastService(
                          e.target.value,
                        )
                      }
                      className="h-10 bg-slate-50/50 border-slate-200 rounded-lg font-bold mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                      Next Service
                    </label>
                    <Input
                      type="date"
                      value={nextService}
                      onChange={(e) =>
                        setNextService(
                          e.target.value,
                        )
                      }
                      className="h-10 bg-slate-50/50 border-slate-200 rounded-lg font-bold mt-1 text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={
                    handleScheduleMaintenance
                  }
                  className="w-full h-10 rounded-lg font-black bg-slate-900 text-white mt-2 text-[10px] uppercase tracking-widest"
                >
                  Add to Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Asset Button */}
          <Dialog
            open={isAssetModalOpen}
            onOpenChange={(open) => {
              setIsAssetModalOpen(open);
              if (!open) {
                setAssetImage(null);
                setImagePreview(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white font-black rounded-lg h-10 px-6 shadow-sm hover:scale-[1.01] transition-transform text-[10px] uppercase tracking-widest">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Register Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg p-8 bg-white border shadow-sm max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Register New Asset
                </DialogTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Add a vehicle to fleet
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Plate Number
                  </label>
                  <Input
                    value={plateNumber}
                    onChange={(e) =>
                      setPlateNumber(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. ABC-1234"
                    className="h-10 bg-slate-50/50 border-slate-200 rounded-lg font-bold uppercase mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Vehicle Type
                  </label>
                  <Input
                    value={vehicleType}
                    onChange={(e) =>
                      setVehicleType(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Delivery Van, Forklift"
                    className="h-10 bg-slate-50/50 border-slate-200 rounded-lg font-bold mt-1 text-xs"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    Asset Photo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-1 w-full h-32 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Click to upload
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <Button
                  onClick={handleAddAsset}
                  className="w-full h-10 rounded-lg font-black bg-slate-900 text-white hover:bg-slate-800 mt-2 text-[10px] uppercase tracking-widest"
                >
                  Register to Fleet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-lg overflow-hidden bg-white group"
          >
            <CardContent className="p-6">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors",
                  stat.color === "blue" &&
                    "bg-blue-50 text-blue-600",
                  stat.color === "amber" &&
                    "bg-amber-50 text-amber-600",
                  stat.color === "emerald" &&
                    "bg-emerald-50 text-emerald-600",
                  stat.color === "green" &&
                    "bg-green-50 text-green-600",
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border shadow-sm rounded-lg bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500" />
              Maintenance Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-10 text-center text-slate-200 font-black animate-pulse uppercase tracking-widest text-[10px]">
                  Loading schedules...
                </div>
              ) : maintenance.length > 0 ? (
                maintenance.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Wrench className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase">
                          {m.asset_name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                          Due:{" "}
                          {format(
                            new Date(
                              m.next_service,
                            ),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md font-black text-emerald-600 hover:bg-emerald-50 uppercase text-[9px] tracking-widest h-8"
                    >
                      Mark Complete
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center p-12">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-slate-900 font-black uppercase text-xs tracking-widest">
                    All Caught Up
                  </p>
                  <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-widest">
                    No upcoming maintenance
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-lg bg-white overflow-hidden relative">
          <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-indigo-500" />
              Fleet Network
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="p-10 text-center text-slate-200 font-black animate-pulse uppercase tracking-widest text-[10px]">
                  Loading assets...
                </div>
              ) : assets.length > 0 ? (
                assets.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      {a.image_url ? (
                        <img
                          src={a.image_url}
                          alt={a.plate_number}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Car className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase">
                        {a.plate_number}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                        {a.vehicle_type}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          a.status === "available"
                            ? "bg-emerald-400"
                            : "bg-rose-400",
                        )}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 font-bold text-sm text-center py-8">
                  No fleet active.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
