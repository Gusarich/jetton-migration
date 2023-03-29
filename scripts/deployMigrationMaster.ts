import { Address, Cell, toNano } from 'ton-core';
import { MigrationMaster } from '../wrappers/MigrationMaster';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const migrationMaster = provider.open(
        await MigrationMaster.createFromConfig(
            {
                oldJettonMinter: Address.parse('EQAGPPuLtcu8BimtY8TFVrpJ-E36akEFZHexCSD_BNQl_QrW'),
                newJettonMinter: Address.parse('EQB8GJpiN7YxxKak6O2wH-aAEVaVrzJKuq9qYK6WHGUSHEjv'),
            },
            await compile('MigrationMaster'),
            provider
        )
    );
    await migrationMaster.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(migrationMaster.address);
}
