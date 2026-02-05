import React, { useEffect } from 'react';
import { ShieldAlert, ShieldCheck, ShieldBan, X, Loader2, Info } from 'lucide-react';
import { cn } from '../lib/utils'; // Keep relative path assuming it's in components/../lib

const GuardianInterceptor = ({ isOpen, isLoading, analysis, onProceed, onCancel }) => {
    if (!isOpen) return null;

    const getStatusConfig = () => {
        if (isLoading) {
            return {
                color: "bg-blue-600",
                border: "border-blue-100",
                icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
                title: "Scanning message...",
                description: "Guardian is analyzing for security threats...",
            };
        }

        switch (analysis?.decision) {
            case 'BLOCK':
                return {
                    color: "bg-[#b3261e]",
                    border: "border-red-100",
                    icon: <ShieldBan className="w-8 h-8 text-[#b3261e]" />,
                    title: "Action Blocked",
                    description: "This action carries high risk and cannot be completed.",
                    canProceed: false,
                };
            case 'WARN':
                return {
                    color: "bg-[#e8eaed]", // Surface Container
                    textColor: "text-[#1f1f1f]",
                    border: "border-orange-100",
                    icon: <ShieldAlert className="w-8 h-8 text-orange-600" />,
                    title: "Risk Detected",
                    description: "Please review the potential risks before proceeding.",
                    canProceed: true,
                };
            case 'ALLOW':
            default:
                return {
                    color: "bg-[#e6f4ea]",
                    border: "border-green-100",
                    icon: <ShieldCheck className="w-8 h-8 text-green-700" />,
                    title: "Safe to Proceed",
                    description: "No significant risks found.",
                    canProceed: true,
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1f1f]/40 backdrop-blur-[2px] p-4 transition-all">
            <div className={cn("w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl overflow-hidden transform transition-all",
                isLoading ? "scale-[0.98]" : "scale-100"
            )}>

                {/* Header Section */}
                <div className="p-8 pb-4 flex flex-col items-center text-center">
                    <div className={cn("mb-6 p-4 rounded-full bg-gray-50")}>
                        {config.icon}
                    </div>
                    <h2 className="text-[22px] font-normal text-[#1f1f1f] mb-2 font-['Google_Sans']">{config.title}</h2>
                    <p className="text-[#444746] text-sm leading-relaxed max-w-xs">{config.description}</p>
                </div>

                {/* Content */}
                {!isLoading && analysis && (
                    <div className="px-8 pb-6 space-y-5">
                        {/* Score Indicator */}
                        {analysis.decision !== 'ALLOW' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-[#444746]">
                                    <span>Safety Score</span>
                                    <span>{analysis.risk_score}% Risk</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#f0f2f5] rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                                            analysis.risk_score > 70 ? "bg-[#b3261e]" :
                                                analysis.risk_score > 30 ? "bg-orange-500" : "bg-green-500"
                                        )}
                                        style={{ width: `${analysis.risk_score}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reasoning Card */}
                        <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#e0e2e7]">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-[#00639b] shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm text-[#1f1f1f] leading-6">{analysis.reasoning}</p>
                                    {analysis.suggestions && (
                                        <p className="text-sm text-[#00639b] font-medium pt-2">
                                            Suggestion: {analysis.suggestions}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 pt-2 flex gap-3 justify-end pb-8 px-8">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-sm font-medium text-[#00639b] hover:bg-[#00639b]/10 rounded-full transition-colors"
                    >
                        {analysis?.decision === 'ALLOW' ? 'Close' : 'Cancel'}
                    </button>

                    {!isLoading && config.canProceed && analysis?.decision !== 'ALLOW' && (
                        <button
                            onClick={onProceed}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-[#0b57d0] hover:bg-[#0b57d0]/90 rounded-full shadow-sm transition-all"
                        >
                            Proceed anyway
                        </button>
                    )}

                    {!isLoading && analysis?.decision === 'ALLOW' && (
                        <button
                            onClick={onProceed}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-[#0b57d0] hover:bg-[#0b57d0]/90 rounded-full shadow-sm transition-all"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardianInterceptor;
