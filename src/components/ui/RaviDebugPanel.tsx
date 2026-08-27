import React, { useEffect, useState } from 'react';
import { raviNPCBrain } from '../../systems/npc/RaviNPCBrain';
import { RaviNPCStateData } from '../../systems/npc/raviState';

export const RaviDebugPanel: React.FC = () => {
  const [data, setData] = useState<RaviNPCStateData>(raviNPCBrain.getStateData());

  useEffect(() => {
    const unsub = raviNPCBrain.subscribe((newState) => {
      setData({ ...newState });
    });
    return () => {
      unsub();
    };
  }, []);

  const stateColorMap: Record<string, string> = {
    SELLING: '#10b981',
    SETUP_STALL: '#f59e0b',
    GO_TO_TOWN_CENTER: '#3b82f6',
    TALK_TO_CUSTOMER: '#a855f7',
    SELL_TO_CUSTOMER: '#ec4899',
    ARRANGE_VEGETABLES: '#8b5cf6',
    EAT_LUNCH: '#eab308',
    GO_HOME: '#3b82f6',
    RELAX: '#64748b',
    SLEEP: '#475569',
  };

  const currentColor = stateColorMap[data.currentState] || '#38bdf8';

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.cardTag}>AUTONOMOUS NPC HUD</div>
          <div style={styles.cardTitle}>Ravi — Vegetable Seller</div>
        </div>
        <div style={{ ...styles.shopBadge, backgroundColor: data.shopOpen ? '#059669' : '#dc2626' }}>
          SHOP {data.shopOpen ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      <div style={styles.statusBox}>
        <div style={styles.row}>
          <span style={styles.label}>State:</span>
          <strong style={{ color: currentColor, fontWeight: 700 }}>{data.currentState}</strong>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Activity:</span>
          <span style={styles.valText}>{data.statusMessage}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Location:</span>
          <span style={styles.valText}>
            {data.currentState.includes('HOME') || data.currentState === 'SLEEP' || data.currentState === 'RELAX'
              ? "Ravi's Cottage"
              : 'Town Center Market'}
          </span>
        </div>
      </div>

      <div style={styles.sectionHeader}>COMMERCE & METRICS</div>
      <div style={styles.metricsGrid}>
        <div style={styles.metricCell}>
          <span style={styles.label}>Money:</span>
          <span style={{ color: '#10b981', fontWeight: 800 }}>₹{data.money}</span>
        </div>
        <div style={styles.metricCell}>
          <span style={styles.label}>Served:</span>
          <span style={styles.valBold}>{data.customersServed} customers</span>
        </div>
      </div>

      <div style={styles.sectionHeader}>VEGETABLE INVENTORY STOCK</div>
      <div style={styles.stockGrid}>
        <div style={styles.stockItem}>
          <span style={styles.stockName}>🍅 Tomato:</span>
          <span style={styles.stockVal}>{data.stock.tomato}</span>
        </div>
        <div style={styles.stockItem}>
          <span style={styles.stockName}>🥔 Potato:</span>
          <span style={styles.stockVal}>{data.stock.potato}</span>
        </div>
        <div style={styles.stockItem}>
          <span style={styles.stockName}>🧅 Onion:</span>
          <span style={styles.stockVal}>{data.stock.onion}</span>
        </div>
        <div style={styles.stockItem}>
          <span style={styles.stockName}>🥕 Carrot:</span>
          <span style={styles.stockVal}>{data.stock.carrot}</span>
        </div>
      </div>

      {data.activeTransaction && (
        <div style={styles.transactionBox}>
          <div style={{ color: '#ec4899', fontWeight: 700, fontSize: '10px' }}>
            🛒 RECENT TRANSACTION [{data.activeTransaction.timestamp}]
          </div>
          <div style={{ fontSize: '11px', color: '#f8fafc', marginTop: '2px' }}>
            Sold {data.activeTransaction.quantity} {data.activeTransaction.item}(s) to{' '}
            <strong style={{ color: '#38bdf8' }}>{data.activeTransaction.customer.toUpperCase()}</strong> for ₹
            {data.activeTransaction.totalCost}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '12px',
    padding: '12px 14px',
    color: '#ffffff',
    marginTop: '10px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '11px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardTag: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#10b981',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#f8fafc',
  },
  shopBadge: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#ffffff',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.6px',
  },
  statusBox: {
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: '10.5px',
  },
  valText: {
    color: '#e2e8f0',
    fontSize: '10.5px',
  },
  valBold: {
    color: '#38bdf8',
    fontWeight: 700,
  },
  sectionHeader: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '1px',
    margin: '8px 0 4px 0',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '8px',
    padding: '6px 8px',
  },
  metricCell: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '6px 8px',
  },
  stockItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10.5px',
  },
  stockName: {
    color: '#cbd5e1',
  },
  stockVal: {
    color: '#f59e0b',
    fontWeight: 700,
  },
  transactionBox: {
    marginTop: '6px',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    border: '1px solid rgba(236, 72, 153, 0.3)',
    borderRadius: '6px',
    padding: '6px 8px',
  },
};

export default RaviDebugPanel;
