import Web3 from 'web3';
import { networkUrl } from '../config/constant';

const HttpProvider = new Web3.providers.HttpProvider(networkUrl);

export default new Web3(HttpProvider);
