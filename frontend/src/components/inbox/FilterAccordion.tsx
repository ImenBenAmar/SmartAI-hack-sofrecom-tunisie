"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import type { SenderGroup, InboxFilters, UserFilterSettings } from "@/types/filters";

interface FilterAccordionProps {
  onFiltersChange: (filters: InboxFilters, groupsMap: Map<string, string[]>) => void;
}

export default function FilterAccordion({ onFiltersChange }: FilterAccordionProps) {
  const { data: session } = useSession();
  const [senderGroups, setSenderGroups] = useState<SenderGroup[]>([]);
  const [filters, setFilters] = useState<InboxFilters>({
    enabled: true,
    activeSenderGroups: [],
    individualSenders: [],
    readStatus: 'all'
  });
  
  // UI state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmail, setNewGroupEmail] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newIndividualEmail, setNewIndividualEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load settings from Firebase Realtime Database
  useEffect(() => {
    if (!session?.user?.email) return;
    
    const loadSettings = async () => {
      try {
        const userEmail = session.user?.email;
        if (!userEmail) return;
        
        // Sanitize email for Firebase key (remove invalid characters)
        const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
        const dbRef = ref(database, `filterSettings/${sanitizedEmail}`);
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val() as UserFilterSettings;
          setSenderGroups(data.senderGroups || []);
          setFilters(data.activeFilters || {
            enabled: true,
            activeSenderGroups: [],
            individualSenders: [],
            readStatus: 'all'
          });
          
          // Set date range if exists
          if (data.activeFilters?.dateRange) {
            setStartDate(data.activeFilters.dateRange.start);
            setEndDate(data.activeFilters.dateRange.end);
          }
          
          // Notify parent with loaded filters
          const groupsMap = new Map<string, string[]>();
          (data.senderGroups || []).forEach(group => {
            groupsMap.set(group.id, group.senders);
          });
          onFiltersChange(data.activeFilters || {
            enabled: true,
            activeSenderGroups: [],
            individualSenders: [],
            readStatus: 'all'
          }, groupsMap);
        }
      } catch (error) {
        console.error("Error loading filter settings:", error);
      }
    };
    
    loadSettings();
  }, [session]);

  // Save settings to Firebase Realtime Database
  const saveSettings = async (updatedGroups: SenderGroup[], updatedFilters: InboxFilters) => {
    const userEmail = session?.user?.email;
    if (!userEmail) return;
    
    try {
      // Sanitize email for Firebase key (remove invalid characters)
      const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
      const dbRef = ref(database, `filterSettings/${sanitizedEmail}`);
      
      const settings: UserFilterSettings = {
        userId: userEmail,
        senderGroups: updatedGroups,
        activeFilters: updatedFilters,
        updatedAt: new Date()
      };
      
      await set(dbRef, settings);
      
      // Create groups map for quick lookup
      const groupsMap = new Map<string, string[]>();
      updatedGroups.forEach(group => {
        groupsMap.set(group.id, group.senders);
      });
      
      onFiltersChange(updatedFilters, groupsMap);
    } catch (error) {
      console.error("Error saving filter settings:", error);
    }
  };

  // Sender Group Management
  const createGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: SenderGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      senders: newGroupEmail.trim() ? [newGroupEmail.trim()] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updated = [...senderGroups, newGroup];
    setSenderGroups(updated);
    saveSettings(updated, filters);
    setNewGroupName("");
    setNewGroupEmail("");
  };

  const deleteGroup = (groupId: string) => {
    const updated = senderGroups.filter(g => g.id !== groupId);
    const updatedFilters = {
      ...filters,
      activeSenderGroups: (filters.activeSenderGroups || []).filter(id => id !== groupId)
    };
    setSenderGroups(updated);
    setFilters(updatedFilters);
    saveSettings(updated, updatedFilters);
  };

  const addSenderToGroup = (groupId: string, email: string) => {
    if (!email.trim()) return;
    
    const updated = senderGroups.map(g => {
      if (g.id === groupId && !g.senders.includes(email.trim())) {
        return {
          ...g,
          senders: [...g.senders, email.trim()],
          updatedAt: new Date()
        };
      }
      return g;
    });
    
    setSenderGroups(updated);
    saveSettings(updated, filters);
  };

  const removeSenderFromGroup = (groupId: string, email: string) => {
    const updated = senderGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          senders: g.senders.filter(s => s !== email),
          updatedAt: new Date()
        };
      }
      return g;
    });
    
    setSenderGroups(updated);
    saveSettings(updated, filters);
  };

  const toggleGroupActive = (groupId: string) => {
    const activeSenderGroups = filters.activeSenderGroups || [];
    const updatedFilters = {
      ...filters,
      activeSenderGroups: activeSenderGroups.includes(groupId)
        ? activeSenderGroups.filter(id => id !== groupId)
        : [...activeSenderGroups, groupId]
    };
    setFilters(updatedFilters);
    saveSettings(senderGroups, updatedFilters);
  };

  // Individual Sender Management
  const addIndividualSender = () => {
    const individualSenders = filters.individualSenders || [];
    if (!newIndividualEmail.trim() || individualSenders.includes(newIndividualEmail.trim())) return;
    
    const updatedFilters = {
      ...filters,
      individualSenders: [...individualSenders, newIndividualEmail.trim()]
    };
    setFilters(updatedFilters);
    saveSettings(senderGroups, updatedFilters);
    setNewIndividualEmail("");
  };

  const removeIndividualSender = (email: string) => {
    const updatedFilters = {
      ...filters,
      individualSenders: (filters.individualSenders || []).filter(s => s !== email)
    };
    setFilters(updatedFilters);
    saveSettings(senderGroups, updatedFilters);
  };

  // Date Range Management
  const applyDateRange = () => {
    const updatedFilters = {
      ...filters,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
    };
    setFilters(updatedFilters);
    saveSettings(senderGroups, updatedFilters);
  };

  const clearDateRange = () => {
    const updatedFilters = {
      ...filters,
      dateRange: undefined
    };
    setFilters(updatedFilters);
    saveSettings(senderGroups, updatedFilters);
    setStartDate("");
    setEndDate("");
  };

  // Read Status Management
  const updateReadStatus = (status: 'all' | 'read' | 'unread') => {
    const updatedFilters = {
      ...filters,
      readStatus: status
    };
    setFilters(updatedFilters);
    saveSettings(senderGroups, updatedFilters);
  };

  if (!session) return null;

  return (
    <div className="accordion mb-3" id="filterAccordion">
      <div className="accordion-item">
        <h2 className="accordion-header d-flex align-items-stretch">
          <button
            className="accordion-button collapsed flex-grow-1"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#filterCollapse"
            aria-expanded="false"
            aria-controls="filterCollapse"
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
          >
            <span className="fw-semibold">Filter Settings</span>
            {filters.enabled !== false && ((filters.activeSenderGroups?.length > 0) || (filters.individualSenders?.length > 0) || filters.dateRange || filters.readStatus !== 'all') && (
              <span className="badge text-white ms-2" style={{ backgroundColor: 'rgb(210, 50, 1)' }}>Active</span>
            )}
          </button>
          <div 
            className="d-flex align-items-center px-3 border-start" 
            style={{ backgroundColor: 'var(--bs-accordion-btn-bg)', cursor: 'default' }}
          >
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="filterEnabledSwitch"
                checked={filters.enabled !== false}
                onChange={(e) => {
                  const newFilters = { ...filters, enabled: e.target.checked };
                  setFilters(newFilters);
                  saveSettings(senderGroups, newFilters);
                }}
              />
              <label className="form-check-label" htmlFor="filterEnabledSwitch">
                {filters.enabled !== false ? 'Enabled' : 'Disabled'}
              </label>
            </div>
          </div>
        </h2>
        <div
          id="filterCollapse"
          className="accordion-collapse collapse"
          data-bs-parent="#filterAccordion"
        >
          <div className="accordion-body">
            {/* Sender Groups Section */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Sender Groups</h6>
              
              {/* Create New Group */}
              <div className="card mb-3">
                <div className="card-body">
                  <h6 className="card-title">Create New Group</h6>
                  <div className="row g-2">
                    <div className="col-md-5">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Group name (e.g., Work)"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-5">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="First sender email (optional)"
                        value={newGroupEmail}
                        onChange={(e) => setNewGroupEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button
                        className="btn btn-primary w-100"
                        onClick={createGroup}
                        disabled={!newGroupName.trim()}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Groups */}
              {senderGroups.map((group) => (
                <div key={group.id} className="card mb-2">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`group-${group.id}`}
                          checked={(filters.activeSenderGroups || []).includes(group.id)}
                          onChange={() => toggleGroupActive(group.id)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor={`group-${group.id}`}>
                          {group.name}
                        </label>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteGroup(group.id)}
                      >
                        Delete
                      </button>
                    </div>
                    
                    {/* Senders in group */}
                    {group.senders.length > 0 && (
                      <div className="mb-2">
                        {group.senders.map((sender) => (
                          <span key={sender} className="badge bg-secondary me-1 mb-1">
                            {sender}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-1"
                              aria-label="Remove"
                              style={{ fontSize: '0.6rem' }}
                              onClick={() => removeSenderFromGroup(group.id, sender)}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Add sender to group */}
                    {editingGroupId === group.id ? (
                      <div className="input-group input-group-sm">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email address"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addSenderToGroup(group.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => setEditingGroupId(null)}
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setEditingGroupId(group.id)}
                      >
                        + Add Sender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Individual Senders Section */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Individual Senders</h6>
              <div className="input-group mb-2">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Add individual email address"
                  value={newIndividualEmail}
                  onChange={(e) => setNewIndividualEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addIndividualSender();
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={addIndividualSender}
                  disabled={!newIndividualEmail.trim()}
                >
                  Add
                </button>
              </div>
              
              {(filters.individualSenders?.length ?? 0) > 0 && (
                <div>
                  {(filters.individualSenders || []).map((email) => (
                    <span key={email} className="badge bg-primary me-1 mb-1">
                      {email}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        aria-label="Remove"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => removeIndividualSender(email)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Section */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Date Range</h6>
              <div className="row g-2">
                <div className="col-md-5">
                  <label htmlFor="startDate" className="form-label small">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-5">
                  <label htmlFor="endDate" className="form-label small">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end gap-1">
                  <button
                    className="btn btn-primary"
                    onClick={applyDateRange}
                    disabled={!startDate || !endDate}
                  >
                    Apply
                  </button>
                  {filters.dateRange && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={clearDateRange}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {filters.dateRange && (
                <div className="alert alert-info mt-2 py-2 px-3 small">
                  Active: {new Date(filters.dateRange.start).toLocaleDateString()} - {new Date(filters.dateRange.end).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Read Status Section */}
            <div className="mb-2">
              <h6 className="fw-bold mb-3">Read Status</h6>
              <div className="btn-group" role="group" aria-label="Read status filter">
                <input
                  type="radio"
                  className="btn-check"
                  name="readStatus"
                  id="statusAll"
                  autoComplete="off"
                  checked={filters.readStatus === 'all'}
                  onChange={() => updateReadStatus('all')}
                />
                <label className="btn btn-outline-primary" htmlFor="statusAll">All</label>

                <input
                  type="radio"
                  className="btn-check"
                  name="readStatus"
                  id="statusUnread"
                  autoComplete="off"
                  checked={filters.readStatus === 'unread'}
                  onChange={() => updateReadStatus('unread')}
                />
                <label className="btn btn-outline-primary" htmlFor="statusUnread">Unread Only</label>

                <input
                  type="radio"
                  className="btn-check"
                  name="readStatus"
                  id="statusRead"
                  autoComplete="off"
                  checked={filters.readStatus === 'read'}
                  onChange={() => updateReadStatus('read')}
                />
                <label className="btn btn-outline-primary" htmlFor="statusRead">Read Only</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
