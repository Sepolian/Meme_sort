import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const goToUpload = () => navigate('/upload');
  const goToGallery = () => navigate('/gallery');

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Meme Sort</h1>
        <p className="hero-subtitle">
          Organize, search, and manage your images with our powerful tagging system
        </p>

        <div className="feature-cards">
          <div className="feature-card" onClick={goToUpload}>
            <div className="feature-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3>Upload Images</h3>
            <p>Add new images to your collection with custom tags</p>
            <button
              className="feature-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goToUpload();
              }}
            >
              Start Uploading
            </button>
          </div>

          <div className="feature-card" onClick={goToGallery}>
            <div className="feature-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Browse Gallery</h3>
            <p>View and search through your image collection</p>
            <button
              className="feature-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goToGallery();
              }}
            >
              View Gallery
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3>Smart Search</h3>
            <p>Find exactly what you need with tag-based search</p>
            <button className="feature-button" type="button">
              Learn More
            </button>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">2.5k+</div>
          <div className="stat-label">Images Supported</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">&lt;100ms</div>
          <div className="stat-label">Search Speed</div>
        </div>
      </div>
    </div>
  );
};

export default Home;