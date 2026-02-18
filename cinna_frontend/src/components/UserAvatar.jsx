// src/components/UserAvatar.jsx
// Reusable avatar component — drop this into ANY navbar/dropdown.
// Automatically shows profile picture if available, falls back to initials.
// Re-renders whenever AuthContext user changes (e.g. after profile update).

import React, { useState, useEffect } from 'react';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000${path}`;
};

/**
 * Props:
 *   picturePath  – user.profile_picture (relative or absolute URL, or null)
 *   initials     – fallback text e.g. "HN"
 *   size         – diameter in px (default 30)
 *   fontSize     – initials font size (default '0.72rem')
 *   border       – CSS border string (optional)
 *   style        – extra style overrides (optional)
 */
export default function UserAvatar({
  picturePath,
  initials = '?',
  size = 30,
  fontSize = '0.72rem',
  border = 'none',
  style = {},
}) {
  const [imgError, setImgError] = useState(false);

  // Reset error when picturePath changes (new upload)
  useEffect(() => { setImgError(false); }, [picturePath]);

  const url = getImageUrl(picturePath);

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    border,
    ...style,
  };

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt="Profile"
        style={{ ...base, objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span style={{
      ...base,
      backgroundColor: '#d4922a',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      fontWeight: 700,
    }}>
      {initials}
    </span>
  );
}