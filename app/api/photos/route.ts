import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  const db = await getDb();
  const photos = await db.collection('photos').find().sort({ createdAt: -1 }).toArray();
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const targetPath = path.join(process.cwd(), 'public', 'uploads', filename);

  await writeFile(targetPath, buffer);

  const photoDoc = {
    filename,
    url: `/uploads/${filename}`,
    createdAt: new Date(),
  };

  const db = await getDb();
  const result = await db.collection('photos').insertOne(photoDoc);

  return NextResponse.json({ _id: result.insertedId, ...photoDoc }, { status: 201 });
}
