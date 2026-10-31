import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'NEX-SCOPE',
    version: '0.4.0',
    status: 'ok',
    docs: '/api/health',
  });
}
