"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Archive, Trash2, Eye, Package, Star, TrendingUp, BarChart3, ChevronLeft, ChevronRight, X, Image as ImageIcon, RotateCcw, ImagePlus, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mock initial data
const INITIAL_PRODUCTS = [
    { id: "1", name: "Premium Leather Bag", price: 2999, category: "Accessories", stock_qty: 15, status: "active", rating: 4.8, sales: 124 },
    { id: "2", name: "Wireless Headphones", price: 4500, category: "Electronics", stock_qty: 0, status: "draft", rating: 4.5, sales: 0 },
    { id: "3", name: "Minimalist Watch", price: 1500, category: "Accessories", stock_qty: 8, status: "active", rating: 4.2, sales: 86 },
    { id: "4", name: "Urban Hoodie", price: 999, category: "Apparel", stock_qty: 42, status: "archived", rating: 4.0, sales: 52 },
    { id: "5", name: "Smart Speaker", price: 3200, category: "Electronics", stock_qty: 5, status: "active", rating: 4.6, sales: 15 },
];

export default function SellerProductsPage() {
    const supabase = createClient();
    const { user, profile } = useUser();

    const [products, setProducts] = useState<any[]>([]);
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        if (!user) return;
        fetchShopAndProducts();
    }, [user]);

    const fetchShopAndProducts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch Shop
            const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user?.id)
                .single();

            if (shopError) {
                if (shopError.code === 'PGRST116') {
                    // No shop found - this is okay, we'll show initialize UI
                    setShop(null);
                    setLoading(false);
                    return;
                }
                throw shopError;
            }

            setShop(shopData);

            // 2. Fetch Products with Category Names
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name)
                `)
                .eq('shop_id', shopData.id)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;
            setProducts(productsData || []);

            // 3. Fetch Categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('id, name')
                .order('name', { ascending: true });

            if (!categoriesError) setCategories(categoriesData || []);
        } catch (error: any) {
            console.error("Fetch error:", error.message);
            toast.error("Failed to load inventory", { id: "fetch-inventory" });
        } finally {
            setLoading(false);
        }
    };

    const initializeShop = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('shops')
                .insert([{
                    owner_id: user.id,
                    name: `${user.user_metadata.full_name || 'My'}'s Shop`,
                    description: "Welcome to my shop!",
                    status: 'active'
                }])
                .select()
                .single();

            if (error) throw error;
            setShop(data);
            toast.success("Shop initialized successfully!");
        } catch (error: any) {
            toast.error("Failed to initialize shop");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setImageFiles(prev => [...prev, ...fileArray].slice(0, 5));
            const newPreviews = fileArray.map(file => URL.createObjectURL(file));
            setUploadedImages(prev => [...prev, ...newPreviews].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!shop) {
            toast.error("Shop session not found. Please refresh.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const category_id = formData.get("category_id") as string;
        const description = formData.get("desc") as string;
        const price = parseFloat(formData.get("price") as string);
        const stock_qty = parseInt(formData.get("stock_qty") as string);



        if (!name || isNaN(price) || isNaN(stock_qty)) {
            toast.error("Please fill in all required fields correctly.");
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Upload Images
            const imageUrls = [];
            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${shop.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                imageUrls.push(publicUrl);
            }

            // 2. Insert Product
            const { data: newProduct, error: insertError } = await supabase
                .from('products')
                .insert([{
                    shop_id: shop.id,
                    name,
                    category_id,
                    description,
                    price,
                    stock_qty,
                    images: imageUrls,
                    status: 'active'
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            setProducts(prev => [newProduct, ...prev]);
            setIsAddDialogOpen(false);
            setUploadedImages([]);
            setImageFiles([]);
            setSelectedCategory("");
            toast.success("Product added successfully!");
        } catch (error: any) {
            console.error("Submission error:", error.message);
            toast.error(error.message || "Failed to add product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
            toast.success(`Product ${newStatus === 'archived' ? 'archived' : 'restored'}`, { id: "p-status-update" });
        } catch (error: any) {
            toast.error("Failed to update status", { id: "p-status-error" });
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success("Product deleted");
        } catch (error: any) {
            toast.error("Failed to delete product");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category_id && p.category_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!shop && !loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[40px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative h-32 w-32 bg-white rounded-[40px] flex items-center justify-center text-slate-200 shadow-xl border border-slate-50">
                        <Store className="h-14 w-14 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                </div>
                <div className="space-y-3 max-w-sm">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Shop Not Ready</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">To start listing products, you first need to initialize your shop profile presence.</p>
                </div>
                <Button
                    onClick={initializeShop}
                    disabled={isSubmitting}
                    className="bg-primary text-black font-black px-10 h-14 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initialize Shop Now"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Product Inventory</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Add, track, and manage your shop listings</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-[280px] hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search products..."
                            className="h-12 pl-12 rounded-2xl bg-white border-none shadow-sm font-medium focus-visible:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black flex gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200"
                    >
                        <Plus className="h-5 w-5" /> Add Product
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Products", value: products.length, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "In Stock", value: products.filter(p => p.stock_qty > 0).length, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Best Seller", value: "Leather Bag", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "Avg Review", value: "4.6", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-50" },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] p-6 bg-white overflow-hidden group">
                        <div className="flex items-center gap-4">
                            <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
                                <stat.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Products Table */}
            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <div className="p-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-black">All Listings</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 font-bold gap-2 text-slate-400 hover:text-slate-900">
                            <Filter className="h-4 w-4" /> Filter by Status
                        </Button>
                    </div>
                </div>
                <div className="p-4 md:p-8">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Product</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Price</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Stock</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 overflow-hidden">
                                                {product.images && product.images.length > 0 ? (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6" />
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-900 line-clamp-1">{product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-bold text-slate-500">
                                            {product.category?.name || "Uncategorized"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-black text-slate-900">₱{product.price.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "text-xs font-black",
                                            product.stock_qty === 0 ? "text-rose-500" :
                                                product.stock_qty <= 10 ? "text-amber-500" : "text-slate-500"
                                        )}>
                                            {product.stock_qty}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={cn(
                                            "rounded-lg px-2.5 py-1 text-[9px] font-black uppercase border-none shadow-none",
                                            product.status === "active" ? "bg-emerald-50 text-emerald-500" :
                                                product.status === "archived" ? "bg-slate-100 text-slate-500" :
                                                    "bg-amber-50 text-amber-500"
                                        )}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white border-none">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2">Quick Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="rounded-xl h-11 px-3 flex gap-3 font-bold group cursor-pointer focus:bg-slate-50 transition-colors">
                                                    <Edit className="h-4 w-4 text-slate-400 group-hover:text-slate-900" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl h-11 px-3 flex gap-3 font-bold group cursor-pointer focus:bg-slate-50 transition-colors">
                                                    <Eye className="h-4 w-4 text-slate-400 group-hover:text-slate-900" /> View in Store
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-50 my-2" />
                                                {product.status !== "archived" ? (
                                                    <DropdownMenuItem
                                                        onClick={() => toggleStatus(product.id, "archived")}
                                                        className="rounded-xl h-11 px-3 flex gap-3 font-bold text-amber-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors"
                                                    >
                                                        <Archive className="h-4 w-4" /> Archive Listing
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => toggleStatus(product.id, "active")}
                                                        className="rounded-xl h-11 px-3 flex gap-3 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer transition-colors"
                                                    >
                                                        <RotateCcw className="h-4 w-4" /> Restore Listing
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="rounded-xl h-11 px-3 flex gap-3 font-bold text-rose-500 focus:bg-rose-50 focus:text-rose-500 cursor-pointer transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete Forever
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Placeholder */}
                <div className="p-8 pt-0 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing 1 to 5 of 48 entries</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 border border-slate-100 hover:bg-slate-50" disabled>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-slate-50 text-slate-900 border border-slate-200">
                            1
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 border border-slate-100 hover:bg-slate-50">
                            2
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 border border-slate-100 hover:bg-slate-50">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Add Product Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-[600px] p-0 overflow-hidden border-none rounded-[20px] shadow-2xl bg-white sm:top-[120px] sm:translate-y-0">
                    <div className="p-5 pb-0 flex justify-between items-center border-b border-slate-50 pb-4">
                        <DialogTitle className="text-base font-black tracking-tighter uppercase italic leading-none text-slate-900">Add New Product</DialogTitle>
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddDialogOpen(false)}
                            className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-50 rounded-lg border-none transition-all"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Visuals & Description */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Images</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <label className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors group">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                            />
                                            <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                                            <span className="text-[6px] font-black uppercase tracking-widest mt-0.5">Upload</span>
                                        </label>
                                        {uploadedImages.map((src, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-100">
                                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 h-5 w-5 bg-slate-900/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {Array.from({ length: Math.max(0, 2 - uploadedImages.length) }).map((_, i) => (
                                            <div key={`empty-${i}`} className="aspect-square bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-200">
                                                <ImagePlus className="h-4 w-4 opacity-20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="desc" className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</Label>
                                    <Textarea id="desc" name="desc" placeholder="Tell us about the product..." className="min-h-[140px] rounded-lg bg-slate-50 border-none text-[11px] font-medium focus-visible:ring-primary leading-tight" />
                                </div>
                            </div>

                            {/* Right Column: Details */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Product Name</Label>
                                    <Input id="name" name="name" placeholder="Ex: Urban Bag" className="h-10 rounded-lg bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-primary" required />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="category_id" className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</Label>
                                        <input type="hidden" name="category_id" value={selectedCategory} />
                                        <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                                            <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-none font-bold text-[11px] focus:ring-primary">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-none shadow-xl p-1">
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id} className="rounded-md h-8 text-[11px] font-bold focus:bg-slate-50">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                                {categories.length === 0 && (
                                                    <div className="p-2 text-[10px] text-slate-400 text-center uppercase font-black">No categories found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="stock_qty" className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Stock</Label>
                                        <Input id="stock_qty" name="stock_qty" type="number" className="h-10 rounded-lg bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-primary" required />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="price" className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Price (₱)</Label>
                                    <Input id="price" name="price" type="number" step="0.01" className="h-10 rounded-lg bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-primary text-emerald-600" required />
                                </div>

                                <div className="flex flex-col gap-2 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-11 rounded-lg bg-primary text-black font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Listing...</span>
                                            </div>
                                        ) : "Complete Listing"}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="w-full rounded-lg h-9 font-black uppercase tracking-widest text-[8px] text-slate-400 hover:text-slate-600">Cancel</Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
