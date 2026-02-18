// src/pages/manufacturer/CreateTenderPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManufacturerLayout from '../../components/ManufacturerLayout';
import { tenderAPI } from '../../services/api';

export default function CreateTenderPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    tender_title: '',
    oil_type: 'organic',
    quantity: '',
    tender_description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    report_file: null,
  });

  const [errors, setErrors]               = useState({});
  const [tenderNumber, setTenderNumber]   = useState('');
  const [qualityGrade, setQualityGrade]   = useState('');
  const [qualityScore, setQualityScore]   = useState('');
  const [reportAnalyzing, setReportAnalyzing] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [serverError, setServerError]     = useState('');

  useEffect(() => { fetchNextTenderNumber(); }, []);

  const fetchNextTenderNumber = async () => {
    try {
      const r = await tenderAPI.getNextTenderNumber();
      setTenderNumber(r.data.next_tender_number);
    } catch {
      setTenderNumber('TND-001');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validateImageFile = (file) =>
    new Promise((resolve, reject) => {
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrors(prev => ({ ...prev, report_file: '' }));
    setQualityGrade('');
    setQualityScore('');

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'].includes(ext)) {
      setErrors(prev => ({ ...prev, report_file: 'Invalid file type. Allowed: PDF, DOC, XLS, PNG, JPG' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, report_file: 'File size cannot exceed 10MB' }));
      return;
    }
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      try { await validateImageFile(file); }
      catch { setErrors(prev => ({ ...prev, report_file: 'Invalid or corrupted image file' })); return; }
    }

    setFormData(prev => ({ ...prev, report_file: file }));
    try { await analyzeQuality(file); } catch { /* quality optional */ }
  };

  const analyzeQuality = async (file) => {
    setReportAnalyzing(true);
    setQualityGrade('');
    setQualityScore('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await tenderAPI.predictQuality(fd);
      if (r.data?.quality_grade) {
        setQualityGrade(r.data.quality_grade);
        setQualityScore(r.data.quality_score);
      }
    } catch (err) {
      let msg = 'Could not analyze file quality.';
      if (err.response?.status === 400) msg = 'Invalid file format for quality analysis.';
      else if (err.response?.status === 413) msg = 'File too large for analysis.';
      else if (err.response?.data?.error) msg = err.response.data.error;
      setErrors(prev => ({ ...prev, report_file: msg }));
    } finally {
      setReportAnalyzing(false);
    }
  };

  const validateForm = () => {
    const e = {};
    if (!formData.tender_title.trim())        e.tender_title = 'Tender title is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) e.quantity = 'Quantity must be greater than zero';
    if (!formData.tender_description.trim())  e.tender_description = 'Description is required';
    if (!formData.end_date)                   e.end_date = 'End date is required';
    else if (new Date(formData.end_date) <= new Date(formData.start_date)) e.end_date = 'End date must be after start date';
    if (!formData.report_file)                e.report_file = 'Please upload a quality report';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); setServerError('Please fix the errors above'); return; }

    setLoading(true);
    setServerError('');

    const payload = new FormData();
    payload.append('tender_title',       formData.tender_title);
    payload.append('oil_type',           formData.oil_type);
    payload.append('quantity',           formData.quantity);
    payload.append('tender_description', formData.tender_description);
    payload.append('start_date',         formData.start_date);
    payload.append('end_date',           formData.end_date);
    payload.append('report_file',        formData.report_file);

    try {
      await tenderAPI.createTender(payload);
      navigate('/manufacturer/my-tenders');
    } catch (err) {
      if (err.response?.data) {
        const mapped = {};
        Object.keys(err.response.data).forEach(k => {
          mapped[k] = Array.isArray(err.response.data[k]) ? err.response.data[k][0] : err.response.data[k];
        });
        setErrors(mapped);
        setServerError('Please fix the errors above.');
      } else {
        setServerError('Failed to create tender. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManufacturerLayout>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Create New Tender</h2>
          <p style={s.pageSubtitle}>Fill in the details below to publish a new tender listing</p>
        </div>
        <button style={s.backBtn} onClick={() => navigate('/manufacturer/dashboard')}>← Back</button>
      </div>

      {/* Form card */}
      <div style={s.card}>
        <form onSubmit={handleSubmit}>

          {serverError && <div style={s.serverError}>{serverError}</div>}

          {/* ── Row 1: Tender Number ── */}
          <div style={s.formGroup}>
            <label style={s.label}>Tender Number</label>
            <input value={tenderNumber} readOnly style={s.inputReadOnly} />
            <span style={s.helpText}>Auto-generated</span>
          </div>

          {/* ── Row 2: Title ── */}
          <div style={s.formGroup}>
            <label style={s.label}>Tender Title <span style={s.req}>*</span></label>
            <input
              type="text" name="tender_title" value={formData.tender_title}
              onChange={handleChange} placeholder="e.g., Premium Cinnamon Oil Supply"
              style={{ ...s.input, ...(errors.tender_title ? s.inputErr : {}) }}
            />
            {errors.tender_title && <span style={s.errTxt}>{errors.tender_title}</span>}
          </div>

          {/* ── Row 3: Oil Type + Quantity ── */}
          <div style={s.row}>
            <div style={s.formGroup}>
              <label style={s.label}>Oil Type</label>
              <input value="Organic" readOnly style={s.inputReadOnly} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Quantity (Liters / Kg) <span style={s.req}>*</span></label>
              <input
                type="number" name="quantity" value={formData.quantity}
                onChange={handleChange} placeholder="e.g., 500" step="0.01" min="0"
                style={{ ...s.input, ...(errors.quantity ? s.inputErr : {}) }}
              />
              {errors.quantity && <span style={s.errTxt}>{errors.quantity}</span>}
            </div>
          </div>

          {/* ── Row 4: Upload report ── */}
          <div style={s.formGroup}>
            <label style={s.label}>Upload Oil Quality Report <span style={s.req}>*</span></label>
            <div style={s.fileBox}>
              <input
                type="file" id="report_file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
              />
              <label htmlFor="report_file" style={s.fileLabel}>
                📎 {formData.report_file ? formData.report_file.name : 'Choose file…'}
              </label>
              <span style={s.helpText}>PDF, DOC, XLS, PNG, JPG — max 10 MB</span>
            </div>
            {errors.report_file && <span style={s.errTxt}>{errors.report_file}</span>}
            {reportAnalyzing && (
              <div style={s.analyzing}>🔍 Analyzing report quality…</div>
            )}
          </div>

          {/* ── Quality result ── */}
          {qualityGrade && (
            <div style={s.qualityResult}>
              <div style={s.qualityBadge}>
                <strong>Quality Grade: {qualityGrade}</strong>
                {qualityScore && <span style={s.qualityScore}>Score: {qualityScore}/100</span>}
              </div>
              <span style={s.aiLabel}>✨ AI-Predicted</span>
            </div>
          )}

          {/* ── Row 5: Description ── */}
          <div style={s.formGroup}>
            <label style={s.label}>Tender Description <span style={s.req}>*</span></label>
            <textarea
              name="tender_description" value={formData.tender_description}
              onChange={handleChange} rows={4}
              placeholder="Provide detailed information about the tender requirements…"
              style={{ ...s.textarea, ...(errors.tender_description ? s.inputErr : {}) }}
            />
            {errors.tender_description && <span style={s.errTxt}>{errors.tender_description}</span>}
          </div>

          {/* ── Row 6: Dates ── */}
          <div style={s.row}>
            <div style={s.formGroup}>
              <label style={s.label}>Start Date</label>
              <input type="date" name="start_date" value={formData.start_date}
                onChange={handleChange} style={s.input} />
              <span style={s.helpText}>Today's date</span>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>End Date <span style={s.req}>*</span></label>
              <input
                type="date" name="end_date" value={formData.end_date}
                onChange={handleChange} min={formData.start_date}
                style={{ ...s.input, ...(errors.end_date ? s.inputErr : {}) }}
              />
              {errors.end_date && <span style={s.errTxt}>{errors.end_date}</span>}
            </div>
          </div>

          {/* ── Submit ── */}
          <div style={s.formActions}>
            <button type="button" style={s.cancelBtn}
              onClick={() => navigate('/manufacturer/my-tenders')}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reportAnalyzing}
              style={{ ...s.submitBtn, ...(loading || reportAnalyzing ? s.submitBtnDisabled : {}) }}
            >
              {loading ? '⏳ Creating…' : '✅ Create Tender'}
            </button>
          </div>

        </form>
      </div>
    </ManufacturerLayout>
  );
}

const s = {
  pageHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle:      { margin: '0 0 0.3rem', color: '#1a2e44', fontSize: '1.4rem', fontWeight: 700 },
  pageSubtitle:   { margin: 0, color: '#64748b', fontSize: '0.9rem' },
  backBtn:        { padding: '0.5rem 1rem', backgroundColor: '#f0f2f5', color: '#1a2e44', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 },

  card:           { backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '2rem', maxWidth: 780 },

  serverError:    { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 6, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem' },

  formGroup:      { marginBottom: '1.25rem', flex: 1 },
  row:            { display: 'flex', gap: '1.25rem' },
  label:          { display: 'block', marginBottom: '0.45rem', color: '#1a2e44', fontWeight: 600, fontSize: '0.875rem' },
  req:            { color: '#dc2626' },

  input:          { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#1a2e44', boxSizing: 'border-box', outline: 'none' },
  inputReadOnly:  { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#94a3b8', backgroundColor: '#f8fafc', boxSizing: 'border-box', cursor: 'not-allowed' },
  inputErr:       { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  textarea:       { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#1a2e44', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none' },

  fileBox:        { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  fileLabel:      { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', border: '1.5px dashed #cbd5e1', borderRadius: 7, cursor: 'pointer', fontSize: '0.875rem', color: '#475569', backgroundColor: '#f8fafc', width: 'fit-content' },

  errTxt:         { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' },
  helpText:       { color: '#94a3b8', fontSize: '0.775rem', marginTop: '0.25rem', display: 'block' },

  analyzing:      { marginTop: '0.5rem', padding: '0.55rem 0.85rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, color: '#1d4ed8', fontSize: '0.875rem' },

  qualityResult:  { backgroundColor: '#f0fdf4', padding: '1rem 1.25rem', borderRadius: 8, marginBottom: '1.25rem', border: '2px solid #86efac' },
  qualityBadge:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', color: '#15803d', fontSize: '1rem', fontWeight: 700 },
  qualityScore:   { fontSize: '0.875rem', color: '#64748b', fontWeight: 400 },
  aiLabel:        { fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' },

  formActions:    { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' },
  cancelBtn:      { padding: '0.65rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  submitBtn:      { padding: '0.65rem 2rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
  submitBtnDisabled: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
};