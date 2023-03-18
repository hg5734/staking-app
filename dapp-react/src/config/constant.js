// exporting .env variables
console.log(process.env)
export const networkUrl = process.env.NETWORK_URL || "https://rpc-mumbai.maticvigil.com/";
export const tokenAddress = process.env.TOKEN_ADDRESS || "0x3Ac6593e44c02B6f26134a5c6f6c97f97923fD62";
export const stakingAddress = process.env.STAKING_ADDRESS|| "0xBD0ed2ba860546d43b23FaE11D77D2e7E47eEEAf";