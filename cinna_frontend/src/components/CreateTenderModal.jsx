// src/components/CreateTenderModal.jsx

import React, { useState, useEffect } from 'react';
import { tenderAPI } from '../services/api';

function CreateTenderModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tender_title: '',
    oil_type: 'organic',
    quantity: '',
    tender_description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    report_file: null,
  });
  
  const [errors, setErrors] = useState({});
  const [tenderNumber, setTenderNumber] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [qualityScore, setQualityScore] = useState('');
  const [reportAnalyzing, setReportAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchNextTenderNumber();
    }
  }, [isOpen]);

  const fetchNextTenderNumber = async () => {
    try {
      const response = await tenderAPI.getNextTenderNumber();
      setTenderNumber(response.data.next_tender_number);
    } catch (error) {
      console.error('Error fetching tender number:', error);
      setTenderNumber('TND-001');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setServerError('');
  };

  const validateImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Invalid or corrupted image'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Clear previous errors and quality data
    setErrors(prev => ({ ...prev, report_file: '' }));
    setQualityGrade('');
    setQualityScore('');

    // Validate file type by extension
    const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setErrors(prev => ({ ...prev, report_file: 'Invalid file type. Allowed: PDF, DOC, XLS, PNG, JPG' }));
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, report_file: 'File size cannot exceed 10MB' }));
      return;
    }

    // For image files, validate that they can be loaded
    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      try {
        await validateImageFile(file);
      } catch (error) {
        console.error('Image validation error:', error);
        setErrors(prev => ({ ...prev, report_file: 'Invalid or corrupted image file' }));
        return;
      }
    }

    // Store the file
    setFormData(prev => ({ ...prev, report_file: file }));

    // Try to analyze file for quality (optional)
    try {
      await analyzeQuality(file);
    } catch (error) {
      console.log('Quality analysis failed, but file is still uploaded');
    }
  };

  const analyzeQuality = async (file) => {
    setReportAnalyzing(true);
    setQualityGrade('');
    setQualityScore('');

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    try {
      console.log('Sending file for analysis:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const response = await tenderAPI.predictQuality(formDataToSend);
      
      console.log('Analysis response:', response.data);
      
      if (response.data && response.data.quality_grade) {
        setQualityGrade(response.data.quality_grade);
        setQualityScore(response.data.quality_score);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error analyzing quality:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Provide more specific error messages
      let errorMessage = 'Could not analyze file quality.';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Invalid file format. Please upload a valid quality report.';
        } else if (error.response.status === 413) {
          errorMessage = 'File is too large. Please upload a smaller file.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      setErrors(prev => ({ 
        ...prev, 
        report_file: errorMessage
      }));
    } finally {
      setReportAnalyzing(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tender_title.trim()) {
      newErrors.tender_title = 'Tender title is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero';
    }

    if (!formData.tender_description.trim()) {
      newErrors.tender_description = 'Description is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (!formData.report_file) {
      newErrors.report_file = 'Please upload a quality report';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setServerError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setServerError('');

    const submitData = new FormData();
    
    // Add all form data EXCEPT manufacturer (backend handles it automatically)
    submitData.append('tender_title', formData.tender_title);
    submitData.append('oil_type', formData.oil_type);
    submitData.append('quantity', formData.quantity);
    submitData.append('tender_description', formData.tender_description);
    submitData.append('start_date', formData.start_date);
    submitData.append('end_date', formData.end_date);
    submitData.append('report_file', formData.report_file);

    // Log what we're sending
    console.log('Submitting tender with data:');
    for (let pair of submitData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const response = await tenderAPI.createTender(submitData);
      console.log('Tender created successfully:', response.data);
      
      // Reset form
      setFormData({
        tender_title: '',
        oil_type: 'crude',
        quantity: '',
        tender_description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        report_file: null,
      });
      setQualityGrade('');
      setQualityScore('');
      setErrors({});
      setServerError('');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        console.log('Server errors:', serverErrors);
        
        const mappedErrors = {};
        
        Object.keys(serverErrors).forEach(key => {
          if (Array.isArray(serverErrors[key])) {
            mappedErrors[key] = serverErrors[key][0];
          } else {
            mappedErrors[key] = serverErrors[key];
          }
        });
        
        setErrors(mappedErrors);
        
        // Create a user-friendly error message
        const errorMessages = Object.entries(mappedErrors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        setServerError(`Please fix the following errors: ${errorMessages}`);
      } else {
        setServerError('Failed to create tender. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Tender</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {serverError && <div style={styles.serverError}>{serverError}</div>}

          {/* Tender Number - Read Only */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Tender Number</label>
            <input
              type="text"
              value={tenderNumber}
              readOnly
              style={styles.inputReadOnly}
            />
            <span style={styles.helpText}>Auto-generated</span>
          </div>

          {/* Tender Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Tender Title *</label>
            <input
              type="text"
              name="tender_title"
              value={formData.tender_title}
              onChange={handleChange}
              placeholder="e.g., Premium Cinnamon Oil Supply"
              style={{
                ...styles.input,
                ...(errors.tender_title ? styles.inputError : {})
              }}
            />
            {errors.tender_title && (
              <span style={styles.errorText}>{errors.tender_title}</span>
            )}
          </div>

          <div style={styles.row}>
            
            {/* Oil Type */}
            <div style={styles.row}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Oil Type *</label>
                    <input
                    type="text"
                    name="oil_type"
                    value="organic"
                    readOnly
                    style={{
                        ...styles.input,
                        backgroundColor: '#f4f4f4',
                        cursor: 'not-allowed',
                    }}
                    />
                </div>
            </div>

            {/* Quantity */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity (Liters/Kg) *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g., 500"
                step="0.01"
                min="0"
                style={{
                  ...styles.input,
                  ...(errors.quantity ? styles.inputError : {})
                }}
              />
              {errors.quantity && (
                <span style={styles.errorText}>{errors.quantity}</span>
              )}
            </div>
          </div>

          {/* Upload Report */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Upload Oil Quality Report *</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              style={styles.fileInput}
            />
            {errors.report_file && (
              <span style={styles.errorText}>{errors.report_file}</span>
            )}
            <span style={styles.helpText}>
              Accepted: PDF, DOC, XLS, PNG, JPG (Max 10MB)
            </span>
            
            {reportAnalyzing && (
              <div style={styles.analyzing}>
                <span>🔍 Analyzing report...</span>
              </div>
            )}
          </div>

          {/* Quality Grade - Auto-filled */}
          {qualityGrade && (
            <div style={styles.qualityResult}>
              <div style={styles.qualityBadge}>
                <strong>Quality Grade: {qualityGrade}</strong>
                {/*<span style={styles.qualityScore}>Score: {qualityScore}/100</span>*/}
              </div>
              <span style={styles.aiLabel}>✨ AI-Predicted</span>
            </div>
          )}

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Tender Description *</label>
            <textarea
              name="tender_description"
              value={formData.tender_description}
              onChange={handleChange}
              placeholder="Provide detailed information about the tender requirements..."
              rows="4"
              style={{
                ...styles.textarea,
                ...(errors.tender_description ? styles.inputError : {})
              }}
            />
            {errors.tender_description && (
              <span style={styles.errorText}>{errors.tender_description}</span>
            )}
          </div>

          <div style={styles.row}>
            {/* Start Date */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                style={styles.input}
              />
              <span style={styles.helpText}>Today's date</span>
            </div>

            {/* End Date */}
            <div style={styles.formGroup}>
              <label style={styles.label}>End Date *</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                style={{
                  ...styles.input,
                  ...(errors.end_date ? styles.inputError : {})
                }}
              />
              {errors.end_date && (
                <span style={styles.errorText}>{errors.end_date}</span>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || reportAnalyzing}
            style={{
              ...styles.submitBtn,
              ...(loading || reportAnalyzing ? styles.submitBtnDisabled : {})
            }}
          >
            {loading ? 'Creating Tender...' : 'Create Tender'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
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
    overflowY: 'auto',
    padding: '2rem 0',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    margin: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
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
  form: {
    padding: '1.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  inputReadOnly: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    backgroundColor: '#f5f5f5',
    color: '#666',
    cursor: 'not-allowed',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  fileInput: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  submitBtnDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
    display: 'block',
  },
  helpText: {
    color: '#7f8c8d',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    display: 'block',
  },
  serverError: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  analyzing: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    color: '#1976d2',
    fontSize: '0.9rem',
  },
  qualityResult: {
    backgroundColor: '#f0f8ff',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '2px solid #27ae60',
  },
  qualityBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    color: '#27ae60',
    fontSize: '1.1rem',
  },
  qualityScore: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
  },
  aiLabel: {
    fontSize: '0.8rem',
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
};

export default CreateTenderModal;