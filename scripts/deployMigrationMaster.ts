import { toNano } from 'ton-core';
import { MigrationMaster } from '../wrappers/MigrationMaster';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const migrationMaster = provider.open(MigrationMaster.createFromConfig({}, await compile('MigrationMaster')));

    await migrationMaster.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(migrationMaster.address);

    // run methods on `migrationMaster`
}
