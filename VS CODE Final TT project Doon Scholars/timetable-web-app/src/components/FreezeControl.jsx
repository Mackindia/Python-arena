import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';

/**
 * FreezeControl Component
 * 
 * Provides UI for freezing/unfreezing the timetable.
 * Shows current lock status and allows admin to toggle.
 */
const FreezeControl = () => {
  const { 
    isTimetableLocked, 
    lockStatus, 
    lockInfo, 
    freezeTimetable, 
    unfreezeTimetable,
    getLockStatusText 
  } = useTimetable();
  
  const [showUnfreezeModal, setShowUnfreezeModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFreeze = async () => {
    if (window.confirm('Are you sure you want to FREEZE the timetable? No changes will be allowed until unfrozen.')) {
      setLoading(true);
      await freezeTimetable();
      setLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!password) {
      alert('Please enter the password to unfreeze.');
      return;
    }
    
    setLoading(true);
    const result = await unfreezeTimetable(password);
    setLoading(false);
    
    if (result.success) {
      setShowUnfreezeModal(false);
      setPassword('');
    }
  };

  const openUnfreezeModal = () => {
    setShowUnfreezeModal(true);
    setPassword('');
  };

  const closeUnfreezeModal = () => {
    setShowUnfreezeModal(false);
    setPassword('');
  };

  // Status badge colors
  const getStatusBadge = () => {
    if (isTimetableLocked) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '9999px',
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          <span style={{ marginRight: '6px' }}>🔒</span>
          FROZEN
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '9999px',
        backgroundColor: '#D1FAE5',
        color: '#065F46',
        fontSize: '14px',
        fontWeight: '600',
      }}>
        <span style={{ marginRight: '6px' }}>✏️</span>
        DRAFT
      </span>
    );
  };

  return (
    <>
      <div style={{
        padding: '16px',
        backgroundColor: isTimetableLocked ? '#FEF2F2' : '#F0FDF4',
        border: `2px solid ${isTimetableLocked ? '#FECACA' : '#BBF7D0'}`,
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1F2937',
            }}>
              Timetable Lock Status
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getStatusBadge()}
              <span style={{ 
                fontSize: '14px', 
                color: '#6B7280',
              }}>
                {getLockStatusText()}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {isTimetableLocked ? (
              <button
                onClick={openUnfreezeModal}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : '🔓 Unfreeze (Edit Mode)'}
              </button>
            ) : (
              <button
                onClick={handleFreeze}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : '🔒 Freeze (Lock Permanently)'}
              </button>
            )}
          </div>
        </div>
        
        {isTimetableLocked && (
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '13px',
            color: '#991B1B',
            backgroundColor: '#FEE2E2',
            padding: '8px 12px',
            borderRadius: '4px',
          }}>
            ⚠️ Timetable is FROZEN. All edits are blocked. Only viewing is allowed.
            To make changes, click "Unfreeze" and enter the admin password.
          </p>
        )}
        
        {!isTimetableLocked && (
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '13px',
            color: '#065F46',
            backgroundColor: '#D1FAE5',
            padding: '8px 12px',
            borderRadius: '4px',
          }}>
            ✅ Timetable is in DRAFT mode. You can make changes. 
            Click "Freeze" when done to lock it permanently.
          </p>
        )}
      </div>

      {/* Unfreeze Modal */}
      {showUnfreezeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1F2937',
            }}>
              🔓 Unfreeze Timetable
            </h3>
            
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#6B7280',
            }}>
              Enter the admin password to unfreeze the timetable and enable editing.
            </p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleUnfreeze();
              }}
            />
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={closeUnfreezeModal}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnfreeze}
                disabled={loading || !password}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                  opacity: loading || !password ? 0.7 : 1,
                }}
              >
                {loading ? 'Unfreezing...' : 'Unlock Timetable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FreezeControl;
