"use client";

import { useChatbot } from "./ChatbotContext";
import type { FocusMode } from "./FocusModeSelector";

interface QuickActionsProps {
  focusMode: FocusMode;
  onActionClick: (action: string) => void;
}

export type QuickActionType = 'translate' | 'semantic-analysis' | 'summary' | 'task-detection' | 'auto-reply';

export default function QuickActions({ focusMode, onActionClick }: QuickActionsProps) {
  const { selectedThread } = useChatbot();

  // Only show when thread is selected and focus mode is text-only
  if (!selectedThread || focusMode !== 'text-only') {
    return null;
  }

  const actions: { id: QuickActionType; label: string; icon: string }[] = [
    { id: 'translate', label: 'Translate', icon: '/icons/translate.svg' },
    { id: 'semantic-analysis', label: 'Semantic Analysis', icon: '/icons/analyse.svg' },
    { id: 'summary', label: 'Summary', icon: '/icons/summary.svg' },
    { id: 'task-detection', label: 'Task Detection', icon: '/icons/task.svg' },
    { id: 'auto-reply', label: 'Auto Reply', icon: '/icons/email-replied.svg' },
  ];

  return (
    <div className="border-top border-bottom p-3 bg-light">
      <div className="small text-body-secondary mb-2 fw-semibold">Quick Actions</div>
      <div className="d-flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => onActionClick(action.id)}
            title={action.label}
          >
            <img 
              src={action.icon} 
              alt="" 
              width={16} 
              height={16} 
              className="me-1"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
