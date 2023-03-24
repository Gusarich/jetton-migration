import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type MigrationMasterConfig = {
    oldJettonMinter: Address;
    newJettonMinter: Address;
    walletCode: Cell;
};

export function migrationMasterConfigToCell(config: MigrationMasterConfig): Cell {
    return beginCell()
        .storeAddress(config.oldJettonMinter)
        .storeAddress(config.newJettonMinter)
        .storeRef(config.walletCode)
        .endCell();
}

export class MigrationMaster implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MigrationMaster(address);
    }

    static createFromConfig(config: MigrationMasterConfig, code: Cell, workchain = 0) {
        const data = migrationMasterConfigToCell(config);
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
}
