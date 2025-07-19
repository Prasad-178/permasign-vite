import { useEffect } from 'react';
import ChangelogTimeline from '../components/ChangelogTimeline';

const changelogEntries = [
    {
        version: "0.8.0",
        date: "July 19, 2025",
        title: "Major UI/UX and Functionality Rehaul",
        features: [
            "Create templates with AI: Generate a complete set of roles and document types for your company by simply describing your use case.",
            "Secure document caching: Implemented secure client-side caching for documents to prevent re-fetching and improve performance.",
            "Document stitching: Signatures are now automatically stitched onto the document when you download a fully signed file.",
        ],
        improvements: [
            "Complete redesign of the user interface for a more intuitive and modern experience.",
            "Fixed numerous bugs related to modals and document previews.",
            "Refactored the navigation bar and home page for better clarity.",
            "Overhauled state management to eliminate page reloads on user operations."
        ]
    },
    {
        version: "0.7.1",
        date: "July 12, 2025",
        title: "Minor Fixes",
        bugFixes: [
            "Fixed a bug where the user's name would not display correctly in the navbar.",
            "Improved loading state visuals for a smoother experience."
        ]
    },
    {
        version: "0.7.0",
        date: "July 8, 2025",
        title: "Room Activity Logs",
        features: [
            "Added room logs to track all activities within a room, providing a comprehensive audit trail for all users.",
        ],
    },
    {
        version: "0.6.0",
        date: "July 5, 2025",
        title: "Security Page and Explanations",
        features: [
            "Launched a new security page with detailed explanations of PermaSign's security architecture.",
        ],
    },
    {
        version: "0.5.0",
        date: "June 25, 2025",
        title: "Company Space Templates",
        features: [
            "Introduced templates to create pre-configured company spaces with defined roles and permissions.",
        ],
    },
    {
        version: "0.4.0",
        date: "June 15, 2025",
        title: "Advanced Role and Member Management",
        features: [
            "Added a dedicated 'Members' tab for easier member management.",
            "Introduced a 'Settings' tab for room configuration.",
            "Implemented dynamic role management with the ability to create and assign custom roles.",
        ],
    },
    {
        version: "0.3.0",
        date: "May 6, 2025",
        title: "Backend Overhaul & Enhanced Security",
        improvements: [
            "Major improvements to backend stability and performance.",
            "Implemented more granular access control mechanisms for rooms.",
            "Developed a much more robust encryption mechanism for documents, enhancing security.",
        ],
        bugFixes: [
            "Resolved several concurrency issues on the backend."
        ]
    },
    {
        version: "0.2.0",
        date: "April 25, 2025",
        title: "Intelligent Document Management",
        features: [
            "Added document upload categories per role, allowing for more organized document management.",
            "Introduced a document timeline to easily view the history of signed documents.",
        ],
    },
    {
        version: "0.1.5",
        date: "April 22, 2025",
        title: "AI-Powered Document Interaction",
        features: [
            "Integrated RAG (Retrieval-Augmented Generation) to allow users to chat with and ask questions about their documents within a room.",
        ],
    },
    {
        version: "0.1.0",
        date: "April 15, 2025",
        title: "Official Open Beta Launch",
        improvements: [
            "PermaSign officially launched its open beta on Arlink.",
        ],
    },
    {
        version: "0.0.1",
        date: "March 31, 2025",
        title: "MVP Launch",
        features: [
            "Basic features to create a room and add members.",
            "Core document signing functionality.",
            "Initial implementation of the audit log.",
        ],
    }
];

export default function ChangelogPage() {
    useEffect(() => {
        document.title = "PermaSign | Changelog";
    }, []);

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <h1 className="text-4xl font-bold tracking-tighter text-center mb-10">PermaSign Changelog</h1>
            <ChangelogTimeline entries={changelogEntries} />
        </div>
    );
}