"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Upload, X, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import StarRating from "./StarRating";

const supabase = createClient();

interface WriteReviewDialogProps {
    productId: string;
    productName: string;
    onReviewSubmitted?: () => void;
}

export default function WriteReviewDialog({
    productId,
    productName,
    onReviewSubmitted,
}: WriteReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");
            const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit

            if (!isImage && !isVideo) {
                toast.error(`${file.name} is not an image or video`);
                return false;
            }
            if (!isUnder10MB) {
                toast.error(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        setMediaFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    };

    const removeFile = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error("Please write a review comment");
            return;
        }

        setUploading(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to write a review");
                return;
            }

            // Upload media files
            const mediaUrls: string[] = [];
            for (const file of mediaFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-reviews')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-reviews')
                    .getPublicUrl(fileName);

                mediaUrls.push(publicUrl);
            }

            // Check if user purchased this product
            const { data: orderData } = await supabase
                .from('order_items')
                .select('order_id, orders!inner(customer_id, status)')
                .eq('product_id', productId)
                .eq('orders.customer_id', user.id)
                .eq('orders.status', 'completed')
                .limit(1)
                .single();

            // Insert review
            const { error: insertError } = await supabase
                .from('product_reviews')
                .insert({
                    product_id: productId,
                    customer_id: user.id,
                    order_id: orderData?.order_id || null,
                    rating,
                    title: title.trim() || null,
                    comment: comment.trim(),
                    media_urls: mediaUrls,
                    verified_purchase: !!orderData,
                });

            if (insertError) throw insertError;

            toast.success("Review submitted successfully!");
            setOpen(false);
            resetForm();
            onReviewSubmitted?.();
        } catch (error: any) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setRating(5);
        setTitle("");
        setComment("");
        setMediaFiles([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-black font-black rounded-xl hover:scale-105 transition-transform">
                    <Star className="h-4 w-4 mr-2" />
                    Write a Review
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Write a Review</DialogTitle>
                    <p className="text-sm text-slate-500 font-medium">{productName}</p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Rating */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">Your Rating *</Label>
                        <StarRating
                            rating={rating}
                            size="lg"
                            showNumber={false}
                            interactive
                            onRatingChange={setRating}
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">Review Title (Optional)</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            className="font-medium"
                            maxLength={100}
                        />
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">Your Review *</Label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts about this product..."
                            className="min-h-[120px] font-medium"
                            maxLength={1000}
                        />
                        <p className="text-xs text-slate-400">{comment.length}/1000 characters</p>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">Add Photos or Videos (Optional)</Label>
                        <div className="space-y-3">
                            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-primary hover:bg-slate-50 transition-colors">
                                <Upload className="h-5 w-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">
                                    Upload images or videos (max 5 files, 10MB each)
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileSelect}
                                    disabled={mediaFiles.length >= 5}
                                />
                            </label>

                            {/* Preview uploaded files */}
                            {mediaFiles.length > 0 && (
                                <div className="grid grid-cols-3 gap-3">
                                    {mediaFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                                                {file.type.startsWith("image/") ? (
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Video className="h-8 w-8 text-slate-400" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="flex-1 font-bold"
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-primary text-black font-black hover:scale-105 transition-transform"
                            disabled={uploading || !comment.trim()}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Review"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
