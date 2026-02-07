# Smart Contract Deployment Guide

## Deploy on Remix Ethereum IDE

### Step 1: Open Remix
Go to [https://remix.ethereum.org](https://remix.ethereum.org)

### Step 2: Create Contract File
1. In the File Explorer (left panel), click the "+" icon
2. Create new file: `SecureVotingSystem.sol`
3. Copy the entire contents of `contracts/SecureVotingSystem.sol` into it

### Step 3: Compile Contract
1. Go to **Solidity Compiler** tab (left sidebar)
2. Select Compiler Version: `0.8.19` or higher
3. Click **Compile SecureVotingSystem.sol**
4. Ensure no errors (warnings are OK)

### Step 4: Connect MetaMask
1. Install [MetaMask](https://metamask.io/) browser extension
2. Create/Import wallet
3. Switch to **Sepolia Testnet**:
   - Click network dropdown → Show test networks → Sepolia
4. Get test ETH from faucet:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

### Step 5: Deploy Contract
1. Go to **Deploy & Run Transactions** tab
2. Environment: **Injected Provider - MetaMask**
3. Connect MetaMask when prompted
4. Contract: Select `SecureVotingSystem`
5. Constructor Parameters:
   ```
   _electionName: "College Election 2025"
   _startTime: 1735689600 (Unix timestamp - use epochconverter.com)
   _endTime: 1735776000 (24 hours later)
   ```
6. Click **Deploy**
7. Confirm transaction in MetaMask
8. **SAVE THE CONTRACT ADDRESS** after deployment!

### Step 6: Get Contract ABI
1. In Remix Compiler tab, click **ABI** button (copies to clipboard)
2. Paste into `client/src/contracts/SecureVotingSystem.json`

---

## Contract Setup After Deployment

### Add Positions
In Remix, call `addPosition` function:
```
_name: "President"
_name: "Vice President"
_name: "Secretary"
_name: "Treasurer"
```

### Add Candidates
Call `addCandidate` function:
```
_name: "Priya Sharma"
_department: "Computer Science"
_positionId: 1  (President)
```

### Start Election
Call `startElection` function (no parameters)

---

## Environment Setup

### Update .env in backend
```env
CONTRACT_ADDRESS=0x... (your deployed contract address)
ADMIN_PRIVATE_KEY=... (MetaMask account private key - KEEP SECRET!)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

### Update contract config in frontend
Edit `client/src/contracts/config.js`:
```javascript
export const CONTRACT_ADDRESS = "0x..."; // Your contract address
export const NETWORK_ID = 11155111; // Sepolia
```

---

## Testing on Remix

### Test Voting Flow
1. Issue a voting token:
   ```javascript
   // Generate token hash (in browser console)
   const token = "secret-token-123";
   const hash = ethers.keccak256(ethers.toUtf8Bytes(token));
   ```
2. Call `issueVotingToken(hash)` as admin
3. Call `castVote("secret-token-123", 1, 1)` to vote
4. Call `getPositionResults(1)` to see results

---

## Security Notes

⚠️ **NEVER commit private keys to git**
⚠️ **Use environment variables for sensitive data**
⚠️ **Test thoroughly on testnet before mainnet**

---

## Network Information

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Sepolia | 11155111 | https://sepolia.infura.io/v3/YOUR_KEY |
| Goerli | 5 | https://goerli.infura.io/v3/YOUR_KEY |
| Localhost | 31337 | http://127.0.0.1:8545 |

---

## Contract Address (Update After Deploy)
```
Sepolia: 0x_YOUR_CONTRACT_ADDRESS_HERE
```
