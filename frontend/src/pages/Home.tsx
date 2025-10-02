import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const goToUpload = () => navigate('/upload');
  const goToGallery = () => navigate('/gallery');

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Image Database</h1>
        <p className="hero-subtitle">
          Organize, search, and manage your images with powerful tagging system
        </p>
        
        <div className="feature-cards">
          <div className="feature-card" onClick={goToUpload}>
            <div className="feature-icon">⬆️</div>
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
            <div className="feature-icon">🖼️</div>
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
            <div className="feature-icon">🔍</div>
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
          <div className="stat-number">∞</div>
          <div className="stat-label">Images Supported</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">🏷️</div>
          <div className="stat-label">Smart Tagging</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">⚡</div>
          <div className="stat-label">Fast Search</div>
        </div>
      </div>
    </div>
  );
};

export default Home;