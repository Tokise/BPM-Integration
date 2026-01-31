
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function SetupAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/auth/sign-in?next=/auth/setup-admin');
    }

    const promoteToAdmin = async () => {
        "use server";
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return redirect('/auth/sign-in');

        // Upsert profile with admin role
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata.full_name || user.email?.split('@')[0],
                role: 'admin',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (error) {
            console.error("Promotion Error:", error);
            return redirect(`/auth/setup-admin?error=${encodeURIComponent(error.message)}`);
        }

        // Redirect to admin dashboard
        return redirect('/admin');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
                <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-2">Admin Setup</h1>
                <p className="text-slate-500 font-medium mb-8">
                    Promote your account to access the administrative control panel.
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Account</p>
                    <p className="font-bold text-slate-900 truncate">{user.email}</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 flex gap-3 text-left">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-bold text-amber-800 leading-relaxed">
                        This will grant full administrative access to all site controls, logistics, and financials.
                    </p>
                </div>

                <form action={promoteToAdmin}>
                    <Button
                        type="submit"
                        className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all"
                    >
                        Confirm Admin Role <ArrowRight className="h-5 w-5" />
                    </Button>
                </form>

                <div className="mt-6">
                    <Link href="/" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">
                        Cancel and return home
                    </Link>
                </div>
            </div>
        </div>
    )
}
