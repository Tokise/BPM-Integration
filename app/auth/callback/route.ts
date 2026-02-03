import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            // Handle multiple hosts (x-forwarded-host can be comma-separated)
            const cleanHost = forwardedHost?.split(',')[0]?.trim();

            // Fetch user profile to check role
            const { data: { user } } = await supabase.auth.getUser();
            let finalNext = next;

            if (user) {
                const { data: profile } = await supabase
                    .schema('bpm-anec-global')
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role) {
                    switch (profile.role) {
                        case 'admin':
                            finalNext = '/admin';
                            break;
                        case 'logistic':
                            finalNext = '/logistic';
                            break;
                        case 'hr':
                            finalNext = '/hr';
                            break;
                        case 'finance':
                            finalNext = '/finance';
                            break;
                        default:
                            finalNext = '/';
                    }
                }
            }

            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${finalNext}`)
            } else if (cleanHost) {
                return NextResponse.redirect(`https://${cleanHost}${finalNext}`)
            } else {
                return NextResponse.redirect(`${origin}${finalNext}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}