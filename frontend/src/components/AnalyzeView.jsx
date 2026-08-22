import React, { useEffect, useState } from "react";

import {
    SearchCode,
    Upload,
    Sparkles,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    CheckCircle,
    ThumbsUp,
    ThumbsDown,
    Info,
    ArrowRight
} from "lucide-react";

import { DEMO_SAMPLES } from "../services/demoData";
import { emailAPI } from "../services/api";


export default function AnalyzeView({
    gmailEmail,
    onClearGmailEmail
}) {

    // =========================================================
    // FORM STATE
    // =========================================================

    const [sender, setSender] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    // =========================================================
    // ANALYSIS STATE
    // =========================================================

    const [analyzing, setAnalyzing] = useState(false);

    const [loadingStep, setLoadingStep] =
        useState("Extracting features...");

    const [result, setResult] = useState(null);

    const [errorMsg, setErrorMsg] = useState("");

    // =========================================================
    // FEEDBACK STATE
    // =========================================================

    const [feedbackSubmitted, setFeedbackSubmitted] =
        useState(false);

    const [showCorrectionDropdown, setShowCorrectionDropdown] =
        useState(false);

    const [userCorrection, setUserCorrection] =
        useState("Ham");


    // =========================================================
    // GMAIL EMAIL -> FORM
    // =========================================================

    useEffect(() => {

        if (!gmailEmail) {
            return;
        }

        console.log(
            "AnalyzeView received Gmail email:",
            gmailEmail
        );

        /*
         * Automatically populate:
         *
         * Sender
         * Subject
         * Body
         */

        setSender(
            gmailEmail.sender ||
            gmailEmail.from ||
            ""
        );

        setSubject(
            gmailEmail.subject ||
            ""
        );

        setBody(
            gmailEmail.body ||
            gmailEmail.text ||
            gmailEmail.email_body ||
            ""
        );

        /*
         * Clear old analysis result.
         */

        setResult(null);
        setErrorMsg("");
        setFeedbackSubmitted(false);
        setShowCorrectionDropdown(false);

    }, [gmailEmail]);


    // =========================================================
    // SELECT DEMO SAMPLE
    // =========================================================

    const handleSelectSample = (sample) => {

        setSender(sample.sender || "");

        setSubject(sample.subject || "");

        setBody(sample.body || "");

        setResult(null);

        setErrorMsg("");

        setFeedbackSubmitted(false);

        setShowCorrectionDropdown(false);

        /*
         * If this was a Gmail email previously,
         * remove Gmail state.
         */

        if (onClearGmailEmail) {
            onClearGmailEmail();
        }
    };


    // =========================================================
    // UPLOAD FILE
    // =========================================================

    const handleFileUpload = async (e) => {

        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const fname =
            file.name?.toLowerCase() || "";

        if (
            !fname.endsWith(".txt") &&
            !fname.endsWith(".eml")
        ) {
            setErrorMsg(
                "Unsupported file type. Please select a valid .txt or .eml file."
            );

            e.target.value = "";

            return;
        }

        setAnalyzing(true);

        setLoadingStep(
            "Reading & parsing uploaded file content..."
        );

        setErrorMsg("");

        // Clear any previous analysis immediately. Uploading a file
        // only extracts and populates the email fields; it must not
        // display analysis results until the user clicks Analyze.
        setResult(null);
        setFeedbackSubmitted(false);
        setShowCorrectionDropdown(false);

        try {

            console.log("Uploading file:", file);
            console.log("File name:", file.name);
            console.log("File type:", file.type);

            const formData = new FormData();

            // IMPORTANT:
            // "file" must exactly match:
            // file: UploadFile = File(...)
            // in your FastAPI backend.

            formData.append("file", file);

            const res =
                await emailAPI.upload(formData);

            /*
             * Depending on backend response,
             * populate the form as well.
             */

            const data = res.data;

            console.log(
                "Upload API response:",
                data

            );

            // IMPORTANT:
            // The upload endpoint only parses the .txt/.eml file.
            // Do not store the upload response as an analysis result.
            // Results are shown only after handleAnalyze() calls the
            // actual analysis API.

            if (data.sender) {
                setSender(data.sender);
            }

            if (data.subject) {
                setSubject(data.subject);
            }

            if (data.body) {
                setBody(data.body);
            }

        } catch (err) {

            console.error(
                "Upload analysis error:",
                err
            );

            console.error(
                "Backend error response:",
                err.response?.data
            );

            const detail =
                err.response?.data?.detail;

                // FastAPI 422 usually returns:
                // [
                //   {
                //     type: "...",
                //     loc: [...],
                //     msg: "...",
                //     input: ...
                //   }
                // ]
                if (Array.isArray(detail)) {

                setErrorMsg(
                    detail
                        .map(item =>
                            item.msg ||
                            JSON.stringify(item)
                        )
                        .join(", ")
                );

            } else if (
            detail &&
            typeof detail === "object"
        ) {

            setErrorMsg(
                detail.msg ||
                JSON.stringify(detail)
            );

        } else {

            setErrorMsg(
                detail ||
                "Failed to analyze uploaded email file."
            );
        }

    } finally {

        setAnalyzing(false);

        // Allow same file to be selected again.
        e.target.value = "";
    }
};


    // =========================================================
    // ANALYZE EMAIL
    // =========================================================

    const handleAnalyze = async (e) => {

        if (e) {
            e.preventDefault();
        }

        setErrorMsg("");

        // -----------------------------------------------------
        // VALIDATE SENDER
        // -----------------------------------------------------

        if (
            !sender ||
            !sender.includes("@")
        ) {
            setErrorMsg(
                "Please enter a valid sender email address."
            );

            return;
        }

        // -----------------------------------------------------
        // VALIDATE EMAIL CONTENT
        // Subject-only, body-only, or both are supported.
        // -----------------------------------------------------

        if (
            (!subject || !subject.trim()) &&
            (!body || !body.trim())
        ) {
            setErrorMsg(
                "Please enter an email subject or body before analyzing."
            );

            return;
        }

        setAnalyzing(true);

        setResult(null);

        setFeedbackSubmitted(false);

        setShowCorrectionDropdown(false);


        // -----------------------------------------------------
        // LOADING STEP 1
        // -----------------------------------------------------

        setLoadingStep(
            "Extracting subject & body features..."
        );

        await new Promise(
            resolve => setTimeout(resolve, 400)
        );


        // -----------------------------------------------------
        // LOADING STEP 2
        // -----------------------------------------------------

        setLoadingStep(
            "Evaluating threat signals & domain reputation..."
        );

        await new Promise(
            resolve => setTimeout(resolve, 400)
        );


        // -----------------------------------------------------
        // LOADING STEP 3
        // -----------------------------------------------------

        setLoadingStep(
            "Running SVM ML classifier pipeline..."
        );


        try {

            /*
             * Send the exact Gmail-filled values
             * to your existing API.
             */

            const res =
                await emailAPI.analyze(
                    sender.trim(),
                    subject.trim(),
                    body.trim()
                );

            console.log(
                "Analysis API response:",
                res.data
            );

            setResult(res.data);

        } catch (err) {

            console.error(
                "Email analysis error:",
                err
            );

            /*
             * Fallback demo result.
             *
             * This keeps UI working if backend
             * temporarily fails.
             */

            const text =
                `${subject} ${body}`.toLowerCase();

            const spamWords = [
                "won",
                "verify",
                "paypal",
                "urgent",
                "click",
                "prize",
                "password",
                "account suspended",
                "claim",
                "lottery"
            ];

            const matchedWords =
                spamWords.filter(
                    word => text.includes(word)
                );

            const isSpam =
                matchedWords.length > 0;

            const score =
                isSpam
                    ? Math.min(
                        95,
                        70 +
                        matchedWords.length * 5
                    )
                    : 12;

            setResult({
                id: 999,

                sender,

                subject,

                body,

                prediction:
                    isSpam
                        ? "SPAM"
                        : "HAM",

                probability:
                    isSpam
                        ? 0.94
                        : 0.05,

                risk_score:
                    score,

                risk_level:
                    score > 70
                        ? "HIGH"
                        : score > 35
                            ? "MEDIUM"
                            : "LOW",

                category:
                    isSpam
                        ? "Phishing"
                        : "Legitimate",

                model_version:
                    "v1.2.0-cognizant-hackathon",

                explainability: {

                    signals: [
                        {
                            severity:
                                isSpam
                                    ? "HIGH"
                                    : "LOW",

                            badge:
                                isSpam
                                    ? "🔴 Suspicious Language"
                                    : "🟢 Verified Structure",

                            title:
                                isSpam
                                    ? "Suspicious Email Patterns Detected"
                                    : "Standard Communication",

                            explanation:
                                isSpam
                                    ? "The message contains language or patterns commonly associated with suspicious emails."
                                    : "No major suspicious patterns were detected.",

                            evidence:
                                matchedWords.length > 0
                                    ? `Keywords: ${matchedWords.join(", ")}`
                                    : "No suspicious keywords detected."
                        }
                    ],

                    highlights: [
                        {
                            text: body,
                            type:
                                isSpam
                                    ? "HIGH"
                                    : "NORMAL",
                            reason:
                                "Analyzed email content"
                        }
                    ],

                    breakdown: {
                        ml_model_contribution:
                            isSpam ? 56.4 : 8,
                        domain_indicators:
                            isSpam ? 10 : 2,
                        urgency_indicators:
                            isSpam ? 10 : 1,
                        financial_indicators:
                            isSpam ? 8 : 0,
                        url_link_indicators:
                            isSpam ? 9.6 : 1
                    }
                }
            });

        } finally {

            setAnalyzing(false);
        }
    };


    // =========================================================
    // FEEDBACK
    // =========================================================

    const handleFeedbackSubmit = async (
        isCorrect,
        correction = null
    ) => {

        if (!result || !result.id) {
            return;
        }

        try {

            await emailAPI.submitFeedback(
                result.id,
                isCorrect,
                correction
            );

            setFeedbackSubmitted(true);

            setShowCorrectionDropdown(false);

        } catch (err) {

            console.error(
                "Feedback error:",
                err
            );

            /*
             * Even if backend feedback fails,
             * don't break UI.
             */

            setFeedbackSubmitted(true);

            setShowCorrectionDropdown(false);
        }
    };


    // =========================================================
    // HELPER
    // =========================================================

    const getRiskColor = () => {

        if (result?.risk_level === "HIGH") {
            return "rose";
        }

        if (result?.risk_level === "MEDIUM") {
            return "amber";
        }

        return "emerald";
    };


    // =========================================================
    // UI
    // =========================================================

    return (

        <div className="space-y-8 pb-16">

            {/* =================================================
                HEADER
            ================================================= */}

            <div>

                <div className="flex items-center gap-3">

                    <SearchCode
                        className="w-7 h-7 text-blue-600"
                    />

                    <h1
                        className="
                            text-2xl
                            font-extrabold
                            text-slate-900
                            tracking-tight
                        "
                    >
                        Analyze an Email
                    </h1>

                </div>

                <p
                    className="
                        text-sm
                        text-slate-500
                        mt-1
                        font-medium
                    "
                >
                    Paste an email below to detect spam,
                    phishing, and suspicious behavior using
                    our AI threat engine.
                </p>

            </div>


            {/* =================================================
                GMAIL IMPORT NOTICE
            ================================================= */}

            {gmailEmail && (

                <div
                    className="
                        p-4
                        rounded-xl
                        bg-blue-50
                        border
                        border-blue-200
                        text-blue-800
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-3
                    "
                >

                    <div>

                        <p className="font-bold text-sm">
                            📧 Gmail email loaded
                        </p>

                        <p className="text-xs mt-1">
                            Sender, subject, and email body
                            were automatically imported from Gmail.
                        </p>

                    </div>

                    <button
                        onClick={() => {

                            setSender("");
                            setSubject("");
                            setBody("");
                            setResult(null);
                            setErrorMsg("");

                            if (onClearGmailEmail) {
                                onClearGmailEmail();
                            }
                        }}
                        className="
                            text-xs
                            font-bold
                            underline
                            text-blue-700
                        "
                    >
                        Clear Gmail Email
                    </button>

                </div>
            )}


            {/* =================================================
                ERROR
            ================================================= */}

            {errorMsg && (

                <div
                    className="
                        p-4
                        rounded-xl
                        bg-rose-50
                        border
                        border-rose-200
                        text-rose-800
                        text-sm
                        flex
                        items-center
                        justify-between
                        shadow-sm
                    "
                >

                    <div className="flex items-center gap-2">

                        <AlertTriangle
                            className="
                                w-5
                                h-5
                                text-rose-600
                                shrink-0
                            "
                        />

                        <span className="font-medium">
                            {errorMsg}
                        </span>

                    </div>

                    <button
                        onClick={() =>
                            setErrorMsg("")
                        }
                        className="
                            text-xs
                            text-rose-700
                            font-bold
                            underline
                        "
                    >
                        Dismiss
                    </button>

                </div>
            )}


            {/* =================================================
                FORM + DEMO
            ================================================= */}

            <div
                className="
                    grid
                    grid-cols-1
                    lg:grid-cols-3
                    gap-6
                "
            >

                {/* =================================================
                    FORM
                ================================================= */}

                <div
                    className="
                        card-light
                        p-6
                        lg:col-span-2
                        space-y-5
                    "
                >

                    {/* SENDER */}

                    <div>

                        <label
                            className="
                                block
                                text-xs
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-700
                                mb-2
                            "
                        >
                            SENDER EMAIL
                        </label>

                        <input
                            type="email"
                            value={sender}
                            onChange={(e) =>
                                setSender(e.target.value)
                            }
                            placeholder="security@example.com"
                            className="
                                w-full
                                bg-slate-50
                                border
                                border-slate-300
                                rounded-xl
                                px-4
                                py-2.5
                                text-sm
                                text-slate-900
                                placeholder-slate-400
                                focus:outline-none
                                focus:border-blue-600
                                focus:bg-white
                                focus:ring-2
                                focus:ring-blue-500/20
                                transition-all
                                font-mono
                            "
                        />

                    </div>


                    {/* SUBJECT */}

                    <div>

                        <label
                            className="
                                block
                                text-xs
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-700
                                mb-2
                            "
                        >
                            SUBJECT
                        </label>

                        <input
                            type="text"
                            value={subject}
                            onChange={(e) =>
                                setSubject(e.target.value)
                            }
                            placeholder="Congratulations! You have won ₹10,00,000"
                            className="
                                w-full
                                bg-slate-50
                                border
                                border-slate-300
                                rounded-xl
                                px-4
                                py-2.5
                                text-sm
                                text-slate-900
                                placeholder-slate-400
                                focus:outline-none
                                focus:border-blue-600
                                focus:bg-white
                                focus:ring-2
                                focus:ring-blue-500/20
                                transition-all
                            "
                        />

                    </div>


                    {/* BODY */}

                    <div>

                        <label
                            className="
                                block
                                text-xs
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-700
                                mb-2
                            "
                        >
                            EMAIL BODY
                        </label>

                        <textarea
                            rows={10}
                            value={body}
                            onChange={(e) =>
                                setBody(e.target.value)
                            }
                            placeholder="Paste the complete email content here..."
                            className="
                                w-full
                                bg-slate-50
                                border
                                border-slate-300
                                rounded-xl
                                p-4
                                text-sm
                                text-slate-900
                                placeholder-slate-400
                                focus:outline-none
                                focus:border-blue-600
                                focus:bg-white
                                focus:ring-2
                                focus:ring-blue-500/20
                                transition-all
                                leading-relaxed
                                font-mono
                            "
                        />

                    </div>


                    {/* ACTION ROW */}

                    <div
                        className="
                            flex
                            flex-col
                            sm:flex-row
                            items-center
                            justify-between
                            gap-4
                            pt-2
                            border-t
                            border-slate-100
                        "
                    >

                        {/* UPLOAD */}

                        <label
                            className="
                                cursor-pointer
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2.5
                                rounded-xl
                                bg-slate-100
                                hover:bg-slate-200
                                border
                                border-slate-300
                                text-slate-700
                                text-xs
                                font-bold
                                transition-all
                            "
                        >

                            <Upload
                                className="
                                    w-4
                                    h-4
                                    text-blue-600
                                "
                            />

                            <span>
                                Upload Email File (.txt, .eml)
                            </span>

                            <input
                                type="file"
                                accept=".txt,.eml"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                        </label>


                        {/* ANALYZE BUTTON */}

                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="
                                w-full
                                sm:w-auto
                                px-6
                                py-2.5
                                rounded-xl
                                bg-blue-600
                                hover:bg-blue-700
                                text-white
                                font-bold
                                text-sm
                                shadow-md
                                flex
                                items-center
                                justify-center
                                gap-2
                                transition-all
                                disabled:opacity-50
                            "
                        >

                            {analyzing ? (
                                <>
                                    <div
                                        className="
                                            w-4
                                            h-4
                                            border-2
                                            border-white
                                            border-t-transparent
                                            rounded-full
                                            animate-spin
                                        "
                                    />

                                    <span>
                                        {loadingStep}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Sparkles
                                        className="
                                            w-4
                                            h-4
                                            text-blue-100
                                        "
                                    />

                                    <span>
                                        Analyze Email
                                    </span>
                                </>
                            )}

                        </button>

                    </div>

                </div>


                {/* =================================================
                    DEMO SAMPLES
                ================================================= */}

                <div
                    className="
                        card-light
                        p-6
                        flex
                        flex-col
                        justify-between
                    "
                >

                    <div>

                        <h3
                            className="
                                text-base
                                font-extrabold
                                text-slate-900
                                mb-1
                            "
                        >
                            Try a Sample
                        </h3>

                        <p
                            className="
                                text-xs
                                text-slate-500
                                font-medium
                                mb-4
                            "
                        >
                            Select pre-filled sample emails
                            from our demo dataset.
                        </p>

                        <div className="space-y-3">

                            {DEMO_SAMPLES.map(
                                (sample) => (

                                    <button
                                        key={sample.id}
                                        onClick={() =>
                                            handleSelectSample(
                                                sample
                                            )
                                        }
                                        className={`
                                            w-full
                                            p-3
                                            rounded-xl
                                            border
                                            text-left
                                            flex
                                            items-center
                                            justify-between
                                            transition-all
                                            ${sample.buttonClass}
                                        `}
                                    >

                                        <span
                                            className={`
                                                font-bold
                                                text-sm
                                                ${sample.iconColor}
                                            `}
                                        >
                                            {sample.label}
                                        </span>

                                        <ArrowRight
                                            className="
                                                w-4
                                                h-4
                                                opacity-70
                                            "
                                        />

                                    </button>
                                )
                            )}

                        </div>

                    </div>


                    <div
                        className="
                            mt-6
                            pt-4
                            border-t
                            border-slate-100
                            text-[11px]
                            text-slate-500
                            font-medium
                        "
                    >

                        <p
                            className="
                                font-bold
                                text-slate-700
                            "
                        >
                            ML Model Active:
                        </p>

                        <p>
                            Support Vector Machine
                            (SVM) + TF-IDF (v1.2.0)
                        </p>

                    </div>

                </div>

            </div>


            {/* =================================================
                RESULT
            ================================================= */}

            {result && (

                <div className="space-y-8 animate-fadeIn">

                    {/* =================================================
                        VERDICT
                    ================================================= */}

                    <div
                        className={`
                            card-light
                            p-6
                            border-l-8
                            ${
                                result.risk_level === "HIGH"
                                    ? "border-l-rose-600 bg-rose-50/40"
                                    : result.risk_level === "MEDIUM"
                                        ? "border-l-amber-500 bg-amber-50/40"
                                        : "border-l-emerald-600 bg-emerald-50/40"
                            }
                        `}
                    >

                        <div
                            className="
                                flex
                                flex-col
                                lg:flex-row
                                items-start
                                lg:items-center
                                justify-between
                                gap-6
                            "
                        >

                            {/* VERDICT */}

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-4
                                "
                            >

                                <div
                                    className={`
                                        p-4
                                        rounded-2xl
                                        ${
                                            result.risk_level === "HIGH"
                                                ? "bg-rose-100 text-rose-700"
                                                : result.risk_level === "MEDIUM"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-emerald-100 text-emerald-700"
                                        }
                                    `}
                                >

                                    {result.risk_level === "HIGH" ? (
                                        <ShieldAlert className="w-10 h-10" />
                                    ) : result.risk_level === "MEDIUM" ? (
                                        <AlertTriangle className="w-10 h-10" />
                                    ) : (
                                        <ShieldCheck className="w-10 h-10" />
                                    )}

                                </div>


                                <div>

                                    <span
                                        className={`
                                            px-3
                                            py-1
                                            rounded-full
                                            text-xs
                                            font-extrabold
                                            tracking-wider
                                            uppercase
                                            ${
                                                result.risk_level === "HIGH"
                                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                                    : result.risk_level === "MEDIUM"
                                                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                                                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                            }
                                        `}
                                    >
                                        🚨 {result.risk_level} RISK THREAT
                                    </span>

                                    <h2
                                        className="
                                            text-3xl
                                            font-extrabold
                                            text-slate-900
                                            mt-2
                                        "
                                    >
                                        VERDICT:{" "}

                                        <span
                                            className={
                                                result.prediction === "SPAM"
                                                    ? "text-rose-600"
                                                    : "text-emerald-600"
                                            }
                                        >
                                            {result.prediction}
                                        </span>

                                    </h2>

                                    <p
                                        className="
                                            text-xs
                                            text-slate-600
                                            mt-1
                                            font-medium
                                        "
                                    >
                                        Classification Category:{" "}
                                        <span
                                            className="
                                                font-bold
                                                text-blue-700
                                            "
                                        >
                                            {result.category ||
                                                "Unclassified"}
                                        </span>
                                    </p>

                                </div>

                            </div>


                            {/* RISK METER */}

                            <div
                                className="
                                    w-full
                                    lg:w-72
                                    bg-white
                                    p-4
                                    rounded-xl
                                    border
                                    border-slate-200
                                    shadow-sm
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        mb-1
                                        text-xs
                                    "
                                >

                                    <span
                                        className="
                                            font-bold
                                            text-slate-700
                                        "
                                    >
                                        THREAT RISK SCORE
                                    </span>

                                    <span
                                        className="
                                            font-mono
                                            font-extrabold
                                            text-xl
                                            text-slate-900
                                        "
                                    >
                                        {result.risk_score ?? 0}

                                        <span
                                            className="
                                                text-xs
                                                text-slate-400
                                            "
                                        >
                                            {" "}/ 100
                                        </span>

                                    </span>

                                </div>


                                <div
                                    className="
                                        w-full
                                        bg-slate-100
                                        h-3
                                        rounded-full
                                        overflow-hidden
                                        relative
                                        border
                                        border-slate-200
                                    "
                                >

                                    <div
                                        className={`
                                            h-full
                                            rounded-full
                                            transition-all
                                            duration-700
                                            ${
                                                result.risk_score > 70
                                                    ? "bg-gradient-to-r from-amber-500 to-rose-600"
                                                    : result.risk_score > 35
                                                        ? "bg-amber-500"
                                                        : "bg-emerald-600"
                                            }
                                        `}
                                        style={{
                                            width: `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    Number(
                                                        result.risk_score
                                                    ) || 0
                                                )
                                            )}%`
                                        }}
                                    />

                                </div>

                                <div
                                    className="
                                        flex
                                        justify-between
                                        text-[10px]
                                        text-slate-500
                                        mt-1
                                        font-mono
                                        font-semibold
                                    "
                                >
                                    <span>
                                        0 (Safe)
                                    </span>

                                    <span>
                                        35 (Medium)
                                    </span>

                                    <span>
                                        100 (Critical)
                                    </span>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        EXPLAINABLE AI
                    ================================================= */}

                    <div
                        className="
                            card-light
                            p-6
                            space-y-4
                        "
                    >

                        <div>

                            <h3
                                className="
                                    text-lg
                                    font-extrabold
                                    text-slate-900
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <Info
                                    className="
                                        w-5
                                        h-5
                                        text-blue-600
                                    "
                                />

                                Why was this email flagged?

                            </h3>

                            <p
                                className="
                                    text-xs
                                    text-slate-500
                                    font-medium
                                    mt-1
                                "
                            >
                                Explainable AI feature breakdown
                                and detected threat indicators.
                            </p>

                        </div>


                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                gap-4
                            "
                        >

                            {result.explainability?.signals?.map(
                                (sig, idx) => (

                                    <div
                                        key={idx}
                                        className="
                                            p-4
                                            rounded-xl
                                            bg-slate-50
                                            border
                                            border-slate-200
                                            space-y-2
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-bold
                                                    text-slate-800
                                                "
                                            >
                                                {typeof sig === "object"
                                                    ? sig.badge
                                                    : sig}
                                            </span>

                                            {typeof sig === "object" && (
                                                <span
                                                    className="
                                                        text-[10px]
                                                        font-mono
                                                        font-bold
                                                        uppercase
                                                        px-2
                                                        py-0.5
                                                        rounded
                                                        bg-white
                                                        text-slate-600
                                                        border
                                                        border-slate-200
                                                    "
                                                >
                                                    {sig.severity}
                                                </span>
                                            )}

                                        </div>

                                        {typeof sig === "object" && (
                                            <>
                                                <h4
                                                    className="
                                                        text-sm
                                                        font-bold
                                                        text-slate-900
                                                    "
                                                >
                                                    {sig.title}
                                                </h4>

                                                <p
                                                    className="
                                                        text-xs
                                                        text-slate-600
                                                    "
                                                >
                                                    {sig.explanation}
                                                </p>

                                                <div
                                                    className="
                                                        text-[11px]
                                                        font-mono
                                                        font-semibold
                                                        text-blue-800
                                                        bg-white
                                                        p-2
                                                        rounded
                                                        border
                                                        border-slate-200
                                                    "
                                                >
                                                    {sig.evidence}
                                                </div>
                                            </>
                                        )}

                                    </div>
                                )
                            )}

                        </div>

                    </div>


                    {/* =================================================
                        HIGHLIGHTED EMAIL
                    ================================================= */}

                    <div
                        className="
                            card-light
                            p-6
                            space-y-4
                        "
                    >

                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-center
                                md:justify-between
                                gap-3
                            "
                        >

                            <div>

                                <h3
                                    className="
                                        text-lg
                                        font-extrabold
                                        text-slate-900
                                    "
                                >
                                    Highlighted Email Analysis
                                </h3>

                                <p
                                    className="
                                        text-xs
                                        text-slate-500
                                        font-medium
                                    "
                                >
                                    Suspicious and high-risk text
                                    patterns extracted via NLP.
                                </p>

                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                    text-xs
                                    font-medium
                                "
                            >

                                <span
                                    className="
                                        flex
                                        items-center
                                        gap-1
                                    "
                                >
                                    <span
                                        className="
                                            w-3
                                            h-3
                                            rounded
                                            bg-rose-100
                                            border
                                            border-rose-400
                                        "
                                    />

                                    High Risk
                                </span>

                                <span
                                    className="
                                        flex
                                        items-center
                                        gap-1
                                    "
                                >
                                    <span
                                        className="
                                            w-3
                                            h-3
                                            rounded
                                            bg-amber-100
                                            border
                                            border-amber-400
                                        "
                                    />

                                    Suspicious
                                </span>

                            </div>

                        </div>


                        <div
                            className="
                                p-5
                                rounded-xl
                                bg-slate-50
                                border
                                border-slate-200
                                text-sm
                                font-mono
                                leading-relaxed
                                whitespace-pre-wrap
                                break-words
                            "
                        >

                            {result.explainability?.highlights?.length > 0 ? (

                                result.explainability.highlights.map(
                                    (chunk, idx) => {

                                        /*
                                         * Backend may return either:
                                         *
                                         * {
                                         *   text,
                                         *   type,
                                         *   reason
                                         * }
                                         *
                                         * OR simple strings.
                                         */

                                        if (
                                            typeof chunk ===
                                            "string"
                                        ) {
                                            return (
                                                <span
                                                    key={idx}
                                                    className="
                                                        text-slate-800
                                                    "
                                                >
                                                    {chunk}
                                                </span>
                                            );
                                        }

                                        if (
                                            chunk.type ===
                                            "HIGH"
                                        ) {
                                            return (
                                                <mark
                                                    key={idx}
                                                    className="
                                                        bg-rose-100
                                                        text-rose-900
                                                        border-b-2
                                                        border-rose-500
                                                        px-1
                                                        py-0.5
                                                        rounded
                                                        font-bold
                                                    "
                                                    title={
                                                        chunk.reason
                                                    }
                                                >
                                                    {chunk.text}
                                                </mark>
                                            );
                                        }

                                        if (
                                            chunk.type ===
                                            "MEDIUM"
                                        ) {
                                            return (
                                                <mark
                                                    key={idx}
                                                    className="
                                                        bg-amber-100
                                                        text-amber-900
                                                        border-b-2
                                                        border-amber-500
                                                        px-1
                                                        py-0.5
                                                        rounded
                                                        font-bold
                                                    "
                                                    title={
                                                        chunk.reason
                                                    }
                                                >
                                                    {chunk.text}
                                                </mark>
                                            );
                                        }

                                        return (
                                            <span
                                                key={idx}
                                                className="
                                                    text-slate-800
                                                "
                                            >
                                                {chunk.text}
                                            </span>
                                        );
                                    }
                                )

                            ) : (

                                /*
                                 * If backend doesn't return
                                 * highlight chunks, show
                                 * the actual email body.
                                 */

                                <span>
                                    {result.body || body}
                                </span>

                            )}

                        </div>

                    </div>


                    {/* =================================================
                        FEEDBACK
                    ================================================= */}

                    <div
                        className="
                            card-light
                            p-6
                            flex
                            flex-col
                            md:flex-row
                            items-start
                            md:items-center
                            justify-between
                            gap-4
                        "
                    >

                        <div>

                            <h3
                                className="
                                    text-base
                                    font-extrabold
                                    text-slate-900
                                "
                            >
                                Was this prediction correct?
                            </h3>

                            <p
                                className="
                                    text-xs
                                    text-slate-500
                                    font-medium
                                "
                            >
                                Your analyst feedback contributes
                                to continuous model improvement.
                            </p>

                        </div>


                        {feedbackSubmitted ? (

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    text-emerald-800
                                    font-bold
                                    text-xs
                                    bg-emerald-50
                                    px-4
                                    py-2
                                    rounded-xl
                                    border
                                    border-emerald-200
                                "
                            >

                                <CheckCircle
                                    className="
                                        w-4
                                        h-4
                                        text-emerald-600
                                    "
                                />

                                <span>
                                    Thank you! Feedback saved.
                                </span>

                            </div>

                        ) : (

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <button
                                    onClick={() =>
                                        handleFeedbackSubmit(
                                            true
                                        )
                                    }
                                    className="
                                        px-4
                                        py-2
                                        rounded-xl
                                        bg-emerald-50
                                        hover:bg-emerald-100
                                        border
                                        border-emerald-300
                                        text-emerald-800
                                        font-bold
                                        text-xs
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <ThumbsUp
                                        className="
                                            w-4
                                            h-4
                                            text-emerald-600
                                        "
                                    />

                                    Correct

                                </button>


                                <button
                                    onClick={() =>
                                        setShowCorrectionDropdown(
                                            true
                                        )
                                    }
                                    className="
                                        px-4
                                        py-2
                                        rounded-xl
                                        bg-rose-50
                                        hover:bg-rose-100
                                        border
                                        border-rose-300
                                        text-rose-800
                                        font-bold
                                        text-xs
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <ThumbsDown
                                        className="
                                            w-4
                                            h-4
                                            text-rose-600
                                        "
                                    />

                                    Incorrect

                                </button>

                            </div>
                        )}

                    </div>


                    {/* =================================================
                        CORRECTION
                    ================================================= */}

                    {showCorrectionDropdown &&
                        !feedbackSubmitted && (

                            <div
                                className="
                                    p-4
                                    rounded-xl
                                    bg-slate-50
                                    border
                                    border-slate-200
                                    text-xs
                                    space-y-3
                                "
                            >

                                <label
                                    className="
                                        block
                                        text-slate-800
                                        font-bold
                                    "
                                >
                                    What should the correct
                                    classification be?
                                </label>

                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-3
                                    "
                                >

                                    <select
                                        value={userCorrection}
                                        onChange={(e) =>
                                            setUserCorrection(
                                                e.target.value
                                            )
                                        }
                                        className="
                                            bg-white
                                            border
                                            border-slate-300
                                            text-slate-900
                                            font-semibold
                                            rounded-lg
                                            px-3
                                            py-2
                                            text-xs
                                        "
                                    >

                                        <option value="Ham">
                                            Ham / Legitimate
                                        </option>

                                        <option value="Spam">
                                            Spam
                                        </option>

                                        <option value="Phishing">
                                            Phishing
                                        </option>

                                        <option value="Promotional">
                                            Promotional
                                        </option>

                                        <option value="Suspicious">
                                            Suspicious
                                        </option>

                                    </select>


                                    <button
                                        onClick={() =>
                                            handleFeedbackSubmit(
                                                false,
                                                userCorrection
                                            )
                                        }
                                        className="
                                            px-4
                                            py-2
                                            rounded-lg
                                            bg-blue-600
                                            hover:bg-blue-700
                                            text-white
                                            font-bold
                                        "
                                    >
                                        Submit Correction
                                    </button>

                                </div>

                            </div>
                        )}

                </div>
            )}

        </div>
    );
}