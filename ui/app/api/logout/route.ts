import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://10.10.0.162:8000"
).replace(/\/$/, "");

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // Try to notify backend logout endpoint
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
    } catch {
      // Backend may be unreachable, continue local logout
    }
  }

  // Clear authentication cookies
  cookieStore.delete("auth_token");
  cookieStore.delete("username");

  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function GET() {
  return POST();
}
