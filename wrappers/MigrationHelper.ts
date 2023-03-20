import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type MigrationHelperConfig = {};

export function migrationHelperConfigToCell(config: MigrationHelperConfig): Cell {
    return beginCell().endCell();
}

export class MigrationHelper implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MigrationHelper(address);
    }

    static createFromConfig(config: MigrationHelperConfig, code: Cell, workchain = 0) {
        const data = migrationHelperConfigToCell(config);
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
}
