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
  const [selectedTender, setSelectedTender] = useState(null);
  const [tenderBids, setTenderBids] = useState([]);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [loadingBids, setLoadingBids] = useState(false);

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

  const handleViewBids = async (tender) => {
    setSelectedTender(tender);
    setShowBidsModal(true);
    setLoadingBids(true);
    setTenderBids([]);
    
    try {
      const response = await tenderAPI.getTenderBids(tender.id);
      console.log('Bids response:', response.data);
      setTenderBids(response.data);
    } catch (error) {
      console.error('Error fetching bids:', error);
      alert('Failed to load bids. Please try again.');
    } finally {
      setLoadingBids(false);
    }
  };

  const getBidStats = () => {
    if (tenderBids.length === 0) return null;
    
    const amounts = tenderBids.map(bid => parseFloat(bid.bid_amount));
    const highest = Math.max(...amounts);
    const lowest = Math.min(...amounts);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const total = amounts.reduce((a, b) => a + b, 0);
    
    return { highest, lowest, average, total };
  };

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'accepted': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const stats = selectedTender && tenderBids.length > 0 ? getBidStats() : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manufacturer Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.first_name}!</p>
        </div>
        <button 
          onClick={() => setShowCreateTender(true)} 
          style={styles.createTenderBtn}
        >
          + Create New Tender
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>📦</div>
          <h3 style={styles.cardTitle}>Total Tenders</h3>
          <p style={styles.cardValue}>{tenders.length}</p>
          <p style={styles.cardLabel}>All Time</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>✅</div>
          <h3 style={styles.cardTitle}>Active Tenders</h3>
          <p style={styles.cardValue}>
            {tenders.filter(t => t.status === 'active').length}
          </p>
          <p style={styles.cardLabel}>Currently Open</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <h3 style={styles.cardTitle}>Total Bids</h3>
          <p style={styles.cardValue}>
            {tenders.reduce((sum, t) => sum + (t.bid_count || 0), 0)}
          </p>
          <p style={styles.cardLabel}>Received</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>🔒</div>
          <h3 style={styles.cardTitle}>Closed Tenders</h3>
          <p style={styles.cardValue}>
            {tenders.filter(t => t.status === 'closed').length}
          </p>
          <p style={styles.cardLabel}>Completed</p>
        </div>
      </div>

      {/* Tenders List */}
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
                  <p style={{
                    fontWeight: 'bold',
                    color: tender.bid_count > 0 ? '#27ae60' : '#7f8c8d'
                  }}>
                    <strong>Bids Received:</strong> {tender.bid_count || 0}
                  </p>
                </div>
                <div style={styles.tenderFooter}>
                  <span style={styles.dateText}>
                    {new Date(tender.start_date).toLocaleDateString()} - {new Date(tender.end_date).toLocaleDateString()}
                  </span>
                  <button 
                    style={{
                      ...styles.viewBtn,
                      ...(tender.bid_count === 0 ? styles.viewBtnDisabled : {})
                    }}
                    onClick={() => handleViewBids(tender)}
                    disabled={tender.bid_count === 0}
                  >
                    {tender.bid_count === 0 ? 'No Bids' : `View Bids (${tender.bid_count})`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tender Modal */}
      <CreateTenderModal 
        isOpen={showCreateTender}
        onClose={() => setShowCreateTender(false)}
        onSuccess={handleTenderCreated}
      />

      {/* View Bids Modal */}
      {showBidsModal && selectedTender && (
        <div style={styles.modalOverlay} onClick={() => setShowBidsModal(false)}>
          <div style={styles.bidsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Bids for {selectedTender.tender_title}</h2>
                <p style={styles.modalSubtitle}>{selectedTender.tender_number}</p>
              </div>
              <button
                style={styles.closeBtn}
                onClick={() => setShowBidsModal(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingBids ? (
                <div style={styles.loadingBids}>
                  <p>Loading bids...</p>
                </div>
              ) : tenderBids.length === 0 ? (
                <div style={styles.noBids}>
                  <p>No bids received yet for this tender</p>
                </div>
              ) : (
                <>
                  {/* Bid Statistics */}
                  {stats && (
                    <div style={styles.statsContainer}>
                      <h3 style={styles.statsTitle}>Bid Statistics</h3>
                      <div style={styles.statsGrid}>
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>Highest Bid</span>
                          <span style={styles.statValue}>${stats.highest.toLocaleString()}</span>
                        </div>
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>Lowest Bid</span>
                          <span style={styles.statValue}>${stats.lowest.toLocaleString()}</span>
                        </div>
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>Average Bid</span>
                          <span style={styles.statValue}>${stats.average.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>Total Value</span>
                          <span style={styles.statValue}>${stats.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bids List */}
                  <div style={styles.bidsList}>
                    <h3 style={styles.bidsListTitle}>All Bids ({tenderBids.length})</h3>
                    {tenderBids.map((bid, index) => (
                      <div key={bid.id} style={styles.bidCard}>
                        <div style={styles.bidHeader}>
                          <div style={styles.bidNumber}>Bid #{index + 1}</div>
                          <span
                            style={{
                              ...styles.bidStatus,
                              color: getBidStatusColor(bid.status)
                            }}
                          >
                            {bid.status.toUpperCase()}
                          </span>
                        </div>

                        <div style={styles.bidContent}>
                          <div style={styles.bidRow}>
                            <span style={styles.bidLabel}>Buyer:</span>
                            <span style={styles.bidValue}>
                              {bid.buyer_details?.company_name || 'N/A'}
                            </span>
                          </div>

                          <div style={styles.bidRow}>
                            <span style={styles.bidLabel}>Contact:</span>
                            <span style={styles.bidValue}>
                              {bid.buyer_details?.email || 'N/A'}
                            </span>
                          </div>

                          <div style={styles.bidRow}>
                            <span style={styles.bidLabel}>Bid Amount:</span>
                            <span style={styles.bidAmount}>
                              ${parseFloat(bid.bid_amount).toLocaleString()}
                            </span>
                          </div>

                          <div style={styles.bidRow}>
                            <span style={styles.bidLabel}>Message:</span>
                            <span style={styles.bidMessage}>{bid.message}</span>
                          </div>

                          <div style={styles.bidRow}>
                            <span style={styles.bidLabel}>Submitted:</span>
                            <span style={styles.bidValue}>
                              {new Date(bid.created_at).toLocaleString()}
                            </span>
                          </div>

                          {bid.updated_at !== bid.created_at && (
                            <div style={styles.bidRow}>
                              <span style={styles.bidLabel}>Last Updated:</span>
                              <span style={styles.bidValue}>
                                {new Date(bid.updated_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons can be added here later */}
                        {/* <div style={styles.bidActions}>
                          <button style={styles.acceptBtn}>Accept</button>
                          <button style={styles.rejectBtn}>Reject</button>
                        </div> */}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#2c3e50',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    color: '#7f8c8d',
    margin: 0,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  viewBtnDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '2rem',
  },
  bidsModal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    padding: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.5rem',
  },
  modalSubtitle: {
    margin: '0.5rem 0 0 0',
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#7f8c8d',
    lineHeight: 1,
  },
  modalBody: {
    padding: '1.5rem',
  },
  loadingBids: {
    textAlign: 'center',
    padding: '3rem',
    color: '#7f8c8d',
  },
  noBids: {
    textAlign: 'center',
    padding: '3rem',
    color: '#7f8c8d',
    fontSize: '1.1rem',
  },
  // Statistics Styles
  statsContainer: {
    backgroundColor: '#f0f8ff',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '2px solid #3498db',
  },
  statsTitle: {
    margin: '0 0 1rem 0',
    color: '#2c3e50',
    fontSize: '1.2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },
  statBox: {
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#7f8c8d',
    marginBottom: '0.5rem',
  },
  statValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#27ae60',
  },
  // Bids List Styles
  bidsList: {
    marginTop: '2rem',
  },
  bidsListTitle: {
    margin: '0 0 1rem 0',
    color: '#2c3e50',
  },
  bidCard: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #e0e0e0',
  },
  bidHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e0e0e0',
  },
  bidNumber: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '1.1rem',
  },
  bidStatus: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  bidContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  bidRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e0e0e0',
  },
  bidLabel: {
    fontWeight: '500',
    color: '#7f8c8d',
    minWidth: '120px',
  },
  bidValue: {
    color: '#2c3e50',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  bidAmount: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'right',
    flex: 1,
  },
  bidMessage: {
    color: '#2c3e50',
    textAlign: 'right',
    flex: 1,
    fontStyle: 'italic',
  },
};

export default ManufacturerDashboard;