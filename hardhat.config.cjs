require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    "bnb-testnet": {
      url: process.env.BNB_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.BNB_PRIVATE_KEY ? [process.env.BNB_PRIVATE_KEY] : [],
      chainId: 97
    }
  }
};
