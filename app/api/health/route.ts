import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'company-pdf-platform',
    architecture: 'next-monolith',
  });
}
