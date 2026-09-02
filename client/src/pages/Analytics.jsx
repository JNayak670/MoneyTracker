import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import ColorfulLoader from '../components/ColorfulLoader';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6'];

const CATEGORY_EMOJIS = {
  'Food & Dining': '🍕',
  'Rent & Bills': '⚡',
  'Travel & Trips': '✈️',
  'Entertainment': '🎬',
  'Loans & Cash': '💰',
  'Settlement': '🤝',
  'Shopping': '🛍️'
};

export default function Analytics() {
  const [data, setData] = useState({ categories: [], monthly: [] });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [res] = await Promise.all([
        api.get('/dashboard/analytics'),
        showLoading ? new Promise(resolve => setTimeout(resolve, 200)) : Promise.resolve()
      ]);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleUpdate = () => {
      fetchAnalytics();
    };

    window.addEventListener('transaction-updated', handleUpdate);
    return () => {
      window.removeEventListener('transaction-updated', handleUpdate);
    };
  }, []);

  if (loading) {
    return <ColorfulLoader fullScreen={false} minHeight="min-h-[70vh]" message="Analyzing Spending Patterns..." submessage="Compiling monthly trends, category shares and group velocity..." />;
  }

  const categoryPieData = data.categories.map(c => ({
    name: c.category,
    value: c.total
  }));

  const totalAnalyzed = data.categories.reduce((acc, curr) => acc + curr.total, 0);
  const topCategory = data.categories.length > 0 ? data.categories[0] : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Visual Analytics & Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Colorful visual breakdown of peer lending, borrowing, and category velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-black shadow-md shadow-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Analysis</span>
          </span>
        </div>
      </div>

      {/* Quick Visual Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5 border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 shadow-xs relative overflow-hidden">
          <div className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Total Tracked Volume</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950">
            ₹{totalAnalyzed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Across all categories & friends</div>
        </div>

        <div className="glass-card rounded-3xl p-5 border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 shadow-xs relative overflow-hidden">
          <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Top Category</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 flex items-center gap-2 truncate">
            <span>{CATEGORY_EMOJIS[topCategory?.category] || '🏷️'}</span>
            <span className="truncate">{topCategory?.category || 'None'}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">₹{(topCategory?.total || 0).toLocaleString()} spent</div>
        </div>

        <div className="glass-card rounded-3xl p-5 border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 shadow-xs relative overflow-hidden">
          <div className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Active Categories</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">
            {data.categories.length} Types
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Smart expense categorization</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown (Donut Chart) */}
        <div className="glass-card rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">Expenses by Category</h2>
            </div>
            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Lent + Borrowed
            </span>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No category transactions available.</div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => `₹${val.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', fontSize: '12px', color: '#0f172a', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Colorful Legend Grid */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                {data.categories.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-3 h-3 rounded-full shadow-xs flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-700 font-bold truncate">{CATEGORY_EMOJIS[c.category] || '🏷️'} {c.category}</span>
                    </div>
                    <span className="font-mono text-slate-900 font-black">₹{c.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Activity Trends (Bar Chart) */}
        <div className="glass-card rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-black text-slate-900">Monthly Lending vs Borrowing</h2>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              6-Month Trend
            </span>
          </div>

          {data.monthly.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No monthly data available.</div>
          ) : (
            <div className="w-full h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    formatter={(val) => `₹${val.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', fontSize: '12px', color: '#0f172a', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="given" name="Given (Lent)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="received" name="Received (Borrowed)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="settled" name="Settled" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
