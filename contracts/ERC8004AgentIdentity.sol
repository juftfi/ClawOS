// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004AgentIdentity
 * @dev ERC-8004 compliant AI Agent Identity NFT
 * Each NFT represents a unique AI agent with on-chain identity
 */
contract ERC8004AgentIdentity is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    // Mapping from token ID to agent metadata
    mapping(uint256 => AgentMetadata) public agentMetadata;
    
    // Mapping from agent ID to token ID
    mapping(string => uint256) public agentIdToTokenId;
    
    struct AgentMetadata {
        string agentId;
        string name;
        string description;
        address agentWallet;
        uint256 createdAt;
        uint256 reputationScore;
        bool isActive;
    }
    
    event AgentCreated(
        uint256 indexed tokenId,
        string agentId,
        string name,
        address indexed agentWallet,
        address indexed owner
    );
    
    event ReputationUpdated(
        uint256 indexed tokenId,
        uint256 newScore
    );
    
    constructor() ERC721("AI Agent Identity", "AGENT") Ownable(msg.sender) {
        _nextTokenId = 1;
    }
    
    /**
     * @dev Mint new agent identity NFT
     * @param to Address to mint NFT to
     * @param agentId Unique agent identifier
     * @param name Agent name
     * @param description Agent description
     * @param agentWallet Agent's wallet address
     * @param tokenURI Metadata URI
     */
    function mintAgentIdentity(
        address to,
        string memory agentId,
        string memory name,
        string memory description,
        address agentWallet,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(agentIdToTokenId[agentId] == 0, "Agent ID already exists");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        agentMetadata[tokenId] = AgentMetadata({
            agentId: agentId,
            name: name,
            description: description,
            agentWallet: agentWallet,
            createdAt: block.timestamp,
            reputationScore: 0,
            isActive: true
        });
        
        agentIdToTokenId[agentId] = tokenId;
        
        emit AgentCreated(tokenId, agentId, name, agentWallet, to);
        
        return tokenId;
    }
    
    /**
     * @dev Update agent reputation score
     * @param tokenId Token ID
     * @param newScore New reputation score
     */
    function updateReputation(uint256 tokenId, uint256 newScore) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        agentMetadata[tokenId].reputationScore = newScore;
        emit ReputationUpdated(tokenId, newScore);
    }
    
    /**
     * @dev Get agent metadata by token ID
     * @param tokenId Token ID
     */
    function getAgentMetadata(uint256 tokenId) public view returns (AgentMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return agentMetadata[tokenId];
    }
    
    /**
     * @dev Get token ID by agent ID
     * @param agentId Agent identifier
     */
    function getTokenIdByAgentId(string memory agentId) public view returns (uint256) {
        return agentIdToTokenId[agentId];
    }
    
    /**
     * @dev Deactivate agent
     * @param tokenId Token ID
     */
    function deactivateAgent(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        agentMetadata[tokenId].isActive = false;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
