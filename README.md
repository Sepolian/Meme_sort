# Meme Sort - Image Database

This project is an image database application that allows users to upload, view, and search images by tags. It consists of a frontend built with React and a backend built with Node.js and Express.

## Features

- **Image Upload**: Users can upload images along with tags.
- **Batch Upload**: Upload multiple images at once with metadata.
- **Image Gallery**: Users can view all uploaded images in a gallery format.
- **Tag Management**: Users can create new tags or select existing tags when uploading images.
- **Search Functionality**: Users can search for images by tags or text content.
- **Text Extraction (OCR)**: Uploaded images are processed automatically to extract text, which users can review, edit, and save with the image metadata. Supports both Tesseract OCR and LLM-based OCR.
- **Image Similarity Detection**: Scan for duplicate or similar images using perceptual hashing, with options to delete duplicates.
- **SQLite Storage**: Image metadata, tags, and OCR results are persisted in a local SQLite database for reliable querying.

## Project Structure

```
meme_sort/
├── .gitattributes
├── .gitignore
├── package-lock.json
├── prompt.txt
├── README.md
├── backend/
│   ├── .env
│   ├── chi_sim.traineddata
│   ├── chi_tra.traineddata
│   ├── data/
│   │   └── database.sqlite
│   ├── dist/
│   ├── eng.traineddata
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   ├── tsconfig.json
│   └── uploads/
└── frontend/
    ├── build/
    │   ├── asset-manifest.json
    │   ├── index.html
    │   └── static/
    ├── node_modules/
    ├── package-lock.json
    ├── package.json
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.css
    │   ├── App.tsx
    │   ├── components/
    │   ├── index.tsx
    │   ├── pages/
    │   ├── react-app-env.d.ts
    │   ├── services/
    │   └── types/
    └── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- TypeScript
- (Optional) [Tesseract.js dependencies](https://github.com/naptha/tesseract.js#installation) if running on systems that require native binaries.

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd meme_sort
   ```

2. Install dependencies for the frontend:
   ```
   cd frontend
   npm install
   ```

3. Install dependencies for the backend:
   ```
   cd backend
   npm install
   ```

SQLite database files will be created automatically in `backend/data/database.sqlite` the first time the server runs.

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend application:
   ```
   cd frontend
   npm start
   ```

### Usage

- Navigate to the frontend application in your browser (usually at `http://localhost:3000`).
- Use the upload page to add new images and tags.
- View all images in the gallery and search by tags.

## License

This project is licensed under the MIT License.