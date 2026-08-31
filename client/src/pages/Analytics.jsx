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

  useEffect(() => {
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

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading visual analytics...</div>;
  }

  const categoryPieData = data.categories.map(c => ({
    name: c.category,
    value: c.total
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Visual Analytics & Spending Insights
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed breakdown of your lending, borrowing, and category distributions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown (Donut Chart) */}
        <div className="glass-card rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-bold text-white">Expenses by Category</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Lent + Borrowed</span>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">No category transactions available.</div>
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
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/60">
                {data.categories.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span className="text-slate-300 font-semibold truncate max-w-[90px]">{c.category}</span>
                    </div>
                    <span className="font-mono text-slate-200 font-bold">₹{c.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Activity Trends (Bar Chart) */}
        <div className="glass-card rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Monthly Given vs Received</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Last 6 Months</span>
          </div>

          {data.monthly.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">No monthly data available.</div>
          ) : (
            <div className="w-full h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    formatter={(val) => `₹${val.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
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
