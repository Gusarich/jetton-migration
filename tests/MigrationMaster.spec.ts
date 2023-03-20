import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { MigrationMaster } from '../wrappers/MigrationMaster';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

describe('MigrationMaster', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MigrationMaster');
    });

    let blockchain: Blockchain;
    let migrationMaster: SandboxContract<MigrationMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        migrationMaster = blockchain.openContract(
            MigrationMaster.createFromConfig({ newJettonWallet: randomAddress() }, code)
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await migrationMaster.sendDeploy(deployer.getSender(), toNano('0.05'));

        console.log(deployResult);

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: migrationMaster.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and migrationMaster are ready to use
    });
});
