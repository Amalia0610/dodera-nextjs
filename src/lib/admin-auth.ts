import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || "fallback-secret-change-me",
);

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export interface AdminSession {
    id: number;
    email: string;
    name: string;
}

/**
 * Create a signed JWT and set it as an httpOnly cookie.
 */
export async function createAdminSession(user: AdminSession): Promise<string> {
    const token = await new SignJWT({
        id: user.id,
        email: user.email,
        name: user.name,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${COOKIE_MAX_AGE}s`)
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });

    return token;
}

/**
 * Verify the admin session cookie and return the payload.
 * Returns null if the session is invalid or expired.
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            id: payload.id as number,
            email: payload.email as string,
            name: payload.name as string,
        };
    } catch {
        return null;
    }
}

/**
 * Destroy the admin session by clearing the cookie.
 */
export async function destroyAdminSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
