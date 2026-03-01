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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Asset Lifecycle (ALMS)
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Track and maintain physical assets &
            logistics infrastructure
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
                className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 bg-white hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4 mr-2" />{" "}
                Schedule Maint
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Schedule Maintenance
                </DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Book a service date
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
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
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      Last Service (Optional)
                    </label>
                    <Input
                      type="date"
                      value={lastService}
                      onChange={(e) =>
                        setLastService(
                          e.target.value,
                        )
                      }
                      className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      Next Service Date
                    </label>
                    <Input
                      type="date"
                      value={nextService}
                      onChange={(e) =>
                        setNextService(
                          e.target.value,
                        )
                      }
                      className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={
                    handleScheduleMaintenance
                  }
                  className="w-full h-12 rounded-xl font-black bg-primary text-black mt-2"
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
              <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Register Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Register New Asset
                </DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Add a vehicle to fleet
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Plate Number (Unique ID)
                  </label>
                  <Input
                    value={plateNumber}
                    onChange={(e) =>
                      setPlateNumber(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. ABC-1234"
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold uppercase mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Vehicle / Machine Type
                  </label>
                  <Input
                    value={vehicleType}
                    onChange={(e) =>
                      setVehicleType(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Delivery Van, Forklift"
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Asset Photo (Optional)
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
                    className="mt-1 w-full h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-100/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-lg"
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
                  {assetImage && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 px-2">
                      📎 {assetImage.name}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleAddAsset}
                  className="w-full h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 mt-2"
                >
                  Register to Fleet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Fleet Assets",
            val: loading
              ? "..."
              : assets.length.toString(),
            icon: Database,
            color: "blue",
          },
          {
            label: "Scheduled Maintenance",
            val: loading
              ? "..."
              : maintenance.length.toString(),
            icon: Wrench,
            color: "amber",
          },
          {
            label: "Available Units",
            val: loading
              ? "..."
              : assets
                  .filter(
                    (a) =>
                      a.status === "available",
                  )
                  .length.toString(),
            icon: Car,
            color: "emerald",
          },
          {
            label: "System Health",
            val: "99.9%",
            icon: Activity,
            color: "green",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white relative group"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${stat.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8 relative">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 bg-${stat.color}-50 text-${stat.color}-600`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-4xl font-black text-slate-900 mt-1">
                {stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
            <CardTitle className="text-xl font-black">
              Maintenance Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
                  Loading schedules...
                </div>
              ) : maintenance.length > 0 ? (
                maintenance.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex flex-col items-center justify-center font-black leading-none">
                        <span className="text-[10px] uppercase">
                          Service
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 capitalize flex items-center gap-2">
                          {m.asset_name}
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">
                            Scheduled
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                          Due:{" "}
                          {new Date(
                            m.next_service,
                          ).toLocaleDateString(
                            "en-PH",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl font-black text-slate-400 hover:text-primary uppercase text-[10px]"
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
                  <p className="text-slate-900 font-black">
                    All Caught Up
                  </p>
                  <p className="text-slate-400 font-bold text-sm mt-1">
                    No upcoming maintenance
                    scheduled.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white overflow-hidden relative">
          <CardHeader className="p-8 pb-0 border-b border-slate-50 bg-slate-50/50">
            <CardTitle className="text-xl font-black text-slate-900">
              Fleet Network
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {loading ? (
                <div className="animate-pulse flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                  <div className="h-4 bg-slate-100 rounded w-24" />
                </div>
              ) : assets.length > 0 ? (
                assets.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 group"
                  >
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden">
                      {a.image_url ? (
                        <img
                          src={a.image_url}
                          alt={a.plate_number}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Car className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide text-slate-900">
                        {a.plate_number}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold capitalize">
                        {a.vehicle_type}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div
                        className={`h-2 w-2 rounded-full ${a.status === "available" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"}`}
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
