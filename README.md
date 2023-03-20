# Jetton Migration

This repository contains smart contracts necessary for the safe migration of Jettons to new versions of minters.

## Description

TL-B scheme is available in `contracts/scheme.tlb` file:

-   https://github.com/Gusarich/jetton-migration/blob/main/contracts/scheme.tlb

### MigrationMaster description

`MigrationMaster` waits for `process_migration` message from any of `MigrationHelper` instances and transfers `amount` of Jettons to `recipient` while burning `amount` of old Jettons.

Storage:

-   `new_jetton_wallet` - Jetton Wallet address of `MigrationMaster` contract for new version of Jetton
-   `migration_helper_code` - Cell with code of `MigrationHelper` contract

### MigrationHelper description

`MigrationHelper` waits for `initiate_migration` and sends `process_migration` message to `MigrationMaster` contract with `recipient` field set to account, linked to that `MigrationHelper`

Storage:

-   `old_jetton_wallet` - Jetton Wallet address of `MigrationMaster` contract for old version of Jetton
-   `migration_master` - Address of `MigrationMaster` contract linked to that `MigrationHelper` instance
-   `recipient` - Address of User

### Usage scenario: Admin

1. Deploy new version of Jetton.
2. Deploy `MigrationMaster` contract.
3. Mint **X** Jettons to the deployed `MigrationMaster` contract, where **X** is the total supply of Jettons in old minter.

### Usage scenario: User

1. Deploy `MigrationHelper` contract.
2. Transfer desired amount of Jettons to `MigrationHelper` contract.
3. Initiate the migration process by sending `initiate_migration` message to the `MigrationHelper` contract.

Point 3 is not neccessary and can be done by simply attaching `transfer_notification` on a Jetton transfer from Point 2
