
import React from 'react';
import { format } from 'date-fns';
import { GitCommit } from 'lucide-react';

interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    features?: string[];
    improvements?: string[];
    bugFixes?: string[];
}

interface ChangelogTimelineProps {
    entries: ChangelogEntry[];
}

const ChangelogTimeline: React.FC<ChangelogTimelineProps> = ({ entries }) => {
    return (
        <div className="relative pl-8 sm:pl-12 py-6">
            {entries.map((entry, index) => (
                <div key={index} className="mb-12 flex items-start relative">
                    {/* Icon */}
                    <div className="absolute left-0 sm:left-0 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-primary z-10 flex items-center justify-center">
                            <GitCommit className="w-3 h-3 text-primary-foreground" />
                        </div>
                    </div>

                    {/* Content Box */}
                    <div className="flex-1 ml-8 sm:ml-10 p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-semibold">
                                Version {entry.version}
                            </h2>
                            <span className="text-sm text-muted-foreground">
                                {format(new Date(entry.date), 'MMM dd, yyyy')}
                            </span>
                        </div>
                        <h3 className="text-xl font-medium text-primary mb-4">{entry.title}</h3>

                        {entry.features && entry.features.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-lg mb-2">New Features:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                    {entry.features.map((feature, i) => (
                                        <li key={i}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {entry.improvements && entry.improvements.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-lg mb-2">Improvements:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                    {entry.improvements.map((improvement, i) => (
                                        <li key={i}>{improvement}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {entry.bugFixes && entry.bugFixes.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-lg mb-2">Bug Fixes:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                    {entry.bugFixes.map((bug, i) => (
                                        <li key={i}>{bug}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChangelogTimeline;
