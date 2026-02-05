import React, { useState } from 'react';
import axios from 'axios';
import { Mail, ShieldCheck, MessageSquare, Menu } from 'lucide-react';
import EmailApp from './components/SimulationApps/EmailApp';
import ChatApp from './components/SimulationApps/ChatApp';
import RiskToast from './components/RiskToast';
import { cn } from './lib/utils';

// Use environment variable for API URL, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [activeApp, setActiveApp] = useState('email');

  // Toast notification state
  const [toastState, setToastState] = useState({
    isOpen: false,
    analysis: null
  });

  // Track which items have been marked as risky
  const [riskyItems, setRiskyItems] = useState({
    emails: new Set(),  // email IDs
    messages: new Set() // message IDs
  });

  const handleAnalyzeAction = async (context, itemId, itemType) => {
    try {
      const response = await axios.post(`${API_URL}/api/analyze-message`, context);
      const analysis = response.data;

      if (analysis.decision === 'ALLOW') {
        // Safe - proceed silently
        console.log('Action approved by Guardian - proceeding silently');
        return { allowed: true, analysis };
      } else {
        // Risky - show toast and mark item
        setToastState({ isOpen: true, analysis });

        // Mark item as risky
        if (itemId && itemType) {
          setRiskyItems(prev => {
            const key = itemType === 'email' ? 'emails' : 'messages';
            const newSet = new Set(prev[key]);
            newSet.add(itemId);
            return { ...prev, [key]: newSet };
          });
        }

        return { allowed: false, analysis };
      }
    } catch (error) {
      console.error("Analysis failed", error);
      const fallbackAnalysis = {
        decision: "WARN",
        risk_score: 0,
        confidence: 0,
        risk_factors: ["Network Error"],
        reasoning: "Failed to connect to AI Guardian.",
        suggestions: "Check backend connection."
      };
      setToastState({ isOpen: true, analysis: fallbackAnalysis });
      return { allowed: false, analysis: fallbackAnalysis };
    }
  };

  // For chat sending - intercept before send
  const handleChatSend = async (messageContent, links, files) => {
    const context = {
      channel: 'CHAT',
      action: 'SEND_MESSAGE',
      sender: 'You',
      subject: null,
      body: messageContent,
      links: links,
      files: files,
      metadata: { timestamp: new Date().toISOString() }
    };

    const result = await handleAnalyzeAction(context, null, null);
    return result.allowed;
  };

  const closeToast = () => {
    setToastState({ isOpen: false, analysis: null });
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans text-[#1f1f1f]">
      {/* Navigation Rail */}
      <aside className="w-20 bg-[#f0f2f5] flex flex-col items-center py-4 z-20">
        <div className="p-4 mb-2">
          <Menu className="w-6 h-6 text-[#444746]" />
        </div>

        <nav className="flex flex-col gap-2 w-full px-3">
          <NavButton
            active={activeApp === 'email'}
            onClick={() => setActiveApp('email')}
            icon={<Mail className="w-6 h-6" />}
            label="Mail"
          />
          <NavButton
            active={activeApp === 'chat'}
            onClick={() => setActiveApp('chat')}
            icon={<MessageSquare className="w-6 h-6" />}
            label="Chat"
          />
        </nav>

        <div className="mt-auto mb-6 p-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white m-2 rounded-[28px] shadow-sm border border-gray-100">
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full w-full">
            {activeApp === 'email' && (
              <EmailApp
                onAnalyzeAction={handleAnalyzeAction}
                riskyEmails={riskyItems.emails}
              />
            )}
            {activeApp === 'chat' && (
              <ChatApp
                onAnalyzeAction={handleAnalyzeAction}
                onSendMessage={handleChatSend}
                riskyMessages={riskyItems.messages}
              />
            )}
          </div>
        </div>
      </main>

      {/* Risk Toast Notification */}
      <RiskToast
        isOpen={toastState.isOpen}
        analysis={toastState.analysis}
        onClose={closeToast}
      />
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex flex-col items-center justify-center p-1 py-3 rounded-full transition-all group gap-1",
      active ? "bg-[#c2e7ff] text-[#001d35]" : "text-[#444746] hover:bg-gray-200",
      disabled && "opacity-40 cursor-not-allowed"
    )}
  >
    <div className={cn("px-4 py-1 rounded-full transition-colors", active ? "bg-transparent" : "")}>
      {icon}
    </div>
    <span className="text-[11px] font-medium tracking-wide">
      {label}
    </span>
  </button>
);

export default App;
