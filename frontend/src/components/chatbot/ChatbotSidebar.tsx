"use client";

import { useEffect, useState, useRef } from "react";
import FocusModeSelector, { FocusMode } from "./FocusModeSelector";
import SelectedThreadTag from "./SelectedThreadTag";
import QuickActions from "./QuickActions";
import { useChatbot } from "./ChatbotContext";
import { translateEmail, type TranslateResponse } from "@/lib/translateApi";
import { analyzeEmail, type AnalyzeResponse } from "@/lib/analyzeApi";
import { summarizeEmail, type SummaryResponse } from "@/lib/summaryApi";
import { detectTasks, convertTasksToCSV, downloadCSV, type TaskDetectionResponse } from "@/lib/taskDetectionApi";
import { generateAutoReply, type AutoReplyResponse } from "@/lib/autoReplyApi";
import { askQuestion, type RAGAnswerResponse } from "@/lib/ragApi";
import { clearAllDatabases } from "@/lib/databaseApi";

export default function ChatbotSidebar() {
  const [focusMode, setFocusMode] = useState<FocusMode>('text-only');
  const [translating, setTranslating] = useState(false);
  const [translationResults, setTranslationResults] = useState<TranslateResponse[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalyzeResponse[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResults, setSummaryResults] = useState<SummaryResponse[]>([]);
  const [detectingTasks, setDetectingTasks] = useState(false);
  const [taskResults, setTaskResults] = useState<TaskDetectionResponse[]>([]);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [replyResults, setReplyResults] = useState<AutoReplyResponse[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [ragAnswers, setRagAnswers] = useState<RAGAnswerResponse[]>([]);
  const { setIsOpen, selectedThread, processedAttachments } = useChatbot();
  
  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for tracking previous values (for database cleanup)
  const prevThreadIdRef = useRef<string | null>(null);
  const prevAttachmentRef = useRef<string>('');
  
  // Scroll to bottom when new results appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Scroll to bottom when any results change
  useEffect(() => {
    scrollToBottom();
  }, [translationResults, analysisResults, summaryResults, taskResults, replyResults, ragAnswers, translating, analyzing, summarizing, detectingTasks, generatingReply, askingQuestion]);

  // Debug: Log when processedAttachments changes
  useEffect(() => {
    console.log('🔄 ChatbotSidebar - processedAttachments updated:', processedAttachments);
    console.log('📊 Count:', processedAttachments.length);
  }, [processedAttachments]);

  // Clear database when leaving a thread (selectedThread becomes null)
  useEffect(() => {
    const currentThreadId = selectedThread?.id || null;
    
    // If we had a thread before and now it's null, we're leaving the thread
    if (prevThreadIdRef.current !== null && currentThreadId === null) {
      console.log('👋 Leaving thread - clearing databases...');
      clearAllDatabases();
    }
    
    // Update the ref for next comparison
    prevThreadIdRef.current = currentThreadId;
  }, [selectedThread]);

  // Clear database when switching between attachments
  useEffect(() => {
    // Only clear when switching from one attachment to another (not on initial selection)
    if (prevAttachmentRef.current !== '' && selectedAttachment !== '' && selectedAttachment !== prevAttachmentRef.current) {
      console.log('🔄 Switching attachment - clearing databases...');
      clearAllDatabases();
    }
    
    // Update the ref for next comparison
    prevAttachmentRef.current = selectedAttachment;
  }, [selectedAttachment]);

  const handleAskQuestion = async () => {
    if (!message.trim() || !selectedAttachment) {
      alert('Please select an attachment and enter a question');
      return;
    }

    const attachment = processedAttachments.find(att => 
      `${att.messageId}-${att.attachmentId}` === selectedAttachment
    );

    if (!attachment) {
      alert('Attachment not found');
      return;
    }

    try {
      setAskingQuestion(true);

      const result = await askQuestion(
        message,
        attachment.extractedText,
        3, // top_k
        false, // force_recreate
        true // apply_correction
      );

      setRagAnswers(prev => [...prev, result]);
      setMessage(''); // Clear message after asking
      
      console.log('RAG Answer:', result);
    } catch (error) {
      console.error('RAG query error:', error);
      alert(`Failed to get answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!selectedThread) return;

    if (action === 'translate') {
      try {
        setTranslating(true);
        setTranslationResults([]);

        // Fetch thread messages
        const threadResponse = await fetch(`/api/gmail/threads/${selectedThread.id}`);
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread messages');
        }
        
        const threadData = await threadResponse.json();
        const messages = threadData.messages || [];
        
        console.log(`Translating ${messages.length} message(s) in thread...`);
        
        // Translate each message in order
        const results: TranslateResponse[] = [];
        for (const message of messages) {
          // Extract text from message body
          const messageText = message.body?.text || message.snippet || '';
          const subject = message.subject || '';
          
          // Call translate API
          const result = await translateEmail(subject, messageText);
          results.push(result);
          
          // Update UI progressively
          setTranslationResults([...results]);
        }
        
        console.log('Translation completed:', results);
      } catch (error) {
        console.error('Translation error:', error);
        // TODO: Show error message to user
      } finally {
        setTranslating(false);
      }
    } else if (action === 'semantic-analysis') {
      try {
        setAnalyzing(true);
        setAnalysisResults([]);

        // Fetch thread messages
        const threadResponse = await fetch(`/api/gmail/threads/${selectedThread.id}`);
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread messages');
        }
        
        const threadData = await threadResponse.json();
        const messages = threadData.messages || [];
        
        console.log(`Analyzing ${messages.length} message(s) in thread...`);
        
        // Translate and analyze each message in order
        const results: AnalyzeResponse[] = [];
        for (const message of messages) {
          // Extract text from message body
          const messageText = message.body?.text || message.snippet || '';
          const subject = message.subject || '';
          
          // First translate to ensure it's in English
          const translateResult = await translateEmail(subject, messageText);
          
          // Use translated text if available, otherwise use original
          const englishSubject = translateResult.subject_translated || subject;
          const englishMessage = translateResult.message_translated || messageText;
          
          // Combine subject and message as the API expects
          const combinedMessage = `Subject: ${englishSubject}\n\n${englishMessage}`;
          
          // Call analyze API with combined English message
          const result = await analyzeEmail(combinedMessage);
          results.push(result);
          
          // Update UI progressively
          setAnalysisResults([...results]);
        }
        
        console.log('Analysis completed:', results);
      } catch (error) {
        console.error('Analysis error:', error);
        // TODO: Show error message to user
      } finally {
        setAnalyzing(false);
      }
    } else if (action === 'summary') {
      try {
        setSummarizing(true);
        setSummaryResults([]);

        // Fetch thread messages
        const threadResponse = await fetch(`/api/gmail/threads/${selectedThread.id}`);
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread messages');
        }
        
        const threadData = await threadResponse.json();
        const messages = threadData.messages || [];
        
        console.log(`Summarizing ${messages.length} message(s) in thread...`);
        
        // Summarize each message in order
        // Note: Summary API handles translation internally, no need to translate first
        const results: SummaryResponse[] = [];
        for (const message of messages) {
          // Extract text from message body
          const messageText = message.body?.text || message.snippet || '';
          const subject = message.subject || '';
          
          // Combine subject and message as the API expects
          const combinedMessage = `Subject: ${subject}\n\n${messageText}`;
          
          // Call summary API (it handles translation internally)
          const result = await summarizeEmail(combinedMessage);
          results.push(result);
          
          // Update UI progressively
          setSummaryResults([...results]);
        }
        
        console.log('Summary completed:', results);
      } catch (error) {
        console.error('Summary error:', error);
        // TODO: Show error message to user
      } finally {
        setSummarizing(false);
      }
    } else if (action === 'task-detection') {
      try {
        setDetectingTasks(true);
        setTaskResults([]);

        // Fetch thread messages
        const threadResponse = await fetch(`/api/gmail/threads/${selectedThread.id}`);
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread messages');
        }
        
        const threadData = await threadResponse.json();
        const messages = threadData.messages || [];
        
        console.log(`Detecting tasks in ${messages.length} message(s)...`);
        
        // Detect tasks in each message
        // Note: Task detection API works best with English, may need translation for French
        const results: TaskDetectionResponse[] = [];
        for (const message of messages) {
          // Extract text from message body
          const messageText = message.body?.text || message.snippet || '';
          const subject = message.subject || '';
          
          // Combine subject and message as the API expects
          const combinedMessage = `Subject: ${subject}\n\n${messageText}`;
          
          // Call task detection API
          const result = await detectTasks(combinedMessage);
          
          // Only add if tasks were found
          if (result.has_tasks && result.tasks.length > 0) {
            results.push(result);
          }
          
          // Update UI progressively
          setTaskResults([...results]);
        }
        
        console.log('Task detection completed:', results);
      } catch (error) {
        console.error('Task detection error:', error);
        // TODO: Show error message to user
      } finally {
        setDetectingTasks(false);
      }
    } else if (action === 'auto-reply') {
      try {
        setGeneratingReply(true);
        setReplyResults([]);

        // Fetch thread messages
        const threadResponse = await fetch(`/api/gmail/threads/${selectedThread.id}`);
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread messages');
        }
        
        const threadData = await threadResponse.json();
        const messages = threadData.messages || [];
        
        console.log(`Generating auto-reply for ${messages.length} message(s)...`);
        
        // Generate reply for each message
        // Note: Auto-reply API handles translation internally
        const results: AutoReplyResponse[] = [];
        for (const message of messages) {
          // Extract text from message body
          const messageText = message.body?.text || message.snippet || '';
          const subject = message.subject || '';
          
          // Combine subject and message as the API expects
          const combinedMessage = `Subject: ${subject}\n\n${messageText}`;
          
          // Call auto-reply API (it handles translation internally)
          const result = await generateAutoReply(combinedMessage);
          results.push(result);
          
          // Update UI progressively
          setReplyResults([...results]);
        }
        
        console.log('Auto-reply generation completed:', results);
      } catch (error) {
        console.error('Auto-reply error:', error);
        // TODO: Show error message to user
      } finally {
        setGeneratingReply(false);
      }
    } else {
      // TODO: Implement other actions
      console.log('Quick action clicked:', action);
    }
  };
  
  const handleDownloadTasks = () => {
    // Combine all tasks from all messages
    const allTasks = taskResults.flatMap(result => result.tasks);
    
    if (allTasks.length === 0) {
      console.warn('No tasks to download');
      return;
    }
    
    // Convert to CSV
    const csvContent = convertTasksToCSV(allTasks);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `tasks_${selectedThread?.id || 'export'}_${timestamp}.csv`;
    
    // Download
    downloadCSV(csvContent, filename);
    
    console.log(`Downloaded ${allTasks.length} tasks to ${filename}`);
  };

  useEffect(() => {
    const el = document.getElementById("chatbotOffcanvas");
    if (!el) return;
    const onShow = () => {
      document.documentElement.setAttribute("data-chatbot-open", "true");
      setIsOpen(true);
    };
    const onHidden = () => {
      document.documentElement.removeAttribute("data-chatbot-open");
      setIsOpen(false);
    };
    el.addEventListener("show.bs.offcanvas", onShow);
    el.addEventListener("hidden.bs.offcanvas", onHidden);
    return () => {
      el.removeEventListener("show.bs.offcanvas", onShow);
      el.removeEventListener("hidden.bs.offcanvas", onHidden);
    };
  }, [setIsOpen]);

  return (
    <div
      className="offcanvas offcanvas-end"
      tabIndex={-1}
      id="chatbotOffcanvas"
      aria-labelledby="chatbotOffcanvasLabel"
      data-bs-scroll="true"
      data-bs-backdrop="false"
      style={{ width: "var(--chatbot-width)" }}
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="chatbotOffcanvasLabel">SmartMail Chatbot</h5>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>

      {/* Focus Mode Selector */}
      <FocusModeSelector value={focusMode} onChange={setFocusMode} />

      {/* Attachment Selector - Only show when Attachments Only mode is selected and in a thread */}
      {focusMode === 'attachment-only' && selectedThread && (
        <div className="border-bottom p-3">
          <label className="form-label small fw-semibold mb-2">Select Attachment</label>
          {processedAttachments.length === 0 ? (
            <div className="alert alert-warning mb-0">
              <small>No attachments available or still processing...</small>
            </div>
          ) : (
            <>
              <select 
                className="form-select form-select-sm"
                value={selectedAttachment}
                onChange={(e) => setSelectedAttachment(e.target.value)}
              >
                <option value="">Choose an attachment...</option>
                {processedAttachments.map((att) => (
                  <option 
                    key={`${att.messageId}-${att.attachmentId}`} 
                    value={`${att.messageId}-${att.attachmentId}`}
                  >
                    📎 {att.filename} ({att.metadata.size_kb.toFixed(1)} KB)
                  </option>
                ))}
              </select>
              
              {selectedAttachment && (
                <div className="mt-2">
                  <small className="text-success">
                    <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    Attachment selected - Use the message input below to ask questions
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="offcanvas-body p-0 d-flex flex-column" style={{ height: 'calc(100% - 140px)' }}>
        <div className="p-3 flex-grow-1 overflow-auto d-flex flex-column">
          {/* Spacer to push content to bottom */}
          <div className="flex-grow-1"></div>
          
          {translationResults.length === 0 && analysisResults.length === 0 && summaryResults.length === 0 && taskResults.length === 0 && replyResults.length === 0 && ragAnswers.length === 0 && !translating && !analyzing && !summarizing && !detectingTasks && !generatingReply && !askingQuestion && (
            <div className="text-body-secondary small mb-3">Say hello to get started.</div>
          )}
          
          {/* Translation loading state */}
          {translating && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Translating...</span>
                </div>
                Translating {translationResults.length > 0 ? `message ${translationResults.length + 1}` : 'email'}...
              </div>
            </div>
          )}
          
          {/* Analysis loading state */}
          {analyzing && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Analyzing...</span>
                </div>
                Analyzing {analysisResults.length > 0 ? `message ${analysisResults.length + 1}` : 'email'}...
              </div>
            </div>
          )}
          
          {/* Summary loading state */}
          {summarizing && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Summarizing...</span>
                </div>
                Summarizing {summaryResults.length > 0 ? `message ${summaryResults.length + 1}` : 'email'}...
              </div>
            </div>
          )}
          
          {/* Task detection loading state */}
          {detectingTasks && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Detecting tasks...</span>
                </div>
                Detecting tasks in {taskResults.length > 0 ? `message ${taskResults.length + 1}` : 'email'}...
              </div>
            </div>
          )}
          
          {/* Auto-reply loading state */}
          {generatingReply && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Generating reply...</span>
                </div>
                Generating reply for {replyResults.length > 0 ? `message ${replyResults.length + 1}` : 'email'}...
              </div>
            </div>
          )}
          
          {/* RAG question loading state */}
          {askingQuestion && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Processing question...</span>
                </div>
                Analyzing document and generating answer...
              </div>
            </div>
          )}
          
          {/* Translation results */}
          {translationResults.length > 0 && (
            <div className="d-flex flex-column gap-3">
              {translationResults.map((result, index) => (
                <div key={index}>
                  {result.subject_translated ? (
                    <div className="card">
                      <div className="card-header bg-light">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="small text-body-secondary">
                            {translationResults.length > 1 && <span className="badge bg-secondary me-2">{index + 1}</span>}
                            Translated from {result.detected_language}
                          </div>
                          {index === translationResults.length - 1 && !translating && (
                            <button 
                              type="button" 
                              className="btn-close btn-close-sm" 
                              onClick={() => setTranslationResults([])}
                              aria-label="Close"
                            />
                          )}
                        </div>
                      </div>
                      <div className="card-body">
                        <h6 className="card-title mb-3">{result.subject_translated}</h6>
                        <div className="card-text" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {result.message_translated}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info d-flex justify-content-between align-items-center">
                      <span>
                        {translationResults.length > 1 && <span className="badge bg-secondary me-2">{index + 1}</span>}
                        This email is already in English.
                      </span>
                      {index === translationResults.length - 1 && !translating && (
                        <button 
                          type="button" 
                          className="btn-close btn-close-sm" 
                          onClick={() => setTranslationResults([])}
                          aria-label="Close"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Analysis results */}
          {analysisResults.length > 0 && (
            <div className="d-flex flex-column gap-3 mt-3">
              {analysisResults.map((result, index) => (
                <div key={index} className="card">
                  <div className="card-header bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="small fw-semibold">
                        {analysisResults.length > 1 && <span className="badge bg-secondary me-2">{index + 1}</span>}
                        Semantic Analysis
                      </div>
                      {index === analysisResults.length - 1 && !analyzing && (
                        <button 
                          type="button" 
                          className="btn-close btn-close-sm" 
                          onClick={() => setAnalysisResults([])}
                          aria-label="Close"
                        />
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <h6 className="text-muted small mb-1">Main Subject</h6>
                      <p className="mb-0">{result.main_subject}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-muted small mb-1">Summary</h6>
                      <p className="mb-0">{result.short_summary}</p>
                    </div>
                    
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                      <span className="badge bg-primary">{result.email_type}</span>
                      <span className={`badge ${result.sentiment === 'Positive' ? 'bg-success' : result.sentiment === 'Negative' ? 'bg-danger' : 'bg-secondary'}`}>
                        {result.sentiment}
                      </span>
                      {result.urgency.is_urgent && (
                        <span className="badge bg-warning text-dark">Urgent</span>
                      )}
                    </div>
                    
                    {result.urgency.is_urgent && (
                      <div className="mb-3">
                        <h6 className="text-muted small mb-1">Urgency Justification</h6>
                        <p className="mb-0 small">{result.urgency.justification}</p>
                      </div>
                    )}
                    
                    {result.participants.length > 0 && (
                      <div className="mb-0">
                        <h6 className="text-muted small mb-1">Participants</h6>
                        <div className="d-flex gap-1 flex-wrap">
                          {result.participants.map((participant, i) => (
                            <span key={i} className="badge bg-light text-dark border">{participant}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Summary results */}
          {summaryResults.length > 0 && (
            <div className="d-flex flex-column gap-3 mt-3">
              {summaryResults.map((result, index) => (
                <div key={index} className="card">
                  <div className="card-header bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="small fw-semibold">
                        {summaryResults.length > 1 && <span className="badge bg-secondary me-2">{index + 1}</span>}
                        Summary
                        {result.was_translated && (
                          <span className="badge bg-info ms-2">Translated from {result.detected_language}</span>
                        )}
                      </div>
                      {index === summaryResults.length - 1 && !summarizing && (
                        <button 
                          type="button" 
                          className="btn-close btn-close-sm" 
                          onClick={() => setSummaryResults([])}
                          aria-label="Close"
                        />
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <h6 className="text-muted small mb-2">Overview</h6>
                      <p className="mb-0">{result.summary}</p>
                    </div>
                    
                    {result.key_points.length > 0 && (
                      <div className="mb-0">
                        <h6 className="text-muted small mb-2">Key Points</h6>
                        <ul className="mb-0 ps-3">
                          {result.key_points.map((point, i) => (
                            <li key={i} className="mb-1">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Task detection results */}
          {taskResults.length > 0 && (
            <div className="mt-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="mb-0 fw-semibold">
                  <span className="badge bg-success me-2">{taskResults.reduce((sum, r) => sum + r.task_count, 0)}</span>
                  Tasks Detected
                </h6>
                {!detectingTasks && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-primary"
                    onClick={handleDownloadTasks}
                  >
                    <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                    Download CSV
                  </button>
                )}
              </div>
              
              <div className="d-flex flex-column gap-3">
                {taskResults.map((result, msgIndex) => (
                  <div key={msgIndex}>
                    {taskResults.length > 1 && (
                      <div className="small text-muted mb-2">
                        <span className="badge bg-secondary">{msgIndex + 1}</span> Message {msgIndex + 1}
                      </div>
                    )}
                    {result.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="card mb-2">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-start justify-content-between mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{task.task_description}</h6>
                            </div>
                            <span className={`badge ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <div className="d-flex gap-3 small text-muted">
                            {task.assignee && (
                              <div>
                                <strong>Assignee:</strong> {task.assignee}
                              </div>
                            )}
                            {task.deadline && (
                              <div>
                                <strong>Deadline:</strong> {task.deadline}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              {!detectingTasks && (
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary mt-2 w-100"
                  onClick={() => setTaskResults([])}
                >
                  Clear Tasks
                </button>
              )}
            </div>
          )}
          
          {/* Auto-reply results */}
          {replyResults.length > 0 && (
            <div className="d-flex flex-column gap-3 mt-3">
              {replyResults.map((result, index) => (
                <div key={index} className="card">
                  <div className="card-header bg-light">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="small fw-semibold">
                        {replyResults.length > 1 && <span className="badge bg-secondary me-2">{index + 1}</span>}
                        Auto-Reply
                        {result.was_translated && (
                          <span className="badge bg-info ms-2">Translated from {result.detected_language}</span>
                        )}
                        <span className={`badge ms-2 ${result.tone === 'Professional' ? 'bg-primary' : result.tone === 'Formal' ? 'bg-secondary' : 'bg-success'}`}>
                          {result.tone}
                        </span>
                      </div>
                      {index === replyResults.length - 1 && !generatingReply && (
                        <button 
                          type="button" 
                          className="btn-close btn-close-sm" 
                          onClick={() => setReplyResults([])}
                          aria-label="Close"
                        />
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="border rounded p-3 bg-white">
                      <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                        {result.reply}
                      </pre>
                    </div>
                    
                    {!generatingReply && index === replyResults.length - 1 && (
                      <div className="mt-3 d-flex gap-2">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            navigator.clipboard.writeText(result.reply);
                            // TODO: Show toast notification
                            console.log('Reply copied to clipboard');
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                          </svg>
                          Copy Reply
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            console.log('Edit reply');
                          }}
                        >
                          <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                          </svg>
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* RAG Answer Results */}
          {ragAnswers.length > 0 && (
            <div className="d-flex flex-column gap-3 mt-3">
              {ragAnswers.map((result, index) => {
                const attachment = processedAttachments.find(
                  att => `${att.messageId}-${att.attachmentId}` === selectedAttachment
                );
                
                return (
                  <div key={index} className="card">
                    <div className="card-header bg-light">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="small fw-semibold">
                          {ragAnswers.length > 1 && <span className="badge bg-secondary me-2">{index + 1}</span>}
                          Document Answer
                          <span className="badge bg-success ms-2">
                            <svg width="12" height="12" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
                            </svg>
                            {attachment?.filename || 'Document'}
                          </span>
                          {result.generation_time_seconds && (
                            <span className="badge bg-info ms-2">{result.generation_time_seconds.toFixed(2)}s</span>
                          )}
                        </div>
                        {index === ragAnswers.length - 1 && !askingQuestion && (
                          <button 
                            type="button" 
                            className="btn-close btn-close-sm" 
                            onClick={() => setRagAnswers([])}
                            aria-label="Close"
                          />
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      {/* Question Asked */}
                      <div className="mb-3">
                        <div className="small text-body-secondary mb-1">Question:</div>
                        <div className="fw-semibold">{result.question || 'N/A'}</div>
                      </div>
                      
                      {/* Answer */}
                      <div className="mb-3">
                        <div className="small text-body-secondary mb-1">Answer:</div>
                        <div className="border rounded p-3 bg-white">
                          <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                            {result.answer}
                          </pre>
                        </div>
                      </div>
                      
                      {/* Context Chunks */}
                      {result.context_chunks && result.context_chunks.length > 0 && (
                        <details className="mb-3">
                          <summary className="small text-body-secondary" style={{ cursor: 'pointer' }}>
                            <strong>Relevant Context</strong> ({result.context_chunks.length} sections found)
                          </summary>
                          <div className="mt-2 d-flex flex-column gap-2">
                            {result.context_chunks.map((chunk, chunkIndex) => (
                              <div key={chunkIndex} className="border rounded p-2 bg-light">
                                <div className="small text-muted mb-1">Section {chunkIndex + 1}:</div>
                                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                                  {chunk}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                      
                      {/* Action Buttons */}
                      {!askingQuestion && index === ragAnswers.length - 1 && (
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              navigator.clipboard.writeText(result.answer);
                              console.log('Answer copied to clipboard');
                            }}
                          >
                            <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                            Copy Answer
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setMessage('');
                              // Focus on the message input
                              document.querySelector<HTMLInputElement>('input[placeholder*="message"]')?.focus();
                            }}
                          >
                            <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                            </svg>
                            Ask Another
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Chat transcript area (placeholder) */}
          <div className="mt-3 d-flex flex-column gap-2">
            {/* Future chat messages will go here */}
          </div>
          
          {/* Invisible div for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Actions - shown when thread selected and text-only mode */}
        <QuickActions focusMode={focusMode} onActionClick={handleQuickAction} />
        
        {/* Selected Thread Tag - appears above input */}
        <SelectedThreadTag />
        
        <div className="border-top p-2">
          <form className="input-group" onSubmit={(e) => {
            e.preventDefault();
            if (message.trim() && selectedAttachment && focusMode === 'attachment-only') {
              handleAskQuestion();
            }
          }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder={selectedAttachment && focusMode === 'attachment-only' ? "Ask a question about the attachment..." : "Type a message…"}
              aria-label="Chat message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={askingQuestion}
            />
            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={!message.trim() || (focusMode === 'attachment-only' && !selectedAttachment) || askingQuestion}
            >
              {askingQuestion ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Asking...
                </>
              ) : (
                'Send'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
