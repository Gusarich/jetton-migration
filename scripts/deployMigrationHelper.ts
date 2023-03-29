import { Address, Cell, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { compile, NetworkProvider } from '@ton-community/blueprint';

const networkFee = toNano('0.05');

export async function run(provider: NetworkProvider) {
    let json = require('./config.json');
    const migrationHelper = provider.open(
        await MigrationHelper.createFromConfig(
            {
                oldJettonMinter: Address.parse(json.oldJettonMinter),
                migrationMaster: Address.parse(json.migrationMaster),
                recipient: Address.parse(json.userAddress),
            },
            await compile('MigrationHelper'),
            provider
        )
    );
    await migrationHelper.sendDeploy(provider.sender(), networkFee);
    await provider.waitForDeploy(migrationHelper.address);
}
