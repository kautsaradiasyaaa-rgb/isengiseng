import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/mongodb';

type CollagePayload = {
  title: string;
  sourcePhotoIds: string[];
  imageDataUrl: string;
};

export async function GET() {
  try {
    const db = await getDb();
    const collages = await db.collection('collages').find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(collages);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load collages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CollagePayload;

    if (!payload?.imageDataUrl || !Array.isArray(payload.sourcePhotoIds) || !payload.sourcePhotoIds.length) {
      return NextResponse.json({ error: 'Invalid collage payload' }, { status: 400 });
    }

    const base64Content = payload.imageDataUrl.split(',')[1];
    if (!base64Content) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const filename = `collage-${randomUUID()}.png`;
    const targetPath = path.join(process.cwd(), 'public', 'uploads', filename);

    await writeFile(targetPath, buffer);

    const collageDoc = {
      title: payload.title || 'Untitled collage',
      sourcePhotoIds: payload.sourcePhotoIds,
      url: `/uploads/${filename}`,
      createdAt: new Date(),
    };

    const db = await getDb();
    const result = await db.collection('collages').insertOne(collageDoc);

    return NextResponse.json({ _id: result.insertedId, ...collageDoc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save collage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
