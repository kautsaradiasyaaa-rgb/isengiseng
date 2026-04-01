# Photo Collage Gallery (Next.js + MongoDB)

A Next.js web app with:
- Photo upload endpoint (`/api/photos`) that stores files and metadata
- Real gallery view of uploaded photos
- Collage editor (select up to 4 photos)
- Collage export/save endpoint (`/api/collages`)
- MongoDB Atlas/Cluster integration for both photos and collages

## Setup

1. Copy env:

```bash
cp .env.example .env.local
```

2. Fill `MONGODB_URI` and optional `MONGODB_DB` in `.env.local`.

3. Install and run:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

## How it works

- Uploaded photos are saved in `public/uploads` and inserted into MongoDB collection `photos`.
- Collage editing happens in the browser (canvas).
- Saved collage image is exported to PNG, uploaded via API, stored in `public/uploads`, and metadata goes to `collages` collection.
