import React from 'react';
import './App.css';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';
import ManageTags from './pages/ManageTags';
import ImageSimilarity from './pages/ImageSimilarity';
import EditImage from './pages/EditImage';
import Navigation from './components/Navigation';
import { Routes, Route, Navigate } from 'react-router-dom';
import BatchUpload from './pages/BatchUpload';

const App: React.FC = () => {
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/batch_upload" element={<BatchUpload />} />
          <Route path="/tags" element={<ManageTags />} />
          <Route path="/similarity" element={<ImageSimilarity />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<EditImage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;