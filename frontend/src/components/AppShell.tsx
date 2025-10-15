"use client";

import BoostedScripts from "@/components/BoostedScripts";
import ThemeSwitcherFloating from "@/components/ThemeSwitcherFloating";
import Navbar from "@/components/Navbar";
import ChatbotSidebar from "@/components/chatbot/ChatbotSidebar";
import { ChatbotProvider } from "@/components/chatbot/ChatbotContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatbotProvider>
      <BoostedScripts />
      <Navbar />
      {/* Floating chatbot button above theme switcher */}
      <button
        type="button"
        className="btn btn-orange chatbot-toggle position-fixed end-0 me-3 z-3 rounded-circle shadow d-flex align-items-center justify-content-center"
        data-bs-toggle="offcanvas"
        data-bs-target="#chatbotOffcanvas"
        aria-controls="chatbotOffcanvas"
        title="Open chatbot"
        style={{ width: 64, height: 64, padding: 0, bottom: 88 }}
      >
        <img src="/icons/ai-chat.svg" alt="Chatbot" width={28} height={28} style={{ filter: "invert(1) brightness(1.2)" }} />
        <span className="visually-hidden">Open chatbot</span>
      </button>
      <ChatbotSidebar />
      <ThemeSwitcherFloating />
      <main className="container py-4">{children}</main>
    </ChatbotProvider>
  );
}
