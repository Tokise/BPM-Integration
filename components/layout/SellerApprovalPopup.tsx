"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, PartyPopper } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function SellerApprovalPopup() {
  const { notifications, clearNotifications } =
    useUser();
  const [open, setOpen] = useState(false);
  const [approvalNotif, setApprovalNotif] =
    useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (
      notifications &&
      notifications.length > 0
    ) {
      const found = notifications.find(
        (n) =>
          n.type === "seller_approved" &&
          !n.isRead,
      );
      if (found) {
        setApprovalNotif(found);
        setOpen(true);
      }
    }
  }, [notifications]);

  const handleClose = async () => {
    setOpen(false);
    if (approvalNotif) {
      // Mark as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", approvalNotif.id);

      // Ideally we refresh notifications here, but clearNotifications() clears all local
      // which might be okay or we might want to just remove this one.
      // For now, let's just close.
      window.location.reload(); // Hard reload to ensure role update is fully applied everywhere if needed
    }
  };

  if (!approvalNotif) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-md text-center">
        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 animate-bounce">
          <PartyPopper className="h-10 w-10" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center text-slate-900">
            You're Now a Seller!
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 font-medium pt-2">
            {approvalNotif.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 sm:justify-center">
          <Button
            onClick={handleClose}
            className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl"
          >
            Start Selling
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
