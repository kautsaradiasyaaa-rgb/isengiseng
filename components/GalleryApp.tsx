'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Photo = { _id: string; url: string; filename: string; createdAt: string };
type Collage = {
  _id: string;
  title: string;
  url: string;
  sourcePhotoIds: string[];
  createdAt: string;
};

const COLLAGE_SIZE = 900;

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.error ?? `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export default function GalleryApp() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [collages, setCollages] = useState<Collage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingCollage, setIsSavingCollage] = useState(false);
  const [title, setTitle] = useState('My collage');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function loadPhotos() {
    const res = await fetch('/api/photos');
    const data = await safeJson<any[]>(res);
    setPhotos(data.map((p) => ({ ...p, _id: p._id.toString() })));
  }

  async function loadCollages() {
    const res = await fetch('/api/collages');
    const data = await safeJson<any[]>(res);
    setCollages(data.map((c) => ({ ...c, _id: c._id.toString() })));
  }

  async function loadAll() {
    try {
      setError('');
      await Promise.all([loadPhotos(), loadCollages()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed loading gallery data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const selectedPhotos = useMemo(
    () => photos.filter((p) => selected.includes(p._id)).slice(0, 4),
    [photos, selected],
  );

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('file', file);

    try {
      setError('');
      setIsUploading(true);
      const res = await fetch('/api/photos', { method: 'POST', body });
      await safeJson(res);
      e.target.value = '';
      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-4),
    );
  }

  async function drawCanvas(): Promise<string | null> {
    if (!selectedPhotos.length) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    canvas.width = COLLAGE_SIZE;
    canvas.height = COLLAGE_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, COLLAGE_SIZE, COLLAGE_SIZE);

    const grid = Math.ceil(Math.sqrt(selectedPhotos.length));
    const slotSize = COLLAGE_SIZE / grid;

    await Promise.all(
      selectedPhotos.map(async (photo, index) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = photo.url;
        });

        const col = index % grid;
        const row = Math.floor(index / grid);

        const x = col * slotSize;
        const y = row * slotSize;

        ctx.drawImage(img, x, y, slotSize, slotSize);

        ctx.strokeStyle = '#f4f4f5';
        ctx.lineWidth = 8;
        ctx.strokeRect(x, y, slotSize, slotSize);
      }),
    );

    return canvas.toDataURL('image/png');
  }

  async function saveCollage() {
    if (!selectedPhotos.length) return;

    try {
      setError('');
      setIsSavingCollage(true);
      const imageDataUrl = await drawCanvas();

      if (!imageDataUrl) {
        throw new Error('Collage render failed');
      }

      const res = await fetch('/api/collages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          sourcePhotoIds: selectedPhotos.map((p) => p._id),
          imageDataUrl,
        }),
      });

      await safeJson(res);
      await loadCollages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collage');
    } finally {
      setIsSavingCollage(false);
    }
  }

  return (
    <main>
      <h1>True Photo Gallery + Collage Editor</h1>
      {error ? <p className="errorBanner">{error}</p> : null}

      <section className="card">
        <h2>1) Upload & Save Photos</h2>
        <input type="file" accept="image/*" onChange={onUpload} disabled={isUploading} />
        <p className="helper">
          Every uploaded photo is saved on the server (`public/uploads`) and listed in MongoDB.
        </p>
      </section>

      <section className="card">
        <h2>2) Photo Gallery</h2>
        <p className="helper">Select up to 4 photos for collage editing.</p>
        <div className="grid">
          {photos.map((photo) => (
            <button
              type="button"
              key={photo._id}
              className={`imageButton ${selected.includes(photo._id) ? 'selected' : ''}`}
              onClick={() => toggle(photo._id)}
            >
              <img src={photo.url} alt={photo.filename} className="thumb" />
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>3) Edit as Collage</h2>
        <label htmlFor="collage-title">Collage title</label>
        <input
          id="collage-title"
          className="textInput"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="collage">
          {selectedPhotos.map((photo) => (
            <img key={`${photo._id}-collage`} src={photo.url} alt={photo.filename} className="thumb" />
          ))}
        </div>
        <div className="toolbar">
          <button type="button" disabled={!selectedPhotos.length || isSavingCollage} onClick={saveCollage}>
            {isSavingCollage ? 'Saving...' : 'Save collage'}
          </button>
        </div>
        <canvas ref={canvasRef} className="hiddenCanvas" />
      </section>

      <section className="card">
        <h2>4) Saved Collage Gallery</h2>
        <p className="helper">Your exported collages are also persisted and shown below.</p>
        <div className="grid">
          {collages.map((collage) => (
            <div key={collage._id}>
              <img src={collage.url} alt={collage.title} className="thumb" />
              <p className="helper">{collage.title}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
