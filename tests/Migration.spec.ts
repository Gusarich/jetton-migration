import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { MigrationMaster, MigrationMasterConfig } from '../wrappers/MigrationMaster';
import { MigrationHelper, MigrationHelperConfig } from '../wrappers/MigrationHelper';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';
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

    beforeEach(async () => {
        blockchain = await Blockchain.create();

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

        let newJettonMinterConfig: JettonMinterDiscoverableConfig = {
            admin: wallets[0].address,
            content: Cell.EMPTY,
            walletCode: jettonWalletCode,
        };
        newJettonMinter = blockchain.openContract(
            JettonMinterDiscoverable.createFromConfig(newJettonMinterConfig, jettonMinterDiscoverableCode)
        );

        let deployResult = await oldJettonMinter.sendDeploy(wallets[0].getSender(), toNano('0.1'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: oldJettonMinter.address,
            deploy: true,
        });

        deployResult = await newJettonMinter.sendDeploy(wallets[0].getSender(), toNano('0.1'));
        expect(deployResult.transactions).toHaveTransaction({
            from: wallets[0].address,
            to: newJettonMinter.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {});
});
