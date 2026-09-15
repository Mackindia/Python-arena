import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getRecommendations } from '../../services/teacherReliefEngine';
import './reliefStyles.css';

const PRIORITY_LABELS = {
  1: { text: 'Best Option', color: '#059669', icon: '✨' },
  2: { text: 'Good Option', color: '#2563eb', icon: '💡' },
  3: { text: 'Possible', color: '#d97706', icon: '🔄' },
  4: { text: 'Complex', color: '#dc2626', icon: '⚠️' },
  5: { text: 'Last Resort', color: '#6b7280', icon: '⚙️' }
};

const IMPACT_LABELS = {
  low: { text: 'Low Impact', color: '#059669' },
  medium: { text: 'Medium Impact', color: '#d97706' },
  high: { text: 'High Impact', color: '#dc2626' }
};

const RecommendationPanel = ({ teacher, overloadedDay, onApplySwap, onClose }) => {
  const { timetables } = useTimetable();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [applyingIndex, setApplyingIndex] = useState(null);

  // Get recommendations
  const recommendations = useMemo(() => {
    if (!teacher || !overloadedDay) return null;
    return getRecommendations(timetables, teacher, overloadedDay);
  }, [timetables, teacher, overloadedDay]);

  if (!recommendations) return null;

  const { constraint, recommendations: recs, stats } = recommendations;

  // Handle apply swap
  const handleApply = async (rec, index) => {
    setApplyingIndex(index);
    try {
      await onApplySwap(rec);
    } finally {
      setApplyingIndex(null);
    }
  };

  // Toggle expand
  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="recommendation-overlay" onClick={onClose}>
      <div className="recommendation-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rec-header">
          <div>
            <h3>Relief Recommendations</h3>
            <div className="rec-header-sub">
              {teacher} — {overloadedDay} ({constraint.excess} periods to move)
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Constraint Analysis */}
        <div className="rec-constraint">
          <div className="rec-constraint-icon">⚠️</div>
          <div className="rec-constraint-content">
            <div className="rec-constraint-title">Why no direct shift?</div>
            <div className="rec-constraint-reason">{constraint.reason}</div>
            <div className="rec-constraint-classes">
              Affected classes: {constraint.affectedClasses.join(', ')}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rec-stats">
          <div className="rec-stat">
            <span className="rec-stat-value">{stats.totalOptions}</span>
            <span className="rec-stat-label">options found</span>
          </div>
          <div className="rec-stat">
            <span className="rec-stat-value">{stats.verifiedOptions}</span>
            <span className="rec-stat-label">verified</span>
          </div>
          {stats.bestOption !== 'none' && (
            <div className="rec-stat">
              <span className="rec-stat-value">{stats.bestOption.replace('_', ' ')}</span>
              <span className="rec-stat-label">best type</span>
            </div>
          )}
        </div>

        {/* Recommendations List */}
        <div className="rec-list">
          {recs.length === 0 ? (
            <div className="rec-empty">
              <div className="rec-empty-icon">🔍</div>
              <div className="rec-empty-title">No automated swaps possible</div>
              <div className="rec-empty-desc">
                Consider manually restructuring the schedule or consulting with administration.
              </div>
            </div>
          ) : (
            recs.map((rec, index) => {
              const priority = PRIORITY_LABELS[rec.priority] || PRIORITY_LABELS[5];
              const impact = IMPACT_LABELS[rec.impact] || IMPACT_LABELS.medium;
              const isExpanded = expandedIndex === index;
              const isApplying = applyingIndex === index;

              return (
                <div
                  key={index}
                  className={`rec-card ${rec.verified ? 'verified' : 'unverified'} ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Card Header */}
                  <div className="rec-card-header" onClick={() => toggleExpand(index)}>
                    <div className="rec-card-priority" style={{ background: priority.color }}>
                      {priority.icon}
                    </div>
                    <div className="rec-card-info">
                      <div className="rec-card-title">{rec.title}</div>
                      <div className="rec-card-meta">
                        <span className="rec-badge" style={{ background: priority.color + '20', color: priority.color }}>
                          {priority.text}
                        </span>
                        <span className="rec-badge" style={{ background: impact.color + '20', color: impact.color }}>
                          {impact.text}
                        </span>
                        {rec.verified && (
                          <span className="rec-badge verified-badge">✓ Verified</span>
                        )}
                      </div>
                    </div>
                    <div className="rec-card-expand">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Card Body (expanded) */}
                  {isExpanded && (
                    <div className="rec-card-body">
                      <div className="rec-card-desc">{rec.description}</div>

                      {/* Steps */}
                      {rec.steps.length > 0 && (
                        <div className="rec-steps">
                          <div className="rec-steps-title">Steps:</div>
                          {rec.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="rec-step">
                              <div className="rec-step-num">{stepIdx + 1}</div>
                              <div className="rec-step-content">
                                {step.action === 'swap' ? (
                                  <>
                                    <strong>{step.teacher}</strong>: {step.from.day} P{step.from.period} ({step.from.classId?.toUpperCase()})
                                    → {step.to.day} P{step.to.period} ({step.to.classId?.toUpperCase()})
                                  </>
                                ) : step.action === 'assign' ? (
                                  <>
                                    <strong>{step.teacher}</strong>: Assign {step.to.subject} to {step.to.classId?.toUpperCase()} on {step.to.day} P{step.to.period}
                                  </>
                                ) : step.action === 'remove' ? (
                                  <>
                                    <strong>{step.teacher}</strong>: Remove from {step.from.classId?.toUpperCase()} on {step.from.day} P{step.from.period}
                                  </>
                                ) : (
                                  JSON.stringify(step)
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Affected Teachers */}
                      <div className="rec-affected">
                        <span className="rec-affected-label">Affected teachers:</span>
                        {rec.affectedTeachers.map(t => (
                          <span key={t} className="rec-teacher-badge">{t}</span>
                        ))}
                      </div>

                      {/* Apply Button */}
                      <button
                        className="rec-apply-btn"
                        onClick={() => handleApply(rec, index)}
                        disabled={isApplying || !rec.verified}
                      >
                        {isApplying ? 'Applying...' : rec.verified ? 'Apply This Swap' : 'Cannot Auto-Apply'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="rec-footer">
          <button className="rec-back-btn" onClick={onClose}>
            Back to Shift Picker
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationPanel;
