# Chatbot Components

This folder contains all components related to the SmartMail AI Chatbot feature.

## Components

### `ChatbotSidebar.tsx`
Main chatbot sidebar component that appears as an offcanvas panel on the right side of the screen.
- Contains the chatbot header, focus mode selector, quick actions, chat area, and input
- Manages the chatbot state and focus mode
- Handles opening/closing animations

### `FocusModeSelector.tsx`
Allows users to select the focus mode for the chatbot:
- **Both**: Search both text content and attachments
- **Text Only**: Search only email text content
- **Attachments Only**: Search only email attachments

**Props:**
- `value`: Current focus mode ('both' | 'text-only' | 'attachment-only')
- `onChange`: Callback when focus mode changes

### `QuickActions.tsx`
Quick action buttons that appear when a thread is selected and focus mode is "text-only".
Provides 5 predefined actions:
- **Translate** 🌐 - Translate the email content
- **Semantic Analysis** 🔍 - Analyze the semantic meaning
- **Summary** 📝 - Generate a summary of the thread
- **Task Detection** ✓ - Detect tasks and action items
- **Auto Reply** ↩️ - Generate an automatic reply

**Props:**
- `focusMode`: Current focus mode
- `onActionClick`: Callback when an action button is clicked

**Visibility:** Only shown when `selectedThread` exists AND `focusMode === 'text-only'`

### `SelectedThreadTag.tsx`
Displays the currently selected email thread as a tag above the message input.
- Shows thread subject and sender
- Has a close button to clear selection
- Styled similar to Copilot Pro chat context

**Props:** None (uses ChatbotContext)

### `ChatbotContext.tsx`
React Context for managing global chatbot state:
- `isOpen`: Whether the chatbot is currently open
- `selectedThread`: The currently selected email thread
- Provides `useChatbot()` hook for easy access

### `ThreadSelector.tsx` (in `/components/inbox/`)
Auto-selects a thread when viewing a thread detail page.
- Sets the current thread as selected in the chatbot context
- Invisible component (renders nothing)

### `ChatMessage.tsx`
Individual chat message component for displaying user and assistant messages.

**Props:**
- `role`: 'user' | 'assistant'
- `content`: Message text
- `timestamp`: Optional timestamp for the message

### `ChatInput.tsx`
Chat input field with send button.

**Props:**
- `onSendMessage`: Callback when a message is sent
- `disabled`: Optional flag to disable input

## Usage

```tsx
import { ChatbotSidebar } from '@/components/chatbot';

// In your layout or app shell
<ChatbotSidebar />
```

## Future Components

- `ChatHistory.tsx` - Chat conversation history
- `ChatTypingIndicator.tsx` - Typing indicator animation
- `ChatSuggestions.tsx` - Quick suggestion chips
- `ChatAttachmentPreview.tsx` - Preview attachments in chat
- `ChatMessageActions.tsx` - Actions like copy, regenerate, etc.
