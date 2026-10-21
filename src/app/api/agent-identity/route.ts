import { NextResponse } from 'next/server';
import { getAgentIdentity, saveAgentIdentity } from '@/lib/agent/identity';

export async function GET() {
  const identity = await getAgentIdentity();
  return NextResponse.json(identity);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await saveAgentIdentity(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error guardando identidad' }, { status: 400 });
  }
}
