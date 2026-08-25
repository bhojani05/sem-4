import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('reports/stats/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Financial Analytics" />
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Generating analytics reports...</div>
      </div>
    );
  }

  // Expense Pie Chart Config (Pure Sapphire & Cyan Financial Palette - NO PURPLE)
  const expenseLabels = data?.expense_by_category?.map(item => item.category) || [];
  const expenseTotals = data?.expense_by_category?.map(item => parseFloat(item.total)) || [];

  const pieChartData = {
    labels: expenseLabels,
    datasets: [
      {
        label: 'Expenses ($)',
        data: expenseTotals,
        backgroundColor: [
          '#0284c7',
          '#06b6d4',
          '#10b981',
          '#f59e0b',
          '#3b82f6',
          '#0891b2',
          '#f43f5e'
        ],
        borderWidth: 0,
      },
    ],
  };

  // Asset Bar Chart Config (Sapphire Blue - NO PURPLE)
  const assetLabels = data?.asset_breakdown?.map(item => item.asset_type) || [];
  const assetValues = data?.asset_breakdown?.map(item => parseFloat(item.total_val)) || [];

  const barChartData = {
    labels: assetLabels,
    datasets: [
      {
        label: 'Asset Total Value ($)',
        data: assetValues,
        backgroundColor: 'rgba(2, 132, 199, 0.85)',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div>
      <Navbar title="Analytics & Visual Reports" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Pie Chart Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', alignSelf: 'flex-start' }}>
            Expense Distribution by Category
          </h3>
          {expenseLabels.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>No expense records available.</div>
          ) : (
            <div style={{ width: '280px', height: '280px' }}>
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          )}
        </div>

        {/* Bar Chart Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Asset Allocation by Class
          </h3>
          {assetLabels.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>No portfolio data available.</div>
          ) : (
            <div style={{ height: '280px' }}>
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
