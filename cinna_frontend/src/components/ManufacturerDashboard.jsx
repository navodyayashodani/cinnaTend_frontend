// src/components/ManufacturerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { getUser } from '../services/api';
import { tenderAPI, bidAPI } from '../services/api';
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
  const [acceptingBid, setAcceptingBid] = useState(null);

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

  const isTenderClosed = (tender) => {
    const endDate = new Date(tender.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const hasAcceptedBid = () => {
    return tenderBids.some(bid => bid.status === 'accepted');
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to accept this bid? This will reject all other bids for this tender.')) {
      return;
    }

    setAcceptingBid(bidId);

    try {
      await bidAPI.acceptBid(bidId);
      
      // Refresh bids to show updated status
      const response = await tenderAPI.getTenderBids(selectedTender.id);
      setTenderBids(response.data);
      
      // Refresh tenders to update counts and status
      fetchTenders();
      
      alert('Bid accepted successfully!');
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert(error.response?.data?.error || 'Failed to accept bid. Please try again.');
    } finally {
      setAcceptingBid(null);
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

  const getBidStatusBgColor = (status) => {
    switch (status) {
      case 'pending': return '#fff3cd';
      case 'accepted': return '#d4edda';
      case 'rejected': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };

  const stats = selectedTender && tenderBids.length > 0 ? getBidStats() : null;
  const tenderClosed = selectedTender && isTenderClosed(selectedTender);
  const bidAccepted = hasAcceptedBid();

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
            {tenders.map(tender => {
              const closed = isTenderClosed(tender);
              return (
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
                    {closed && tender.status !== 'closed' && (
                      <p style={{
                        fontWeight: 'bold',
                        color: '#e74c3c',
                        marginTop: '0.5rem'
                      }}>
                        ⏰ Tender Closed - Ready to Accept Bid
                      </p>
                    )}
                    {tender.status === 'closed' && (
                      <p style={{
                        fontWeight: 'bold',
                        color: '#28a745',
                        marginTop: '0.5rem'
                      }}>
                        ✅ Winner Selected - Tender Complete
                      </p>
                    )}
                  </div>
                  <div style={styles.tenderFooter}>
                    <span style={styles.dateText}>
                      {new Date(tender.start_date).toLocaleDateString()} - {new Date(tender.end_date).toLocaleDateString()}
                    </span>
                    <button 
                      style={{
                        ...styles.viewBtn,
                        ...(tender.bid_count === 0 ? styles.viewBtnDisabled : {}),
                        ...(closed && tender.bid_count > 0 && tender.status !== 'closed' ? styles.viewBtnHighlight : {}),
                        ...(tender.status === 'closed' ? styles.viewBtnClosed : {})
                      }}
                      onClick={() => handleViewBids(tender)}
                      disabled={tender.bid_count === 0}
                    >
                      {tender.bid_count === 0 
                        ? 'No Bids' 
                        : tender.status === 'closed'
                        ? '✅ Winner Selected'
                        : closed 
                        ? `⚡ Select Winner (${tender.bid_count})` 
                        : `View Bids (${tender.bid_count})`
                      }
                    </button>
                  </div>
                </div>
              );
            })}
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
                <p style={styles.modalSubtitle}>
                  {selectedTender.tender_number} 
                  {tenderClosed && <span style={styles.closedBadge}> • Tender Closed</span>}
                </p>
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
                  {/* Notice for closed tenders */}
                  {tenderClosed && !bidAccepted && (
                    <div style={styles.closedNotice}>
                      <h3 style={styles.closedNoticeTitle}>🎯 Tender Closed - Time to Select Winner!</h3>
                      <p style={styles.closedNoticeText}>
                        The bidding period has ended. Review all bids below and select the winning bid. 
                        Once you accept a bid, all other bids will be automatically rejected.
                      </p>
                    </div>
                  )}

                  {/* Show accepted bid prominently */}
                  {bidAccepted && (
                    <div style={styles.acceptedBidNotice}>
                      <h3 style={styles.acceptedNoticeTitle}>🎉 Winner Selected!</h3>
                      <p style={styles.acceptedNoticeText}>
                        You have accepted a bid for this tender. The winning buyer has been notified.
                      </p>
                    </div>
                  )}

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
                        {/*<div style={styles.statBox}>
                          <span style={styles.statLabel}>Average Bid</span>
                          <span style={styles.statValue}>${stats.average.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>*/}
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>Total Bids</span>
                          <span style={styles.statValue}>{tenderBids.length}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bids List */}
                  <div style={styles.bidsList}>
                    <h3 style={styles.bidsListTitle}>All Bids ({tenderBids.length})</h3>
                    {tenderBids.map((bid, index) => (
                      <div 
                        key={bid.id} 
                        style={{
                          ...styles.bidCard,
                          ...(bid.status === 'accepted' ? styles.bidCardAccepted : {}),
                          ...(bid.status === 'rejected' ? styles.bidCardRejected : {}),
                          backgroundColor: getBidStatusBgColor(bid.status)
                        }}
                      >
                        <div style={styles.bidHeader}>
                          <div style={styles.bidNumber}>
                            Bid #{index + 1}
                            {bid.status === 'accepted' && <span style={styles.winnerBadge}> 🏆 WINNER</span>}
                          </div>
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
                            <span style={styles.bidLabel}>Phone:</span>
                            <span style={styles.bidValue}>
                              {bid.buyer_details?.phone_number || 'N/A'}
                            </span>
                          </div>

                          <div style={styles.bidRow}>
                            <span style={styles.bidLabel}>Bid Amount:</span>
                            <span style={{
                              ...styles.bidAmount,
                              ...(bid.status === 'accepted' ? { fontSize: '1.5rem' } : {})
                            }}>
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

                        {/* Action Buttons - Only show if tender is closed and no bid accepted yet */}
                        {tenderClosed && !bidAccepted && bid.status === 'pending' && (
                          <div style={styles.bidActions}>
                            <button
                              style={{
                                ...styles.acceptBtn,
                                ...(acceptingBid === bid.id ? styles.acceptBtnLoading : {})
                              }}
                              onClick={() => handleAcceptBid(bid.id)}
                              disabled={acceptingBid !== null}
                            >
                              {acceptingBid === bid.id ? '⏳ Accepting...' : '✅ Accept This Bid'}
                            </button>
                          </div>
                        )}

                        {/* Show acceptance message for accepted bid */}
                        {bid.status === 'accepted' && (
                          <div style={styles.acceptedMessage}>
                            <p style={styles.acceptedMessageText}>
                              ✨ This bid has been accepted! The buyer has been notified and will proceed with the order.
                            </p>
                          </div>
                        )}

                        {/* Show rejection message for rejected bids */}
                        {bid.status === 'rejected' && (
                          <div style={styles.rejectedMessage}>
                            <p style={styles.rejectedMessageText}>
                              This bid was automatically rejected because another bid was accepted.
                            </p>
                          </div>
                        )}
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
  viewBtnHighlight: {
    backgroundColor: '#e74c3c',
    animation: 'pulse 2s infinite',
  },
  viewBtnClosed: {
    backgroundColor: '#28a745',
    cursor: 'pointer',
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
  closedBadge: {
    color: '#e74c3c',
    fontWeight: 'bold',
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
  // Notice Styles
  closedNotice: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  closedNoticeTitle: {
    margin: '0 0 0.5rem 0',
    color: '#856404',
  },
  closedNoticeText: {
    margin: 0,
    color: '#856404',
  },
  acceptedBidNotice: {
    backgroundColor: '#d4edda',
    border: '2px solid #28a745',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  acceptedNoticeTitle: {
    margin: '0 0 0.5rem 0',
    color: '#155724',
  },
  acceptedNoticeText: {
    margin: 0,
    color: '#155724',
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
    border: '2px solid #e0e0e0',
    transition: 'all 0.3s',
  },
  bidCardAccepted: {
    border: '3px solid #28a745',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
  },
  bidCardRejected: {
    opacity: 0.7,
    border: '2px solid #dc3545',
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
  winnerBadge: {
    color: '#f39c12',
    fontSize: '1rem',
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
// Action Buttons
bidActions: {
marginTop: '1rem',
paddingTop: '1rem',
borderTop: '2px solid #e0e0e0',
display: 'flex',
gap: '1rem',
},
acceptBtn: {
flex: 1,
padding: '0.75rem 1.5rem',
backgroundColor: '#28a745',
color: '#fff',
border: 'none',
borderRadius: '6px',
cursor: 'pointer',
fontSize: '1rem',
fontWeight: 'bold',
transition: 'all 0.3s',
},
acceptBtnLoading: {
backgroundColor: '#95a5a6',
cursor: 'not-allowed',
},
// Messages
acceptedMessage: {
marginTop: '1rem',
padding: '1rem',
backgroundColor: '#d4edda',
border: '2px solid #28a745',
borderRadius: '6px',
},
acceptedMessageText: {
margin: 0,
color: '#155724',
fontWeight: '500',
},
rejectedMessage: {
marginTop: '1rem',
padding: '1rem',
backgroundColor: '#f8d7da',
border: '2px solid #dc3545',
borderRadius: '6px',
},
rejectedMessageText: {
margin: 0,
color: '#721c24',
fontWeight: '500',
},
};
export default ManufacturerDashboard;

