# Meme Sort – Image Database

An end-to-end image library that supports smart tagging, OCR enrichment, similarity detection, and rich gallery management. The project pairs a React frontend with an Express/TypeScript backend backed by SQLite and optional Python helpers for vector generation.

## Features

- **Image Upload** – Single and batch uploads with drag-and-drop, previews, and metadata.
- **Smart Tagging** – Create, manage, and reuse tags with OCR-driven suggestions.
- **OCR Pipeline** – Tesseract- and LLM-based extraction with editable results.
- **Image Similarity Scan** – Vector-based duplicate detection with review tooling.
- **Editable Metadata** – Update tags/OCR after upload.
- **SQLite Persistence** – Lightweight relational storage with automatic migrations.

## Project Structure

```
meme_sort/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   ├── uploads/
│   ├── data/
│   │   └── database.sqlite
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── App.css
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── types/
    ├── public/
    ├── tsconfig.json
    └── package.json
```

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- Python 3 (for vector extraction helpers)
- Optional: native dependencies required by [`tesseract.js`](https://github.com/naptha/tesseract.js#installation)

## Installation

```bash
git clone <repository-url>
cd meme_sort
```

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd ../backend
npm install
```

Copy the sample environment file and adjust as needed:

```bash
cp ".env_copy" .env
```

SQLite data files are created automatically in `backend/data/database.sqlite` on first run.

## Running the Application

Open two terminals:

```bash
# Terminal 1 – backend
cd backend
npm run dev

# Terminal 2 – frontend
cd frontend
npm start
```

- Backend defaults to `http://localhost:5000`
- Frontend defaults to `http://localhost:3000`

## Configuration

### LLM OCR

Edit `backend/.env` (or use the Settings page):

```
LLM_BASE_URL=https://api.example.com/v1
LLM_MODEL=gemini-2.5-flash
LLM_API_KEY=<your-key>
DEFAULT_SIMILARITY_THRESHOLD=0.8
```

The frontend Settings page (`/settings`) can update these values and persists them back to `.env`.

### OCR Languages

Pre-bundled `eng`, `chi_sim`, and `chi_tra` trained data files live under `backend/`. Add more languages by placing additional `.traineddata` files in the same directory.

### Python Vector Extraction

The backend spins up a virtual environment in `backend/.venv` and installs requirements from `src/scripts/requirements.txt` on first launch automatically if Python is available. It use `facebook/dinov2-base` to generate vector. Ensure GPU drivers are configured if you expect accelerated inference (it runs fine on CPU if you have a modern CPU, say, i5-12400).

## Useful Scripts

| Location  | Script           | Description                                  |
|-----------|------------------|----------------------------------------------|
| backend   | `npm run dev`    | Start Express server with ts-node            |
| backend   | `npm run build`  | Compile TypeScript to JavaScript             |
| frontend  | `npm start`      | Run React dev server with fast refresh       |
| frontend  | `npm run build`  | Produce production build                     |
| frontend  | `npm run lint`   | Run ESLint (if configured in package.json)   |

## Usage Notes

- Upload images via `/upload` with optional OCR extraction and suggested tags.
- Manage shared tag vocabulary at `/tags`.
- Review potential duplicates in `/similarity`.
- Edit any image’s metadata through the gallery modal or `/images/:id` edit page.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details. Third-party components, such as the `facebook/dinov2-base` vision model, are documented in [`backend/THIRD_PARTY_NOTICES.md`](backend/THIRD_PARTY_NOTICES.md).