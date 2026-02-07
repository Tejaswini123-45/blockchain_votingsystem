// Contract Configuration
// Update CONTRACT_ADDRESS after deploying on Remix

export const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138"; // UPDATE THIS AFTER DEPLOYMENT!

// Network configurations
export const NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    currency: "ETH"
  },
  goerli: {
    chainId: 5,
    name: "Goerli",
    rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://goerli.etherscan.io",
    currency: "ETH"
  },
  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "",
    currency: "ETH"
  }
};

// Current network (change for different environments)
export const CURRENT_NETWORK = NETWORKS.sepolia;

// Check if contract is deployed
export const isContractDeployed = () => {
  return CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
};
