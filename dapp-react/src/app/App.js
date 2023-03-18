import React, { useState, useEffect } from "react";
import { Form, Input } from "semantic-ui-react";
import { Button } from 'react-bootstrap';
import Web3 from 'web3';
import web3 from "../utils/web3";
import StakingABI from '../abi/Staking.json';
import ERC20ABI from '../abi/ERC20.json';
import BigNumber from 'bignumber.js';
import { tokenAddress, stakingAddress } from '../config/constant';
import Table from 'react-bootstrap/Table';


const App = () => {
  const [stakingAmount, setStakingAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState("");
  const [stakingList, setStakingList] = useState([]);
  //We can use these in redux later
  const [decimal, setDecimal] = useState("");

  useEffect(() => {
    const loadWeb3 = async () => {
      console.log('load web3')
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        setUser(accounts[0]);
        const balance = await getTokenBalance(tokenAddress, accounts[0]);
        setBalance(balance);
        getStakingList(accounts[0])
      } else {
        setErrorMsg("Please install Metamask to use this app.");
      }
    };
    loadWeb3();
  }, []);

  const getStakingList = async (address) => {
    const methodName = '[getStakingList]'
    try {
      const contract = stakingContractSetup(web3, stakingAddress);
      const userStakingCounter = await contract.methods.stakeCounter(address).call();
      console.log('total staking', userStakingCounter)
      const allUserStakes = (new Array(+userStakingCounter).fill(0)).map((d, i) => i + 1);
      const batch = new web3.BatchRequest();
      const promises = allUserStakes.map((stakingCounter) => new Promise((resolve, reject) => {
        batch.add(contract.methods.stakingDetails(address, stakingCounter).call.request((err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        }));
      }));
      batch.execute();
      const stakes = await Promise.all(promises);
      console.log("staking list", stakes)
      setStakingList(stakes);
    } catch (error) {
      console.log(methodName + '-->', error);
    }
  }

  const handleStake = async () => {
    const methodName = '[getStakingList]'
    if (!loading && stakingAmount) {
      setLoading(true);
      try {
        const web3 = window.web3;
        const contract = stakingContractSetup(web3, stakingAddress);
        const amount = formatEthToWei(stakingAmount, decimal);
        console.log(methodName, stakingAmount, decimal, amount);
        await contract.methods.stake(amount).send({ from: user });
        setStakingAmount("");
        const balance = await getTokenBalance(tokenAddress, user);
        setBalance(balance);
        getStakingList(user)
      } catch (error) {
        console.log(methodName + '-->', error);
      }
    }
    setLoading(false);
  };

  const handleUnstake = async (index) => {
    const methodName = '[handleUnstake]'
    if (!loading) {
      setLoading(true);
      try {
        const web3 = window.web3;
        const contract = stakingContractSetup(web3, stakingAddress);
        console.log(methodName, index);
        await contract.methods.withdraw(index).send({ from: user });
        const balance = await getTokenBalance(tokenAddress, user);
        setBalance(balance);
        getStakingList(user)
      } catch (error) {
        console.log(methodName + '-->', error);
      }
    }
    setLoading(false);
  };

  const handApprove = async () =>{
    const methodName = '[handApprove]'
    if (!loading && stakingAmount) {
      setLoading(true);
      try {
        const web3 = window.web3;
        const contract = tokenSetup(web3, tokenAddress);
        const amount = formatEthToWei(stakingAmount, decimal);
        console.log(methodName, stakingAmount, decimal, amount);
        await contract.methods.approve(stakingAddress, amount).send({ from: user });
      } catch (error) {
        console.log(methodName + '-->', error);
      }
    }
    setLoading(false);
  }

  const getTokenBalance = async (tokenAddress, userAddress) => {
    try {
      const token = tokenSetup(web3, tokenAddress);
      const tokenBalance = await token.methods.balanceOf(userAddress).call();
      if (!decimal) {
        let decimal = await token.methods.decimals().call();
        setDecimal(decimal)
        console.log('first', tokenBalance, decimal);
        return formatBalance(tokenBalance, decimal)
      } else {
        console.log('second', tokenBalance, decimal);
        return formatBalance(tokenBalance, decimal)
      }
    } catch (error) {
      console.log(error);
    }
  }

  const formatEthToWei = (balance, decimal) => {
    return safeMultiply(balance, 10 ** decimal)
  }

  const formatBalance = (balance, decimals) => {
    const smallestUnit = 10 ** decimals;
    const balanceInSmallestUnit = safeDivide(balance, smallestUnit);
    const balanceIn8Decimal = balanceInSmallestUnit.toFixed(3);
    return balanceIn8Decimal;
  }

  const safeDivide = function (a, b) {
    let x = new BigNumber(a);
    let y = new BigNumber(b);
    return x.dividedBy(y);
  };

  const safeMultiply = function (a, b) {
    let x = new BigNumber(a);
    let y = new BigNumber(b);
    return x.multipliedBy(y);
  };

  function tokenSetup(web3, address) {
    return new web3.eth.Contract(ERC20ABI.abi, address);
  }

  function stakingContractSetup(web3, address) {
    return new web3.eth.Contract(StakingABI.abi, address);
  }
  function stakingListRender() {
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Amount</th>
            <th>Deposit Block</th>
            <th>Action</th>
          </tr>
        </thead>
        {stakingList.map((stake, index) => (
          <tbody>
            <tr>
              <td>{index + 1}</td>
              <td>{formatBalance(stake.amount, decimal)} STT</td>
              <td>{stake.depositBlock}</td>
              <td><Button variant="primary" onClick={(e) => handleUnstake(index + 1)} loading={loading}> Withdraw </Button></td>
            </tr>
          </tbody>
        ))}
      </Table>
    );
  }


  return (
    <div style={styles.container}>
      <h1 style={{ alignSelf: 'center', alignItems: 'center' }}>Staking App</h1>
      <p>Your current balance: {balance} STT</p>
      <Form>
        <Form.Field>
          <Input style={styles.input} type="number" placeholder={'Stake Amount'} value={stakingAmount} onChange={(e) => setStakingAmount(e.target.value)} />
          {errorMsg && <p style={styles.error}>{errorMsg}</p>}
        </Form.Field>
        <Button style={styles.button} onClick={handApprove} loading={loading}>
          Approve
        </Button>
        <Button style={styles.button} onClick={handleStake} loading={loading} >
          Stake
        </Button>
      </Form>
      {stakingListRender()}
    </div>
  );
};
//css
const styles = {
  list: {
    margin: '10px'
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 25,
  },
  error: {
    color: 'red'
  },
  input: {
  },
  button: {
    height: '40px',
    width: '85px',
    marginRight: 15,
    marginTop: 15,
    marginBottom: 15,

  }
}

export default App;
