import React, { useState } from 'react';
import { MessageSquare, ExternalLink, Paperclip, Forward, MoreVertical, Send, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Simulated chat messages with mix of safe and risky content
const INITIAL_MESSAGES = [
    {
        id: 1,
        sender: "Alice Chen",
        avatar: "A",
        time: "10:30 AM",
        body: "Hey! Check out this article I found about the new project guidelines.",
        links: ["https://company-wiki.internal/project-guidelines"],
        files: [],
        isOwn: false,
    },
    {
        id: 2,
        sender: "You",
        avatar: "V",
        time: "10:32 AM",
        body: "Thanks! I'll take a look.",
        links: [],
        files: [],
        isOwn: true,
    },
    {
        id: 3,
        sender: "Bob Martinez",
        avatar: "B",
        time: "10:45 AM",
        body: "URGENT: The IT department needs everyone to verify their credentials immediately. Click here to update your password before your account is locked: https://it-helpdesk-verify.net/login",
        links: ["https://it-helpdesk-verify.net/login"],
        files: [],
        isOwn: false,
    },
    {
        id: 4,
        sender: "Sarah Johnson",
        avatar: "S",
        time: "11:00 AM",
        body: "Here are the meeting notes from yesterday's standup. Let me know if I missed anything.",
        links: [],
        files: [{ name: "standup_notes_feb4.docx", type: "application/docx", size: 25600 }],
        isOwn: false,
    },
    {
        id: 5,
        sender: "Mike Wilson",
        avatar: "M",
        time: "11:15 AM",
        body: "Found this cool tool that bypasses the company firewall. Download it here and you can access any website!\n\nhttps://free-vpn-download.xyz/installer.exe",
        links: ["https://free-vpn-download.xyz/installer.exe"],
        files: [],
        isOwn: false,
    },
    {
        id: 6,
        sender: "David Lee",
        avatar: "D",
        time: "11:30 AM",
        body: "Sharing the Q4 budget spreadsheet as requested. Password protected - I'll send the password separately.",
        links: [],
        files: [{ name: "Q4_Budget_2024.xlsx", type: "application/xlsx", size: 102400 }],
        isOwn: false,
    },
];

// Helper to extract links from text
const extractLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
};

const ChatApp = ({ onAnalyzeAction, onSendMessage, riskyMessages = new Set() }) => {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [messageInput, setMessageInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [analyzingItems, setAnalyzingItems] = useState(new Set());

    const handleOpenLink = async (message, link) => {
        setAnalyzingItems(prev => new Set([...prev, `link-${message.id}-${link}`]));

        await onAnalyzeAction({
            channel: 'CHAT',
            action: 'OPEN_LINK',
            sender: message.sender,
            subject: null,
            body: message.body,
            links: [link],
            files: message.files,
            metadata: { timestamp: new Date().toISOString() }
        }, message.id, 'message');

        setAnalyzingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`link-${message.id}-${link}`);
            return newSet;
        });
    };

    const handleOpenFile = async (message, file) => {
        setAnalyzingItems(prev => new Set([...prev, `file-${message.id}-${file.name}`]));

        await onAnalyzeAction({
            channel: 'CHAT',
            action: 'OPEN_FILE',
            sender: message.sender,
            subject: null,
            body: message.body,
            links: message.links,
            files: [file],
            metadata: { timestamp: new Date().toISOString() }
        }, message.id, 'message');

        setAnalyzingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`file-${message.id}-${file.name}`);
            return newSet;
        });
    };

    const handleForward = async (message) => {
        setAnalyzingItems(prev => new Set([...prev, `forward-${message.id}`]));

        await onAnalyzeAction({
            channel: 'CHAT',
            action: 'FORWARD',
            sender: message.sender,
            subject: null,
            body: message.body,
            links: message.links,
            files: message.files,
            metadata: { timestamp: new Date().toISOString() }
        }, message.id, 'message');

        setAnalyzingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`forward-${message.id}`);
            return newSet;
        });
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        const links = extractLinks(messageInput);

        // If message contains links, analyze before sending
        if (links.length > 0) {
            setIsSending(true);
            const allowed = await onSendMessage(messageInput, links, []);
            setIsSending(false);

            if (!allowed) {
                // Message blocked - don't send
                return;
            }
        }

        // Message is safe - add to chat
        const newMessage = {
            id: Date.now(),
            sender: "You",
            avatar: "V",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            body: messageInput,
            links: links,
            files: [],
            isOwn: true,
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isMessageRisky = (msgId) => riskyMessages.has(msgId);

    return (
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-medium">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">Engineering Team</div>
                        <div className="text-xs text-gray-500">12 members • 4 online</div>
                    </div>
                </div>
                <div className="ml-auto">
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-[#f8f9fa]">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex gap-3",
                            message.isOwn && "flex-row-reverse"
                        )}
                    >
                        {/* Avatar */}
                        {!message.isOwn && (
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0",
                                isMessageRisky(message.id)
                                    ? "bg-red-500"
                                    : "bg-gradient-to-br from-blue-400 to-purple-500"
                            )}>
                                {isMessageRisky(message.id) ? (
                                    <ShieldAlert className="w-4 h-4" />
                                ) : (
                                    message.avatar
                                )}
                            </div>
                        )}

                        {/* Message Content */}
                        <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-3",
                            message.isOwn
                                ? "bg-[#0b57d0] text-white rounded-br-md"
                                : isMessageRisky(message.id)
                                    ? "bg-red-50 border-2 border-red-200 rounded-bl-md"
                                    : "bg-white shadow-sm border border-gray-100 rounded-bl-md"
                        )}>
                            {/* Sender name + risky badge */}
                            {!message.isOwn && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-xs font-medium",
                                        isMessageRisky(message.id) ? "text-red-800" : "text-gray-900"
                                    )}>
                                        {message.sender}
                                    </span>
                                    {isMessageRisky(message.id) && (
                                        <span className="risky-badge">
                                            <ShieldAlert className="w-3 h-3" />
                                            Risky
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">{message.time}</span>
                                </div>
                            )}

                            {/* Message body */}
                            <p className={cn(
                                "text-sm whitespace-pre-wrap",
                                message.isOwn
                                    ? "text-white"
                                    : isMessageRisky(message.id)
                                        ? "text-red-900"
                                        : "text-gray-700"
                            )}>
                                {message.body}
                            </p>

                            {/* Links */}
                            {message.links.length > 0 && !message.isOwn && (
                                <div className="mt-3 space-y-2">
                                    {message.links.map((link, idx) => (
                                        <div key={idx} className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg",
                                            isMessageRisky(message.id) ? "bg-red-100" : "bg-gray-50"
                                        )}>
                                            <ExternalLink className={cn(
                                                "w-3.5 h-3.5 shrink-0",
                                                isMessageRisky(message.id) ? "text-red-600" : "text-blue-600"
                                            )} />
                                            <span className={cn(
                                                "text-xs truncate flex-1",
                                                isMessageRisky(message.id) ? "text-red-600" : "text-blue-600"
                                            )}>{link}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenLink(message, link);
                                                }}
                                                disabled={analyzingItems.has(`link-${message.id}-${link}`)}
                                                className={cn(
                                                    "px-3 py-1 text-white text-xs font-medium rounded-full transition-colors",
                                                    analyzingItems.has(`link-${message.id}-${link}`)
                                                        ? "bg-gray-400 cursor-wait"
                                                        : "bg-[#0b57d0] hover:bg-[#0b57d0]/90"
                                                )}
                                            >
                                                {analyzingItems.has(`link-${message.id}-${link}`) ? "..." : "Open"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Files */}
                            {message.files.length > 0 && !message.isOwn && (
                                <div className="mt-3 space-y-2">
                                    {message.files.map((file, idx) => (
                                        <div key={idx} className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg",
                                            isMessageRisky(message.id) ? "bg-red-100" : "bg-gray-50"
                                        )}>
                                            <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-700 truncate">{file.name}</div>
                                                <div className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenFile(message, file);
                                                }}
                                                disabled={analyzingItems.has(`file-${message.id}-${file.name}`)}
                                                className={cn(
                                                    "px-3 py-1 text-white text-xs font-medium rounded-full transition-colors",
                                                    analyzingItems.has(`file-${message.id}-${file.name}`)
                                                        ? "bg-gray-400 cursor-wait"
                                                        : "bg-[#0b57d0] hover:bg-[#0b57d0]/90"
                                                )}
                                            >
                                                {analyzingItems.has(`file-${message.id}-${file.name}`) ? "..." : "Open"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Forward action for non-own messages with content */}
                            {!message.isOwn && (message.links.length > 0 || message.files.length > 0) && (
                                <div className="mt-3 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleForward(message);
                                        }}
                                        disabled={analyzingItems.has(`forward-${message.id}`)}
                                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <Forward className="w-3.5 h-3.5" />
                                        {analyzingItems.has(`forward-${message.id}`) ? "Scanning..." : "Forward"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
                    <input
                        type="text"
                        placeholder="Type a message... (try pasting a suspicious link)"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                    />
                    <button
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={isSending}
                    >
                        <Paperclip className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={handleSendMessage}
                        disabled={isSending || !messageInput.trim()}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            isSending
                                ? "bg-gray-400 cursor-wait"
                                : "bg-[#0b57d0] hover:bg-[#0b57d0]/90"
                        )}
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                    {isSending ? "🔍 Guardian is scanning your message..." : "Messages with links are scanned before sending"}
                </p>
            </div>
        </div>
    );
};

export default ChatApp;
