import { Address, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { NetworkProvider } from '@ton-community/blueprint';
import { JettonWallet } from '../wrappers/JettonWallet';

export async function run(provider: NetworkProvider) {
    const migrationHelper = provider.open(
        MigrationHelper.createFromAddress(Address.parse('EQAD0NkLKy6-_pOlq-OkhHg0fwMSXh4afAZ0znu69kwcT9wJ'))
    );
    const oldJettonWallet = provider.open(
        JettonWallet.createFromAddress(Address.parse('EQAaEVqtVYVzYoAgSiWxQll4P-vTOFD8i998PfYVZ4RFI1sp'))
    );
    await oldJettonWallet.sendTransfer(
        provider.sender(),
        toNano('0.05'),
        toNano('0.3'),
        migrationHelper.address,
        toNano('3500')
    );
    // await migrationHelper.sendMigrate(provider.sender(), toNano('0.35'), toNano('500'));
}
