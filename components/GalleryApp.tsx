'use client';

import { useEffect, useMemo, useState } from 'react';

type Photo = { _id: string; url: string; filename: string; createdAt: string };

export default function GalleryApp() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function loadPhotos() {
    const res = await fetch('/api/photos');
    const data = await res.json();
    setPhotos(data.map((p: any) => ({ ...p, _id: p._id.toString() })));
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  const collagePhotos = useMemo(
    () => photos.filter((p) => selected.includes(p._id)).slice(0, 4),
    [photos, selected],
  );

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('file', file);

    setIsUploading(true);
    await fetch('/api/photos', { method: 'POST', body });
    setIsUploading(false);
    e.target.value = '';
    await loadPhotos();
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-4),
    );
  }

  return (
    <main>
      <h1>Photo Gallery + Collage Builder</h1>

      <section className="card">
        <h2>Upload Photo</h2>
        <input type="file" accept="image/*" onChange={onUpload} disabled={isUploading} />
        <p className="helper">Upload an image to store in your MongoDB-backed gallery.</p>
      </section>

      <section className="card">
        <h2>Gallery</h2>
        <p className="helper">Click up to 4 photos to build a collage preview.</p>
        <div className="grid">
          {photos.map((photo) => (
            <img
              key={photo._id}
              src={photo.url}
              alt={photo.filename}
              className={`thumb ${selected.includes(photo._id) ? 'selected' : ''}`}
              onClick={() => toggle(photo._id)}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Collage Preview</h2>
        <div className="collage">
          {collagePhotos.map((photo) => (
            <img key={`${photo._id}-collage`} src={photo.url} alt={photo.filename} className="thumb" />
          ))}
        </div>
      </section>
    </main>
  );
}
