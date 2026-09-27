# MAVNARO Beta V2

Static, mobile-first MAVNARO beta. No npm/build required.

## What is real in this build
- Responsive mobile navigation and full-width layout.
- EVM wallet connection through `window.ethereum` (MetaMask, Coinbase Wallet browser, etc.).
- Wallet/account and chain changes are detected live.
- Daily spin reset is date-based.
- Chat, missions, referral link, XP, balance and history persist locally.
- Referral links are generated and copyable.

## What is intentionally NOT claimed as production-real yet
- Beta points are not blockchain tokens and have no monetary value.
- Chat replies are local beta logic, not a hosted AI model.
- Leaderboard is not a shared server leaderboard.
- Rewards are not minted/transferred on-chain.
- NFT gating is intentionally absent from the beta app.

Those four production functions require a backend and/or smart contracts. Do not put private API keys in this static GitHub Pages site.

## Later NFT gate
Create a separate `/verify` page that checks the connected wallet's NFT ownership against the final NFT contract, then redirects verified holders to the app. Keep the app itself unchanged.

## Optional configuration
Edit `config.js` for the final EVM chain, Supabase URL/anon key, and Reown/WalletConnect project ID when those services are created.
