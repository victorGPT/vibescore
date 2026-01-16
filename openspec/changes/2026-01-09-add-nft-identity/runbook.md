# Runbook: VibeUsage Identity Contract Deployment (UUPS)

## Goal
Deploy the upgradeable SBT contract to Base and initialize it with name/symbol and voucher signer, using an ERC1967 proxy.

## Preconditions
- Base RPC URL and funded deployer key.
- Voucher signer address ready (backend signing key).
- Allowlist roots (member-free / invite / purchase) prepared.
- Foundry installed and `forge test` passing in `contracts/`.
- `contracts/script/Deploy.s.sol` available (uses OpenZeppelin `ERC1967Proxy`).

## Step 1: Build + test
Run:
```
cd contracts
forge build
forge test
```

## Step 2: Deploy implementation + proxy (script)
```
export RPC_URL="https://base-mainnet-rpc.example"
export DEPLOYER_KEY="<hex private key>"
export SIGNER="0xSignerAddress"
export NAME="VibeUsage Identity"
export SYMBOL="VIBE"

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_KEY" \
  --broadcast
```
Record the output addresses as `IMPL` and `PROXY`.

## Step 3: (Optional) Manual proxy deployment
If you need a manual fallback, prepare initializer calldata:
```
export SIGNER="0xSignerAddress"
export NAME="VibeUsage Identity"
export SYMBOL="VIBE"

INIT_DATA=$(cast calldata "initialize(string,string,address)" "$NAME" "$SYMBOL" "$SIGNER")
```

Deploy the implementation:
```
forge create \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_KEY" \
  src/VibeUsageIdentity.sol:VibeUsageIdentity
```
Record the implementation address as `IMPL`.

Deploy the proxy:
```
forge create \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_KEY" \
  lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --constructor-args "$IMPL" "$INIT_DATA"
```
Record the proxy address as `PROXY`.

## Step 4: Post-deploy setup
Transfer ownership to the admin/multisig:
```
export OWNER="0xOwnerOrMultisig"
cast send "$PROXY" "transferOwnership(address)" "$OWNER" \
  --rpc-url "$RPC_URL" --private-key "$DEPLOYER_KEY"
```

Set signer and allowlist roots (from owner):
```
cast send "$PROXY" "setVoucherSigner(address)" "$SIGNER" \
  --rpc-url "$RPC_URL" --private-key "$DEPLOYER_KEY"

cast send "$PROXY" "setClaimRoot(uint8,bytes32)" 0 0x<root_member_free> \
  --rpc-url "$RPC_URL" --private-key "$DEPLOYER_KEY"
```
Repeat for claim types 1/2 as needed.

## Step 4b: Post-deploy setup (scripted)
```
export PROXY="0xProxyAddress"
export OWNER="0xOwnerOrMultisig"
export ROOT_0="0x<root_member_free>"
export ROOT_1="0x<root_invite>"
export ROOT_2="0x<root_purchase>"

forge script script/Configure.s.sol:Configure \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_KEY" \
  --broadcast
```
This will set claim roots for types 0/1/2 and transfer ownership.

## Step 5: Upgrade procedure (UUPS)
1) Deploy new implementation (same as Step 2) and record `NEW_IMPL`.
2) Verify storage layout changes before upgrade.
3) From the owner, run:
```
cast send "$PROXY" "upgradeTo(address)" "$NEW_IMPL" \
  --rpc-url "$RPC_URL" --private-key "$OWNER_KEY"
```
4) If a new initializer is required, use `upgradeToAndCall(address,bytes)` instead.

## Evidence to record
- `IMPL` and `PROXY` addresses.
- Chain ID + block numbers.
- Owner address after transfer.
- Claim root values and signer address.
- Add a line to `docs/deployment/freeze.md` with the deployment record.
