import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { 
  PieChart, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  DollarSign,
  Wallet,
  Coins,
  ShieldAlert,
  BadgeCheck,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

const formatApiError = (err, defaultMsg) => {
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      const parts = [];
      for (const [k, v] of Object.entries(data)) {
        const valStr = Array.isArray(v) ? v.join(', ') : String(v);
        parts.push(k !== 'detail' ? `${k}: ${valStr}` : valStr);
      }
      if (parts.length > 0) return parts.join(' | ');
    }
  }
  return err.message || defaultMsg;
};

const Portfolio = () => {
  const [assets, setAssets] = useState([]);
  const [marketCatalog, setMarketCatalog] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('holdings'); // 'holdings' | 'market'
  
  // Add Asset Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState('Stocks');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);

  // Sell Shares Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedAssetToSell, setSelectedAssetToSell] = useState(null);
  const [sellQuantity, setSellQuantity] = useState('1');
  const [sellPrice, setSellPrice] = useState('');
  const [selling, setSelling] = useState(false);

  // Deposit & Withdraw Cash Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [cashProcessing, setCashProcessing] = useState(false);

  // Market Catalog Search & Filter
  const [marketSearch, setMarketSearch] = useState('');
  const [marketCategory, setMarketCategory] = useState('All');
  const [lastUpdated, setLastUpdated] = useState('');

  const { addToast } = useToast();

  const fetchPortfolioData = useCallback(async () => {
    try {
      const t = Date.now();
      const results = await Promise.allSettled([
        api.get(`portfolio/?_t=${t}`),
        api.get(`portfolio/market_catalog/?_t=${t}`),
        api.get(`dashboard/stats/?_t=${t}`)
      ]);

      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value.data)) {
        setAssets(results[0].value.data);
      }
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value.data)) {
        setMarketCatalog(results[1].value.data);
      }
      if (results[2].status === 'fulfilled' && results[2].value.data) {
        setCashBalance(results[2].value.data.net_balance || 0);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Auto-tick refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timerId;
    let isMounted = true;

    const poll = async () => {
      await fetchPortfolioData();
      if (isMounted) {
        timerId = setTimeout(poll, 2500); // Perpetual 2.5s auto-tick polling!
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [fetchPortfolioData]);

  const handleFetchLivePrice = async () => {
    if (!symbol) {
      addToast('Please enter a Symbol / Ticker first.', 'info');
      return;
    }
    setFetchingPrice(true);
    try {
      const res = await api.get(`portfolio/fetch_price/?symbol=${symbol}&asset_type=${assetType}`);
      setCurrentPrice(res.data.current_price);
      setPurchasePrice(res.data.current_price);
      addToast(`Live price updated for ${symbol}: $${res.data.current_price}`, 'success');
    } catch (err) {
      addToast('Unable to fetch live price automatically. Please enter price manually.', 'error');
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleOpenAddShareModal = (catalogItem) => {
    setName(catalogItem.name);
    setSymbol(catalogItem.symbol);
    setAssetType(catalogItem.asset_type || 'Stocks');
    setCurrentPrice(catalogItem.current_price);
    setPurchasePrice(catalogItem.current_price);
    setQuantity('1');
    setIsAddModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity || 0);
    const priceNum = parseFloat(purchasePrice || currentPrice || 0);
    const totalCost = qtyNum * priceNum;

    if (totalCost > cashBalance) {
      addToast(`Insufficient Cash! Required: $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Available: $${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'error');
      return;
    }

    try {
      await api.post('portfolio/', {
        name: name || symbol.toUpperCase(),
        symbol: symbol.toUpperCase(),
        asset_type: assetType,
        quantity: qtyNum,
        purchase_price: priceNum,
        current_price: priceNum,
      });
      setIsAddModalOpen(false);
      resetForm();
      addToast(`Purchased & Added ${name || symbol} to portfolio! Cash balance updated.`, 'success');
      fetchPortfolioData();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to purchase asset.'), 'error');
    }
  };

  const handleOpenSellModal = (asset) => {
    setSelectedAssetToSell(asset);
    setSellQuantity('1');
    setSellPrice(asset.current_price || asset.purchase_price || '0');
    setIsSellModalOpen(true);
  };

  const handleExecuteSellOrder = async (e) => {
    e.preventDefault();
    if (!selectedAssetToSell) return;

    let sellQtyNum = parseFloat(sellQuantity || 0);
    const maxQty = parseFloat(selectedAssetToSell.quantity || 0);

    if (isNaN(sellQtyNum) || sellQtyNum <= 0) {
      addToast('Please enter a valid sell quantity greater than 0.', 'error');
      return;
    }

    if (sellQtyNum > maxQty) {
      sellQtyNum = maxQty;
    }

    setSelling(true);
    try {
      const payloadQty = sellQtyNum.toString();
      const fallbackPrice = selectedAssetToSell.current_price || selectedAssetToSell.purchase_price || 0;
      const payloadPrice = (parseFloat(sellPrice) || parseFloat(fallbackPrice) || 0).toString();

      const res = await api.post(`portfolio/${selectedAssetToSell.id}/sell/`, {
        quantity: payloadQty,
        price: payloadPrice,
      });

      setIsSellModalOpen(false);
      addToast(`${res.data.message} Proceeds of $${res.data.proceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })} added to your account!`, 'success');
      fetchPortfolioData();
    } catch (err) {
      addToast(formatApiError(err, 'Sell transaction failed.'), 'error');
    } finally {
      setSelling(false);
    }
  };

  const handleDepositCash = async (e) => {
    e.preventDefault();
    const amt = parseFloat(cashAmount || 0);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid deposit amount greater than $0.', 'error');
      return;
    }
    setCashProcessing(true);
    try {
      await api.post('transactions/', {
        amount: amt.toString(),
        type: 'income',
        category: 'Deposit / Cash In',
        description: cashNote || 'Account Cash Deposit / Buying Power Top-up',
        date: new Date().toISOString().split('T')[0]
      });
      setIsDepositModalOpen(false);
      setCashAmount('');
      setCashNote('');
      addToast(`Successfully deposited $${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })} into account cash balance!`, 'success');
      fetchPortfolioData();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to deposit funds.'), 'error');
    } finally {
      setCashProcessing(false);
    }
  };

  const handleWithdrawCash = async (e) => {
    e.preventDefault();
    const amt = parseFloat(cashAmount || 0);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid withdrawal amount greater than $0.', 'error');
      return;
    }
    if (amt > cashBalance) {
      addToast(`Insufficient cash balance ($${cashBalance.toLocaleString()} available).`, 'error');
      return;
    }
    setCashProcessing(true);
    try {
      await api.post('transactions/', {
        amount: amt.toString(),
        type: 'expense',
        category: 'Withdrawal / Cash Out',
        description: cashNote || 'Account Cash Withdrawal',
        date: new Date().toISOString().split('T')[0]
      });
      setIsWithdrawModalOpen(false);
      setCashAmount('');
      setCashNote('');
      addToast(`Successfully withdrew $${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })} from account cash balance!`, 'success');
      fetchPortfolioData();
    } catch (err) {
      addToast(formatApiError(err, 'Failed to withdraw funds.'), 'error');
    } finally {
      setCashProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove asset entry from portfolio?')) {
      try {
        await api.delete(`portfolio/${id}/`);
        addToast('Asset removed.', 'info');
        fetchPortfolioData();
      } catch (err) {
        addToast('Failed to delete asset.', 'error');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setSymbol('');
    setAssetType('Stocks');
    setQuantity('');
    setPurchasePrice('');
    setCurrentPrice('');
  };

  const totalPortfolioValue = assets.reduce((acc, curr) => acc + parseFloat(curr.total_value || 0), 0);
  const totalUnrealizedPL = assets.reduce((acc, curr) => acc + parseFloat(curr.unrealized_pl || 0), 0);
  const combinedNetWorth = cashBalance + totalPortfolioValue;

  const filteredCatalog = marketCatalog.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(marketSearch.toLowerCase()) || item.symbol.toLowerCase().includes(marketSearch.toLowerCase());
    const matchesCategory = marketCategory === 'All' || item.asset_type === marketCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <Navbar title="Portfolio & Trading Directory" />

      {/* Live Market Feed Indicator Banner */}
      <div className="glass-panel" style={{ padding: '0.65rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ height: '10px', width: '10px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.03em' }}>
            LIVE MARKET TICKER ACTIVE
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            • Auto-updating prices live every 3 seconds
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Last Market Tick: <span style={{ color: '#0284c7' }}>{lastUpdated}</span>
            </span>
          )}
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}
            onClick={fetchPortfolioData}
            title="Click to force sync live market prices immediately"
          >
            <RefreshCw size={13} /> Sync Prices Now
          </button>
        </div>
      </div>

      {/* Account Cash Dollars & Buying Power Executive Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        {/* 1. Available Buying Power (Cash) */}
        <div className="glass-panel portfolio-stat-card card-buying-power">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span className="card-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Available Buying Power
              </span>
              <div className="card-icon-bg" style={{ padding: '0.4rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color="#10b981" />
              </div>
            </div>
            <div className="card-val" style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="card-subtext" style={{ fontSize: '0.76rem', marginTop: '0.25rem', display: 'block' }}>
              Liquid funds available for instant orders
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
            <button
              className="btn btn-card-deposit"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', flex: 1, justifyContent: 'center', borderRadius: '8px' }}
              onClick={() => { setCashAmount(''); setCashNote(''); setIsDepositModalOpen(true); }}
            >
              <Plus size={14} /> Deposit
            </button>
            <button
              className="btn btn-card-withdraw"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', flex: 1, justifyContent: 'center', fontWeight: 600, borderRadius: '8px' }}
              onClick={() => { setCashAmount(''); setCashNote(''); setIsWithdrawModalOpen(true); }}
            >
              <ArrowDownRight size={14} /> Withdraw
            </button>
          </div>
        </div>

        {/* 2. Total Invested Value */}
        <div className="glass-panel portfolio-stat-card card-invested-val">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span className="card-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Invested Value
              </span>
              <div className="card-icon-bg" style={{ padding: '0.4rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={18} color="#0284c7" />
              </div>
            </div>
            <div className="card-val" style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <span className="card-subtext" style={{ fontSize: '0.76rem', marginTop: '0.5rem', display: 'block' }}>
            Current market worth of held equities & crypto
          </span>
        </div>

        {/* 3. Unrealized Profit & Loss (P&L) */}
        <div className={`glass-panel portfolio-stat-card ${totalUnrealizedPL >= 0 ? 'card-pl-positive' : 'card-pl-negative'}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span className="card-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Unrealized Return (P&L)
              </span>
              <div className="card-icon-bg" style={{ padding: '0.4rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalUnrealizedPL >= 0 ? <TrendingUp size={18} color="#10b981" /> : <ArrowDownRight size={18} color="#f43f5e" />}
              </div>
            </div>
            <div className="card-val" style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <span className="card-subtext" style={{ fontSize: '0.76rem', marginTop: '0.5rem', display: 'block' }}>
            Overall return on invested capital
          </span>
        </div>

        {/* 4. Combined Total Net Worth */}
        <div className="glass-panel portfolio-stat-card card-net-worth">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span className="card-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Combined Total Net Worth
              </span>
              <div className="card-icon-bg" style={{ padding: '0.4rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="#a855f7" />
              </div>
            </div>
            <div className="card-val" style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              ${combinedNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <span className="card-subtext" style={{ fontSize: '0.76rem', marginTop: '0.5rem', display: 'block' }}>
            Cash buying power + portfolio assets
          </span>
        </div>

      </div>

      {/* Tab Controls & Add Custom Asset Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={`btn ${tab === 'holdings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('holdings')}
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <PieChart size={18} /> My Holdings ({assets.length})
          </button>
          <button
            className={`btn ${tab === 'market' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('market')}
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <Layers size={18} /> Market Explorer
          </button>
        </div>

        <button className="btn btn-primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus size={18} /> Buy Custom Asset
        </button>
      </div>

      {/* VIEW 1: MY HOLDINGS TABLE */}
      {tab === 'holdings' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asset</th>
                  <th>Ticker</th>
                  <th>Class</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Current</th>
                  <th>Value</th>
                  <th>Unrealized P&L</th>
                  <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textTransform: 'none', color: 'var(--text-muted)' }}>
                      No assets in portfolio. Switch to "Market Explorer" tab to buy shares with 1 click!
                    </td>
                  </tr>
                ) : (
                  assets.map((asset, idx) => {
                    const pl = parseFloat(asset.unrealized_pl || 0);
                    const plPercent = parseFloat(asset.unrealized_pl_percent || 0);
                    const avgCost = parseFloat(asset.purchase_price || asset.current_price || 0);
                    const currPrice = parseFloat(asset.current_price || asset.purchase_price || 0);

                    return (
                      <tr key={`${asset.id}-${asset.current_price}`}>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{asset.name}</td>
                        <td>
                          <span className="badge badge-ticker" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#0284c7', fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {asset.symbol}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{asset.asset_type}</td>
                        <td style={{ fontWeight: 700 }}>{parseFloat(asset.quantity || 0)}</td>
                        <td>${avgCost.toFixed(2)}</td>
                        <td>${currPrice.toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>${parseFloat(asset.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 700, color: pl >= 0 ? '#10b981' : '#f43f5e', fontSize: '0.8rem' }}>
                          {pl >= 0 ? '+' : ''}${pl.toFixed(2)} <span style={{ fontSize: '0.72rem' }}>({plPercent.toFixed(1)}%)</span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '0.5rem' }}>
                          <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                            {/* BUY MORE SHARES BUTTON */}
                            <button
                              className="btn btn-table-buy"
                              onClick={() => handleOpenAddShareModal({
                                name: asset.name,
                                symbol: asset.symbol,
                                asset_type: asset.asset_type || 'Stocks',
                                current_price: currPrice
                              })}
                              title="Buy More Shares of this Asset"
                            >
                              <Plus size={12} /> Buy
                            </button>

                            {/* SELL SHARES BUTTON */}
                            <button
                              className="btn btn-table-sell"
                              onClick={() => handleOpenSellModal(asset)}
                              title="Sell Shares & Add Cash to Account"
                            >
                              Sell
                            </button>

                            <button
                              className="btn btn-table-delete"
                              onClick={() => handleDelete(asset.id)}
                              title="Remove Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MARKET EXPLORER */}
      {tab === 'market' && (
        <div>
          {/* Market Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Stocks', 'Cryptocurrency', 'Gold & Precious Metals'].map((cat) => (
                <button
                  key={cat}
                  className={`btn ${marketCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={() => setMarketCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search symbol or company..."
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Asset Market Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredCatalog.map((item) => (
              <div key={`${item.symbol}-${item.current_price}`} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.name}</h4>
                      <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', marginTop: '0.2rem' }}>
                        {item.symbol} &bull; {item.asset_type}
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: item.positive ? '#10b981' : '#f43f5e',
                      background: item.positive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      {item.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {item.change_24h}
                    </span>
                  </div>

                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.positive ? '#10b981' : '#f43f5e', transition: 'color 0.4s ease' }}>
                      ${parseFloat(item.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                  onClick={() => handleOpenAddShareModal(item)}
                >
                  <Plus size={16} /> Buy Shares
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 DEPOSIT CASH MODAL */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Deposit Funds to Account">
        <form onSubmit={handleDepositCash}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Cash Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Deposit Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 5000"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method / Reference Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Bank Transfer, Wire, Debit Card"
              value={cashNote}
              onChange={(e) => setCashNote(e.target.value)}
            />
          </div>

          {cashAmount && (() => {
            const amtNum = parseFloat(cashAmount || 0);
            const newBal = cashBalance + amtNum;
            return (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                marginBottom: '1.25rem',
                display: 'flex',
                justify: 'space-between',
                fontSize: '0.9rem'
              }}>
                <span>New Cash Balance After Deposit:</span>
                <strong style={{ color: '#10b981' }}>${newBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            );
          })()}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={cashProcessing || !cashAmount || parseFloat(cashAmount || 0) <= 0}
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', background: '#10b981', borderColor: '#10b981' }}
          >
            {cashProcessing ? 'Processing Deposit...' : 'Confirm & Deposit Funds'}
          </button>
        </form>
      </Modal>

      {/* 🔴 WITHDRAW CASH MODAL */}
      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Withdraw Cash from Account">
        <form onSubmit={handleWithdrawCash}>
          <div style={{
            background: 'rgba(2, 132, 199, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available Cash to Withdraw</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7' }}>
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Withdrawal Amount ($)
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 1000"
                style={{ fontSize: '1.2rem', fontWeight: 700, flex: 1 }}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.65rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setCashAmount(cashBalance > 0 ? (Math.floor(cashBalance * 100) / 100).toFixed(2) : '0')}
                title="Fill maximum available cash amount"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transfer Destination / Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Chase Bank Account, ATM Cash Out"
              value={cashNote}
              onChange={(e) => setCashNote(e.target.value)}
            />
          </div>

          {cashAmount && (() => {
            const amtNum = parseFloat(cashAmount || 0);
            const remaining = cashBalance - amtNum;
            const isAffordable = amtNum <= cashBalance;
            return (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: isAffordable ? 'rgba(6, 182, 212, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                marginBottom: '1.25rem',
                display: 'flex',
                justify: 'space-between',
                fontSize: '0.9rem'
              }}>
                <span>Remaining Cash Balance After Withdrawal:</span>
                <strong style={{ color: isAffordable ? '#06b6d4' : '#f43f5e' }}>
                  ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            );
          })()}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={cashProcessing || !cashAmount || parseFloat(cashAmount || 0) <= 0 || parseFloat(cashAmount || 0) > cashBalance}
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
          >
            {cashProcessing ? 'Processing Withdrawal...' : 'Confirm & Withdraw Cash'}
          </button>
        </form>
      </Modal>

      {/* 🟢 BUY SHARES MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Buy ${name || 'Shares'}`}>
        <form onSubmit={handleCreate}>
          <div style={{
            background: 'rgba(2, 132, 199, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            marginBottom: '1.25rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{name || 'Custom Asset'} ({symbol || 'SYMBOL'})</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class: {assetType}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit Price</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>
                ${(currentPrice || purchasePrice) ? parseFloat(currentPrice || purchasePrice).toLocaleString() : '0.00'}
              </div>
            </div>
          </div>

          {!name && (
            <>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input type="text" className="form-control" placeholder="e.g. Bitcoin, Apple Inc." value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Symbol / Ticker</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-control" placeholder="e.g. BTC, ETH, AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required />
                  <button type="button" className="btn btn-secondary" onClick={handleFetchLivePrice} disabled={fetchingPrice}>
                    <Zap size={16} color="#f59e0b" /> {fetchingPrice ? '...' : 'Live Price'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Asset Class / Category</label>
                <select className="form-control" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                  <option value="Stocks">Stocks</option>
                  <option value="Cryptocurrency">Cryptocurrency</option>
                  <option value="Gold & Precious Metals">Gold & Precious Metals</option>
                  <option value="Bonds">Bonds</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price Per Share ($)</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-control"
                  placeholder="e.g. 225.50"
                  value={purchasePrice || currentPrice}
                  onChange={(e) => {
                    setPurchasePrice(e.target.value);
                    setCurrentPrice(e.target.value);
                  }}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Quantity of Shares to Purchase (Integers or Decimals e.g. 10 or 2.5)
            </label>
            <input
              type="number"
              step="0.00000001"
              className="form-control"
              placeholder="e.g. 10 or 2.5"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* REAL-TIME COST & CASH CALCULATIONS */}
          {quantity && (currentPrice || purchasePrice) && (() => {
            const qtyNum = parseFloat(quantity || 0);
            const priceNum = parseFloat(currentPrice || purchasePrice || 0);
            const totalCost = qtyNum * priceNum;
            const remainingCash = cashBalance - totalCost;
            const isAffordable = totalCost <= cashBalance;

            return (
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: isAffordable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${isAffordable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Purchase Cost:</span>
                  <strong style={{ fontSize: '1.1rem', color: isAffordable ? '#10b981' : '#f43f5e' }}>
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cash Balance After Purchase:</span>
                  <strong style={{ color: isAffordable ? 'var(--text-main)' : '#f43f5e' }}>
                    ${remainingCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                {!isAffordable && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldAlert size={14} /> Insufficient Cash! Available: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        background: '#10b981',
                        borderColor: '#10b981',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        justifyContent: 'center'
                      }}
                      onClick={async () => {
                        const depositNeeded = Math.ceil(totalCost - cashBalance + 500);
                        try {
                          await api.post('transactions/', {
                            amount: depositNeeded,
                            type: 'income',
                            category: 'Deposit / Cash In',
                            description: 'Instant Order Cash Deposit',
                            date: new Date().toISOString().split('T')[0]
                          });
                          addToast(`Instant Deposit of $${depositNeeded.toLocaleString()} added to your cash balance!`, 'success');
                          fetchPortfolioData();
                        } catch (err) {
                          addToast('Failed to deposit funds.', 'error');
                        }
                      }}
                    >
                      <Plus size={14} /> Instant Deposit +${Math.ceil(totalCost - cashBalance + 500).toLocaleString()} Cash to Account
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!quantity || (parseFloat(quantity || 0) <= 0)}
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
          >
            Confirm Purchase Order
          </button>
        </form>
      </Modal>

      {/* 🔴 SELL SHARES MODAL */}
      <Modal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} title={`Sell ${selectedAssetToSell?.name || 'Shares'}`}>
        {selectedAssetToSell && (() => {
          const ownedQtyNum = parseFloat(selectedAssetToSell.quantity || 0);
          const avgCostNum = parseFloat(selectedAssetToSell.purchase_price || selectedAssetToSell.current_price || 0);
          const currPriceNum = parseFloat(selectedAssetToSell.current_price || selectedAssetToSell.purchase_price || 0);

          return (
            <form onSubmit={handleExecuteSellOrder}>
              <div style={{
                background: 'rgba(2, 132, 199, 0.1)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedAssetToSell.name} ({selectedAssetToSell.symbol})</div>
                  <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#0284c7' }}>
                    Owned: {ownedQtyNum} Shares
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Avg Purchase Cost: <strong>${avgCostNum.toFixed(2)}</strong></span>
                  <span>Current Sell Price: <strong style={{ color: '#10b981' }}>${currPriceNum.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* SELL QUANTITY INPUT */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: 0 }}>
                    Shares to Sell (Simple e.g. 10 or Decimal e.g. 2.5)
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                    onClick={() => setSellQuantity(ownedQtyNum.toString())}
                  >
                    Sell All ({ownedQtyNum})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.00000001"
                    className="form-control"
                    placeholder="e.g. 10 or 2.5"
                    style={{ fontSize: '1.2rem', fontWeight: 700, flex: 1 }}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => setSellQuantity(ownedQtyNum.toString())}
                    title="Sell 100% of owned shares"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* REAL-TIME PROCEEDS, PROFIT/LOSS & ACCOUNT DOLLARS CALCULATIONS */}
              {sellQuantity && (() => {
                let inputQtyNum = parseFloat(sellQuantity || 0);
                if (isNaN(inputQtyNum)) inputQtyNum = 0;

                const isExceeded = inputQtyNum > ownedQtyNum;
                const actualQty = isExceeded ? ownedQtyNum : inputQtyNum;

                const totalProceeds = actualQty * currPriceNum;
                const totalRealizedPL = (currPriceNum - avgCostNum) * actualQty;
                const newCashBalance = cashBalance + totalProceeds;

                return (
                  <div style={{
                    padding: '1.1rem',
                    borderRadius: '14px',
                    background: 'rgba(17, 24, 39, 0.4)',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Cash Proceeds (Added to Account):</span>
                      <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>
                        +${totalProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Calculated Profit / Loss:</span>
                      <strong style={{ fontSize: '1.05rem', color: totalRealizedPL >= 0 ? '#10b981' : '#f43f5e' }}>
                        {totalRealizedPL >= 0 ? '+' : ''}${totalRealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>New Account Cash Dollars After Sale:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#06b6d4' }}>
                        ${newCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>

                    {isExceeded && (
                      <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: '0.2rem' }}>
                        Note: You entered {inputQtyNum} shares. Selling your maximum available {ownedQtyNum} shares.
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                type="submit"
                className="btn btn-danger"
                disabled={selling || !sellQuantity || parseFloat(sellQuantity || 0) <= 0}
                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
              >
                {selling ? 'Executing Order...' : 'Confirm & Execute Sell Order'}
              </button>
            </form>
          );
        })()}
      </Modal>

    </div>
  );
};

export default Portfolio;
