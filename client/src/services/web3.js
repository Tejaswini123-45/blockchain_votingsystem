import { ethers } from "ethers";
import contractABI from "../contracts/SecureVotingSystem.json";
import { CONTRACT_ADDRESS } from "../contracts/config";

class Web3Service {

  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  async connectWallet() {

    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);

    await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    this.signer = await this.provider.getSigner();

    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractABI.abi,
      this.signer
    );

    const account = await this.signer.getAddress();

    return { account };
  }

  async getElectionInfo() {
    const info = await this.contract.getElectionInfo();

    return {
      name: info.name,
      totalCandidates: Number(info.totalCandidates),
      totalVotes: Number(info.totalVotes),
      started: info.started,
      ended: info.ended
    };
  }

  async getPositions() {
    const positions = await this.contract.getPositions();

    return positions.map(p => ({
      id: Number(p.id),
      name: p.name
    }));
  }

  async getCandidatesByPosition(positionId) {
    const candidates = await this.contract.getCandidates(positionId);

    return candidates.map(c => ({
      id: Number(c.id),
      name: c.name,
      department: c.department,
      voteCount: Number(c.voteCount)
    }));
  }

  async hasVotedForPosition(token, positionId) {
    return await this.contract.hasVoted(token, positionId);
  }

  async castVote(token, positionId, candidateId) {

    const tx = await this.contract.vote(
      token,
      positionId,
      candidateId
    );

    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash
    };
  }
}

export default new Web3Service();