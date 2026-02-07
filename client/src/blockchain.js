import { ethers } from "ethers";

// Replace with your actual contract address from Remix
const contractAddress = "0xYourContractAddressHere"; 

// Replace with your actual ABI array from Remix
const contractABI = [ /* PASTE YOUR ABI ARRAY HERE */ ];

export const castVoteOnBlockchain = async (candidateId) => {
  if (typeof window.ethereum !== 'undefined') {
    // 1. Connect to MetaMask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    // 2. Connect to the Contract
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // 3. Call the vote function
    const transaction = await contract.vote(candidateId);
    
    // 4. Wait for it to finish
    return await transaction.wait();
  } else {
    throw new Error("Please install MetaMask");
  }
};