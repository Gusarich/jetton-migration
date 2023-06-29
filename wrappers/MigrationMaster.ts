import { NetworkProvider } from '@ton-community/blueprint';
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
    opener: Blockchain | NetworkProvider
): Promise<Cell> {
    let oldJettonMinter = JettonMinter.createFromAddress(config.oldJettonMinter);
    let newJettonMinter = JettonMinter.createFromAddress(config.newJettonMinter);
    let result = beginCell().storeAddress(config.oldJettonMinter).storeAddress(config.newJettonMinter);
    if (opener instanceof Blockchain) {
        return result
            .storeRef(config.oldWalletCode || (await opener.openContract(oldJettonMinter).getWalletCode()))
            .storeRef(config.newWalletCode || (await opener.openContract(newJettonMinter).getWalletCode()))
            .endCell();
    }
    return result
        .storeRef(config.oldWalletCode || (await opener.open(oldJettonMinter).getWalletCode()))
        .storeRef(config.newWalletCode || (await opener.open(newJettonMinter).getWalletCode()))
        .endCell();
}

export class MigrationMaster implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MigrationMaster(address);
    }

    static async createFromConfig(
        config: MigrationMasterConfig,
        code: Cell,
        opener: Blockchain | NetworkProvider,
        workchain = 0
    ) {
        const data = await migrationMasterConfigToCell(config, opener);
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
