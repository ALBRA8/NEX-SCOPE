import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cazador-download
 *
 * Serves the prebuilt CAZADOR extension .zip from /public so users can
 * download it with a single click. The .zip is built by the
 * `scripts/package-cazador-extension.sh` script (or manually) and
 * committed to /public/cazador-extension-v0.2.0.zip.
 *
 * Public endpoint (no auth) — the extension is meant to be installable
 * by anyone, including trial users who haven't registered yet.
 */
export async function GET(_request: NextRequest) {
  const fileName = 'cazador-extension-v0.2.0.zip';
  const filePath = path.join(process.cwd(), 'public', fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[cazador-download] File not found:', filePath, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Extensión no encontrada en el servidor. Contacta al administrador.',
      },
      { status: 404 }
    );
  }
}
