import React, { useState } from 'react';
import { Mail, Paperclip, ExternalLink, Forward, Star, Clock, Inbox as InboxIcon, ShieldAlert, X, Send, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

// Initial inbox with clearly risky vs safe emails
const INITIAL_EMAILS = [
    {
        id: 1,
        sender: "security@bankofamerica-secure.net",
        senderName: "Bank of America Security",
        subject: "URGENT: Your account has been compromised!",
        body: "Dear Customer,\n\nWe have detected suspicious activity on your account. Click the link below immediately to verify your identity.\n\nFailure to verify within 24 hours will result in permanent account suspension.\n\nVerify Now: https://bankofamerica-secure.net/verify-account",
        links: ["https://bankofamerica-secure.net/verify-account"],
        files: [],
        time: "10:23 AM",
        isRead: false,
    },
    {
        id: 2,
        sender: "john.smith@company.com",
        senderName: "John Smith",
        subject: "Q4 Report - Final Version",
        body: "Hi team,\n\nPlease find attached the final Q4 report. Let me know if you have any questions.\n\nBest,\nJohn",
        links: [],
        files: [{ name: "Q4_Report_Final.pdf", type: "application/pdf", size: 2048576 }],
        time: "9:45 AM",
        isRead: true,
    },
    {
        id: 3,
        sender: "support@paypa1-security.com",
        senderName: "PayPal Support",
        subject: "Your PayPal account is limited",
        body: "Dear PayPal User,\n\nWe've noticed unusual activity. Click here to restore access: https://paypa1-security.com/restore\n\nPayPal Security Team",
        links: ["https://paypa1-security.com/restore"],
        files: [],
        time: "Yesterday",
        isRead: false,
    },
    {
        id: 4,
        sender: "newsletter@techcrunch.com",
        senderName: "TechCrunch Daily",
        subject: "Today's top tech news",
        body: "Good morning!\n\nHere's your daily tech roundup:\n\n1. AI breakthrough in medical diagnosis\n2. New smartphone launches this week\n\nRead more: https://techcrunch.com/daily",
        links: ["https://techcrunch.com/daily"],
        files: [],
        time: "8:00 AM",
        isRead: true,
    },
];

const EmailApp = ({ onAnalyzeAction, riskyEmails = new Set() }) => {
    const [emails, setEmails] = useState(INITIAL_EMAILS);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [analyzingItems, setAnalyzingItems] = useState(new Set());
    const [showCompose, setShowCompose] = useState(false);
    const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
    const [isSending, setIsSending] = useState(false);

    const handleOpenLink = async (email, link) => {
        setAnalyzingItems(prev => new Set([...prev, `link-${email.id}-${link}`]));

        await onAnalyzeAction({
            channel: 'EMAIL',
            action: 'OPEN_LINK',
            sender: email.sender,
            subject: email.subject,
            body: email.body,
            links: [link],
            files: email.files,
            metadata: { timestamp: new Date().toISOString() }
        }, email.id, 'email');

        setAnalyzingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`link-${email.id}-${link}`);
            return newSet;
        });
    };

    const handleOpenFile = async (email, file) => {
        setAnalyzingItems(prev => new Set([...prev, `file-${email.id}-${file.name}`]));

        await onAnalyzeAction({
            channel: 'EMAIL',
            action: 'OPEN_FILE',
            sender: email.sender,
            subject: email.subject,
            body: email.body,
            links: email.links,
            files: [file],
            metadata: { timestamp: new Date().toISOString() }
        }, email.id, 'email');

        setAnalyzingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`file-${email.id}-${file.name}`);
            return newSet;
        });
    };

    const handleForward = async (email) => {
        setAnalyzingItems(prev => new Set([...prev, `forward-${email.id}`]));

        await onAnalyzeAction({
            channel: 'EMAIL',
            action: 'FORWARD',
            sender: email.sender,
            subject: email.subject,
            body: email.body,
            links: email.links,
            files: email.files,
            metadata: { timestamp: new Date().toISOString() }
        }, email.id, 'email');

        setAnalyzingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`forward-${email.id}`);
            return newSet;
        });
    };

    // Extract links from email body
    const extractLinks = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    };

    const handleSendEmail = async () => {
        if (!composeData.to || !composeData.body) return;

        const links = extractLinks(composeData.body);
        setIsSending(true);

        // Analyze the email being sent
        const result = await onAnalyzeAction({
            channel: 'EMAIL',
            action: 'SEND_EMAIL',
            sender: 'you@company.com',
            subject: composeData.subject,
            body: composeData.body,
            links: links,
            files: [],
            metadata: {
                recipient: composeData.to,
                timestamp: new Date().toISOString()
            }
        }, null, null);

        setIsSending(false);

        if (result.allowed) {
            // Add to sent and close
            const newEmail = {
                id: Date.now(),
                sender: 'you@company.com',
                senderName: 'You',
                subject: composeData.subject || '(No Subject)',
                body: composeData.body,
                links: links,
                files: [],
                time: 'Just now',
                isRead: true,
                isSent: true,
            };
            setEmails(prev => [newEmail, ...prev]);
            setComposeData({ to: '', subject: '', body: '' });
            setShowCompose(false);
        }
    };

    const isEmailRisky = (emailId) => riskyEmails.has(emailId);

    return (
        <div className="bg-white h-full flex flex-col overflow-hidden relative">
            {/* Search Header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0">
                <div className="flex-1 max-w-2xl bg-[#f0f4f8] h-11 rounded-full flex items-center px-6">
                    <span className="text-gray-500 text-sm">Search in mail</span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">V</div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Email Sidebar */}
                <div className="w-60 p-4 hidden md:block border-r border-gray-100">
                    <button
                        onClick={() => setShowCompose(true)}
                        className="flex items-center gap-3 bg-[#c2e7ff] hover:shadow-md text-[#001d35] px-6 py-4 rounded-2xl font-semibold mb-6 transition-all w-full"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Compose</span>
                    </button>

                    <div className="space-y-1">
                        <div className="px-6 py-2 rounded-r-full bg-[#d3e3fd] text-[#001d35] font-bold text-sm flex justify-between items-center cursor-pointer">
                            <div className="flex items-center gap-3">
                                <InboxIcon className="w-4 h-4" />
                                <span>Inbox</span>
                            </div>
                            <span className="text-xs">{emails.filter(e => !e.isRead).length}</span>
                        </div>
                        <div className="px-6 py-2 rounded-r-full text-gray-600 text-sm font-medium hover:bg-gray-100 cursor-pointer flex items-center gap-3">
                            <Star className="w-4 h-4" />
                            Starred
                        </div>
                        <div className="px-6 py-2 rounded-r-full text-gray-600 text-sm font-medium hover:bg-gray-100 cursor-pointer flex items-center gap-3">
                            <Send className="w-4 h-4" />
                            Sent
                        </div>
                    </div>
                </div>

                {/* Email List & Detail View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Email List */}
                    <div className={cn(
                        "border-r border-gray-100 overflow-y-auto",
                        selectedEmail ? "w-80 hidden md:block" : "flex-1"
                    )}>
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={cn(
                                    "flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50",
                                    !email.isRead && "bg-blue-50/50",
                                    selectedEmail?.id === email.id && "bg-blue-100",
                                    isEmailRisky(email.id) && "risky-item"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0",
                                    isEmailRisky(email.id)
                                        ? "bg-red-500"
                                        : email.isSent
                                            ? "bg-green-500"
                                            : "bg-gradient-to-br from-blue-400 to-purple-500"
                                )}>
                                    {isEmailRisky(email.id) ? (
                                        <ShieldAlert className="w-5 h-5" />
                                    ) : (
                                        email.senderName.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={cn("text-sm truncate", !email.isRead && "font-semibold")}>
                                                {email.senderName}
                                            </span>
                                            {isEmailRisky(email.id) && (
                                                <span className="risky-badge">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    Risky
                                                </span>
                                            )}
                                            {email.isSent && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                                    SENT
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 shrink-0">{email.time}</span>
                                    </div>
                                    <div className={cn("text-sm truncate", !email.isRead ? "text-gray-900" : "text-gray-600")}>
                                        {email.subject}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                        {email.body.substring(0, 50)}...
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Email Detail */}
                    {selectedEmail && (
                        <div className={cn(
                            "flex-1 overflow-y-auto p-6",
                            isEmailRisky(selectedEmail.id) && "bg-red-50/30"
                        )}>
                            <div className="max-w-3xl">
                                {/* Risky Banner */}
                                {isEmailRisky(selectedEmail.id) && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3">
                                        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                                        <div>
                                            <div className="font-medium text-red-800 text-sm">This email has been flagged as potentially risky</div>
                                            <div className="text-xs text-red-600">Guardian detected suspicious content. Proceed with caution.</div>
                                        </div>
                                    </div>
                                )}

                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-normal text-gray-900 mb-2">{selectedEmail.subject}</h2>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                                                isEmailRisky(selectedEmail.id) ? "bg-red-500" : "bg-gradient-to-br from-blue-400 to-purple-500"
                                            )}>
                                                {selectedEmail.senderName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{selectedEmail.senderName}</div>
                                                <div className="text-xs text-gray-500">{selectedEmail.sender}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-500">{selectedEmail.time}</span>
                                </div>

                                {/* Body */}
                                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                                    {selectedEmail.body}
                                </div>

                                {/* Links Section */}
                                {selectedEmail.links.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Links in this message</h3>
                                        <div className="space-y-2">
                                            {selectedEmail.links.map((link, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                                                    <span className="text-sm text-blue-600 truncate flex-1">{link}</span>
                                                    <button
                                                        onClick={() => handleOpenLink(selectedEmail, link)}
                                                        disabled={analyzingItems.has(`link-${selectedEmail.id}-${link}`)}
                                                        className={cn(
                                                            "px-4 py-1.5 text-white text-xs font-medium rounded-full transition-colors",
                                                            analyzingItems.has(`link-${selectedEmail.id}-${link}`)
                                                                ? "bg-gray-400 cursor-wait"
                                                                : "bg-[#0b57d0] hover:bg-[#0b57d0]/90"
                                                        )}
                                                    >
                                                        {analyzingItems.has(`link-${selectedEmail.id}-${link}`) ? "Scanning..." : "Open Link"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Files Section */}
                                {selectedEmail.files.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Attachments</h3>
                                        <div className="space-y-2">
                                            {selectedEmail.files.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <Paperclip className="w-4 h-4 text-gray-600 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-700 truncate">{file.name}</div>
                                                        <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenFile(selectedEmail, file)}
                                                        disabled={analyzingItems.has(`file-${selectedEmail.id}-${file.name}`)}
                                                        className={cn(
                                                            "px-4 py-1.5 text-white text-xs font-medium rounded-full transition-colors",
                                                            analyzingItems.has(`file-${selectedEmail.id}-${file.name}`)
                                                                ? "bg-gray-400 cursor-wait"
                                                                : "bg-[#0b57d0] hover:bg-[#0b57d0]/90"
                                                        )}
                                                    >
                                                        {analyzingItems.has(`file-${selectedEmail.id}-${file.name}`) ? "Scanning..." : "Open File"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleForward(selectedEmail)}
                                        disabled={analyzingItems.has(`forward-${selectedEmail.id}`)}
                                        className={cn(
                                            "flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-colors",
                                            analyzingItems.has(`forward-${selectedEmail.id}`)
                                                ? "bg-gray-300 text-gray-500 cursor-wait"
                                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        )}
                                    >
                                        <Forward className="w-4 h-4" />
                                        {analyzingItems.has(`forward-${selectedEmail.id}`) ? "Scanning..." : "Forward"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!selectedEmail && (
                        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Select an email to view</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <div className="absolute bottom-4 right-4 w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="bg-[#f2f6fc] px-4 py-3 flex items-center justify-between">
                        <span className="font-medium text-gray-700 text-sm">New Message</span>
                        <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-gray-200 rounded">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        <input
                            type="email"
                            placeholder="To"
                            value={composeData.to}
                            onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                            className="w-full px-3 py-2 border-b border-gray-100 outline-none text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Subject"
                            value={composeData.subject}
                            onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full px-3 py-2 border-b border-gray-100 outline-none text-sm"
                        />
                        <textarea
                            placeholder="Compose your email... (try including a suspicious link like https://g00gle-security.net/verify)"
                            value={composeData.body}
                            onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                            rows={6}
                            className="w-full px-3 py-2 outline-none text-sm resize-none"
                        />
                    </div>

                    <div className="px-4 py-3 border-t flex justify-between items-center">
                        <button
                            onClick={handleSendEmail}
                            disabled={isSending || !composeData.to || !composeData.body}
                            className={cn(
                                "px-6 py-2 text-white text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                                isSending ? "bg-gray-400 cursor-wait" : "bg-[#0b57d0] hover:bg-[#0b57d0]/90"
                            )}
                        >
                            <Send className="w-4 h-4" />
                            {isSending ? "Scanning..." : "Send"}
                        </button>
                        <span className="text-xs text-gray-400">Messages with links are scanned</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailApp;
