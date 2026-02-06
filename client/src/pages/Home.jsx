import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background">
                    <div className="hero-particles">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="particle"></div>
                        ))}
                    </div>
                    <div className="hero-gradient"></div>
                </div>
                
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-icon">🏆</span>
                        <span>Campus Elections 2026</span>
                    </div>
                    
                    <h1 className="hero-title">
                        Your Voice,<br />
                        <span className="gradient-text">Your Vote,</span><br />
                        Your Future
                    </h1>
                    
                    <p className="hero-description">
                        Participate in the most secure and transparent digital voting 
                        system. Shape the future of your campus by choosing leaders 
                        who represent your vision.
                    </p>
                    
                    {user ? (
                        <div className="hero-buttons">
                            <Link to="/vote" className="btn btn-primary">
                                <span className="btn-icon">🗳️</span>
                                Cast Your Vote
                                <span className="btn-arrow">→</span>
                            </Link>
                            <Link to="/results" className="btn btn-glass">
                                <span className="btn-icon">📊</span>
                                Live Results
                            </Link>
                        </div>
                    ) : (
                        <div className="hero-buttons">
                            <Link to="/register" className="btn btn-primary">
                                <span className="btn-icon">🚀</span>
                                Get Started
                                <span className="btn-arrow">→</span>
                            </Link>
                            <Link to="/login" className="btn btn-glass">
                                <span className="btn-icon">👤</span>
                                Sign In
                            </Link>
                        </div>
                    )}
                    
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">5000+</span>
                            <span className="stat-label">Registered Voters</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-number">12</span>
                            <span className="stat-label">Candidates</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-number">99.9%</span>
                            <span className="stat-label">Uptime</span>
                        </div>
                    </div>
                </div>
                
                <div className="hero-illustration">
                    <div className="voting-card">
                        <div className="voting-card-header">
                            <span className="card-icon">🗳️</span>
                            <span>Secure Ballot</span>
                        </div>
                        <div className="voting-options">
                            <div className="vote-option selected">
                                <div className="option-radio"></div>
                                <span>Student Representative</span>
                            </div>
                            <div className="vote-option">
                                <div className="option-radio"></div>
                                <span>Class President</span>
                            </div>
                            <div className="vote-option">
                                <div className="option-radio"></div>
                                <span>Sports Secretary</span>
                            </div>
                        </div>
                        <div className="voting-card-footer">
                            <span className="secure-badge">🔒 End-to-End Encrypted</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="section-header">
                    <span className="section-badge">Features</span>
                    <h2>Why Choose Our Platform?</h2>
                    <p>Built with cutting-edge technology to ensure fair and transparent elections</p>
                </div>
                
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <span className="feature-icon">🔐</span>
                        </div>
                        <h3>Bank-Level Security</h3>
                        <p>256-bit encryption ensures your vote remains confidential and tamper-proof</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <span className="feature-icon">✅</span>
                        </div>
                        <h3>One Vote Guarantee</h3>
                        <p>Biometric verification ensures each student can only vote once</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <span className="feature-icon">📊</span>
                        </div>
                        <h3>Real-Time Results</h3>
                        <p>Watch live vote counts and analytics as the election progresses</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <span className="feature-icon">📱</span>
                        </div>
                        <h3>Mobile Friendly</h3>
                        <p>Vote from anywhere using your smartphone, tablet, or computer</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <span className="feature-icon">⚡</span>
                        </div>
                        <h3>Instant Verification</h3>
                        <p>Receive immediate confirmation that your vote was recorded</p>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <span className="feature-icon">🌐</span>
                        </div>
                        <h3>24/7 Availability</h3>
                        <p>Vote at your convenience during the election period</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="section-header">
                    <span className="section-badge">Process</span>
                    <h2>How It Works</h2>
                    <p>Three simple steps to make your voice heard</p>
                </div>
                
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h3>Register</h3>
                            <p>Sign up with your student ID and college email to verify your identity</p>
                        </div>
                    </div>
                    
                    <div className="step-connector"></div>
                    
                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h3>Choose</h3>
                            <p>Review candidates and their manifestos, then make your selection</p>
                        </div>
                    </div>
                    
                    <div className="step-connector"></div>
                    
                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h3>Vote</h3>
                            <p>Submit your ballot securely and receive instant confirmation</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="cta-content">
                    <h2>Ready to Make a Difference?</h2>
                    <p>Join thousands of students who are shaping the future of our campus</p>
                    <Link to={user ? "/vote" : "/register"} className="btn btn-cta">
                        {user ? "Vote Now" : "Register Today"}
                        <span className="btn-arrow">→</span>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo">🗳️</span>
                        <span>CLG Voting</span>
                    </div>
                    <p>© 2026 College Voting System. Empowering Student Democracy.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
