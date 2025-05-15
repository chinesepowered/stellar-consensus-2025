import { NextResponse } from 'next/server';
import { getUserByPasskeyId } from '@/lib/mockUserDb'; // Adjust path if @/ isn't configured
import { User } from '@/lib/types'; // Adjust path if @/ isn't configured

// This is a placeholder for how you might get the user ID from a session.
// In a real app, you'd use a library like next-auth or iron-session to manage sessions securely.
async function getUserIdFromSession(request: Request): Promise<string | null> {
  // For mock purposes, let's assume the client sends a user ID in a custom header or a cookie
  // For a real app, this would involve decrypting a session cookie.
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  // In our mock setup, the login/register routes don't actually set this token yet.
  // This is a placeholder for where that logic would go.
  // The "token" here is just the user's passkeyCredentialId for simplicity.
  if (mockSessionToken) {
    return mockSessionToken; // Assuming the token IS the userId (passkeyCredentialId)
  }
  return null;
}

export async function GET(request: Request) {
  try {
    console.log("API: Get Current User (/api/user/me)");

    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No session found" }, { status: 401 });
    }

    const user = await getUserByPasskeyId(userId);

    if (!user) {
      // This could happen if the session token is invalid or the user was deleted.
      return NextResponse.json({ error: "Unauthorized: User not found for session" }, { status: 401 });
    }

    // Exclude sensitive passkey details before sending to client
    const { passkeyCredentialId, passkeyPublicKey, ...userResponse } = user;

    return NextResponse.json({ user: userResponse });

  } catch (error) {
    console.error("Get user/me error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to fetch user data", details: errorMessage }, { status: 500 });
  }
} 