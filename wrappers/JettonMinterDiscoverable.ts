import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type JettonMinterDiscoverableConfig = {};

export function jettonMinterDiscoverableConfigToCell(config: JettonMinterDiscoverableConfig): Cell {
    return beginCell().endCell();
}

export class JettonMinterDiscoverable implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonMinterDiscoverable(address);
    }

    static createFromConfig(config: JettonMinterDiscoverableConfig, code: Cell, workchain = 0) {
        const data = jettonMinterDiscoverableConfigToCell(config);
        const init = { code, data };
        return new JettonMinterDiscoverable(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
