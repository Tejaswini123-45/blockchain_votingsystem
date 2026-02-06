import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="dashboard">
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="welcome-section">
                        <span className="greeting">{getGreeting()}</span>
                        <h1>{user?.name} 👋</h1>
                        <p className="student-id">Student ID: {user?.studentId || 'N/A'}</p>
                    </div>
                    <div className="header-actions">
                        {!user?.hasVoted && (
                            <Link to="/vote" className="vote-now-btn">
                                <span className="btn-icon">🗳️</span>
                                <span>Cast Your Vote</span>
                                <span className="btn-arrow">→</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card voting-status">
                    <div className="stat-icon-wrapper">
                        <span className="stat-icon">🗳️</span>
                    </div>
                    <div className="stat-content">
                        <h3>Voting Status</h3>
                        <span className={`status-badge ${user?.hasVoted ? 'voted' : 'pending'}`}>
                            {user?.hasVoted ? (
                                <>
                                    <span className="status-dot"></span>
                                    Vote Submitted
                                </>
                            ) : (
                                <>
                                    <span className="status-dot"></span>
                                    Vote Pending
                                </>
                            )}
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <span className="stat-icon">🎓</span>
                    </div>
                    <div className="stat-content">
                        <h3>Department</h3>
                        <p>{user?.department || 'Not specified'}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <span className="stat-icon">📅</span>
                    </div>
                    <div className="stat-content">
                        <h3>Academic Year</h3>
                        <p>{user?.year || 'Not specified'}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper orange">
                        <span className="stat-icon">👤</span>
                    </div>
                    <div className="stat-content">
                        <h3>Account Type</h3>
                        <p className="role-badge">{user?.role === 'admin' ? '🛡️ Administrator' : '🎒 Student'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content">
                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-info">
                            <h2>{user?.name}</h2>
                            <p>{user?.email}</p>
                        </div>
                    </div>
                    <div className="profile-details">
                        <div className="detail-row">
                            <span className="detail-label">Student ID</span>
                            <span className="detail-value">{user?.studentId || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Department</span>
                            <span className="detail-value">{user?.department || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Year</span>
                            <span className="detail-value">{user?.year || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="actions-card">
                    <h3>Quick Actions</h3>
                    <div className="actions-grid">
                        {!user?.hasVoted && (
                            <Link to="/vote" className="action-item primary">
                                <div className="action-icon">🗳️</div>
                                <div className="action-info">
                                    <h4>Cast Your Vote</h4>
                                    <p>Vote for your representatives</p>
                                </div>
                                <span className="action-arrow">→</span>
                            </Link>
                        )}
                        <Link to="/results" className="action-item">
                            <div className="action-icon">📊</div>
                            <div className="action-info">
                                <h4>View Results</h4>
                                <p>See live election results</p>
                            </div>
                            <span className="action-arrow">→</span>
                        </Link>
                        <Link to="/candidates" className="action-item">
                            <div className="action-icon">👥</div>
                            <div className="action-info">
                                <h4>View Candidates</h4>
                                <p>Learn about the candidates</p>
                            </div>
                            <span className="action-arrow">→</span>
                        </Link>
                    </div>
                </div>

                {/* Election Info */}
                <div className="election-info-card">
                    <h3>📢 Election Information</h3>
                    <div className="info-content">
                        <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div>
                                <h4>Voting Period</h4>
                                <p>Feb 1 - Feb 10, 2026</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">🏆</span>
                            <div>
                                <h4>Positions Available</h4>
                                <p>Student President, Vice President, Secretary</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">📍</span>
                            <div>
                                <h4>Results Announcement</h4>
                                <p>February 11, 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
