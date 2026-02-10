"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

interface SignInFormProps {
    signInEmailAction: (formData: FormData) => Promise<any>;
    signInGoogleAction: () => Promise<any>;
}

export function SignInForm({ signInEmailAction, signInGoogleAction }: SignInFormProps) {
    const { } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div className="grid gap-4">
            <form
                action={async (formData) => {
                    toast.loading("Signing you in...");
                    await signInEmailAction(formData);
                }}
                className="grid gap-4"
            >
                <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-50 border-input/60 focus:bg-white transition-colors h-12 rounded-xl font-medium px-4"
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="ml-auto inline-block text-sm underline text-primary hover:text-primary/80 font-bold"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength={8}
                        className="bg-slate-50 border-input/60 focus:bg-white transition-colors h-12 rounded-xl font-medium px-4"
                    />
                </div>
                <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 font-black text-lg h-12 rounded-xl shadow-lg shadow-primary/10 transition-all border-none mt-2">
                    Login
                </Button>
            </form>

            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                    <span className="bg-white px-2">
                        Or continue with
                    </span>
                </div>
            </div>

            <form action={async () => {
                toast.loading("Connecting to Google...");
                await signInGoogleAction();
            }}>
                <Button variant="outline" type="submit" className="w-full h-12 gap-3 cursor-pointer hover:bg-slate-50 border-slate-100 hover:border-primary/50 hover:text-primary transition-all duration-300 group rounded-xl font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" className="h-5 w-5 group-hover:scale-110 transition-transform">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Continue with Google
                </Button>
            </form>
        </div>
    );
}
