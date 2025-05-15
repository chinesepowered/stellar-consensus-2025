import { NextResponse } from 'next/server';
import { PasskeyLoginChallenge } from '@/lib/types';

export async function POST(request: Request) {
  console.log("Login challenge API route hit");
  try {
    // Generate a mock challenge as this is just a demo
    const mockChallenge = `mock-challenge-login-${Date.now()}`;
    const MOCK_RP_ID = 'localhost'; // This should match your domain in production

    // Create the response payload
    const responsePayload: PasskeyLoginChallenge & { rpId: string } = {
      challenge: mockChallenge,
      rpId: MOCK_RP_ID,
      allowCredentials: [] // Empty array for discoverable credentials - PasskeyKit will find them
    };

    console.log("Sending challenge response:", responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Login challenge error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to generate login challenge", details: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ message: "Login challenge endpoint hit via GET!" });
} 