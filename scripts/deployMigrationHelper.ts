import { toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    // const migrationHelper = provider.open(MigrationHelper.createFromConfig({}, await compile('MigrationHelper')));
    // await migrationHelper.sendDeploy(provider.sender(), toNano('0.05'));
    // await provider.waitForDeploy(migrationHelper.address);
    // run methods on `migrationHelper`
}
