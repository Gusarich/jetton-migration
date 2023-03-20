# Jetton Migration

## Logic

TL-B scheme is available in `contracts/scheme.tlb` file:

-   https://github.com/Gusarich/jetton-migration/blob/main/contracts/scheme.tlb

### Usage scenario: Admin

1. Deploy new version of Jetton and mint the whole supply of previous version using new minter.
2. Deploy `MigrationMaster` contract. Storage:
    - `new_jetton_wallet` - Jetton Wallet address of `MigrationMaster` contract for new version of Jetton

### Usage scenario: User

1. Deploy `MigrationHelper` contract. Storage:
    - `old_jetton_wallet` - Jetton Wallet address of `MigrationHelper` contract for old version of Jetton
    - `migration_master` - `MigrationMaster` contract address
    - `recipient` - User's wallet address
2. Transfer desired amount of Jettons to `MigrationHelper` contract
3. Initiate the migration process by sending `migrate#79e4748e` message to the `MigrationHelper` contract

Point 3 is not neccessary and can be done by simply attaching `transfer_notification` on a Jetton transfer from Point 2
