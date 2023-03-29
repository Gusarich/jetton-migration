import { Address, Cell, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const migrationHelper = provider.open(
        await MigrationHelper.createFromConfig(
            {
                oldJettonMinter: Address.parse('EQAGPPuLtcu8BimtY8TFVrpJ-E36akEFZHexCSD_BNQl_QrW'),
                migrationMaster: Address.parse('EQDw4jADMCJcO80n9QduKi_JbTjNoA8HP_ELFqfQML5uaslC'),
                recipient: Address.parse('EQBIhPuWmjT7fP-VomuTWseE8JNWv2q7QYfsVQ1IZwnMk8wL'),
            },
            await compile('MigrationHelper'),
            provider
        )
    );
    await migrationHelper.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(migrationHelper.address);
}
