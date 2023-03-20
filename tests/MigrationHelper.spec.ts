import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { MigrationHelper } from '../wrappers/MigrationHelper';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('MigrationHelper', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MigrationHelper');
    });

    let blockchain: Blockchain;
    let migrationHelper: SandboxContract<MigrationHelper>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        migrationHelper = blockchain.openContract(MigrationHelper.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await migrationHelper.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: migrationHelper.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and migrationHelper are ready to use
    });
});
