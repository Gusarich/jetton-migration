import { Blockchain } from '@ton-community/sandbox';
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { JettonMinter } from './JettonMinter';

export type MigrationHelperConfig = {
    oldJettonMinter: Address;
    migrationMaster: Address;
    recipient: Address;
    oldWalletCode?: Cell;
};

export async function migrationHelperConfigToCell(
    config: MigrationHelperConfig,
    blockchain: Blockchain
): Promise<Cell> {
    return beginCell()
        .storeAddress(config.oldJettonMinter)
        .storeAddress(config.migrationMaster)
        .storeAddress(config.recipient)
        .storeRef(
            config.oldWalletCode ||
                (await blockchain.openContract(JettonMinter.createFromAddress(config.oldJettonMinter)).getWalletCode())
        )
        .endCell();
}

export class MigrationHelper implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MigrationHelper(address);
    }

    static async createFromConfig(config: MigrationHelperConfig, code: Cell, blockchain: Blockchain, workchain = 0) {
        const data = await migrationHelperConfigToCell(config, blockchain);
        const init = { code, data };
        return new MigrationHelper(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMigrate(provider: ContractProvider, via: Sender, value: bigint, amount: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x79e4748e, 32).storeUint(0, 64).storeCoins(amount).endCell(),
        });
    }

    async getBalance(provider: ContractProvider) {
        return (await provider.getState()).balance;
    }
}
