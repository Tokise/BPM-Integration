
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SignInForm } from "@/components/auth/sign-in-form"
import { getURL } from '@/utils/url-helper'

export default async function SignIn(props: {
    searchParams: Promise<{ next?: string; message?: string; error?: string }>
}) {
    const searchParams = await props.searchParams;
    const next = searchParams.next || "/";
    const message = searchParams.message;
    const error = searchParams.error;

    const signInWithGoogle = async () => {
        "use server";
        const supabase = await createClient();

        // Dynamically determine the origin based on the request headers
        // This ensures correct redirection in both development and production (Vercel)
        const headersList = await headers();
        const host = headersList.get('host');
        // If host is localhost, use http, otherwise https
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        // Fallback to getURL() if host is missing (rare)
        const origin = host ? `${protocol}://${host}/` : getURL();

        // Pass next param to the callback to redirect back to correctly
        const redirectTo = new URL(`${origin}auth/callback`);
        if (next) redirectTo.searchParams.set('next', next);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo.toString(),
            },
        });

        if (error) {
            console.error(error);
            return redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
        }

        if (data.url) {
            redirect(data.url);
        }
    };

    const signInWithEmail = async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error(error);
            return redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
        }

        return redirect(next);
    }

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col items-center justify-center relative bg-[#FFF8E1]">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 max-w-lg text-center p-10">
                    <img src="/logo.png" alt="Anec Global" className="mx-auto mb-8 h-32 w-auto opacity-80" />
                    <h2 className="text-4xl font-bold mb-4 text-amber-900">Experience Hassle-Free Shopping</h2>
                    <p className="text-lg text-amber-800/80">
                        Join thousands of happy customers discovering unique local products every day.
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center py-12 bg-white relative">
                <Link href="/" className="absolute top-8 left-8 lg:left-auto lg:right-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
                <div className="mx-auto grid w-[350px] gap-6 px-4">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Welcome Back</h1>
                        <p className="text-slate-500 text-sm font-medium">Enter your credentials to access your account</p>
                    </div>

                    <SignInForm signInEmailAction={signInWithEmail} signInGoogleAction={signInWithGoogle} />

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/sign-up" className="underline text-primary font-black hover:text-primary/80 transition-colors">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
