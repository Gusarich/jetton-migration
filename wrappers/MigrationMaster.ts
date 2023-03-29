import { Blockchain } from '@ton-community/sandbox';
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { JettonMinter } from './JettonMinter';

export type MigrationMasterConfig = {
    oldJettonMinter: Address;
    newJettonMinter: Address;
    oldWalletCode?: Cell;
    newWalletCode?: Cell;
};

export async function migrationMasterConfigToCell(
    config: MigrationMasterConfig,
    blockchain: Blockchain
): Promise<Cell> {
    return beginCell()
        .storeAddress(config.oldJettonMinter)
        .storeAddress(config.newJettonMinter)
        .storeRef(
            config.oldWalletCode ||
                (await blockchain.openContract(JettonMinter.createFromAddress(config.oldJettonMinter)).getWalletCode())
        )
        .storeRef(
            config.newWalletCode ||
                (await blockchain.openContract(JettonMinter.createFromAddress(config.newJettonMinter)).getWalletCode())
        )
        .endCell();
}

export class MigrationMaster implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MigrationMaster(address);
    }

    static async createFromConfig(config: MigrationMasterConfig, code: Cell, blockchain: Blockchain, workchain = 0) {
        const data = await migrationMasterConfigToCell(config, blockchain);
        const init = { code, data };
        return new MigrationMaster(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getBalance(provider: ContractProvider) {
        return (await provider.getState()).balance;
    }
}
