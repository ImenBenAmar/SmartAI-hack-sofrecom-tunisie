"use client";

import { useState } from "react";

export type FocusMode = 'both' | 'text-only' | 'attachment-only';

interface FocusModeSelectorProps {
  value: FocusMode;
  onChange: (mode: FocusMode) => void;
}

export default function FocusModeSelector({ value, onChange }: FocusModeSelectorProps) {
  return (
    <div className="border-bottom p-3">
      <label className="form-label small fw-semibold mb-2">Focus Mode</label>
      <div className="btn-group w-100" role="group" aria-label="Focus mode selector">
        <input
          type="radio"
          className="btn-check"
          name="focusMode"
          id="focusModeBoth"
          autoComplete="off"
          checked={value === 'both'}
          onChange={() => onChange('both')}
        />
        <label className="btn btn-sm btn-outline-secondary" htmlFor="focusModeBoth">
          Both
        </label>

        <input
          type="radio"
          className="btn-check"
          name="focusMode"
          id="focusModeText"
          autoComplete="off"
          checked={value === 'text-only'}
          onChange={() => onChange('text-only')}
        />
        <label className="btn btn-sm btn-outline-secondary" htmlFor="focusModeText">
          Text Only
        </label>

        <input
          type="radio"
          className="btn-check"
          name="focusMode"
          id="focusModeAttachment"
          autoComplete="off"
          checked={value === 'attachment-only'}
          onChange={() => onChange('attachment-only')}
        />
        <label className="btn btn-sm btn-outline-secondary" htmlFor="focusModeAttachment">
          Attachments Only
        </label>
      </div>
      <div className="text-body-secondary small mt-2">
        {value === 'both' && 'Search both text content and attachments'}
        {value === 'text-only' && 'Search only text content'}
        {value === 'attachment-only' && 'Search only attachments'}
      </div>
    </div>
  );
}
