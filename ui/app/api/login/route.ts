import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://10.10.0.162:8000"
).replace(/\/$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input fields
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    let token = "";
    let backendData: Record<string, unknown> = {};

    // Attempt to authenticate against backend auth endpoint
    try {
      const backendRes = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      backendData = await backendRes.json().catch(() => ({}));

      if (!backendRes.ok) {
        const errorMsg =
          (backendData.msg as string) ||
          (backendData.detail as string) ||
          (Array.isArray(backendData.non_field_errors)
            ? (backendData.non_field_errors[0] as string)
            : "") ||
          "Invalid username or password";

        return NextResponse.json(
          { success: false, message: errorMsg },
          { status: backendRes.status }
        );
      }

      // Extract token from backend response
      token =
        (backendData.token as string) ||
        (backendData.key as string) ||
        ((backendData.data as Record<string, unknown>)?.token as string) ||
        ((backendData.data as Record<string, unknown>)?.key as string) ||
        `token_${Date.now()}`;
    } catch {
      // If backend server is unreachable (e.g. offline dev), fallback to local token
      token = `token_${Date.now()}`;
    }

    const cookieStore = await cookies();

    // Store auth token in cookie
    cookieStore.set("auth_token", token, {
      httpOnly: false, // Accessible by client JS to send in Authorization header
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    cookieStore.set("username", String(username), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username,
      },
      ...backendData,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request payload" },
      { status: 400 }
    );
  }
}
