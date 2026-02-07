import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getKYCStatus, getVotingToken } from '../services/api';
import web3Service from '../services/web3';
import { isContractDeployed } from '../contracts/config';
import './Vote.css';

const Vote = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Blockchain state
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletAccount, setWalletAccount] = useState('');
    const [electionInfo, setElectionInfo] = useState(null);
    
    // Voting state
    const [positions, setPositions] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [votingToken, setVotingToken] = useState('');
    const [votedPositions, setVotedPositions] = useState([]);
    
    // UI state
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [txHash, setTxHash] = useState('');

    useEffect(() => {
        initializeVoting();
    }, []);

    const initializeVoting = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Check KYC status first
            const kycRes = await getKYCStatus();
            setKycStatus(kycRes.data.kycStatus);

            if (kycRes.data.kycStatus !== 'approved') {
                setLoading(false);
                return;
            }

            // Check if contract is deployed
            if (!isContractDeployed()) {
                setError('Smart contract not deployed yet. Please deploy on Remix first.');
                setLoading(false);
                return;
            }

            // Get voting token from backend (issued after KYC approval)
            try {
                const tokenRes = await getVotingToken();
                if (tokenRes.data.votingToken) {
                    setVotingToken(tokenRes.data.votingToken);
                }
            } catch (err) {
                console.log('No voting token yet');
            }

            // Connect wallet and load blockchain data
            await connectWalletAndLoadData();
        } catch (err) {
            console.error('Initialization error:', err);
            setError(err.message || 'Failed to initialize voting');
        } finally {
            setLoading(false);
        }
    };

    const connectWalletAndLoadData = async () => {
        try {
            // Connect wallet
            const walletInfo = await web3Service.connectWallet();
            setWalletConnected(true);
            setWalletAccount(walletInfo.account);

            // Load election info from blockchain
            const info = await web3Service.getElectionInfo();
            setElectionInfo(info);

            // Load positions
            const positionsData = await web3Service.getPositions();
            setPositions(positionsData);

            if (positionsData.length > 0) {
                // Load candidates for first position
                await loadCandidatesForPosition(positionsData[0]);
            }

            // Check which positions user has voted for
            if (votingToken) {
                await checkVotedPositions(positionsData);
            }
        } catch (err) {
            console.error('Wallet connection error:', err);
            setError(err.message);
        }
    };

    const loadCandidatesForPosition = async (position) => {
        try {
            setCurrentPosition(position);
            const candidatesData = await web3Service.getCandidatesByPosition(position.id);
            setCandidates(candidatesData);
            setSelectedCandidate(null);
        } catch (err) {
            setError('Failed to load candidates');
        }
    };

    const checkVotedPositions = async (positionsToCheck) => {
        if (!votingToken) return;

        const voted = [];
        for (const pos of positionsToCheck) {
            const hasVoted = await web3Service.hasVotedForPosition(votingToken, pos.id);
            if (hasVoted) {
                voted.push(pos.id);
            }
        }
        setVotedPositions(voted);
    };

    const handleConnectWallet = async () => {
        setError('');
        try {
            await connectWalletAndLoadData();
        } catch (err) {
            setError(err.message || 'Failed to connect wallet');
        }
    };

    const handleVote = async () => {
        if (!selectedCandidate || !currentPosition || !votingToken) {
            setError('Please select a candidate and ensure you have a valid voting token');
            return;
        }

        try {
            setVoting(true);
            setError('');
            setSuccess('');

            // Cast vote on blockchain
            const result = await web3Service.castVote(
                votingToken,
                currentPosition.id,
                selectedCandidate.id
            );

            setTxHash(result.transactionHash);
            setSuccess(`Vote recorded on blockchain! Transaction: ${result.transactionHash.slice(0, 10)}...`);
            setVotedPositions([...votedPositions, currentPosition.id]);
            setSelectedCandidate(null);

            // Refresh candidates to show updated vote counts
            await loadCandidatesForPosition(currentPosition);
        } catch (err) {
            setError(err.message || 'Failed to cast vote on blockchain');
        } finally {
            setVoting(false);
        }
    };

    // Check KYC status
    if (kycStatus && kycStatus !== 'approved') {
        return (
            <div className="vote-container">
                <div className="kyc-warning">
                    <div className="warning-icon">⚠️</div>
                    <h2>KYC Verification Required</h2>
                    <p>
                        {kycStatus === 'not_submitted' && 'Complete KYC verification before voting. Upload your ID card.'}
                        {kycStatus === 'pending' && 'Your KYC is pending. Please wait for admin approval.'}
                        {kycStatus === 'rejected' && 'Your KYC was rejected. Please re-upload with correct details.'}
                    </p>
                    <button onClick={() => navigate('/kyc')} className="kyc-btn">
                        {kycStatus === 'not_submitted' ? 'Complete KYC' : 'Check KYC Status'}
                    </button>
                </div>
            </div>
        );
    }

    // Check if fully voted
    if (positions.length > 0 && votedPositions.length === positions.length) {
        return (
            <div className="vote-container">
                <div className="voting-complete">
                    <div className="complete-icon">✅</div>
                    <h2>Thank You for Voting!</h2>
                    <p>Your votes have been recorded on the blockchain.</p>
                    {txHash && (
                        <p className="tx-info">
                            Last Transaction: <code>{txHash}</code>
                        </p>
                    )}
                    <button onClick={() => navigate('/results')} className="results-btn">
                        View Blockchain Results
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="vote-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Connecting to blockchain...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vote-container">
            <div className="vote-header">
                <h1>🗳️ Blockchain Voting</h1>
                <p>Your vote is recorded immutably on the Ethereum blockchain</p>
                
                {/* Wallet Connection Status */}
                <div className="wallet-status">
                    {walletConnected ? (
                        <div className="wallet-connected">
                            <span className="wallet-icon">🦊</span>
                            <span className="wallet-address">
                                {walletAccount.slice(0, 6)}...{walletAccount.slice(-4)}
                            </span>
                            <span className="status-dot connected"></span>
                        </div>
                    ) : (
                        <button onClick={handleConnectWallet} className="connect-wallet-btn">
                            🦊 Connect MetaMask
                        </button>
                    )}
                </div>

                {/* Election Info */}
                {electionInfo && (
                    <div className="election-info">
                        <h3>{electionInfo.name}</h3>
                        <div className="stats-row">
                            <div className="stat">
                                <span className="stat-value">{electionInfo.totalCandidates}</span>
                                <span className="stat-label">Candidates</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{electionInfo.totalVotes}</span>
                                <span className="stat-label">Votes Cast</span>
                            </div>
                            <div className="stat">
                                <span className={`stat-value ${electionInfo.started ? 'active' : ''}`}>
                                    {electionInfo.started ? (electionInfo.ended ? 'Ended' : 'Active') : 'Not Started'}
                                </span>
                                <span className="stat-label">Status</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Voting Progress */}
                <div className="voting-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ 
                                width: `${(votedPositions.length / Math.max(positions.length, 1)) * 100}%` 
                            }}
                        />
                    </div>
                    <span>{votedPositions.length} of {positions.length} positions voted</span>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    <span className="success-icon">✅</span>
                    {success}
                </div>
            )}

            {/* Not connected warning */}
            {!walletConnected && (
                <div className="wallet-warning">
                    <p>⚠️ Connect your MetaMask wallet to vote on the blockchain</p>
                </div>
            )}

            {/* Voting Token Input */}
            {walletConnected && !votingToken && (
                <div className="token-section">
                    <h3>Enter Your Voting Token</h3>
                    <p>Your anonymous voting token was issued after KYC approval</p>
                    <input
                        type="text"
                        placeholder="Enter your voting token"
                        value={votingToken}
                        onChange={(e) => setVotingToken(e.target.value)}
                        className="token-input"
                    />
                </div>
            )}

            {walletConnected && votingToken && (
                <>
                    {/* Position Tabs */}
                    <div className="position-tabs">
                        {positions.map(position => {
                            const hasVoted = votedPositions.includes(position.id);
                            return (
                                <button
                                    key={position.id}
                                    className={`position-tab ${currentPosition?.id === position.id ? 'active' : ''} ${hasVoted ? 'voted' : ''}`}
                                    onClick={() => !hasVoted && loadCandidatesForPosition(position)}
                                    disabled={hasVoted}
                                >
                                    {hasVoted && <span className="voted-check">✓</span>}
                                    {position.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Candidates Grid */}
                    {currentPosition && !votedPositions.includes(currentPosition.id) && (
                        <div className="candidates-section">
                            <h2>Candidates for {currentPosition.name}</h2>
                            <div className="candidates-grid">
                                {candidates.map(candidate => (
                                    <div
                                        key={candidate.id}
                                        className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        <div className="candidate-avatar">
                                            {candidate.name.charAt(0)}
                                        </div>
                                        <h3>{candidate.name}</h3>
                                        <p className="department">{candidate.department}</p>
                                        <div className="blockchain-badge">
                                            <span className="chain-icon">⛓️</span>
                                            <span>{candidate.voteCount} votes on-chain</span>
                                        </div>
                                        {selectedCandidate?.id === candidate.id && (
                                            <div className="selected-badge">✓ Selected</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Vote Button */}
                            <div className="vote-action">
                                <button
                                    onClick={handleVote}
                                    disabled={!selectedCandidate || voting}
                                    className={`vote-btn ${voting ? 'voting' : ''}`}
                                >
                                    {voting ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            Recording on Blockchain...
                                        </>
                                    ) : (
                                        <>
                                            ⛓️ Cast Vote on Blockchain
                                        </>
                                    )}
                                </button>
                                <p className="vote-info">
                                    This will create an immutable record on the Ethereum blockchain
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Blockchain Info Footer */}
            <div className="blockchain-footer">
                <div className="footer-item">
                    <span className="footer-icon">🔒</span>
                    <span>Tamper-proof</span>
                </div>
                <div className="footer-item">
                    <span className="footer-icon">👁️</span>
                    <span>Anonymous</span>
                </div>
                <div className="footer-item">
                    <span className="footer-icon">📊</span>
                    <span>Publicly Auditable</span>
                </div>
            </div>
        </div>
    );
};

export default Vote;
