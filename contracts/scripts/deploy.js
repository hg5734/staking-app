// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
require('dotenv').config();
const hre = require("hardhat");
let { ethers, network } = hre;
async function main() {
  let { TOKEN_ADDRESS, STAKING_ADDRESS } = process.env;
  let owner = await (await ethers.getSigner(network.config.from)).getAddress();
  console.log('deployer address', owner);

  let token = null;
  let staking = null;

  // This will deploy token contract & mint
  if (!TOKEN_ADDRESS) {
    // We get the contract to deploy
    token = await (await ethers.getContractFactory("Token")).deploy('Staking Token', 'STT', 8); // We can take these variables into env file
    await token.deployed();
    console.log("TOKEN_ADDRESS", token.address);
    console.log('minting tokens 500 mil')
    console.log('tx', (await token.mint(owner, ethers.utils.parseUnits("500000000", "8")))?.hash);
    console.log(await token.totalSupply())
  } else {
    token = await ethers.getContractFactory("Token").attach(TOKEN_ADDRESS);
  }

  if (!STAKING_ADDRESS) {
    let stakeFund = ethers.utils.parseUnits("10000000000", "8");
    let interestRate = ethers.utils.parseUnits("2", "16");
    let minBlocks = 10;
    staking = await (await ethers.getContractFactory("Staking")).deploy(token.address, interestRate, minBlocks);
    await staking.deployed();
    console.log("STAKING_ADDRESS", staking.address);
    console.log('transfer funds to staking tx', (await token.transfer(staking.address, ethers.utils.parseUnits("1000", "8")))?.hash);
    console.log('balance of staking contract', (await token.balanceOf(staking.address)));
    console.log('approve funds for future staking ', (await token.approve(staking.address, stakeFund))?.hash);
  }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
