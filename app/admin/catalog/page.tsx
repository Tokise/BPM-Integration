"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    LayoutGrid,
    Tag,
    Loader2,
    X,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const supabase = createClient();

export default function AdminCatalogPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCategory, setEditingCategory] = useState<any>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            console.error("Fetch error:", error.message);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const slug = formData.get("slug") as string;

        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({ name, slug })
                    .eq('id', editingCategory.id);

                if (error) throw error;
                toast.success("Category updated");
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([{ name, slug }]);

                if (error) throw error;
                toast.success("Category added");
            }

            setIsAddDialogOpen(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message || "Failed to save category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This might affect products linked to this category.")) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success("Category deleted");
        } catch (error: any) {
            toast.error("Failed to delete category. It might be in use.");
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Product Catalog</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Manage standardized product categories</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-[280px] hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl font-bold text-xs focus-visible:ring-primary"
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setEditingCategory(null);
                            setIsAddDialogOpen(true);
                        }}
                        className="bg-primary text-black font-black uppercase tracking-widest text-[10px] px-6 h-12 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4 stroke-[3]" /> Add Category
                    </Button>
                </div>
            </div>

            {/* Categories Table */}
            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900">Standard Categories</CardTitle>
                        <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Platform-wide classification system</CardDescription>
                    </div>
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Tag className="h-6 w-6 text-slate-900" />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none px-4">
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6 pl-8">Category Name</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">URL Slug</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">ID (UUID)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6 pr-8 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-50">
                                        <TableCell colSpan={4} className="py-8">
                                            <div className="h-4 w-full bg-slate-50 animate-pulse rounded" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <Tag className="h-10 w-10 opacity-20" />
                                            <p className="font-black uppercase tracking-widest text-[10px]">No categories found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <TableRow key={cat.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="py-5 pl-8 font-black text-slate-900 uppercase text-[11px] tracking-tighter">
                                            {cat.name}
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-500 font-mono text-[10px] font-bold">
                                            /{cat.slug}
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-300 font-mono text-[9px] uppercase tracking-widest">
                                            {cat.id}
                                        </TableCell>
                                        <TableCell className="py-5 pr-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-white hover:shadow-md">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl border-none shadow-2xl p-2 bg-white ring-1 ring-slate-100">
                                                    <DropdownMenuLabel className="text-[9px] font-black uppercase text-slate-400 px-2 py-1.5">Manage</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingCategory(cat);
                                                            setIsAddDialogOpen(true);
                                                        }}
                                                        className="rounded-lg h-9 text-[11px] font-bold focus:bg-slate-50 gap-2 cursor-pointer"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" /> Edit details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-50" />
                                                    <DropdownMenuItem
                                                        onClick={() => deleteCategory(cat.id)}
                                                        className="rounded-lg h-9 text-[11px] font-bold text-rose-500 focus:text-rose-600 focus:bg-rose-50 gap-2 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Add/Edit Category Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-[700px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl bg-white sm:top-[120px] sm:translate-y-0">
                    <div className="p-8 pb-0 flex justify-between items-center border-b border-slate-50 pb-6">
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tighter uppercase italic leading-none text-slate-900">
                                {editingCategory ? "Edit Category" : "New Category"}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                                <LayoutGrid className="h-3 w-3" /> System Catalog Definition
                            </DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Category Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={editingCategory?.name}
                                        placeholder="e.g. ELECTRONICS"
                                        className="h-12 rounded-xl bg-slate-50 border-none font-black text-xs uppercase tracking-tight focus-visible:ring-primary"
                                        required
                                        onChange={(e) => {
                                            const slugInput = document.getElementById('slug') as HTMLInputElement;
                                            if (slugInput && !editingCategory) {
                                                slugInput.value = e.target.value
                                                    .toLowerCase()
                                                    .replace(/ /g, '-')
                                                    .replace(/[^\w-]+/g, '');
                                            }
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">URL Slug</Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        defaultValue={editingCategory?.slug}
                                        placeholder="electronics"
                                        className="h-12 rounded-xl bg-slate-50 border-none font-mono text-xs font-bold focus-visible:ring-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col justify-end gap-3 pb-2">
                                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 mb-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Notice</p>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                                        Defining a new category will make it immediately available for all sellers across the platform. Ensure the naming follows standardized catalog conventions.
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <span>{editingCategory ? "Update Category" : "Define Category"}</span>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsAddDialogOpen(false)}
                                    className="w-full h-12 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
