import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    console.log(`Middleware: [${pathname}] - Usuario detectado: ${user ? user.email : 'NINGUNO'}`);

    // Proteger /dashboard
    if (!user && pathname.startsWith('/dashboard')) {
        console.log('Middleware: Bloqueando acceso a dashboard, redirigiendo a login...');
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Redirigir si ya está logueado y va a /auth
    if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
        console.log('Middleware: Usuario ya logueado en página de auth, redirigiendo a dashboard...');
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth/:path*'],
}
