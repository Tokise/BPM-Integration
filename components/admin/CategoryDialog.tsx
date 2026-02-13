"use client";

import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface CategoryDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function CategoryDialog({
  onSuccess,
  trigger,
}: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const supabase = createClient();

  const [imageFile, setImageFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState<string>("");

  // Auto-generate slug from name
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, ""),
    );
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("categories")
        .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("categories")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const handleSubmit = async (
    e: React.FormEvent | React.MouseEvent,
    keepOpen: boolean = false,
  ) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl =
          await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from("categories")
        .insert({
          name,
          description,
          slug,
          image_url: finalImageUrl,
        });

      if (error) throw error;

      toast.success(
        "Category created successfully",
      );

      // Reset form
      setName("");
      setDescription("");
      setSlug("");
      setImageUrl("");
      setImageFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh parent list
      await Promise.resolve(onSuccess()); // Ensure immediate execution if sync

      if (!keepOpen) {
        setOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Failed to create category: " +
          error.message,
      );
    } finally {
      // Small delay to ensure state updates propagate
      setTimeout(() => setLoading(false), 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200 px-6 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add
            Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900">
            Add New Category
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label
              htmlFor="name"
              className="font-bold"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Electronics"
              required
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="slug"
              className="font-bold"
            >
              Slug
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value)
              }
              placeholder="e.g. electronics"
              required
              className="rounded-xl bg-slate-50"
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="description"
              className="font-bold"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Short description..."
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="image"
              className="font-bold"
            >
              Category Image
            </Label>
            <div className="flex flex-col gap-3">
              {previewUrl && (
                <div className="h-32 w-32 relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                id="image"
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="rounded-xl cursor-pointer file:text-slate-500 file:font-bold"
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Upload a cover image for this
                category
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={(e) =>
                handleSubmit(e, true)
              }
              className="w-full sm:w-auto rounded-xl h-12 font-bold"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save & Add Another
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-slate-900 text-white font-black rounded-xl h-12"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
