import { Address, toNano } from 'ton-core';
import { MigrationMaster } from '../wrappers/MigrationMaster';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const migrationMaster = provider.open(
        MigrationMaster.createFromConfig(
            {
                oldJettonMinter: Address.parse(''),
                newJettonMinter: Address.parse(''),
                walletCode: await compile('JettonWallet'),
            },
            await compile('MigrationMaster')
        )
    );
    await migrationMaster.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(migrationMaster.address);
}
