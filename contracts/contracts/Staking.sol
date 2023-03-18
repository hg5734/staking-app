// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingStorage {
    
    IERC20 public stakableToken;
    uint8 public minBlocks;
    uint256 public interestRate; // 1e16 = 1%, 1e18 = 100%

    struct StakingDetails {
        uint256 depositBlock;
        uint256 amount;
    }
    mapping(address => uint256) public stakeCounter;
    mapping(address => mapping(uint256 => StakingDetails)) public stakingDetails;

    // events
    event Staked(address indexed user, uint256 amount, uint256 depositBlock,uint256 counter);
    event Claimed(address indexed user, uint256 amount, uint256 reward, uint256 counter);

}

contract Staking is StakingStorage {

    using SafeMath for uint256;

    constructor(address token, uint256 rate, uint8 blocks) {
       stakableToken = IERC20(token);
       interestRate = rate;
       minBlocks = blocks;
    }

     function stake(uint256 amount) external {
        require(amount > 0, "Staking:Cannot stake 0 tokens");

        uint256 stakeAmount = amount;
        stakeCounter[msg.sender] = stakeCounter[msg.sender] + 1;
        StakingDetails storage details = stakingDetails[msg.sender][stakeCounter[msg.sender]];
        details.depositBlock = block.number;
        details.amount = stakeAmount;

        SafeERC20.safeTransferFrom(stakableToken, msg.sender, address(this), stakeAmount);
        emit Staked(msg.sender, stakeAmount, block.number, stakeCounter[msg.sender]);
    }

     function withdraw(uint256 counter) external {
        _withdraw(counter);
    }

    function _withdraw(uint256 counter) internal {
        require(stakingDetails[msg.sender][counter].amount > 0, "Staking: Stake does not exist");
        uint256 amount = stakingDetails[msg.sender][counter].amount;
        uint256 totalAmount = calculateCompoundInterest(msg.sender, counter);
        delete stakingDetails[msg.sender][counter];
        stakeCounter[msg.sender] = stakeCounter[msg.sender].sub(1);
        SafeERC20.safeTransfer(stakableToken, msg.sender, totalAmount);
        emit Claimed(msg.sender, amount, totalAmount, counter);
    }

    function calculateCompoundInterest(address user, uint256 counter) public view returns(uint256) {
        uint256 amount = stakingDetails[user][counter].amount;
        uint256 depositBlock = stakingDetails[user][counter].depositBlock;
        uint256 blocksElapsed = block.number - depositBlock;
        uint256 periods = (blocksElapsed - (blocksElapsed % minBlocks))/minBlocks;
        return compoundInterest(amount, interestRate, periods);
    }

    function compoundInterest(uint256 amount, uint256 rate, uint256 t) public pure returns (uint256) {
        for (uint256 i = 0; i < t; i++) {
           amount+= amount.mul(rate).div(1e18);
        }
        return amount;
    }

    //  function compoundInterest(uint256 principal, uint256 rate, uint256 time, uint256 compoundPerYear) public pure returns (uint256) {
        // uint256 ratio = interestRate * (10**18) / (n (100));
        // amount *= (1 + ratio) ** periods; 
    //     uint256 n = compoundPerYear;
    //     uint256 r = rate.mul(10**18).div(n.mul(100));
    //     uint256 A = principal.mul((r.add(10**18)).pow(n.mul(time))).div(10**18);
    //     return A;
    // }

 
 

}
