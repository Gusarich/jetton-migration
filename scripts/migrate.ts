import { Address, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { NetworkProvider } from '@ton-community/blueprint';
import { JettonWallet } from '../wrappers/JettonWallet';

export async function run(provider: NetworkProvider) {
    const migrationHelper = provider.open(
        MigrationHelper.createFromAddress(Address.parse('EQCl9BHggN1bT3ql-OItOfBhVe0JHV6u8DLlgIWw05tPVFEM'))
    );
    const oldJettonWallet = provider.open(
        JettonWallet.createFromAddress(Address.parse('EQDxk5SdWPXIkxlSYvR2Fru2bk2TN1QaxD2ugxS1cTFmMQz3'))
    );
    await oldJettonWallet.sendTransfer(
        provider.sender(),
        toNano('0.1'),
        toNano('0.4'),
        migrationHelper.address,
        toNano('400')
    );
    // await migrationHelper.sendMigrate(provider.sender(), toNano('0.5'), toNano('100'));
}
