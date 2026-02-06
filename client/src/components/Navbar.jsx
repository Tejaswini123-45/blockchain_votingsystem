import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">🗳️</span>
                    <span className="brand-text">CLG<span className="brand-highlight">Vote</span></span>
                </Link>

                <button 
                    className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    <div className="nav-links">
                        <Link 
                            to="/" 
                            className={`nav-link ${isActive('/') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        {user && (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/vote" 
                                    className={`nav-link ${isActive('/vote') ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Vote
                                </Link>
                                <Link 
                                    to="/results" 
                                    className={`nav-link ${isActive('/results') ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Results
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="nav-actions">
                        {user ? (
                            <div className="user-section">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-id">{user.studentId || user.email}</span>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="btn-logout">
                                    <span className="logout-icon">🚪</span>
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link 
                                    to="/login" 
                                    className="btn-signin"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="btn-register"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
