// src/components/ManufacturerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { getUser } from '../services/api';
import { tenderAPI } from '../services/api';
import CreateTenderModal from './CreateTenderModal';

function ManufacturerDashboard() {
  const user = getUser();
  const [showCreateTender, setShowCreateTender] = useState(false);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await tenderAPI.getAllTenders();
      setTenders(response.data);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenderCreated = () => {
    fetchTenders();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Manufacturer Dashboard</h1>
        <p style={styles.subtitle}>Welcome back, {user?.first_name}!</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>📦</div>
          <h3 style={styles.cardTitle}>Active Tenders</h3>
          <p style={styles.cardValue}>{tenders.length}</p>
          <p style={styles.cardLabel}>Total Tenders</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>📝</div>
          <h3 style={styles.cardTitle}>Pending Requests</h3>
          <p style={styles.cardValue}>0</p>
          <p style={styles.cardLabel}>Buyer Requests</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>✅</div>
          <h3 style={styles.cardTitle}>Completed Orders</h3>
          <p style={styles.cardValue}>0</p>
          <p style={styles.cardLabel}>Successfully Delivered</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <h3 style={styles.cardTitle}>Revenue</h3>
          <p style={styles.cardValue}>$0</p>
          <p style={styles.cardLabel}>Total Earnings</p>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <button 
            onClick={() => setShowCreateTender(true)} 
            style={styles.createTenderBtn}
          >
            + Create New Tender
          </button>
        </div>
        <div style={styles.actions}>
          <button style={styles.actionBtn}>Manage Inventory</button>
          <button style={styles.actionBtn}>View Bids</button>
          <button style={styles.actionBtn}>View Analytics</button>
          <button style={styles.actionBtn}>Reports</button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>My Tenders</h2>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading tenders...</p>
          </div>
        ) : tenders.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No tenders created yet</p>
            <button 
              onClick={() => setShowCreateTender(true)}
              style={styles.browseBtn}
            >
              Create Your First Tender
            </button>
          </div>
        ) : (
          <div style={styles.tenderGrid}>
            {tenders.map(tender => (
              <div key={tender.id} style={styles.tenderCard}>
                <div style={styles.tenderHeader}>
                  <span style={styles.tenderNumber}>{tender.tender_number}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: tender.status === 'active' ? '#27ae60' : '#95a5a6'
                  }}>
                    {tender.status}
                  </span>
                </div>
                <h3 style={styles.tenderTitle}>{tender.tender_title}</h3>
                <div style={styles.tenderDetails}>
                  <p><strong>Oil Type:</strong> {tender.oil_type}</p>
                  <p><strong>Quantity:</strong> {tender.quantity} L/Kg</p>
                  {tender.quality_grade && (
                    <p style={styles.qualityBadge}>
                      <strong>Quality:</strong> {tender.quality_grade} ({tender.quality_score}/100)
                    </p>
                  )}
                  <p><strong>Bids:</strong> {tender.bid_count || 0}</p>
                </div>
                <div style={styles.tenderFooter}>
                  <span style={styles.dateText}>
                    {new Date(tender.start_date).toLocaleDateString()} - {new Date(tender.end_date).toLocaleDateString()}
                  </span>
                  <button style={styles.viewBtn}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTenderModal 
        isOpen={showCreateTender}
        onClose={() => setShowCreateTender(false)}
        onSuccess={handleTenderCreated}
      />
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#f5f6fa',
    padding: '2rem',
  },
  header: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    color: '#2c3e50',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    color: '#7f8c8d',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  cardIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  cardTitle: {
    color: '#2c3e50',
    fontSize: '1rem',
    marginBottom: '0.5rem',
  },
  cardValue: {
    color: '#27ae60',
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0.5rem 0',
  },
  cardLabel: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  section: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  createTenderBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  actionBtn: {
    padding: '1rem',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: '1.1rem',
  },
  browseBtn: {
    padding: '0.75rem 2rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem',
  },
  tenderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  tenderCard: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  tenderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  tenderNumber: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '1.1rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.8rem',
    textTransform: 'capitalize',
  },
  tenderTitle: {
    color: '#2c3e50',
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  tenderDetails: {
    marginBottom: '1rem',
    fontSize: '0.9rem',
    color: '#555',
  },
  qualityBadge: {
    color: '#27ae60',
    fontWeight: '500',
  },
  tenderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0',
  },
  dateText: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
  },
  viewBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

export default ManufacturerDashboard;