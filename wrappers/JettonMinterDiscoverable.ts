import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { JettonMinter } from './JettonMinter';

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

export class JettonMinterDiscoverable extends JettonMinter implements Contract {
    static createFromAddress(address: Address) {
        return new JettonMinterDiscoverable(address);
    }

    static createFromConfig(config: JettonMinterDiscoverableConfig, code: Cell, workchain = 0) {
        const data = jettonMinterDiscoverableConfigToCell(config);
        const init = { code, data };
        return new JettonMinterDiscoverable(contractAddress(workchain, init), init);
    }
}
