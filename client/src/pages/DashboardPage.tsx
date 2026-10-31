import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  IndianRupee,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  ShoppingCart,
  Boxes,
  Eye,
  FileText,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC<{ onNavigateToPos?: () => void }> = ({ onNavigateToPos }) => {
  const { isOwner } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.get('/reports/dashboard-summary'),
        api.get('/reports/charts?range=14d'),
      ]);
      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (chartRes.data.success) setChartData(chartRes.data.data);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Dashboard Analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy-900 to-slate-800 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Retail Intelligence Overview
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            DEEP E-BIKE & TOY MANAGEMENT
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Real-time sales, inventory valuation, and POS transactions.
          </p>
        </div>
        {onNavigateToPos && (
          <button
            onClick={onNavigateToPos}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-all self-start md:self-auto"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Terminal (F2)</span>
          </button>
        )}
      </div>

      {/* Low Stock Warning Banner if items are low */}
      {summary.lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-200/50 dark:bg-amber-900/50">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold">
                Low Stock Alert: {summary.lowStockCount} product(s) are at or below minimum threshold!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {summary.lowStockProducts.map((p) => `${p.name} (${p.availableQuantity} left)`).join(', ')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            Restock Required
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`₹ ${summary.todaySales.toLocaleString()}`}
          subtitle={`${summary.todayBillsCount} bill(s) generated today`}
          icon={IndianRupee}
          colorScheme="orange"
        />

        <StatCard
          title="Monthly Revenue"
          value={`₹ ${summary.monthlySales.toLocaleString()}`}
          subtitle={`${summary.monthlyBillsCount} sales this calendar month`}
          icon={ShoppingCart}
          colorScheme="blue"
        />

        {isOwner && summary.estimatedGrossProfit !== undefined && (
          <StatCard
            title="Gross Profit (Est.)"
            value={`₹ ${summary.estimatedGrossProfit.toLocaleString()}`}
            subtitle="Selling price minus purchase cost"
            icon={TrendingUp}
            colorScheme="emerald"
          />
        )}

        {isOwner && summary.totalStockValue !== undefined && (
          <StatCard
            title="Total Stock Valuation"
            value={`₹ ${summary.totalStockValue.toLocaleString()}`}
            subtitle={`${summary.totalStockUnits} units in stock (${summary.totalProducts} items)`}
            icon={Boxes}
            colorScheme="purple"
          />
        )}
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Products</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.totalProducts}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-semibold uppercase">Available Units</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.totalStockUnits}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-semibold uppercase">Low Stock Alerts</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {summary.lowStockCount}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-semibold uppercase">Staff Members</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.totalEmployees}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales & Profit Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sales & Profit Trends (Last 14 Days)
              </h3>
              <p className="text-xs text-slate-500">Daily revenue performance</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              INR (₹)
            </span>
          </div>

          <div className="h-72 w-full">
            {chartData?.dailyChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.dailyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EA580C" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#FFF',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Sales Revenue (₹)"
                    stroke="#EA580C"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  {isOwner && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Gross Profit (₹)"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white dark:bg-navy-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Payment Breakdown
            </h3>
            <p className="text-xs text-slate-500">Distribution across Cash, UPI, Card</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {chartData?.paymentChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.paymentChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {chartData.paymentChart.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#FFF',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No payment data available</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Real-time reconciled payment channels
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent POS Invoices
              </h3>
              <p className="text-xs text-slate-500">Latest completed sales transactions</p>
            </div>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-center rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.recentTransactions.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {sale.customer?.name || sale.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹ {sale.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'} size="sm">
                        {sale.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-navy-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Top Performing Products
          </h3>
          <p className="text-xs text-slate-500 mb-4">Ranked by units sold</p>

          <div className="space-y-3">
            {summary.topSellingProducts.map((p, idx) => (
              <div
                key={p.productId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {p.totalSold} units sold
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  ₹ {p.totalRevenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
