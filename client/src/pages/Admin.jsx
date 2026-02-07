import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPendingKYC, approveKYC, rejectKYC, getAdminStats } from '../services/api';
import './Admin.css';

const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [pendingKYC, setPendingKYC] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, userId: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [kycRes, statsRes] = await Promise.all([
                getPendingKYC(),
                getAdminStats()
            ]);
            setPendingKYC(kycRes.data.users || []);
            setStats(statsRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        setError('');
        try {
            await approveKYC(userId);
            setSuccess(`KYC approved for ${userId}`);
            setPendingKYC(prev => prev.filter(u => u.userId !== userId));
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve KYC');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }
        
        setActionLoading(rejectModal.userId);
        setError('');
        try {
            await rejectKYC(rejectModal.userId, rejectReason);
            setSuccess(`KYC rejected for ${rejectModal.userId}`);
            setPendingKYC(prev => prev.filter(u => u.userId !== rejectModal.userId));
            setRejectModal({ open: false, userId: null });
            setRejectReason('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject KYC');
        } finally {
            setActionLoading(null);
        }
    };

    if (user?.role !== 'admin') {
        return null;
    }

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>🛡️ Admin Dashboard</h1>
                <p>Manage KYC verifications and monitor voting</p>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}

            {/* Stats Grid */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalUsers || 0}</span>
                            <span className="stat-label">Total Users</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.verifiedUsers || 0}</span>
                            <span className="stat-label">Verified</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🗳️</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalVotes || 0}</span>
                            <span className="stat-label">Total Votes</span>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <span className="stat-value">{pendingKYC.length}</span>
                            <span className="stat-label">Pending KYC</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending KYC Section */}
            <div className="section">
                <h2>📋 Pending KYC Verifications</h2>
                
                {pendingKYC.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✓</div>
                        <p>No pending KYC submissions</p>
                    </div>
                ) : (
                    <div className="kyc-grid">
                        {pendingKYC.map(kycUser => (
                            <div key={kycUser.userId} className="kyc-card">
                                <div className="kyc-card-header">
                                    <div className="user-avatar">
                                        {kycUser.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="user-info">
                                        <h3>{kycUser.name}</h3>
                                        <span className="user-id">{kycUser.userId}</span>
                                    </div>
                                </div>
                                
                                <div className="kyc-details">
                                    <div className="detail">
                                        <span className="label">Email</span>
                                        <span className="value">{kycUser.email}</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Department</span>
                                        <span className="value">{kycUser.department}</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Year</span>
                                        <span className="value">{kycUser.year}</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Submitted</span>
                                        <span className="value">
                                            {new Date(kycUser.kycSubmittedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {kycUser.idCardUrl && (
                                    <div className="id-preview">
                                        <img 
                                            src={kycUser.idCardUrl} 
                                            alt="ID Card"
                                            onClick={() => setSelectedImage(kycUser.idCardUrl)}
                                        />
                                        <span className="preview-hint">Click to enlarge</span>
                                    </div>
                                )}

                                <div className="kyc-actions">
                                    <button 
                                        className="approve-btn"
                                        onClick={() => handleApprove(kycUser.userId)}
                                        disabled={actionLoading === kycUser.userId}
                                    >
                                        {actionLoading === kycUser.userId ? (
                                            <span className="btn-spinner"></span>
                                        ) : (
                                            '✓ Approve'
                                        )}
                                    </button>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => setRejectModal({ open: true, userId: kycUser.userId })}
                                        disabled={actionLoading === kycUser.userId}
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="image-modal">
                        <button className="close-btn" onClick={() => setSelectedImage(null)}>✕</button>
                        <img src={selectedImage} alt="ID Card Full View" />
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="modal-overlay">
                    <div className="reject-modal">
                        <h3>Reject KYC</h3>
                        <p>Please provide a reason for rejection:</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., ID card image is blurry, name doesn't match..."
                            rows={3}
                        />
                        <div className="modal-actions">
                            <button 
                                className="cancel-btn"
                                onClick={() => {
                                    setRejectModal({ open: false, userId: null });
                                    setRejectReason('');
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="confirm-reject-btn"
                                onClick={handleReject}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject KYC'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
