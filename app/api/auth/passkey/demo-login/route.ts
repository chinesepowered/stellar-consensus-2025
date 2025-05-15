import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/mockUserDb'; // Adjust path if @/ isn't configured

interface DemoLoginRequestBody {
  username: string;
}

export async function POST(request: Request) {
  try {
    const { username } = await request.json() as DemoLoginRequestBody;

    console.log(`API: Demo Login for username: ${username}`);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Lookup user by username
    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found with this username' }, { status: 404 });
    }

    console.log(` MOCK: User ${user.username} logged in via demo login`);

    // Remove sensitive data before returning to client
    const { passkeyCredentialId, passkeyPublicKey, ...userResponse } = user;
    const sessionToken = user.id; // Using user ID as session token

    return NextResponse.json({
      success: true,
      user: userResponse,
      token: sessionToken,
    });

  } catch (error) {
    console.error("Demo login error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Demo login failed", details: errorMessage }, { status: 500 });
  }
} 