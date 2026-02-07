import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar, ProtectedRoute } from './components';
import { Home, Login, Register, Dashboard, BlockchainVote, KYC, BlockchainResults, Admin } from './pages';
import './App.css';
import { castVoteOnBlockchain } from './blockchain';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/vote"
                                element={
                                    <ProtectedRoute>
                                        <BlockchainVote />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/kyc"
                                element={
                                    <ProtectedRoute>
                                        <KYC />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/results"
                                element={
                                    <ProtectedRoute>
                                        <BlockchainResults />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute>
                                        <Admin />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

const handleVoteClick = async (id) => {
  try {
    await castVoteOnBlockchain(id);
    alert("Blockchain Vote Success!");
    // Update your MongoDB state here next
  } catch (err) {
    alert("Error: " + err.message);
  }
};

export default App;
