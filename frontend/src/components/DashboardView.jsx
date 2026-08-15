import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Mail, AlertTriangle, ArrowUpRight, Search, Filter, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { dashboardAPI } from '../services/api';

const COLORS = {
  Spam: '#ef4444',
  Phishing: '#9333ea',
  Promotional: '#f59e0b',
  Suspicious: '#ea580c',
  Legitimate: '#10b981',
  Ham: '#10b981'
};

export default function DashboardView({ onAnalyzeClick, onViewDetail }) {
  const [stats, setStats] = useState({
    total_analyzed: 0,
    spam_detected: 0,
    safe_emails: 0,
    high_risk_emails: 0
  });

  const [trendDays, setTrendDays] = useState(7);
  const [trends, setTrends] = useState([]);
  const [riskDist, setRiskDist] = useState({ risk_levels: [], category_breakdown: [] });
  const [recentThreats, setRecentThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table filtering & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes, riskRes, threatsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getTrends(trendDays),
        dashboardAPI.getRiskDistribution(),
        dashboardAPI.getRecentThreats()
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (trendsRes.data) setTrends(trendsRes.data);
      if (riskRes.data) setRiskDist(riskRes.data);
      if (threatsRes.data) setRecentThreats(threatsRes.data);
    } catch (err) {
      console.error("Dashboard API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [trendDays]);

  // Filtered threats table
  const filteredThreats = recentThreats.filter(item => {
    const matchesSearch = (item.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || item.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const totalPages = Math.ceil(filteredThreats.length / itemsPerPage) || 1;
  const paginatedThreats = filteredThreats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs">High Risk</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs">Medium Risk</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs">Low Risk</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Security Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Monitor email threats and AI detection activity in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onAnalyzeClick}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Analyze New Email</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Balanced Cards - Phishing Threats Removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emails */}
        <div className="card-light p-5 card-light-hover">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Analyzed</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.total_analyzed}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">All processed emails</div>
        </div>

        {/* Spam Detected */}
        <div className="card-light p-5 card-light-hover">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Spam Detected</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{stats.spam_detected}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {stats.total_analyzed ? roundPercent(stats.spam_detected, stats.total_analyzed) : 0}% of total emails
          </div>
        </div>

        {/* Safe Emails */}
        <div className="card-light p-5 card-light-hover">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Safe Emails</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.safe_emails}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Verified legitimate</div>
        </div>

        {/* High Risk Emails */}
        <div className="card-light p-5 card-light-hover border-rose-200 bg-rose-50/30">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">High Risk</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{stats.high_risk_emails}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Requires immediate action</div>
        </div>
      </div>

      {/* Charts Section: Donut + Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classification Donut Chart */}
        <div className="card-light p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Email Categorization</h2>
            <p className="text-xs text-slate-500 font-medium mb-4">Breakdown by threat category</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {riskDist.category_breakdown && riskDist.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDist.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {riskDist.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                            <p className="font-bold text-slate-900 mb-1">{data.name}</p>
                            <p className="text-slate-600">Count: <span className="font-mono font-bold text-blue-600">{data.count}</span></p>
                            <p className="text-slate-600">Percentage: <span className="font-mono font-bold text-blue-600">{data.percentage}%</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Loading chart data...</div>
            )}
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            {riskDist.category_breakdown && riskDist.category_breakdown.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[cat.name] || '#64748b' }} />
                  <span>{cat.name}</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detection Trend Line Chart */}
        <div className="card-light p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Detection Trend</h2>
              <p className="text-xs text-slate-500 font-medium">Historical email scanning volume & threat timeline</p>
            </div>
            {/* 7 Days / 30 Days Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setTrendDays(7)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  trendDays === 7 ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTrendDays(30)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  trendDays === 30 ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="total" name="Total Emails" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="spam" name="Spam Detected" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="safe" name="Safe Emails" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="high_risk" name="High Risk" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Distribution Cards */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 mb-3">Risk Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskDist.risk_levels && riskDist.risk_levels.map((r, i) => (
            <div key={i} className="card-light p-5 border-l-4" style={{ borderColor: r.color }}>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-extrabold text-xs tracking-wider" style={{ color: r.color }}>{r.level}</span>
                <span className="font-mono text-xs font-bold text-slate-600">{r.percentage}%</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{r.count} <span className="text-xs font-normal text-slate-500">emails</span></div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden border border-slate-200">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.percentage}%`, backgroundColor: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Threat Detections Table */}
      <div className="card-light p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Recent Threats & Scanned Emails</h2>
            <p className="text-xs text-slate-500 font-medium">Latest email classifications from live API database</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by sender/subject..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedThreats.length > 0 ? (
                paginatedThreats.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-700 max-w-[200px] truncate font-medium" title={item.sender}>
                      {item.sender}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[280px] truncate" title={item.subject}>
                      {item.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.risk_score} <span className="text-[10px] text-slate-400">/ 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getRiskBadge(item.risk_level)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {item.time}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewDetail(item.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No threat records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredThreats.length ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredThreats.length)} of {filteredThreats.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono font-bold text-slate-800">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function roundPercent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
