import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, ExternalAddress, toNano } from 'ton-core';
import { MigrationMaster, MigrationMasterConfig } from '../wrappers/MigrationMaster';
import { MigrationHelper, MigrationHelperConfig } from '../wrappers/MigrationHelper';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { JettonMinter, JettonMinterConfig } from '../wrappers/JettonMinter';
import { JettonMinterDiscoverable, JettonMinterDiscoverableConfig } from '../wrappers/JettonMinterDiscoverable';
import { JettonWallet, JettonWalletConfig } from '../wrappers/JettonWallet';

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
        let deployResult = await oldJettonMinter.sendDeploy(wallets[0].getSender(), toNano('0.3'));
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
        deployResult = await newJettonMinter.sendDeploy(wallets[0].getSender(), toNano('0.3'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: newJettonMinter.address,
            deploy: true,
            success: true,
        });

        let migrationMasterConfig: MigrationMasterConfig = {
            oldJettonMinter: oldJettonMinter.address,
            newJettonMinter: newJettonMinter.address,
            oldWalletCode: jettonWalletCode,
            newWalletCode: jettonWalletCode,
        };
        migrationMaster = blockchain.openContract(
            await MigrationMaster.createFromConfig(migrationMasterConfig, masterCode, blockchain)
        );
        deployResult = await migrationMaster.sendDeploy(wallets[0].getSender(), toNano('0.3'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: migrationMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should compile and deploy', async () => {});

    it('should migrate jettons through `transfer_notification`', async () => {
        let rs = await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            wallets[1].address,
            toNano('100')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await oldJettonMinter.getWalletAddressOf(wallets[1].address))
        );
        let newJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await newJettonMinter.getWalletAddressOf(wallets[1].address))
        );

        let migrationHelperConfig: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
        };
        let migrationHelper = blockchain.openContract(
            await MigrationHelper.createFromConfig(migrationHelperConfig, helperCode, blockchain)
        );
        let result = await migrationHelper.sendDeploy(wallets[1].getSender(), toNano('0.3'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper.address,
            deploy: true,
            success: true,
        });

        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('100'));

        result = await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('0.05'),
            toNano('0.3'),
            migrationHelper.address,
            toNano('100')
        );

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('100'));
        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('0'));
    });

    it('should migrate jettons through `migrate`', async () => {
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            wallets[1].address,
            toNano('100')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await oldJettonMinter.getWalletAddressOf(wallets[1].address))
        );
        let newJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await newJettonMinter.getWalletAddressOf(wallets[1].address))
        );

        let migrationHelperConfig: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
        };
        let migrationHelper = blockchain.openContract(
            await MigrationHelper.createFromConfig(migrationHelperConfig, helperCode, blockchain)
        );
        let result = await migrationHelper.sendDeploy(wallets[1].getSender(), toNano('0.3'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper.address,
            deploy: true,
            success: true,
        });

        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('100'));

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('0.05'),
            0n,
            migrationHelper.address,
            toNano('100')
        );

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('0'));

        result = await migrationHelper.sendMigrate(wallets[1].getSender(), toNano('0.3'), toNano('100'));

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('100'));
        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('0'));
    });

    it('should not migrate more than sent', async () => {
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            wallets[1].address,
            toNano('100')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await oldJettonMinter.getWalletAddressOf(wallets[1].address))
        );
        let newJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await newJettonMinter.getWalletAddressOf(wallets[1].address))
        );

        let migrationHelperConfig: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
        };
        let migrationHelper = blockchain.openContract(
            await MigrationHelper.createFromConfig(migrationHelperConfig, helperCode, blockchain)
        );
        let result = await migrationHelper.sendDeploy(wallets[1].getSender(), toNano('0.3'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper.address,
            deploy: true,
            success: true,
        });

        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('100'));

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('0.05'),
            0n,
            migrationHelper.address,
            toNano('100')
        );

        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('0'));

        result = await migrationHelper.sendMigrate(wallets[1].getSender(), toNano('0.3'), toNano('1'));
        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('1'));

        result = await migrationHelper.sendMigrate(wallets[1].getSender(), toNano('0.3'), toNano('100'));
        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('1'));

        result = await migrationHelper.sendMigrate(wallets[1].getSender(), toNano('0.3'), toNano('99'));
        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('100'));
    });

    it('should migrate jettons several times', async () => {
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            wallets[1].address,
            toNano('30')
        );
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            wallets[2].address,
            toNano('70')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet1 = blockchain.openContract(
            JettonWallet.createFromAddress(await oldJettonMinter.getWalletAddressOf(wallets[1].address))
        );
        let newJettonWallet1 = blockchain.openContract(
            JettonWallet.createFromAddress(await newJettonMinter.getWalletAddressOf(wallets[1].address))
        );
        let oldJettonWallet2 = blockchain.openContract(
            JettonWallet.createFromAddress(await oldJettonMinter.getWalletAddressOf(wallets[2].address))
        );
        let newJettonWallet2 = blockchain.openContract(
            JettonWallet.createFromAddress(await newJettonMinter.getWalletAddressOf(wallets[2].address))
        );

        let migrationHelper1Config: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
        };
        let migrationHelper1 = blockchain.openContract(
            await MigrationHelper.createFromConfig(migrationHelper1Config, helperCode, blockchain)
        );
        let result = await migrationHelper1.sendDeploy(wallets[1].getSender(), toNano('0.3'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper1.address,
            deploy: true,
            success: true,
        });

        let migrationHelper2Config: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[2].address,
        };
        let migrationHelper2 = blockchain.openContract(
            await MigrationHelper.createFromConfig(migrationHelper2Config, helperCode, blockchain)
        );
        result = await migrationHelper2.sendDeploy(wallets[2].getSender(), toNano('0.3'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[2].address,
            to: migrationHelper2.address,
            deploy: true,
            success: true,
        });

        expect(await oldJettonWallet1.getJettonBalance()).toEqual(toNano('30'));
        expect(await oldJettonWallet2.getJettonBalance()).toEqual(toNano('70'));

        result = await oldJettonWallet1.sendTransfer(
            wallets[1].getSender(),
            toNano('0.05'),
            toNano('0.3'),
            migrationHelper1.address,
            toNano('30')
        );

        expect(await newJettonWallet1.getJettonBalance()).toEqual(toNano('30'));
        expect(await oldJettonWallet1.getJettonBalance()).toEqual(toNano('0'));

        result = await oldJettonWallet2.sendTransfer(
            wallets[2].getSender(),
            toNano('0.05'),
            toNano('0.3'),
            migrationHelper2.address,
            toNano('50')
        );

        expect(await newJettonWallet2.getJettonBalance()).toEqual(toNano('50'));
        expect(await oldJettonWallet2.getJettonBalance()).toEqual(toNano('20'));

        result = await oldJettonWallet2.sendTransfer(
            wallets[2].getSender(),
            toNano('0.05'),
            toNano('0.3'),
            migrationHelper2.address,
            toNano('20')
        );

        expect(await newJettonWallet2.getJettonBalance()).toEqual(toNano('70'));
        expect(await oldJettonWallet2.getJettonBalance()).toEqual(toNano('0'));
    });

    it('should not gain ton balance', async () => {
        await oldJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            wallets[1].address,
            toNano('100')
        );
        await newJettonMinter.sendMint(
            wallets[0].getSender(),
            toNano('0.3'),
            toNano('0.05'),
            migrationMaster.address,
            toNano('100')
        );
        let oldJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await oldJettonMinter.getWalletAddressOf(wallets[1].address))
        );
        let newJettonWallet = blockchain.openContract(
            JettonWallet.createFromAddress(await newJettonMinter.getWalletAddressOf(wallets[1].address))
        );

        let migrationHelperConfig: MigrationHelperConfig = {
            oldJettonMinter: oldJettonMinter.address,
            migrationMaster: migrationMaster.address,
            recipient: wallets[1].address,
        };
        let migrationHelper = blockchain.openContract(
            await MigrationHelper.createFromConfig(migrationHelperConfig, helperCode, blockchain)
        );
        let result = await migrationHelper.sendDeploy(wallets[1].getSender(), toNano('0.3'));
        expect(result.transactions).toHaveTransaction({
            from: wallets[1].address,
            to: migrationHelper.address,
            deploy: true,
            success: true,
        });

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('5.00'),
            toNano('1.00'),
            migrationHelper.address,
            toNano('10')
        );

        const migrationHelperBalanceBefore = await migrationHelper.getBalance();
        const migrationMasterBalanceBefore = await migrationMaster.getBalance();

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationHelper.address,
            toNano('5')
        );

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('100.00'),
            toNano('50.00'),
            migrationHelper.address,
            toNano('3')
        );

        await oldJettonWallet.sendTransfer(
            wallets[1].getSender(),
            toNano('1.00'),
            toNano('1.00'),
            migrationHelper.address,
            toNano('15')
        );

        const migrationHelperBalanceAfter = await migrationHelper.getBalance();
        const migrationMasterBalanceAfter = await migrationMaster.getBalance();

        expect(await oldJettonWallet.getJettonBalance()).toEqual(toNano('67'));
        expect(await newJettonWallet.getJettonBalance()).toEqual(toNano('33'));
        expect(migrationHelperBalanceAfter).toEqual(migrationHelperBalanceBefore);
        expect(migrationMasterBalanceAfter).toEqual(migrationMasterBalanceBefore);
    });
});
