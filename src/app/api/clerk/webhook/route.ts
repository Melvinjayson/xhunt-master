import { NextResponse } from 'next/server';

// Clerk has been removed — this endpoint is no longer in use.
export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
