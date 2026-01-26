// src/components/Home.js

import React from 'react';

function Home({ onRegisterClick }) {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome to Cinnamon Oil Tendering System</h1>
        <p style={styles.heroSubtitle}>
          Connect manufacturers and buyers in the cinnamon oil industry
        </p>
        <button onClick={onRegisterClick} style={styles.ctaButton}>
          Get Started
        </button>
      </div>

      <div style={styles.features}>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🏭</div>
          <h3 style={styles.featureTitle}>For Manufacturers</h3>
          <p style={styles.featureText}>
            List your products, manage inventory, and respond to buyer requests efficiently.
          </p>
        </div>

        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🛒</div>
          <h3 style={styles.featureTitle}>For Buyers</h3>
          <p style={styles.featureText}>
            Browse quality cinnamon oil, submit tenders, and connect with verified manufacturers.
          </p>
        </div>

        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🤖</div>
          <h3 style={styles.featureTitle}>AI-Powered</h3>
          <p style={styles.featureText}>
            Smart matching and recommendations to help you find the best deals.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#f5f6fa',
  },
  hero: {
    backgroundColor: '#fff',
    padding: '4rem 2rem',
    textAlign: 'center',
    borderBottom: '1px solid #e0e0e0',
  },
  heroTitle: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '1rem',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    marginBottom: '2rem',
  },
  ctaButton: {
    padding: '1rem 2.5rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  features: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 2rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  featureTitle: {
    color: '#2c3e50',
    marginBottom: '1rem',
  },
  featureText: {
    color: '#7f8c8d',
    lineHeight: '1.6',
  },
};

export default Home;