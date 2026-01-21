import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const DAILY_GMBASE_ABI = [
  'function dailyClick(string metadata) payable returns (uint256)',
  'function canClickToday(address user) view returns (bool)',
  'function getTimeUntilNextClick(address user) view returns (uint256)',
  'function getStreak(address user) view returns (uint256)',
  'function getTotalRewards(address user) view returns (uint256)',
  'function lastClickTimestamp(address user) view returns (uint256)',
  'function totalClicks(address user) view returns (uint256)',
  'function claimRewards() nonpayable'
];

export default function DailyGMBase({ signer, network, contractAddr }) {
  const [canClick, setCanClick] = useState(false);
  const [timeUntilClick, setTimeUntilClick] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(null);

  // Only show for Base chain
  const isBaseChain = network === 'base';

  // Refresh data
  async function refreshData() {
    if (!signer || !contractAddr || !isBaseChain) return;

    try {
      const contract = new ethers.Contract(contractAddr, DAILY_GMBASE_ABI, signer);
      const userAddress = await signer.getAddress();

      const [canClickToday, timeLeft, userStreak, rewards, lastClick, clicks] = await Promise.all([
        contract.canClickToday(userAddress),
        contract.getTimeUntilNextClick(userAddress),
        contract.getStreak(userAddress),
        contract.getTotalRewards(userAddress),
        contract.lastClickTimestamp(userAddress),
        contract.totalClicks(userAddress)
      ]);

      setCanClick(canClickToday);
      setTimeUntilClick(Number(timeLeft));
      setStreak(Number(userStreak));
      setTotalRewards(ethers.formatEther(rewards));
      setTotalClicks(Number(clicks));
      setLastClickTime(new Date(Number(lastClick) * 1000).toLocaleString());
    } catch (err) {
      console.error('Error refreshing Daily GMBase data:', err);
    }
  }

  // Countdown timer
  useEffect(() => {
    if (timeUntilClick <= 0 || canClick) return;

    const interval = setInterval(() => {
      setTimeUntilClick(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilClick, canClick]);

  // Refresh on mount and periodically
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [signer, contractAddr, isBaseChain]);

  const handleDailyClick = async () => {
    if (!signer || !contractAddr) {
      alert('Connect wallet on Base chain first');
      return;
    }

    try {
      setLoading(true);

      const contract = new ethers.Contract(contractAddr, DAILY_GMBASE_ABI, signer);
      const userAddress = await signer.getAddress();

      // Metadata for the click NFT
      const metadata = JSON.stringify({
        date: new Date().toISOString(),
        network: 'Base',
        description: `Daily click on ${new Date().toLocaleDateString()}`,
        gm: 'Good Morning!'
      });

      // Click with gas fee (0.001 ETH)
      const tx = await contract.dailyClick(metadata, {
        value: ethers.parseEther('0.001')
      });

      await tx.wait();

      alert('✓ Daily click successful! NFT minted and reward earned.');
      refreshData();
    } catch (err) {
      console.error('Click error:', err);
      alert(err?.reason || err?.message || 'Daily click failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!signer || !contractAddr) return;

    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddr, DAILY_GMBASE_ABI, signer);
      const tx = await contract.claimRewards();
      await tx.wait();

      alert('✓ Rewards claimed!');
      refreshData();
    } catch (err) {
      console.error('Claim error:', err);
      alert(err?.reason || err?.message || 'Claim failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (!isBaseChain) {
    return (
      <div style={{
        padding: '15px',
        border: '2px solid #FFA500',
        borderRadius: '8px',
        backgroundColor: '#fff8f0',
        marginTop: '20px'
      }}>
        <p style={{ color: '#FF6B35', margin: 0 }}>
          ⛓️ Switch to Base chain to access Daily GMBase clicks
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #0066ff',
      borderRadius: '12px',
      backgroundColor: '#f0f4ff',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#0066ff' }}>
        🌅 Daily GMBase Click
      </h3>

      {/* Main Click Button */}
      <button
        onClick={handleDailyClick}
        disabled={!canClick || loading}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: canClick ? '#0066ff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: canClick && !loading ? 'pointer' : 'not-allowed',
          marginBottom: '15px',
          transition: 'all 0.3s'
        }}
      >
        {loading ? '⏳ Clicking...' : canClick ? '🎯 Click Daily' : '⏱️ Already Clicked'}
      </button>

      {/* Countdown Timer */}
      {!canClick && timeUntilClick > 0 && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fff',
          borderRadius: '6px',
          textAlign: 'center',
          marginBottom: '12px',
          fontSize: '14px',
          color: '#0066ff',
          fontWeight: 'bold'
        }}>
          Next click in: {formatTime(timeUntilClick)}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '12px'
      }}>
        {/* Streak */}
        <div style={{
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '6px',
          textAlign: 'center',
          borderLeft: '4px solid #FF6B35'
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Streak</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF6B35' }}>
            {streak} 🔥
          </div>
        </div>

        {/* Total Clicks */}
        <div style={{
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '6px',
          textAlign: 'center',
          borderLeft: '4px solid #00cc88'
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Clicks</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00cc88' }}>
            {totalClicks} ✓
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div style={{
        padding: '12px',
        backgroundColor: '#fff',
        borderRadius: '6px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>Rewards Earned</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0066ff' }}>
            {parseFloat(totalRewards).toFixed(6)} ETH
          </div>
        </div>
        <button
          onClick={handleClaimRewards}
          disabled={parseFloat(totalRewards) === 0 || loading}
          style={{
            padding: '8px 12px',
            backgroundColor: parseFloat(totalRewards) > 0 ? '#00cc88' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: parseFloat(totalRewards) > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Claim
        </button>
      </div>

      {/* Info */}
      {lastClickTime && (
        <div style={{
          fontSize: '11px',
          color: '#666',
          padding: '8px',
          backgroundColor: '#e6f0ff',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Last click: {lastClickTime}
        </div>
      )}

      {/* Gas Fee Info */}
      <div style={{
        fontSize: '11px',
        color: '#999',
        padding: '8px',
        marginTop: '8px',
        textAlign: 'center'
      }}>
        💡 Each click pays 0.001 ETH gas subsidy on Base
      </div>
    </div>
  );
}
