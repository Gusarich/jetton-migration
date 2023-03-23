import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type JettonMinterDiscoverableConfig = {
    admin: Address;
    content: Cell;
    walletCode: Cell;
};

export function jettonMinterDiscoverableConfigToCell(config: JettonMinterDiscoverableConfig): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.admin)
        .storeRef(config.content)
        .storeRef(config.walletCode)
        .endCell();
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

    async sendMint(provider: ContractProvider, via: Sender, value: bigint, recipient: Address, amount: bigint) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1674b0a0, 32)
                .storeUint(0, 64)
                .storeAddress(recipient)
                .storeCoins(amount)
                .storeRef(
                    beginCell()
                        .storeUint(0x178d4519, 32)
                        .storeUint(0, 64)
                        .storeCoins(amount)
                        .storeAddress(this.address)
                        .storeAddress(this.address)
                        .storeCoins(0)
                        .storeUint(0, 1)
                        .endCell()
                )
                .endCell(),
            value: value,
        });
    }
}
