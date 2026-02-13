"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Trash2,
  Edit,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const supabase = createClient();

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] =
    useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error(
        "Error fetching categories:",
        error,
      );
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category?",
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error(
        "Failed to delete: " + error.message,
      );
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">
              Categories
            </h1>
          </div>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] pl-12">
            Manage product categories
          </p>
        </div>
        <CategoryDialog
          onSuccess={fetchCategories}
        />
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-black">
            All Categories
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="h-10 pl-10 rounded-xl bg-slate-50 border-none shadow-sm text-xs font-bold"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-100"
            >
              <Filter className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-50 hover:bg-transparent">
                  <TableHead className="w-[100px] pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Image
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Name
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Slug
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length >
                  0 ? (
                  filteredCategories.map(
                    (cat) => (
                      <TableRow
                        key={cat.id}
                        className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="pl-8 py-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden">
                            {cat.image_url ? (
                              <img
                                src={
                                  cat.image_url
                                }
                                alt={cat.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-xs">
                                IMG
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {cat.name}
                        </TableCell>
                        <TableCell className="font-medium text-slate-500">
                          {cat.slug}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDelete(
                                  cat.id,
                                )
                              }
                              className="h-8 w-8 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                    >
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
