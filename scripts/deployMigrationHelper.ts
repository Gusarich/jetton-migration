import { Address, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const migrationHelper = provider.open(
        MigrationHelper.createFromConfig(
            {
                oldJettonMinter: Address.parse(''),
                migrationMaster: Address.parse(''),
                recipient: Address.parse(''),
                walletCode: await compile('JettonWallet'),
            },
            await compile('MigrationHelper')
        )
    );
    await migrationHelper.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(migrationHelper.address);
}
