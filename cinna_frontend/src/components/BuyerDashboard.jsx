// src/components/BuyerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { tenderAPI, bidAPI } from '../services/api';

function BuyerDashboard() {
  const [tenders, setTenders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tenders'); // 'tenders' or 'myBids'
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'closed'
  const [selectedTender, setSelectedTender] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidForm, setBidForm] = useState({
    bid_amount: '',
    message: ''
  });
  const [bidErrors, setBidErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        alert('Please log in to continue');
        window.location.href = '/login';
        return;
      }

      const [tendersRes, bidsRes] = await Promise.all([
        tenderAPI.getAllTenders(),
        bidAPI.getAllBids()
      ]);
      setTenders(tendersRes.data);
      setMyBids(bidsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Handle 401 Unauthorized
      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTenders = () => {
    if (filter === 'all') return tenders;
    if (filter === 'active') return tenders.filter(t => t.status === 'active');
    if (filter === 'closed') return tenders.filter(t => t.status === 'closed');
    return tenders;
  };

  const handleViewTender = (tender) => {
    setSelectedTender(tender);
    
    // Check if I already have a bid on this tender
    const existingBid = myBids.find(bid => bid.tender === tender.id);
    if (existingBid) {
      setBidForm({
        bid_amount: existingBid.bid_amount,
        message: existingBid.message
      });
    } else {
      setBidForm({ bid_amount: '', message: '' });
    }
    
    setShowBidModal(true);
    setBidErrors({});
  };

  const handleBidChange = (e) => {
    const { name, value } = e.target;
    setBidForm(prev => ({ ...prev, [name]: value }));
    if (bidErrors[name]) {
      setBidErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateBid = () => {
    const errors = {};
    
    if (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0) {
      errors.bid_amount = 'Bid amount must be greater than zero';
    }
    
    if (!bidForm.message.trim()) {
      errors.message = 'Message is required';
    }
    
    return errors;
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    
    const errors = validateBid();
    if (Object.keys(errors).length > 0) {
      setBidErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const existingBid = myBids.find(bid => bid.tender === selectedTender.id);
      
      if (existingBid) {
        // ✅ FIXED: When updating, only send bid_amount and message
        const updateData = {
          bid_amount: parseFloat(bidForm.bid_amount),
          message: bidForm.message
        };
        
        await bidAPI.updateBid(existingBid.id, updateData);
        alert('Bid updated successfully!');
      } else {
        // When creating new bid, include tender
        const createData = {
          tender: selectedTender.id,
          bid_amount: parseFloat(bidForm.bid_amount),
          message: bidForm.message
        };
        
        await bidAPI.createBid(createData);
        alert('Bid placed successfully!');
      }

      // Refresh data
      await fetchData();
      setShowBidModal(false);
      setSelectedTender(null);
      setBidForm({ bid_amount: '', message: '' });
    } catch (error) {
      console.error('Error submitting bid:', error);
      if (error.response?.data) {
        // Handle specific error messages from backend
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          setBidErrors(errorData);
        } else {
          alert(`Error: ${errorData}`);
        }
      } else {
        alert('Failed to submit bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getMyBidForTender = (tenderId) => {
    return myBids.find(bid => bid.tender === tenderId);
  };

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'accepted': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getBidStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Buyer Dashboard</h1>
          <p style={styles.subtitle}>Browse tenders and place your bids</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'tenders' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('tenders')}
        >
          Available Tenders ({tenders.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'myBids' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('myBids')}
        >
          My Bids ({myBids.length})
        </button>
      </div>

      {/* Tenders Tab */}
      {activeTab === 'tenders' && (
        <>
          {/* Filter Buttons */}
          <div style={styles.filterContainer}>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === 'all' ? styles.activeFilter : {})
              }}
              onClick={() => setFilter('all')}
            >
              All Tenders
            </button>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === 'active' ? styles.activeFilter : {})
              }}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === 'closed' ? styles.activeFilter : {})
              }}
              onClick={() => setFilter('closed')}
            >
              Closed
            </button>
          </div>

          {/* Tenders List */}
          <div style={styles.grid}>
            {getFilteredTenders().length === 0 ? (
              <div style={styles.emptyState}>
                <p>No tenders available</p>
              </div>
            ) : (
              getFilteredTenders().map(tender => {
                const myBid = getMyBidForTender(tender.id);
                return (
                  <div key={tender.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.cardTitle}>{tender.tender_title}</h3>
                        <span style={styles.tenderNumber}>{tender.tender_number}</span>
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: tender.status === 'active' ? '#27ae60' : '#95a5a6'
                        }}
                      >
                        {tender.status}
                      </span>
                    </div>

                    <div style={styles.cardBody}>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Oil Type:</span>
                        <span style={styles.value}>{tender.oil_type}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Quantity:</span>
                        <span style={styles.value}>{tender.quantity} L/Kg</span>
                      </div>
                      {tender.quality_grade && (
                        <div style={styles.infoRow}>
                          <span style={styles.label}>Quality:</span>
                          <span style={styles.qualityBadge}>
                            {tender.quality_grade} ({tender.quality_score}/100)
                          </span>
                        </div>
                      )}
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Manufacturer:</span>
                        <span style={styles.value}>
                          {tender.manufacturer_details?.company_name || 'N/A'}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>End Date:</span>
                        <span style={styles.value}>
                          {new Date(tender.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Total Bids:</span>
                        <span style={styles.value}>{tender.bid_count}</span>
                      </div>

                      {myBid && (
                        <div style={styles.myBidIndicator}>
                          <span style={styles.myBidLabel}>Your Bid:</span>
                          <span style={styles.myBidAmount}>
                            ${parseFloat(myBid.bid_amount).toLocaleString()}
                          </span>
                          <span
                            style={{
                              ...styles.myBidStatus,
                              color: getBidStatusColor(myBid.status)
                            }}
                          >
                            {getBidStatusText(myBid.status)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={styles.cardFooter}>
                      <button
                        style={styles.viewBtn}
                        onClick={() => handleViewTender(tender)}
                        disabled={tender.status === 'closed' || (myBid && myBid.status !== 'pending')}
                      >
                        {myBid ? (myBid.status === 'pending' ? 'Update Bid' : 'View Bid') : 'Place Bid'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* My Bids Tab */}
      {activeTab === 'myBids' && (
        <div style={styles.grid}>
          {myBids.length === 0 ? (
            <div style={styles.emptyState}>
              <p>You haven't placed any bids yet</p>
            </div>
          ) : (
            myBids.map(bid => (
              <div key={bid.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>
                      {bid.tender_details?.tender_title || 'Tender'}
                    </h3>
                    <span style={styles.tenderNumber}>
                      {bid.tender_details?.tender_number}
                    </span>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getBidStatusColor(bid.status)
                    }}
                  >
                    {getBidStatusText(bid.status)}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Your Bid Amount:</span>
                    <span style={styles.bidAmount}>
                      ${parseFloat(bid.bid_amount).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Message:</span>
                    <span style={styles.value}>{bid.message}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Submitted:</span>
                    <span style={styles.value}>
                      {new Date(bid.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {bid.updated_at !== bid.created_at && (
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Last Updated:</span>
                      <span style={styles.value}>
                        {new Date(bid.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Tender Status:</span>
                    <span style={styles.value}>
                      {bid.tender_details?.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedTender && (
        <div style={styles.modalOverlay} onClick={() => setShowBidModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {getMyBidForTender(selectedTender.id) ? 'Update Bid' : 'Place Bid'}
              </h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowBidModal(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Tender Info */}
              <div style={styles.tenderInfo}>
                <h3 style={styles.tenderInfoTitle}>{selectedTender.tender_title}</h3>
                <p style={styles.tenderInfoText}>
                  <strong>Tender Number:</strong> {selectedTender.tender_number}
                </p>
                <p style={styles.tenderInfoText}>
                  <strong>Oil Type:</strong> {selectedTender.oil_type}
                </p>
                <p style={styles.tenderInfoText}>
                  <strong>Quantity:</strong> {selectedTender.quantity} L/Kg
                </p>
                {selectedTender.quality_grade && (
                  <p style={styles.tenderInfoText}>
                    <strong>Quality:</strong> {selectedTender.quality_grade} ({selectedTender.quality_score}/100)
                  </p>
                )}
                <p style={styles.tenderInfoText}>
                  <strong>Description:</strong> {selectedTender.tender_description}
                </p>
              </div>

              {/* Bid Form */}
              <form onSubmit={handleSubmitBid} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bid Amount ($) *</label>
                  <input
                    type="number"
                    name="bid_amount"
                    value={bidForm.bid_amount}
                    onChange={handleBidChange}
                    placeholder="Enter your bid amount"
                    step="0.01"
                    min="0"
                    style={{
                      ...styles.input,
                      ...(bidErrors.bid_amount ? styles.inputError : {})
                    }}
                  />
                  {bidErrors.bid_amount && (
                    <span style={styles.errorText}>{bidErrors.bid_amount}</span>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Message *</label>
                  <textarea
                    name="message"
                    value={bidForm.message}
                    onChange={handleBidChange}
                    placeholder="Add a message with your bid..."
                    rows="4"
                    style={{
                      ...styles.textarea,
                      ...(bidErrors.message ? styles.inputError : {})
                    }}
                  />
                  {bidErrors.message && (
                    <span style={styles.errorText}>{bidErrors.message}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...styles.submitBtn,
                    ...(submitting ? styles.submitBtnDisabled : {})
                  }}
                >
                  {submitting ? 'Submitting...' : (getMyBidForTender(selectedTender.id) ? 'Update Bid' : 'Place Bid')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#7f8c8d',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    margin: 0,
  },
  subtitle: {
    color: '#7f8c8d',
    marginTop: '0.5rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '1rem 2rem',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#7f8c8d',
    transition: 'all 0.3s',
  },
  activeTab: {
    color: '#3498db',
    borderBottom: '3px solid #3498db',
    fontWeight: 'bold',
  },
  filterContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
  },
  filterBtn: {
    padding: '0.75rem 1.5rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s',
  },
  activeFilter: {
    background: '#3498db',
    color: '#fff',
    border: '2px solid #3498db',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  cardHeader: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#2c3e50',
  },
  tenderNumber: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
    marginTop: '0.25rem',
    display: 'block',
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: '1.5rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    fontWeight: '500',
    color: '#7f8c8d',
  },
  value: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  qualityBadge: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  myBidIndicator: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myBidLabel: {
    fontWeight: '500',
    color: '#1976d2',
  },
  myBidAmount: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#1976d2',
  },
  myBidStatus: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  bidAmount: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#27ae60',
  },
  cardFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e0e0e0',
  },
  viewBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '3rem',
    color: '#7f8c8d',
    fontSize: '1.1rem',
  },
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
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    color: '#2c3e50',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#7f8c8d',
  },
  modalBody: {
    padding: '1.5rem',
  },
  tenderInfo: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  tenderInfoTitle: {
    margin: '0 0 1rem 0',
    color: '#2c3e50',
  },
  tenderInfoText: {
    margin: '0.5rem 0',
    color: '#2c3e50',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  formLabel: {
    marginBottom: '0.5rem',
    color: '#2c3e50',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  inputError: {
    border: '1px solid #e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  submitBtn: {
    padding: '1rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  submitBtnDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
};

export default BuyerDashboard;