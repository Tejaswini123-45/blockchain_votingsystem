import { useState, useEffect } from 'react';
import web3Service from '../services/web3';
import { isContractDeployed } from '../contracts/config';
import './Results.css';

const BlockchainResults = () => {
    const [electionInfo, setElectionInfo] = useState(null);
    const [positions, setPositions] = useState([]);
    const [results, setResults] = useState({});
    const [voteRecords, setVoteRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        loadBlockchainResults();
    }, []);

    const loadBlockchainResults = async () => {
        setLoading(true);
        setError('');

        try {
            if (!isContractDeployed()) {
                setError('Smart contract not deployed. Please deploy on Remix first.');
                setLoading(false);
                return;
            }

            // Try to connect wallet for better access
            try {
                await web3Service.connectWallet();
                setConnected(true);
            } catch (err) {
                // Can still read without wallet
                console.log('Reading without wallet connection');
            }

            // Get election info
            const info = await web3Service.getElectionInfo();
            setElectionInfo(info);

            // Get positions
            const positionsData = await web3Service.getPositions();
            setPositions(positionsData);

            // Get results for each position
            const resultsData = {};
            for (const pos of positionsData) {
                const posResults = await web3Service.getPositionResults(pos.id);
                resultsData[pos.id] = posResults;
            }
            setResults(resultsData);

            // Get vote records for audit
            const recordsCount = await web3Service.getVoteRecordsCount();
            if (recordsCount > 0) {
                const records = [];
                for (let i = 0; i < Math.min(recordsCount, 50); i++) {
                    const record = await web3Service.getVoteRecord(i);
                    records.push({ ...record, index: i });
                }
                setVoteRecords(records);
            }
        } catch (err) {
            console.error('Error loading results:', err);
            setError(err.message || 'Failed to load blockchain results');
        } finally {
            setLoading(false);
        }
    };

    const getWinner = (candidates) => {
        if (!candidates || candidates.length === 0) return null;
        return candidates.reduce((max, c) => c.voteCount > max.voteCount ? c : max, candidates[0]);
    };

    const getTotalVotesForPosition = (candidates) => {
        return candidates?.reduce((sum, c) => sum + c.voteCount, 0) || 0;
    };

    if (loading) {
        return (
            <div className="results-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading results from blockchain...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="results-container">
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={loadBlockchainResults} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="results-container blockchain-results">
            <div className="results-header">
                <h1>⛓️ Blockchain Election Results</h1>
                <p>Immutable, transparent, and publicly verifiable</p>
                
                {/* Election Stats */}
                {electionInfo && (
                    <div className="blockchain-stats">
                        <div className="stat-card">
                            <div className="stat-icon">🗳️</div>
                            <div className="stat-content">
                                <span className="stat-value">{electionInfo.totalVotes}</span>
                                <span className="stat-label">Total Votes on Chain</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <span className="stat-value">{electionInfo.totalCandidates}</span>
                                <span className="stat-label">Candidates</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🎫</div>
                            <div className="stat-content">
                                <span className="stat-value">{electionInfo.totalTokens}</span>
                                <span className="stat-label">Tokens Issued</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">{electionInfo.ended ? '🏁' : '🟢'}</div>
                            <div className="stat-content">
                                <span className="stat-value">
                                    {electionInfo.ended ? 'Ended' : (electionInfo.started ? 'Active' : 'Not Started')}
                                </span>
                                <span className="stat-label">Election Status</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results by Position */}
            <div className="results-grid">
                {positions.map(position => {
                    const posResults = results[position.id];
                    const candidates = posResults?.candidates || [];
                    const winner = getWinner(candidates);
                    const totalVotes = getTotalVotesForPosition(candidates);

                    return (
                        <div key={position.id} className="position-results">
                            <h2>{position.name}</h2>
                            <div className="candidates-results">
                                {candidates
                                    .sort((a, b) => b.voteCount - a.voteCount)
                                    .map((candidate, index) => {
                                        const percentage = totalVotes > 0 
                                            ? ((candidate.voteCount / totalVotes) * 100).toFixed(1)
                                            : 0;
                                        const isWinner = candidate.id === winner?.id && candidate.voteCount > 0;

                                        return (
                                            <div 
                                                key={candidate.id} 
                                                className={`candidate-result ${isWinner ? 'winner' : ''}`}
                                            >
                                                <div className="result-rank">#{index + 1}</div>
                                                <div className="result-info">
                                                    <h3>
                                                        {candidate.name}
                                                        {isWinner && <span className="winner-badge">🏆 Winner</span>}
                                                    </h3>
                                                    <div className="vote-bar-container">
                                                        <div 
                                                            className="vote-bar" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="result-votes">
                                                    <span className="vote-count">{candidate.voteCount}</span>
                                                    <span className="vote-percent">{percentage}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className="position-total">
                                Total votes: {totalVotes}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Audit Log Section */}
            <div className="audit-section">
                <button 
                    onClick={() => setShowAuditLog(!showAuditLog)}
                    className="audit-toggle-btn"
                >
                    {showAuditLog ? '🔼 Hide Audit Log' : '🔽 Show Blockchain Audit Log'}
                </button>

                {showAuditLog && (
                    <div className="audit-log">
                        <h3>📋 Vote Transaction Audit Log</h3>
                        <p className="audit-info">
                            <strong>🔒 FULLY ANONYMOUS:</strong> Votes are verified on blockchain but 
                            <strong> NO ONE can see what was voted</strong>. Only aggregate totals are visible.
                        </p>
                        <div className="audit-table-container">
                            <table className="audit-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Vote Hash (Proof)</th>
                                        <th>Position</th>
                                        <th>Timestamp</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voteRecords.map((record, index) => {
                                        const position = positions.find(p => p.id === record.positionId);

                                        return (
                                            <tr key={index}>
                                                <td>{record.index + 1}</td>
                                                <td className="hash-cell">
                                                    <code>{record.voteHash.slice(0, 10)}...{record.voteHash.slice(-8)}</code>
                                                </td>
                                                <td>{position?.name || `Position ${record.positionId}`}</td>
                                                <td>{new Date(record.timestamp * 1000).toLocaleString()}</td>
                                                <td><span className="verified-badge">✅ Verified</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {voteRecords.length === 0 && (
                            <p className="no-records">No votes recorded yet</p>
                        )}
                    </div>
                )}
            </div>

            {/* Blockchain Verification Info */}
            <div className="verification-info">
                <h3>🔐 Verification</h3>
                <p>
                    These results are fetched directly from the Ethereum blockchain. 
                    Anyone can verify them by calling the smart contract functions.
                </p>
                <div className="verification-details">
                    <div className="detail">
                        <span className="detail-label">Election:</span>
                        <span className="detail-value">{electionInfo?.name}</span>
                    </div>
                    <div className="detail">
                        <span className="detail-label">Network:</span>
                        <span className="detail-value">Sepolia Testnet</span>
                    </div>
                    <div className="detail">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value ${connected ? 'connected' : ''}`}>
                            {connected ? '🟢 Connected' : '🔴 Read-only'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockchainResults;
