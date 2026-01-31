"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ToastHandlerProps {
    message?: string;
    error?: string;
}

export function ToastHandler({ message, error }: ToastHandlerProps) {
    useEffect(() => {
        if (message) {
            toast.success(message, {
                duration: 5000,
            });
        }
        if (error) {
            toast.error(error, {
                duration: 5000,
            });
        }
    }, [message, error]);

    return null;
}
