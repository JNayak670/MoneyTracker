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
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6'];

export default function Analytics() {
  const [data, setData] = useState({ categories: [], monthly: [] });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/analytics');
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
    return <div className="py-20 text-center text-slate-500 text-sm">Loading visual analytics...</div>;
  }

  const categoryPieData = data.categories.map(c => ({
    name: c.category,
    value: c.total
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Visual Analytics & Spending Insights
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed breakdown of your lending, borrowing, and category distributions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown (Donut Chart) */}
        <div className="glass-card rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Expenses by Category</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Lent + Borrowed</span>
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
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                {data.categories.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span className="text-slate-700 font-semibold truncate max-w-[90px]">{c.category}</span>
                    </div>
                    <span className="font-mono text-slate-900 font-bold">₹{c.total.toLocaleString()}</span>
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
              <h2 className="text-base font-bold text-slate-900">Monthly Given vs Received</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Last 6 Months</span>
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
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="given" name="Given (Lent)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" name="Received (Borrowed)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="settled" name="Settled" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
