require('dotenv').config();
const hre = require("hardhat");
const { expect } = require('chai');
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

// Start test block
describe('Staking Contracts', function () {
    let stakeFund = ethers.utils.parseUnits("1", "8");
    let interestRate = ethers.utils.parseUnits("2", "16");
    let minBlocks = 10;
    before(async function () {
        this.owner = await (await ethers.getSigner(network.config.from)).getAddress();
        console.log('deployer address', this.owner);
        this.token = await (await ethers.getContractFactory("Token")).deploy('Staking Token', 'STT', 8);
        await this.token.deployed();
        console.log("TOKEN_ADDRESS", this.token.address);
        console.log('minting tx', (await this.token.mint(this.owner, ethers.utils.parseUnits("500000000", "8")))?.hash);
        console.log('total supply', await this.token.totalSupply())
    }); 

    before(async function () {
        let staking = await ethers.getContractFactory('Staking');
        this.staking = await staking.deploy(this.token.address, interestRate, minBlocks);
        await this.staking.deployed();
        console.log("STAKING_ADDRESS", this.staking.address);
    });

    before(async function () {
        console.log('transfer funds to staking tx', (await this.token.transfer(this.staking.address, ethers.utils.parseUnits("1000", "8")))?.hash);
        console.log('balance of staking contract', (await this.token.balanceOf(this.staking.address)));
    });

    // stake deposit before every test case
    beforeEach(async function() {
        let userBeforeBalance = await this.token.balanceOf(this.owner);
        console.log('user balance before staking ', userBeforeBalance);
        console.log('approve tx ', (await this.token.approve(this.staking.address, stakeFund))?.hash);
        console.log('stake funds ', (await this.staking.stake(stakeFund))?.hash);
        let userAfterBalance = await this.token.balanceOf(this.owner);
        console.log('user balance after staking ', userAfterBalance);
       
    })
    // it('stake & withdraw without interest', async function () {
    //    expect(userBeforeBalance.toString()).to.equal((userAfterBalance.add(stakeFund)).toString());
    // })

    it('withdraw before window so it will give zero interst', async function () {
        await mine(5);
        console.log('user balance before withdraw ', await this.token.balanceOf(this.owner));
        console.log('staking counter', (await this.staking.stakeCounter(this.owner)).toString())
        console.log('accrued Interest: with principle ', (await this.staking.calculateCompoundInterest(this.owner, 1)).toString())
        console.log('withdraw funds ', (await this.staking.withdraw(1))?.hash);
        console.log('user balance after withdraw ', await this.token.balanceOf(this.owner));
    })

    it('withdraw after compound interest', async function () {
        await mine(23);
        console.log('user balance before withdraw ', await this.token.balanceOf(this.owner));
        console.log('staking counter', (await this.staking.stakeCounter(this.owner)).toString())
        console.log('accrued Interest: principle ', (await this.staking.calculateCompoundInterest(this.owner, 1)).toString())
        console.log('withdraw funds ', (await this.staking.withdraw(1))?.hash);
        console.log('user balance after withdraw ', await this.token.balanceOf(this.owner));
    })

});