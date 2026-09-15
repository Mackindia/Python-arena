import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';

const FreezeControl = () => {
  const {
    isTimetableLocked,
    freezeTimetable,
    unfreezeTimetable,
    getLockStatusText
  } = useTimetable();

  const [showUnfreezeModal, setShowUnfreezeModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFreeze = async () => {
    if (window.confirm('FREEZE timetable? All edits will be blocked.')) {
      setLoading(true);
      await freezeTimetable();
      setLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!password) return;
    setLoading(true);
    const result = await unfreezeTimetable(password);
    setLoading(false);
    if (result.success) {
      setShowUnfreezeModal(false);
      setPassword('');
    }
  };

  return (
    <>
      {/* Sticky compact status bar */}
      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        marginBottom: '14px',
        backgroundColor: isTimetableLocked ? '#FEF2F2' : '#F0FDF4',
        border: `1px solid ${isTimetableLocked ? '#FECACA' : '#BBF7D0'}`,
        borderRadius: '6px',
        fontSize: '13px',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Left: status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '13px' }}>{isTimetableLocked ? '🔒' : '✏️'}</span>
          <span style={{
            fontWeight: '600',
            color: isTimetableLocked ? '#991B1B' : '#065F46',
            whiteSpace: 'nowrap',
          }}>
            {isTimetableLocked ? 'FROZEN' : 'DRAFT'}
          </span>
          <span style={{ color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getLockStatusText()}
          </span>
        </div>

        {/* Right: action button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {isTimetableLocked ? (
            <>
              <span style={{ color: '#991B1B', fontSize: '11px' }}>Edits blocked</span>
              <button
                onClick={() => setShowUnfreezeModal(true)}
                disabled={loading}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                🔓 Unfreeze
              </button>
            </>
          ) : (
            <button
              onClick={handleFreeze}
              disabled={loading}
              style={{
                padding: '4px 10px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              🔒 Freeze
            </button>
          )}
        </div>
      </div>

      {/* Unfreeze Modal */}
      {showUnfreezeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '360px',
            maxWidth: '90%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
              🔓 Unfreeze Timetable
            </h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6B7280' }}>
              Enter admin password to enable editing.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                marginBottom: '10px',
                boxSizing: 'border-box',
              }}
              onKeyPress={(e) => { if (e.key === 'Enter') handleUnfreeze(); }}
            />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowUnfreezeModal(false); setPassword(''); }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnfreeze}
                disabled={loading || !password}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                  opacity: loading || !password ? 0.7 : 1,
                }}
              >
                {loading ? 'Unlocking...' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FreezeControl;
