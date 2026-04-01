# Photo Collage Gallery (Next.js + MongoDB)

A Next.js web app with:
- Photo upload endpoint (`/api/photos`)
- Gallery display
- Collage preview (select up to 4 photos)
- MongoDB Atlas/Cluster integration

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

## Notes

- Uploaded files are stored in `public/uploads`.
- Metadata is stored in MongoDB collection `photos`.
