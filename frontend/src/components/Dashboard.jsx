import React from 'react';
import { FiTrendingUp, FiAlertCircle, FiCheck, FiX, FiClock, FiPackage, FiTarget } from 'react-icons/fi';
import '../styles/Dashboard.css';

const SHELF_CAPACITY_UNITS = {
  'Top Shelf': 8,
  'Middle Shelf': 8,
  'Bottom Shelf': 8,
  'Door Rack': 5,
  'Crisper Drawer': 5,
  Freezer: 4,
  'Chiller Tray': 2,
};

const DashboardCard = ({ icon: Icon, title, value, color, trend, tone }) => {
  return (
    <div className={`dashboard-card ${tone || ''}`} style={{ '--card-accent': color }}>
      <div className="card-header">
        <Icon className="card-icon" style={{ color }} size={28} />
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <div className="card-value">{value}</div>
        {trend && (
          <div className="card-trend" style={{ color: trend > 0 ? '#FF9800' : '#4CAF50' }}>
            <FiTrendingUp size={16} />
            <span>{trend > 0 ? '+' : ''}{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const getItemsExpiringWithinOneDay = (items) => {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return items
    .filter(item => {
      const expiryDate = new Date(item.expiry_date);
      return expiryDate > now && expiryDate <= oneDayFromNow;
    })
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
};

const buildRecipeSuggestions = (items) => {
  const names = items.map(item => item.item_name);
  if (names.length === 0) return [];

  const joined = names.slice(0, 4).join(', ');
  const categories = new Set(items.map(item => item.category));
  const suggestions = [
    {
      title: 'Quick stir fry',
      description: `Use ${joined} with garlic, oil, salt, and any grains you have.`
    },
    {
      title: 'Rescue bowl',
      description: `Chop ${joined}, add a sauce or dressing, and serve over rice, toast, or noodles.`
    }
  ];

  if (categories.has('Fruits') || categories.has('Dairy')) {
    suggestions.push({
      title: 'Smoothie or parfait',
      description: `Blend or layer ${joined} with milk, curd, oats, or nuts.`
    });
  }

  return suggestions.slice(0, 3);
};

const buildFallbackPatterns = (items) => {
  const expiredItems = items.filter(item => item.status === 'expired');
  const soonItems = items.filter(item => item.status === 'expiring_soon');
  const suggestions = [...expiredItems, ...soonItems].slice(0, 3).map(item => ({
    item_name: item.item_name,
    category: item.category,
    average_consumption_days: null,
    wasted_count: item.status === 'expired' ? 1 : 0,
    total_events: 0,
    messages: [
      item.status === 'expired'
        ? `You often risk wasting ${item.item_name}.`
        : `${item.item_name} is getting close to expiry.`
    ],
    recommendation: item.status === 'expired'
      ? `Buy smaller quantity of ${item.item_name} next time.`
      : `Use ${item.item_name} soon or buy it closer to the day you need it.`,
    confidence: 1,
  }));

  return {
    total_events: 0,
    insights: suggestions,
  };
};

const buildShelfLayout = (items) => {
  return Object.entries(SHELF_CAPACITY_UNITS).map(([shelf, capacity]) => {
    const shelfItems = items.filter(item => (item.shelf_location || 'Top Shelf') === shelf);
    const used = shelfItems.reduce((sum, item) => sum + (item.space_units || 1), 0);

    return {
      shelf,
      capacity,
      used,
      empty: Math.max(capacity - used, 0),
      percent: Math.min((used / capacity) * 100, 100),
      items: shelfItems,
    };
  });
};

const Dashboard = ({ stats, items = [], patternInsights }) => {
  const oneDayItems = getItemsExpiringWithinOneDay(items);
  const recipeSuggestions = buildRecipeSuggestions(oneDayItems);
  const learnedPatterns = patternInsights?.insights?.length
    ? patternInsights
    : buildFallbackPatterns(items);
  const usedSpace = stats?.used_space || 0;
  const capacity = stats?.fridge_capacity || 40;
  const emptySpace = stats?.empty_space ?? Math.max(capacity - usedSpace, 0);
  const spacePercent = Math.min((usedSpace / capacity) * 100, 100);
  const shelfLayout = buildShelfLayout(items);
  const hasAlerts = Boolean(
    stats?.unread_notifications > 0 ||
    stats?.expired_items > 0 ||
    stats?.expiring_soon_items > 0
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Quick overview of your fridge, expiry alerts, and useful suggestions.</p>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          icon={FiCheck}
          title="Total Items"
          value={stats?.total_items || 0}
          color="#2196F3"
          tone="total"
        />
        <DashboardCard
          icon={FiTrendingUp}
          title="Fresh Items"
          value={stats?.fresh_items || 0}
          color="#4CAF50"
          tone="fresh"
        />
        <DashboardCard
          icon={FiAlertCircle}
          title="Expiring Soon"
          value={stats?.expiring_soon_items || 0}
          color="#FF9800"
          tone="expiring"
        />
        <DashboardCard
          icon={FiX}
          title="Expired Items"
          value={stats?.expired_items || 0}
          color="#F44336"
          tone="expired"
        />
      </div>

      <div className="smart-panels">
        <div className="smart-panel shelf-panel">
          <div className="smart-panel-header">
            <h2><FiPackage size={17} /> Shelf Layout</h2>
            <span>40 units total</span>
          </div>
          <div className="shelf-list">
            {shelfLayout.map(shelf => (
              <div className="shelf-item" key={shelf.shelf}>
                <div className="shelf-row">
                  <strong>{shelf.shelf}</strong>
                  <span>{shelf.used}/{shelf.capacity} units</span>
                </div>
                <div className="shelf-meter">
                  <div className="shelf-meter-fill" style={{ width: `${shelf.percent}%` }} />
                </div>
                {shelf.items.length === 0 ? (
                  <p>Empty shelf</p>
                ) : (
                  <div className="shelf-tags">
                    {shelf.items.map(item => (
                      <span key={item.id}>
                        {item.item_name} ({item.space_units || 1})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="smart-panel">
          <div className="smart-panel-header">
            <h2>Fridge Space</h2>
            <span>{emptySpace} unit{emptySpace !== 1 ? 's' : ''} empty</span>
          </div>
          <div className="space-meter">
            <div className="space-meter-fill" style={{ width: `${spacePercent}%` }} />
          </div>
          <p>
            {usedSpace} of {capacity} space units used.
            {emptySpace === 0 ? ' No empty place remains in your fridge.' : ' You still have room for new items.'}
          </p>
        </div>

        <div className="smart-panel">
          <div className="smart-panel-header">
            <h2><FiClock size={17} /> Expires In 1 Day</h2>
            <span>{oneDayItems.length} item{oneDayItems.length !== 1 ? 's' : ''}</span>
          </div>
          {oneDayItems.length === 0 ? (
            <p>No items are expiring within the next 24 hours.</p>
          ) : (
            <div className="one-day-list">
              {oneDayItems.map(item => (
                <div className="one-day-item" key={item.id}>
                  <strong>{item.item_name}</strong>
                  <span>{new Date(item.expiry_date).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="smart-panel recipes-panel">
          <div className="smart-panel-header">
            <h2><FiPackage size={17} /> Recipe Suggestions</h2>
            <span>Use soon</span>
          </div>
          {recipeSuggestions.length === 0 ? (
            <p>Recipe suggestions will appear when an item is expiring within one day.</p>
          ) : (
            <div className="recipe-list">
              {recipeSuggestions.map(recipe => (
                <div className="recipe-item" key={recipe.title}>
                  <strong>{recipe.title}</strong>
                  <p>{recipe.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="smart-panel pattern-panel">
          <div className="smart-panel-header">
            <h2><FiTarget size={17} /> Consumption Pattern Learning</h2>
            <span>{patternInsights?.total_events || 0} learned</span>
          </div>
          {learnedPatterns.insights.length === 0 ? (
            <p>Mark inventory as used or wasted to start learning your food habits.</p>
          ) : (
            <div className="pattern-list">
              {learnedPatterns.insights.slice(0, 3).map(pattern => (
                <div className="pattern-item" key={`${pattern.item_name}-${pattern.recommendation}`}>
                  <div className="pattern-stars" aria-label={`${pattern.confidence || 1} confidence`}>
                    {Array.from({ length: Math.max(1, pattern.confidence || 1) }).map((_, index) => (
                      <span key={index} />
                    ))}
                  </div>
                  {pattern.messages.map(message => (
                    <p key={message}>{message}</p>
                  ))}
                  <strong>{pattern.recommendation}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasAlerts && (
      <div className="dashboard-alerts">
        {stats?.unread_notifications > 0 && (
          <div className="alert alert-info">
            <FiAlertCircle size={20} />
            <div>
              <p><strong>{stats.unread_notifications} new notification{stats.unread_notifications !== 1 ? 's' : ''}</strong></p>
              <p>You have unread alerts about food expiry</p>
            </div>
          </div>
        )}

        {stats?.expired_items > 0 && (
          <div className="alert alert-danger">
            <FiX size={20} />
            <div>
              <p><strong>{stats.expired_items} item{stats.expired_items !== 1 ? 's' : ''} expired</strong></p>
              <p>Please review and remove expired food items</p>
            </div>
          </div>
        )}

        {stats?.expiring_soon_items > 0 && (
          <div className="alert alert-warning">
            <FiAlertCircle size={20} />
            <div>
              <p><strong>{stats.expiring_soon_items} item{stats.expiring_soon_items !== 1 ? 's' : ''} expiring soon</strong></p>
              <p>The buzzer reminds hourly until these alerts are read</p>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Dashboard;
