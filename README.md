# 🗳️ Secure Voting System Using Blockchain

A decentralized voting platform built with **MERN Stack** and **Ethereum Blockchain** for secure, transparent, and tamper-proof elections.

![Architecture](https://img.shields.io/badge/Architecture-MERN%20%2B%20Ethereum-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core Voting Features
- ✅ **One-Person-One-Vote**: Enforced at smart contract level
- 🔒 **Anonymous Voting**: Identity separated from votes using token mechanism
- 📊 **Public Auditable Results**: All votes verifiable on blockchain
- 🛡️ **Tamper-proof**: Votes immutably stored on Ethereum

### Authentication & Security
- 🔐 JWT Authentication with bcrypt password hashing
- 📧 OTP-based Email Verification
- 🆔 KYC Verification with ID card upload
- 🛡️ Helmet.js security headers
- ⏱️ Rate limiting protection

### Blockchain Integration
- 📝 Solidity Smart Contract (v0.8.19)
- 🦊 MetaMask Wallet Integration
- ⛓️ Sepolia Testnet Compatible
- 🔍 Transaction verification & audit log

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │ Vote UI     │  │ Results View  │  │ Admin Dashboard      │  │
│  └──────┬──────┘  └───────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │                   Web3 Service (ethers.js)                │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
│    Backend    │  │   MongoDB      │  │ Ethereum Network │
│   (Express)   │  │  (User Data)   │  │(Smart Contract)  │
│   Port 5000   │  │   Port 27017   │  │  Sepolia/Mainnet │
└───────────────┘  └────────────────┘  └──────────────────┘
```

---

## 📁 Project Structure

```
blockchain_votingsystem/
├── backend/                    # Express.js API Server
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── blockchain.controller.js  # Voting token management
│   │   ├── kyc.controller.js
│   │   └── vote.controller.js
│   ├── models/
│   │   ├── User.model.js       # User with voting token fields
│   │   ├── Candidate.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── blockchain.routes.js  # Token issuance endpoints
│   │   └── ...
│   └── server.js
│
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── contracts/
│   │   │   ├── SecureVotingSystem.json  # Contract ABI
│   │   │   └── config.js       # Contract address config
│   │   ├── services/
│   │   │   ├── api.js          # Backend API calls
│   │   │   └── web3.js         # Blockchain interactions
│   │   └── pages/
│   │       ├── BlockchainVote.jsx
│   │       └── BlockchainResults.jsx
│   └── ...
│
├── contracts/                  # Solidity Smart Contracts
│   ├── SecureVotingSystem.sol  # Main voting contract
│   └── DEPLOYMENT_GUIDE.md     # Remix deployment instructions
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- MetaMask browser extension
- Sepolia test ETH (from faucet)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/clg_voting
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
```

Start server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 3. Deploy Smart Contract

1. Open [Remix IDE](https://remix.ethereum.org)
2. Copy `contracts/SecureVotingSystem.sol`
3. Compile with Solidity 0.8.19
4. Deploy to Sepolia via MetaMask
5. Copy contract address to `client/src/contracts/config.js`

See [DEPLOYMENT_GUIDE.md](contracts/DEPLOYMENT_GUIDE.md) for detailed steps.

---

## ⛓️ Smart Contract Overview

### SecureVotingSystem.sol

**Key Features:**
- **Anonymous Tokens**: Voters receive hashed tokens (identity hidden)
- **Position-based Voting**: Multiple positions (President, VP, etc.)
- **One-vote-per-position**: Enforced on-chain
- **Public Audit Trail**: All votes verifiable without exposing identity

**Main Functions:**
```solidity
// Admin functions
addPosition(string name)          // Add a voting position
addCandidate(name, dept, posId)   // Register a candidate
issueVotingToken(bytes32 hash)    // Issue token after KYC
startElection() / endElection()   // Control election state

// Voter functions
castVote(token, positionId, candidateId)  // Cast anonymous vote
hasVotedForPosition(token, posId)         // Check if voted

// Public views (auditable)
getPositionResults(posId)         // Get vote counts
getVoteRecordsCount()             // Total votes cast
getVoteRecord(index)              // Individual vote (anonymous)
```

---

## 🔐 Anonymity Mechanism

```
┌──────────────────────────────────────────────────────────────┐
│                    HOW VOTING ANONYMITY WORKS                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User completes KYC ─────► Identity verified               │
│                               (stored in MongoDB)             │
│                                                               │
│  2. Server generates random token ─────► Given to user        │
│     (stored encrypted, never linked to vote)                  │
│                                                               │
│  3. Token HASH stored on blockchain ─────► No identity link   │
│     keccak256(token) → contract                               │
│                                                               │
│  4. User casts vote with TOKEN ─────► Vote recorded           │
│     (token, positonId, candidateId)                           │
│                                                               │
│  5. Blockchain stores: ─────────────────► Auditable           │
│     - Vote hash (not token)                                   │
│     - Position ID                                             │
│     - Candidate ID                                            │
│     - Timestamp                                               │
│                                                               │
│  ❌ NO voter identity stored on blockchain                    │
│  ✅ Vote verifiable by token holder only                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### KYC
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/kyc/upload | Upload ID card |
| GET | /api/kyc/status | Get KYC status |
| POST | /api/kyc/approve/:id | Admin approve KYC |

### Blockchain
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/blockchain/token | Get/generate voting token |
| POST | /api/blockchain/token/issue | Admin issue token |
| GET | /api/blockchain/token/hash/:userId | Get hash for contract |

---

## 🧪 Testing Flow

### 1. Register & Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","userId":"CS001","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"CS001","password":"password123"}'
```

### 2. Complete KYC
- Navigate to /kyc
- Upload ID card image
- Wait for admin approval (or auto-approve in dev mode)

### 3. Get Voting Token
- Token auto-generated after KYC approval
- Available at /api/blockchain/token

### 4. Cast Vote on Blockchain
- Connect MetaMask on /blockchain-vote
- Enter voting token
- Select candidate and confirm transaction

### 5. View Results
- Navigate to /blockchain-results
- See live vote counts from blockchain
- Check audit log for transparency

---

## 🔧 Technologies

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, ethers.js |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Blockchain | Ethereum, Solidity 0.8.19 |
| Wallet | MetaMask |
| Network | Sepolia Testnet |
| Auth | JWT, bcrypt |
| Security | Helmet.js, Rate Limiting |

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 👥 Team

Built as a college project demonstrating secure blockchain-based voting.

---

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for Solidity patterns
- [Remix IDE](https://remix.ethereum.org/) for smart contract development
- [ethers.js](https://ethers.org/) for Ethereum integration