import React, { useState, useEffect } from 'react';
import { Search, Filter, History, Eye, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { emailAPI } from '../services/api';

export default function HistoryView({ initialSelectedId, onClearSelectedId }) {
  const [historyData, setHistoryData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState('ALL');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Detail Modal State
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Confirmation Modal State
  const [emailToDelete, setEmailToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await emailAPI.getHistory({
        search,
        classification,
        risk_level: riskLevel,
        page,
        limit
      });
      if (res.data) {
        setHistoryData(res.data.data);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, classification, riskLevel, page]);

  useEffect(() => {
    if (initialSelectedId) {
      handleOpenDetail(initialSelectedId);
    }
  }, [initialSelectedId]);

  const handleOpenDetail = async (id) => {
    setModalLoading(true);
    try {
      const res = await emailAPI.getDetail(id);
      setSelectedEmail(res.data);
    } catch (err) {
      console.error("Error opening detail:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePrompt = (e, row) => {
    e.stopPropagation(); // prevent opening detail modal
    setEmailToDelete(row);
  };

  const handleConfirmDelete = async () => {
    if (!emailToDelete) return;
    setDeleting(true);
    try {
      await emailAPI.delete(emailToDelete.id);
      // Remove from displayed list and fetch latest count
      setHistoryData(prev => prev.filter(item => item.id !== emailToDelete.id));
      setTotalRecords(prev => Math.max(0, prev - 1));
      setEmailToDelete(null);
      setNotification('Email deleted successfully.');
      setTimeout(() => setNotification(''), 3500);
      fetchHistory();
    } catch (err) {
      console.error("Failed to delete email:", err);
      alert('Error deleting email record. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-extrabold text-[11px]">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-extrabold text-[11px]">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-[11px]">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email History Log</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Audit log of all analyzed email threats and predictions.</p>
      </div>

      {/* Success Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="text-xs text-emerald-700 underline font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-light p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by sender, subject..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Classification Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Verdict:</span>
            <select
              value={classification}
              onChange={(e) => { setClassification(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Verdicts</option>
              <option value="SPAM">SPAM</option>
              <option value="HAM">HAM (Safe)</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Risk:</span>
            <select
              value={riskLevel}
              onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Sender</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyData.length > 0 ? (
                historyData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleOpenDetail(row.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap font-medium">{row.created_at}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 max-w-[180px] truncate font-medium" title={row.sender}>{row.sender}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[240px] truncate" title={row.subject}>{row.subject}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-extrabold ${row.classification === 'SPAM' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {row.classification}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{row.category}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{row.risk_score}</td>
                    <td className="py-3.5 px-4">{getRiskBadge(row.risk_level)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{row.confidence}%</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetail(row.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 transition-colors cursor-pointer"
                          title="Inspect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePrompt(e, row)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    {loading ? 'Loading history records...' : 'No email records match the selected search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>Showing page {page} of {totalPages} ({totalRecords} total records)</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {emailToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="card-light max-w-md w-full p-6 space-y-5 bg-white shadow-2xl rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Email Record</h3>
                <p className="text-xs text-slate-500 font-medium">ID: #{emailToDelete.id} — {emailToDelete.sender}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Are you sure you want to delete this email from history?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEmailToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL INSPECTION MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="card-light max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative space-y-6 bg-white shadow-2xl rounded-2xl">
            <button
              onClick={() => { setSelectedEmail(null); if (onClearSelectedId) onClearSelectedId(); }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                selectedEmail.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                selectedEmail.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {selectedEmail.risk_level} RISK THREAT
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">Email Threat Details #{selectedEmail.id}</h2>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block font-bold">Classification</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedEmail.prediction}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Category</span>
                <span className="font-bold text-blue-700 text-sm">{selectedEmail.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Risk Score</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{selectedEmail.risk_score} / 100</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Model Version</span>
                <span className="font-mono text-slate-700 font-semibold">{selectedEmail.model_version}</span>
              </div>
            </div>

            {/* Email Sender & Subject */}
            <div className="space-y-2 text-xs">
              <div><span className="text-slate-500 font-bold">From: </span><span className="text-slate-900 font-mono font-medium">{selectedEmail.sender}</span></div>
              <div><span className="text-slate-500 font-bold">Subject: </span><span className="text-slate-900 font-semibold">{selectedEmail.subject}</span></div>
            </div>

            {/* Body */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Original Email Content</h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                {selectedEmail.body}
              </div>
            </div>

            {/* XAI Signals */}
            {selectedEmail.explainability?.signals && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">XAI Threat Indicators</h4>
                <div className="space-y-2">
                  {selectedEmail.explainability.signals.map((sig, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-blue-700">{sig.title}</div>
                      <div className="text-slate-700 font-medium">{sig.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
