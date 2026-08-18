import { useEffect, useState } from "react";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://email-spam-detection-oyhu.onrender.com";;

function GmailInboxView({ onAnalyzeEmail }) {
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);

    const [loading, setLoading] = useState(false);
    const [opening, setOpening] = useState(false);
    const [connecting, setConnecting] = useState(false);

    const [error, setError] = useState("");

    // =========================================================
    // GET MAILGUARD JWT
    // =========================================================

    const getToken = () => {
        return (
            localStorage.getItem("mailguard_token") ||
            sessionStorage.getItem("mailguard_token")
        );
    };

    // =========================================================
    // CONNECT GMAIL
    // =========================================================

    const connectGmail = async () => {
        try {
            setConnecting(true);
            setError("");

            const token = getToken();

            if (!token) {
                setError(
                    "Please login to MailGuard first."
                );
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/gmail/auth-url`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to connect Gmail."
                );
            }

            if (!data.authorization_url) {
                throw new Error(
                    "Google authorization URL was not returned."
                );
            }

            window.location.href =
                data.authorization_url;

        } catch (err) {
            console.error(
                "Gmail connection error:",
                err
            );

            setError(
                err.message ||
                "Gmail connection failed."
            );
        } finally {
            setConnecting(false);
        }
    };

    // =========================================================
    // LOAD GMAIL INBOX
    // =========================================================

    const loadInbox = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                setError(
                    "Please login to MailGuard first."
                );
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/gmail/inbox`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to load Gmail inbox."
                );
            }

            setEmails(
                Array.isArray(data.data)
                    ? data.data
                    : []
            );

        } catch (err) {
            console.error(
                "Gmail inbox error:",
                err
            );

            setError(
                err.message ||
                "Unable to load Gmail inbox."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // OPEN SINGLE GMAIL EMAIL
    // =========================================================

    const openEmail = async (messageId) => {
        try {
            setOpening(true);
            setError("");
            setSelectedEmail(null);

            const token = getToken();

            if (!token) {
                setError(
                    "Please login to MailGuard first."
                );
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/gmail/email/${messageId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to retrieve email."
                );
            }

            /*
             * Normalize Gmail response.
             *
             * This prevents undefined / blank fields
             * when Gmail backend uses slightly different
             * property names.
             */

            const normalizedEmail = {
                id:
                    data.id ||
                    messageId,

                sender:
                    data.sender ||
                    data.from ||
                    data.sender_email ||
                    "",

                subject:
                    data.subject ||
                    "",

                body:
                    data.body ||
                    data.text ||
                    data.email_body ||
                    "",

                to:
                    data.to ||
                    data.recipient ||
                    "",

                date:
                    data.date ||
                    data.timestamp ||
                    "",

                snippet:
                    data.snippet ||
                    "",
            };

            console.log(
                "Opened Gmail email:",
                normalizedEmail
            );

            setSelectedEmail(normalizedEmail);

        } catch (err) {
            console.error(
                "Open Gmail email error:",
                err
            );

            setError(
                err.message ||
                "Unable to retrieve email."
            );
        } finally {
            setOpening(false);
        }
    };

    // =========================================================
    // SEND EMAIL TO ANALYZE PAGE
    // =========================================================

    const goToAnalyze = () => {
        if (!selectedEmail) {
            setError(
                "Please open an email first."
            );
            return;
        }

        /*
         * Check the important fields before navigating.
         */

        const sender =
            selectedEmail.sender?.trim() || "";

        const subject =
            selectedEmail.subject?.trim() || "";

        const body =
            selectedEmail.body?.trim() || "";

        if (!sender) {
            setError(
                "The selected Gmail email has no sender."
            );
            return;
        }

        if (!subject) {
            setError(
                "The selected Gmail email has no subject."
            );
            return;
        }

        if (!body) {
            setError(
                "The selected Gmail email has no body."
            );
            return;
        }

        /*
         * IMPORTANT:
         *
         * Do NOT analyze here.
         *
         * App.jsx receives this email and navigates
         * to AnalyzeView.
         */

        console.log(
            "Sending Gmail email to AnalyzeView:",
            selectedEmail
        );

        if (typeof onAnalyzeEmail === "function") {
            onAnalyzeEmail({
                ...selectedEmail,
                sender,
                subject,
                body,
            });
        } else {
            console.error(
                "onAnalyzeEmail prop is missing."
            );
        }
    };

    // =========================================================
    // LOAD INBOX ON PAGE OPEN
    // =========================================================

    useEffect(() => {
        loadInbox();
    }, []);

    // =========================================================
    // SELECTED EMAIL VIEW
    // =========================================================

    if (selectedEmail) {
        return (
            <div className="p-6">

                {/* BACK */}

                <button
                    onClick={() => {
                        setSelectedEmail(null);
                        setError("");
                    }}
                    className="
                        mb-6
                        px-4
                        py-2
                        rounded-lg
                        bg-slate-200
                        hover:bg-slate-300
                        text-slate-800
                        font-medium
                    "
                >
                    ← Back to Gmail
                </button>

                {/* EMAIL CARD */}

                <div
                    className="
                        bg-white
                        rounded-xl
                        shadow-sm
                        border
                        p-6
                    "
                >

                    {/* SUBJECT */}

                    <h1
                        className="
                            text-2xl
                            font-bold
                            mb-5
                            text-slate-900
                        "
                    >
                        {selectedEmail.subject ||
                            "(No Subject)"}
                    </h1>

                    {/* EMAIL INFORMATION */}

                    <div
                        className="
                            border-b
                            pb-4
                            mb-5
                        "
                    >

                        <p className="font-semibold">
                            From:
                        </p>

                        <p
                            className="
                                text-slate-600
                                mb-3
                                break-all
                            "
                        >
                            {selectedEmail.sender ||
                                "Unknown sender"}
                        </p>

                        <p className="font-semibold">
                            To:
                        </p>

                        <p
                            className="
                                text-slate-600
                                mb-3
                                break-all
                            "
                        >
                            {selectedEmail.to ||
                                "Unknown recipient"}
                        </p>

                        <p className="font-semibold">
                            Date:
                        </p>

                        <p className="text-slate-600">
                            {selectedEmail.date ||
                                "Unknown date"}
                        </p>

                    </div>

                    {/* EMAIL BODY */}

                    <div
                        className="
                            whitespace-pre-wrap
                            text-slate-800
                            leading-7
                            min-h-[100px]
                            break-words
                        "
                    >
                        {selectedEmail.body ||
                            "No email body available."}
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div
                            className="
                                mt-6
                                p-4
                                rounded-lg
                                bg-red-50
                                border
                                border-red-200
                                text-red-700
                            "
                        >
                            {error}
                        </div>
                    )}

                    {/* ANALYZE */}

                    <div
                        className="
                            mt-8
                            pt-5
                            border-t
                            flex
                            flex-col
                            sm:flex-row
                            gap-3
                        "
                    >

                        <button
                            onClick={goToAnalyze}
                            className="
                                px-6
                                py-3
                                rounded-lg
                                bg-indigo-600
                                text-white
                                hover:bg-indigo-700
                                font-semibold
                                transition
                            "
                        >
                            🤖 Analyze with MailGuard
                        </button>

                        <button
                            onClick={() => {
                                setSelectedEmail(null);
                                setError("");
                            }}
                            className="
                                px-6
                                py-3
                                rounded-lg
                                bg-slate-100
                                text-slate-700
                                hover:bg-slate-200
                                font-semibold
                            "
                        >
                            Back to Gmail
                        </button>

                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // GMAIL INBOX
    // =========================================================

    return (
        <div className="p-6">

            {/* HEADER */}

            <div
                className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                    mb-6
                "
            >

                <div>

                    <h1
                        className="
                            text-2xl
                            font-bold
                            text-slate-900
                        "
                    >
                        Gmail Inbox & Spam
                    </h1>

                    <p
                        className="
                            text-slate-500
                            mt-1
                        "
                    >
                        View and analyze your Gmail inbox and Spam messages
                    </p>

                </div>

                <div className="flex gap-3">

                    <button
                        onClick={connectGmail}
                        disabled={connecting}
                        className="
                            px-4
                            py-2
                            rounded-lg
                            bg-red-500
                            text-white
                            hover:bg-red-600
                            disabled:opacity-50
                        "
                    >
                        {connecting
                            ? "Connecting..."
                            : "Connect Gmail"}
                    </button>

                    <button
                        onClick={loadInbox}
                        disabled={loading}
                        className="
                            px-4
                            py-2
                            rounded-lg
                            bg-slate-800
                            text-white
                            hover:bg-slate-900
                            disabled:opacity-50
                        "
                    >
                        {loading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

            </div>

            {/* ERROR */}

            {error && (
                <div
                    className="
                        mb-5
                        p-4
                        rounded-lg
                        bg-red-50
                        border
                        border-red-200
                        text-red-700
                    "
                >
                    {error}
                </div>
            )}

            {/* LOADING */}

            {loading && (
                <div
                    className="
                        text-center
                        py-10
                        text-slate-500
                    "
                >
                    Loading Gmail messages...
                </div>
            )}

            {/* EMPTY */}

            {!loading &&
                emails.length === 0 &&
                !error && (
                    <div
                        className="
                            text-center
                            py-12
                            bg-white
                            rounded-xl
                            border
                        "
                    >
                        <div className="text-4xl mb-3">
                            📭
                        </div>

                        <h2 className="text-lg font-semibold">
                            No emails found
                        </h2>

                        <p
                            className="
                                text-slate-500
                                mt-1
                            "
                        >
                            No Gmail Inbox or Spam messages found.
                        </p>
                    </div>
                )}

            {/* EMAIL LIST */}

            {!loading &&
                emails.length > 0 && (
                    <div
                        className="
                            bg-white
                            rounded-xl
                            border
                            shadow-sm
                            overflow-hidden
                        "
                    >

                        {emails.map((email) => (
                            <div
                                key={email.id}
                                onClick={() =>
                                    openEmail(email.id)
                                }
                                className="
                                    px-5
                                    py-4
                                    border-b
                                    last:border-b-0
                                    hover:bg-slate-50
                                    cursor-pointer
                                    transition
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-4
                                    "
                                >

                                    <div
                                        className="
                                            min-w-0
                                            flex-1
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                items-center
                                                gap-3
                                            "
                                        >

                                            <span
                                                className="
                                                    font-semibold
                                                    text-slate-900
                                                    truncate
                                                "
                                            >
                                                {email.sender ||
                                                    "Unknown sender"}
                                            </span>

                                            {email.labels?.includes(
                                                "UNREAD"
                                            ) && (
                                                <span
                                                    className="
                                                        text-xs
                                                        px-2
                                                        py-1
                                                        rounded-full
                                                        bg-blue-100
                                                        text-blue-700
                                                    "
                                                >
                                                    Unread
                                                </span>
                                            )}
                                            
                                            {email.labels?.includes("SPAM") && (
                                                <span
                                                    className="
                                                            text-xs
                                                            px-2
                                                            py-1
                                                            rounded-full
                                                            bg-red-100
                                                            text-red-700
                                                    "
                                                >
                                                    Gmail Spam
                                                </span>
                                            )}
                                        </div>

                                        <h3
                                            className="
                                                font-medium
                                                text-slate-800
                                                mt-1
                                                truncate
                                            "
                                        >
                                            {email.subject ||
                                                "(No Subject)"}
                                        </h3>

                                        <p
                                            className="
                                                text-sm
                                                text-slate-500
                                                truncate
                                                mt-1
                                            "
                                        >
                                            {email.snippet ||
                                                ""}
                                        </p>

                                    </div>

                                    <div
                                        className="
                                            text-xs
                                            text-slate-500
                                            whitespace-nowrap
                                        "
                                    >
                                        {email.date}
                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>
                )}

            {/* OPENING */}

            {opening && (
                <div
                    className="
                        fixed
                        inset-0
                        bg-black/20
                        flex
                        items-center
                        justify-center
                        z-50
                    "
                >
                    <div
                        className="
                            bg-white
                            rounded-xl
                            px-6
                            py-5
                            shadow-lg
                            font-medium
                        "
                    >
                        Opening email...
                    </div>
                </div>
            )}

        </div>
    );
}

export default GmailInboxView;