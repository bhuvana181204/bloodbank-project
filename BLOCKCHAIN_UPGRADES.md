# Blockchain Upgrades — v2.0

This project uses a **custom SHA-256 blockchain** built with Node.js built-in `crypto` module.
No Ethereum, Hardhat, Solidity, or ethers.js is required or used.

---

## Blockchain Features Implemented

### 1. Digital Signatures
- RSA key pair via `crypto.generateKeyPairSync`
- Every block signed by the creating validator
- Signatures verified in `isChainValid()`

### 2. Merkle Tree for Block Integrity
- `MerkleTree` class hashes all transactions into a Merkle root per block
- Merkle root stored and re-verified during chain validation
- Detects tampering of any single transaction

### 3. Proof of Authority (PoA) Consensus
- `ValidatorRegistry` tracks authorised validators (admin, bloodbank, hospital)
- Only registered validators can add blocks via `addBlockWithSignature()`

### 4. Blockchain Integrity Verification
- `isChainValid()` checks: previous hash, recalculated hash, Merkle root, signature
- `auditChain()` returns per-block report
- Admin dashboard Verify button calls `GET /api/blockchain/validate`

### 5. Merkle Proof API
- `GET /api/blockchain/merkle/:blockIndex` — Merkle root for a block
- `POST /api/blockchain/verify-tx` — verify a transaction in a block

---

## How to Run

```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

No Hardhat, no Solidity, no MetaMask, no gas fees needed.
