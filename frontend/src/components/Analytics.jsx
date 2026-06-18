import React from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import '../styles/Analytics.css';

const Analytics = ({ items, categoryStats }) => {
  // Category distribution data
  const categoryData = categoryStats.map(cat => ({
    name: cat.category,
    value: cat.count
  }));

  // Status distribution
  const statusData = [
    {
      name: 'Fresh',
      value: items.filter(i => i.status === 'fresh').length,
      color: '#4CAF50'
    },
    {
      name: 'Expiring Soon',
      value: items.filter(i => i.status === 'expiring_soon').length,
      color: '#FF9800'
    },
    {
      name: 'Expired',
      value: items.filter(i => i.status === 'expired').length,
      color: '#F44336'
    }
  ];

  // Monthly waste trend (mock data)
  const monthlyData = [
    { month: 'Jan', waste: 2 },
    { month: 'Feb', waste: 3 },
    { month: 'Mar', waste: 1 },
    { month: 'Apr', waste: 4 },
    { month: 'May', waste: 2 },
    { month: 'Jun', waste: 3 }
  ];

  return (
    <div className="analytics-container">
      <h2>Inventory Analytics</h2>

      <div className="charts-grid">
        {/* Category Distribution */}
        <div className="chart-card">
          <h3>Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Overview */}
        <div className="chart-card">
          <h3>Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Waste Trend */}
        <div className="chart-card full-width">
          <h3>Monthly Food Waste Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="waste" 
                stroke="#F44336" 
                strokeWidth={2}
                dot={{ fill: '#F44336', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#4CAF50' }}>
            {statusData[0].value}
          </div>
          <div className="stat-label">Fresh Items</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#FF9800' }}>
            {statusData[1].value}
          </div>
          <div className="stat-label">Expiring Soon</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#F44336' }}>
            {statusData[2].value}
          </div>
          <div className="stat-label">Expired</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
