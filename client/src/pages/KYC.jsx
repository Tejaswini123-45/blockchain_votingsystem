import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadIdCard, getKYCStatus } from '../services/api';
import './KYC.css';

const KYC = () => {
    const { user, loadUser } = useAuth();
    const navigate = useNavigate();
    
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [kycStatus, setKycStatus] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        // First use user context, then fetch fresh status
        if (user?.kycStatus) {
            setKycStatus(user.kycStatus);
        }
        fetchKYCStatus();
    }, [user]);

    const fetchKYCStatus = async () => {
        try {
            const { data } = await getKYCStatus();
            setKycStatus(data.kycStatus || user?.kycStatus || 'not_submitted');
        } catch (err) {
            // Use user context as fallback
            setKycStatus(user?.kycStatus || 'not_submitted');
        } finally {
            setPageLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        handleFile(selectedFile);
    };

    const handleFile = (selectedFile) => {
        if (selectedFile) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Please upload a JPG or PNG image');
                return;
            }
            
            // Validate file size (5MB max)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setFile(selectedFile);
            setError('');
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            setError('Please select an ID card image');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('idCard', file);

            const { data } = await uploadIdCard(formData);
            
            // Check if auto-approved
            if (data.kycStatus === 'approved') {
                setSuccess('ID card uploaded and verified! You can now vote.');
                setKycStatus('approved');
            } else {
                setSuccess('ID card uploaded successfully! Awaiting verification.');
                setKycStatus('pending');
            }
            
            // Reload user data to get updated KYC status
            if (loadUser) {
                await loadUser();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload ID card');
        } finally {
            setLoading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
    };

    // Show loading while determining KYC status
    if (pageLoading) {
        return (
            <div className="kyc-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Already approved - redirect to vote
    if (kycStatus === 'approved') {
        return (
            <div className="kyc-container">
                <div className="kyc-card success-card">
                    <div className="status-icon approved">✓</div>
                    <h2>KYC Verified!</h2>
                    <p>Your identity has been verified. You can now participate in voting.</p>
                    <button className="primary-btn" onClick={() => navigate('/vote')}>
                        Go to Voting
                    </button>
                </div>
            </div>
        );
    }

    // Pending verification
    if (kycStatus === 'pending') {
        return (
            <div className="kyc-container">
                <div className="kyc-card pending-card">
                    <div className="status-icon pending">⏳</div>
                    <h2>Verification Pending</h2>
                    <p>Your ID card has been submitted and is pending verification.</p>
                    <p className="sub-text">This usually takes 24-48 hours. You'll be notified once approved.</p>
                    <button className="secondary-btn" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Rejected - allow resubmission
    if (kycStatus === 'rejected') {
        return (
            <div className="kyc-container">
                <div className="kyc-card">
                    <div className="kyc-header">
                        <div className="status-icon rejected">✗</div>
                        <h1>KYC Rejected</h1>
                        <p>Your previous submission was rejected. Please resubmit with a valid ID card.</p>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <form onSubmit={handleSubmit} className="kyc-form">
                        <div 
                            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {preview ? (
                                <div className="preview-container">
                                    <img src={preview} alt="ID Preview" className="id-preview" />
                                    <button type="button" className="remove-btn" onClick={removeFile}>
                                        ✕ Remove
                                    </button>
                                </div>
                            ) : (
                                <label className="upload-label">
                                    <div className="upload-icon">📄</div>
                                    <p>Drag & drop your ID card here</p>
                                    <span>or click to browse</span>
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleFileChange}
                                        hidden
                                    />
                                </label>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={!file || loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Uploading...
                                </>
                            ) : (
                                'Resubmit ID Card'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Not submitted - show upload form
    return (
        <div className="kyc-container">
            <div className="kyc-card">
                <div className="kyc-header">
                    <div className="kyc-icon">🪪</div>
                    <h1>Identity Verification</h1>
                    <p>Upload your college ID card to verify your identity and enable voting.</p>
                </div>

                <div className="kyc-steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <span className="step-text">Upload ID Card</span>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <span className="step-text">Admin Review</span>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <span className="step-text">Start Voting</span>
                    </div>
                </div>

                {error && <div className="error-message">⚠️ {error}</div>}
                {success && <div className="success-message">✓ {success}</div>}

                <form onSubmit={handleSubmit} className="kyc-form">
                    <div 
                        className={`upload-area ${dragActive ? 'drag-active' : ''} ${preview ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {preview ? (
                            <div className="preview-container">
                                <img src={preview} alt="ID Preview" className="id-preview" />
                                <div className="file-info">
                                    <span className="file-name">{file?.name}</span>
                                    <span className="file-size">{(file?.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button type="button" className="remove-btn" onClick={removeFile}>
                                    ✕ Remove
                                </button>
                            </div>
                        ) : (
                            <label className="upload-label">
                                <div className="upload-icon">📄</div>
                                <p>Drag & drop your ID card here</p>
                                <span>or click to browse</span>
                                <p className="file-hint">JPG, PNG (max 5MB)</p>
                                <input 
                                    type="file" 
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleFileChange}
                                    hidden
                                />
                            </label>
                        )}
                    </div>

                    <div className="guidelines">
                        <h3>📋 Upload Guidelines</h3>
                        <ul>
                            <li>Ensure your full name is visible on the ID</li>
                            <li>Photo should be clear and not blurry</li>
                            <li>ID must be valid and not expired</li>
                            <li>All corners of the ID should be visible</li>
                        </ul>
                    </div>

                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={!file || loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <span>📤</span>
                                Submit for Verification
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default KYC;
