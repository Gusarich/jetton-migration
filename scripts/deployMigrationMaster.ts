import { Address, Cell, toNano } from 'ton-core';
import { MigrationMaster } from '../wrappers/MigrationMaster';
import { compile, NetworkProvider } from '@ton-community/blueprint';

const networkFee = toNano('0.05');

export async function run(provider: NetworkProvider) {
    let json = require('./config.json');
    const migrationMaster = provider.open(
        await MigrationMaster.createFromConfig(
            {
                oldJettonMinter: Address.parse(json.oldJettonMinter),
                newJettonMinter: Address.parse(json.newJettonMinter),
            },
            await compile('MigrationMaster'),
            provider
        )
    );
    await migrationMaster.sendDeploy(provider.sender(), networkFee);
    await provider.waitForDeploy(migrationMaster.address);
}
