import { Address, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { NetworkProvider } from '@ton-community/blueprint';
import { JettonWallet } from '../wrappers/JettonWallet';
import { JettonMinter } from '../wrappers/JettonMinter';

const networkFee = toNano('0.05');
const migrationFee = toNano('0.3');

export async function run(provider: NetworkProvider) {
    let json = require('./config.json');
    const migrationHelper = provider.open(MigrationHelper.createFromAddress(Address.parse(json.migrationHelper)));
    const oldJettonWallet = provider.open(
        JettonWallet.createFromAddress(
            await provider
                .open(JettonMinter.createFromAddress(Address.parse(json.oldJettonMinter)))
                .getWalletAddressOf(Address.parse(json.userAddress))
        )
    );

    let amount = await oldJettonWallet.getJettonBalance();
    await oldJettonWallet.sendTransfer(provider.sender(), networkFee, migrationFee, migrationHelper.address, amount);
    // await migrationHelper.sendMigrate(provider.sender(), networkFee + migrationFee, amount);
}
