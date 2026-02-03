
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Lock, User, Mail } from 'lucide-react'
import { SignUpForm } from "@/components/auth/sign-up-form"
import { getURL } from '@/utils/url-helper'

export default async function SignUp(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
    const searchParams = await props.searchParams;
    const next = searchParams.next || "/";
    const error = searchParams.error;

    const signUpWithEmail = async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const fullName = formData.get("fullName") as string;

        // Password Validation Pattern: exactly 8 chars, 1 upper, 1 lower, 1 number, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/;

        if (!passwordRegex.test(password)) {
            const errorMsg = "Password must be exactly 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
            return redirect(`/auth/sign-up?error=${encodeURIComponent(errorMsg)}`);
        }

        const supabase = await createClient();

        // Dynamically determine the origin based on the request headers
        const headersList = await headers();
        const host = headersList.get('x-forwarded-host') || headersList.get('host');
        const protocol = headersList.get('x-forwarded-proto') || 'https';

        const cleanHost = host?.split(',')[0]?.trim();
        const finalProtocol = cleanHost?.includes('localhost') ? 'http' : protocol;
        const origin = cleanHost ? `${finalProtocol}://${cleanHost}/` : getURL();

        const { data: { user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${origin}auth/callback?next=${next}`,
            },
        });

        if (error) {
            console.error(error);
            return redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
        }

        // Redirect with success message for toast triggering
        return redirect("/auth/sign-in?message=Registration successful! Please check your email to confirm your account.");
    };

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col items-center justify-center relative bg-[#FFF8E1]">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 max-w-lg text-center p-10">
                    <img src="/logo.png" alt="Anec Global" className="mx-auto mb-8 h-32 w-auto opacity-80" />
                    <h2 className="text-4xl font-bold mb-4 text-amber-900">Join the ANEC Community</h2>
                    <p className="text-lg text-amber-800/80">
                        Create an account to track your orders, save multiple addresses, and enjoy a personalized shopping experience.
                    </p>
                    <div className="mt-12 grid grid-cols-3 gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-900">
                                <User className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-900">Personalize</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-900">
                                <Mail className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-900">Updates</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-900">
                                <Lock className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-900">Secure</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center py-12 bg-white relative">
                <Link href="/" className="absolute top-8 left-8 lg:left-auto lg:right-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
                <div className="mx-auto grid w-[400px] gap-6 px-4">
                    <div className="flex flex-col gap-2 text-center lg:text-left">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Create Account</h1>
                        <p className="text-slate-500 font-medium">Enter your details below to get started</p>
                    </div>

                    <SignUpForm signUpAction={signUpWithEmail} searchParamsNext={next} />

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/sign-in" className="underline text-primary font-black hover:text-primary/80 transition-colors">
                            Log in
                        </Link>
                    </div>

                    <div className="mt-8 text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
                        By signing up, you agree to our<br />
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link> & <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
