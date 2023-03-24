import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, ExternalAddress, toNano } from 'ton-core';
import { MigrationMaster, MigrationMasterConfig } from '../wrappers/MigrationMaster';
import { MigrationHelper, MigrationHelperConfig } from '../wrappers/MigrationHelper';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { JettonMinter, JettonMinterConfig } from '../wrappers/JettonMinter';
import { JettonMinterDiscoverable, JettonMinterDiscoverableConfig } from '../wrappers/JettonMinterDiscoverable';
import { JettonWallet, JettonWalletConfig } from '../wrappers/JettonWallet';

function getJettonWalletAddress(owner: Address, minter: Address, code: Cell) {
    return JettonWallet.createFromConfig({ owner, minter, walletCode: code }, code, 0).address;
}

describe('Migration', () => {
    let masterCode: Cell;
    let helperCode: Cell;
    let jettonMinterCode: Cell;
    let jettonMinterDiscoverableCode: Cell;
    let jettonWalletCode: Cell;
    let wallets: SandboxContract<TreasuryContract>[] = [];

    beforeAll(async () => {
        masterCode = await compile('MigrationMaster');
        helperCode = await compile('MigrationHelper');
        jettonMinterCode = await compile('JettonMinter');
        jettonMinterDiscoverableCode = await compile('JettonMinterDiscoverable');
        jettonWalletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let oldJettonMinter: SandboxContract<JettonMinter>;
    let newJettonMinter: SandboxContract<JettonMinterDiscoverable>;
    let migrationMaster: SandboxContract<MigrationMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.verbosity.debugLogs = false;

        wallets = [];
        for (let i = 0; i < 5; i++) {
            wallets.push(await blockchain.treasury(i.toString()));
        }

        let oldJettonMinterConfig: JettonMinterConfig = {
            admin: wallets[0].address,
            content: Cell.EMPTY,
            walletCode: jettonWalletCode,
        };
        oldJettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(oldJettonMinterConfig, jettonMinterCode)
        );
        let deployResult = await oldJettonMinter.sendDeploy(wallets[0].getSender(), toNano('1.00'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: oldJettonMinter.address,
            deploy: true,
            success: true,
        });

        let newJettonMinterConfig: JettonMinterDiscoverableConfig = {
            admin: wallets[0].address,
            content: Cell.EMPTY,
            walletCode: jettonWalletCode,
        };
        newJettonMinter = blockchain.openContract(
            JettonMinterDiscoverable.createFromConfig(newJettonMinterConfig, jettonMinterDiscoverableCode)
        );
        deployResult = await newJettonMinter.sendDeploy(wallets[0].getSender(), toNano('1.00'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: newJettonMinter.address,
            deploy: true,
            success: true,
        });

        let migrationMasterConfig: MigrationMasterConfig = {
            oldJettonMinter: oldJettonMinter.address,
            newJettonMinter: newJettonMinter.address,
            walletCode: jettonWalletCode,
        };
        migrationMaster = blockchain.openContract(MigrationMaster.createFromConfig(migrationMasterConfig, masterCode));
        deployResult = await migrationMaster.sendDeploy(wallets[0].getSender(), toNano('1.00'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: migrationMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should compile and deploy', async () => {});

    it('should migrate jettons through `transfer_notification`', async () => {
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            wallets[1].address,
            toNano('100')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(
                getJettonWalletAddress(wallets[1].address, oldJettonMinter.address, jettonWalletCode)
            )
        );
        let newJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(
                getJettonWalletAddress(wallets[1].address, newJettonMinter.address, jettonWalletCode)
            )
        );

        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationMaster.address,
            toNano('100')
        );

        let migrationHelperConfig: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
            walletCode: jettonWalletCode,
        };
        let migrationHelper = blockchain.openContract(
            MigrationHelper.createFromConfig(migrationHelperConfig, helperCode)
        );
        let result = await migrationHelper.sendDeploy(wallets[1].getSender(), toNano('1.00'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper.address,
            deploy: true,
            success: true,
        });

        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('100'));

        result = await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationHelper.address,
            toNano('100')
        );

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('100'));
    });

    it('should migrate jettons through `migrate`', async () => {
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            wallets[1].address,
            toNano('100')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(
                getJettonWalletAddress(wallets[1].address, oldJettonMinter.address, jettonWalletCode)
            )
        );
        let newJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(
                getJettonWalletAddress(wallets[1].address, newJettonMinter.address, jettonWalletCode)
            )
        );

        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationMaster.address,
            toNano('100')
        );

        let migrationHelperConfig: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
            walletCode: jettonWalletCode,
        };
        let migrationHelper = blockchain.openContract(
            MigrationHelper.createFromConfig(migrationHelperConfig, helperCode)
        );
        let result = await migrationHelper.sendDeploy(wallets[1].getSender(), toNano('1.00'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper.address,
            deploy: true,
            success: true,
        });

        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('100'));

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('1.00'),
            0n,
            migrationHelper.address,
            toNano('100')
        );

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('0'));

        await migrationHelper.sendMigrate(wallets[1].getSender(), toNano('1.00'), toNano('100'));

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('100'));
    });
});
