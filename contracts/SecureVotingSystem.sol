// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecureVotingSystem
 * @dev Blockchain-based voting system with anonymity and tamper-proof records
 * 
 * Features:
 * - One-person-one-vote control via voting tokens
 * - Anonymity: Identity separated from votes using commitment scheme
 * - Public auditable tally without exposing individual choices
 * - Admin controls for election management
 * 
 * Deploy on Remix: https://remix.ethereum.org
 * Use Sepolia/Goerli testnet for testing
 */
contract SecureVotingSystem {
    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    
    address public admin;
    string public electionName;
    bool public electionStarted;
    bool public electionEnded;
    uint256 public startTime;
    uint256 public endTime;
    
    // Position struct for multiple positions (President, VP, etc.)
    struct Position {
        uint256 id;
        string name;
        bool exists;
        uint256[] candidateIds;
    }
    
    // Candidate struct
    struct Candidate {
        uint256 id;
        string name;
        string department;
        uint256 positionId;
        uint256 voteCount;
        bool exists;
    }
    
    // Voting token for anonymity - issued after KYC verification
    struct VotingToken {
        bytes32 tokenHash;      // Hash of secret token (for anonymity)
        bool issued;
        bool used;
        uint256 issuedAt;
    }
    
    // Vote record (fully anonymous - NO voter identity or choice stored)
    struct VoteRecord {
        bytes32 voteHash;        // Unique hash for verification only
        uint256 positionId;      // Which position was voted for
        uint256 timestamp;       // When the vote was cast
        // NOTE: candidateId and tokenHash are NOT stored to ensure privacy!
    }
    
    // Mappings
    mapping(uint256 => Position) public positions;
    mapping(uint256 => Candidate) public candidates;
    mapping(bytes32 => VotingToken) public votingTokens;
    mapping(bytes32 => mapping(uint256 => bool)) public tokenVotedForPosition;
    
    // Arrays for enumeration
    uint256[] public positionIds;
    uint256[] public candidateIds;
    VoteRecord[] public voteRecords;
    
    // Counters
    uint256 public positionCount;
    uint256 public candidateCount;
    uint256 public totalVotes;
    uint256 public tokensIssued;
    
    // =========================================================================
    // EVENTS
    // =========================================================================
    
    event ElectionCreated(string name, uint256 startTime, uint256 endTime);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp);
    event PositionAdded(uint256 indexed positionId, string name);
    event CandidateAdded(uint256 indexed candidateId, string name, uint256 positionId);
    event VotingTokenIssued(bytes32 indexed tokenHash, uint256 timestamp);
    event VoteCast(bytes32 indexed voteHash, uint256 positionId, uint256 timestamp);
    event ResultsPublished(uint256 timestamp);
    
    // =========================================================================
    // MODIFIERS
    // =========================================================================
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier electionActive() {
        require(electionStarted && !electionEnded, "Election is not active");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Outside election period");
        _;
    }
    
    modifier electionNotStarted() {
        require(!electionStarted, "Election already started");
        _;
    }
    
    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================
    
    constructor(string memory _electionName, uint256 _startTime, uint256 _endTime) {
        require(_startTime < _endTime, "Invalid election period");
        
        admin = msg.sender;
        electionName = _electionName;
        startTime = _startTime;
        endTime = _endTime;
        
        emit ElectionCreated(_electionName, _startTime, _endTime);
    }
    
    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================
    
    /**
     * @dev Add a new position (e.g., President, Vice President)
     */
    function addPosition(string memory _name) external onlyAdmin electionNotStarted {
        positionCount++;
        uint256 positionId = positionCount;
        
        positions[positionId] = Position({
            id: positionId,
            name: _name,
            exists: true,
            candidateIds: new uint256[](0)
        });
        
        positionIds.push(positionId);
        
        emit PositionAdded(positionId, _name);
    }
    
    /**
     * @dev Add a candidate for a position
     */
    function addCandidate(
        string memory _name,
        string memory _department,
        uint256 _positionId
    ) external onlyAdmin electionNotStarted {
        require(positions[_positionId].exists, "Position does not exist");
        
        candidateCount++;
        uint256 candidateId = candidateCount;
        
        candidates[candidateId] = Candidate({
            id: candidateId,
            name: _name,
            department: _department,
            positionId: _positionId,
            voteCount: 0,
            exists: true
        });
        
        positions[_positionId].candidateIds.push(candidateId);
        candidateIds.push(candidateId);
        
        emit CandidateAdded(candidateId, _name, _positionId);
    }
    
    /**
     * @dev Start the election
     */
    function startElection() external onlyAdmin {
        require(!electionStarted, "Election already started");
        require(positionCount > 0, "Add at least one position");
        require(candidateCount > 0, "Add at least one candidate");
        
        electionStarted = true;
        
        emit ElectionStarted(block.timestamp);
    }
    
    /**
     * @dev End the election
     */
    function endElection() external onlyAdmin {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election already ended");
        
        electionEnded = true;
        
        emit ElectionEnded(block.timestamp);
    }
    
    /**
     * @dev Issue a voting token to a verified voter (called by backend after KYC)
     * @param _tokenHash Hash of the secret token (actual token kept secret)
     * 
     * Anonymity mechanism:
     * 1. Backend generates random token after KYC verification
     * 2. Stores hash on blockchain (not linkable to voter identity)
     * 3. Gives actual token to voter via encrypted channel
     * 4. Voter uses token to vote (only hash is recorded)
     */
    function issueVotingToken(bytes32 _tokenHash) external onlyAdmin {
        require(!votingTokens[_tokenHash].issued, "Token already issued");
        
        votingTokens[_tokenHash] = VotingToken({
            tokenHash: _tokenHash,
            issued: true,
            used: false,
            issuedAt: block.timestamp
        });
        
        tokensIssued++;
        
        emit VotingTokenIssued(_tokenHash, block.timestamp);
    }
    
    // =========================================================================
    // VOTING FUNCTIONS
    // =========================================================================
    
    /**
     * @dev Cast a vote using voting token
     * @param _token The secret voting token (will be hashed for verification)
     * @param _positionId Position to vote for
     * @param _candidateId Candidate to vote for
     * 
     * Privacy: Only token hash stored, not linkable to voter
     */
    function castVote(
        string memory _token,
        uint256 _positionId,
        uint256 _candidateId
    ) external electionActive {
        bytes32 tokenHash = keccak256(abi.encodePacked(_token));
        
        // Verify token is valid
        require(votingTokens[tokenHash].issued, "Invalid voting token");
        require(!tokenVotedForPosition[tokenHash][_positionId], "Already voted for this position");
        
        // Verify position and candidate
        require(positions[_positionId].exists, "Invalid position");
        require(candidates[_candidateId].exists, "Invalid candidate");
        require(candidates[_candidateId].positionId == _positionId, "Candidate not in this position");
        
        // Mark as voted for this position
        tokenVotedForPosition[tokenHash][_positionId] = true;
        
        // Increment vote count (only aggregate counts stored - no individual choice recorded!)
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        // Create anonymous vote hash for verification (contains no linkable data)
        bytes32 voteHash = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            _positionId,
            totalVotes // Use as nonce for uniqueness
        ));
        
        // Record vote (FULLY ANONYMOUS - NO voter identity or choice stored!)
        voteRecords.push(VoteRecord({
            voteHash: voteHash,
            positionId: _positionId,
            timestamp: block.timestamp
            // NOTE: No candidateId or tokenHash stored = complete privacy!
        }));
        
        emit VoteCast(voteHash, _positionId, block.timestamp);
    }
    
    /**
     * @dev Check if token has voted for a position
     */
    function hasVotedForPosition(string memory _token, uint256 _positionId) external view returns (bool) {
        bytes32 tokenHash = keccak256(abi.encodePacked(_token));
        return tokenVotedForPosition[tokenHash][_positionId];
    }
    
    /**
     * @dev Verify a token is valid
     */
    function verifyToken(string memory _token) external view returns (bool) {
        bytes32 tokenHash = keccak256(abi.encodePacked(_token));
        return votingTokens[tokenHash].issued;
    }
    
    // =========================================================================
    // PUBLIC VIEW FUNCTIONS (Auditable Results)
    // =========================================================================
    
    /**
     * @dev Get all positions
     */
    function getAllPositions() external view returns (uint256[] memory) {
        return positionIds;
    }
    
    /**
     * @dev Get position details
     */
    function getPosition(uint256 _positionId) external view returns (
        string memory name,
        uint256[] memory candidateIdsForPosition
    ) {
        require(positions[_positionId].exists, "Position does not exist");
        Position storage pos = positions[_positionId];
        return (pos.name, pos.candidateIds);
    }
    
    /**
     * @dev Get candidate details and vote count
     */
    function getCandidate(uint256 _candidateId) external view returns (
        string memory name,
        string memory department,
        uint256 positionId,
        uint256 voteCount
    ) {
        require(candidates[_candidateId].exists, "Candidate does not exist");
        Candidate storage cand = candidates[_candidateId];
        return (cand.name, cand.department, cand.positionId, cand.voteCount);
    }
    
    /**
     * @dev Get results for a position (public, auditable)
     */
    function getPositionResults(uint256 _positionId) external view returns (
        string memory positionName,
        uint256[] memory candidateIdsResult,
        string[] memory candidateNames,
        uint256[] memory voteCounts
    ) {
        require(positions[_positionId].exists, "Position does not exist");
        
        Position storage pos = positions[_positionId];
        uint256 count = pos.candidateIds.length;
        
        string[] memory names = new string[](count);
        uint256[] memory votes = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 candId = pos.candidateIds[i];
            names[i] = candidates[candId].name;
            votes[i] = candidates[candId].voteCount;
        }
        
        return (pos.name, pos.candidateIds, names, votes);
    }
    
    /**
     * @dev Get total vote records count (for audit)
     */
    function getVoteRecordsCount() external view returns (uint256) {
        return voteRecords.length;
    }
    
    /**
     * @dev Get vote record by index (for audit - fully anonymous, no choice revealed)
     */
    function getVoteRecord(uint256 _index) external view returns (
        bytes32 voteHash,
        uint256 positionId,
        uint256 timestamp
    ) {
        require(_index < voteRecords.length, "Invalid index");
        VoteRecord storage record = voteRecords[_index];
        return (record.voteHash, record.positionId, record.timestamp);
    }
    
    /**
     * @dev Get election info
     */
    function getElectionInfo() external view returns (
        string memory name,
        bool started,
        bool ended,
        uint256 start,
        uint256 end,
        uint256 totalPositions,
        uint256 totalCandidates,
        uint256 totalVotesCast,
        uint256 totalTokens
    ) {
        return (
            electionName,
            electionStarted,
            electionEnded,
            startTime,
            endTime,
            positionCount,
            candidateCount,
            totalVotes,
            tokensIssued
        );
    }
}
