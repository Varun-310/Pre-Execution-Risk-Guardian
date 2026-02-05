import React, { useEffect } from 'react';
import { ShieldAlert, ShieldBan, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Slide-in toast notification for risk alerts.
 * Appears from the bottom-right, auto-dismisses after a delay.
 */
const RiskToast = ({ isOpen, analysis, onClose, autoCloseMs = 6000 }) => {
    useEffect(() => {
        if (isOpen && analysis) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseMs);
            return () => clearTimeout(timer);
        }
    }, [isOpen, analysis, onClose, autoCloseMs]);

    if (!isOpen || !analysis) return null;

    const isBlock = analysis.decision === 'BLOCK';

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-50 max-w-md animate-slide-in-right",
            "bg-white rounded-2xl shadow-2xl border overflow-hidden",
            isBlock ? "border-red-200" : "border-orange-200"
        )}>
            {/* Header strip */}
            <div className={cn(
                "h-1.5 w-full",
                isBlock ? "bg-red-500" : "bg-orange-500"
            )} />

            <div className="p-4">
                {/* Title row */}
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "p-2 rounded-full shrink-0",
                        isBlock ? "bg-red-50" : "bg-orange-50"
                    )}>
                        {isBlock ? (
                            <ShieldBan className="w-5 h-5 text-red-600" />
                        ) : (
                            <ShieldAlert className="w-5 h-5 text-orange-600" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className={cn(
                                "font-medium text-sm",
                                isBlock ? "text-red-800" : "text-orange-800"
                            )}>
                                {isBlock ? "Content Blocked" : "Risk Detected"}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {analysis.reasoning}
                        </p>

                        {/* Risk factors */}
                        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {analysis.risk_factors.slice(0, 3).map((factor, idx) => (
                                    <span
                                        key={idx}
                                        className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                            isBlock ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                        )}
                                    >
                                        {factor}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Suggestion */}
                        {analysis.suggestions && (
                            <p className="text-xs text-blue-600 mt-2 font-medium">
                                💡 {analysis.suggestions}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskToast;
