import { NextResponse } from 'next/server';
import { getFileMetadata } from '@/app/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }
  const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
  const names: Record<string, string> = {};
  for (const id of ids) {
    const meta = getFileMetadata(id);
    if (meta) names[id] = meta.originalName;
  }
  return NextResponse.json(names);
}
