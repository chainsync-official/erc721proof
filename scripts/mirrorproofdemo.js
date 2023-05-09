const ethers = require("ethers");
const Web3 = require("web3");
const abi = require("ethereumjs-abi");
const { bufferToHex } = require("ethereumjs-util");
const axios = require("axios");
const NFTStorageSlot = require("../src/NFTStorageSlot");
const nftStorageSlot = new NFTStorageSlot();
const configs = require("../config.json");
const mirrorerc721factoryabi = require("../abi/MirrorERC721Factory.json");
require("dotenv").config();

const web3 = new Web3(configs[1].RPC_URL);
const web3mumbai = new Web3(configs[5].RPC_URL);

async function main() {
  const tokenId = 15;
  const contract = "0x29ec6f235b1d7cb6ab501ae8e5428974baf90e56";
  const mirrorCFactoryContract = "0xc9873e55e48b02e8f065e4334cc91166164ac688";

  const stateRootData = await getStateRoot(1);
  const nftconfig = await getNFTConfig(1, contract);

  const proof = await web3.eth.getProof(
    contract,
    [
      nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId),
      nftStorageSlot.getOwnerSlot(
        nftconfig.owner_slot_type,
        nftconfig.owner_slot_index,
        tokenId + 1
      ),
      nftStorageSlot.getOwnerSlot(
        nftconfig.owner_slot_type,
        nftconfig.owner_slot_index,
        tokenId + 2
      ),
      nftStorageSlot.getOwnerSlot(
        nftconfig.owner_slot_type,
        nftconfig.owner_slot_index,
        tokenId + 3
      ),
    ],
    stateRootData.block_number
  );

  console.log(proof.storageProof);

  const stateMessage = abi.solidityPack(
    ["uint256", "uint256", "bytes32", "uint256"],
    [
      stateRootData.chain_id,
      stateRootData.block_number,
      stateRootData.state_root,
      stateRootData.timestamp,
    ]
  );

  const mirrorERC721Factory = new web3mumbai.eth.Contract(
    mirrorerc721factoryabi,
    mirrorCFactoryContract
  );
  const tx = await mirrorERC721Factory.methods.claimNFT(
    stateMessage,
    stateRootData.signature,
    [
      nftconfig.proof,
      nftconfig.chainId,
      nftconfig.contract,
      nftconfig.name,
      nftconfig.symbol,
      nftconfig.owner_slot_type,
      nftconfig.owner_slot_index,
      nftconfig.owner_unpack_type,
    ],
    [tokenId, tokenId + 1],
    [
      bufferToHex(ethers.utils.concat(proof.accountProof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[0].proof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[1].proof)),
    ]
  );

  const accountFrom = {
    privateKey: process.env.PRIVATE_KEY,
  };
  console.log(await tx.estimateGas());
  console.log(await web3mumbai.eth.getGasPrice());
  console.log(accountFrom);
  const createTransaction = await web3mumbai.eth.accounts.signTransaction(
    {
      to: mirrorCFactoryContract,
      data: tx.encodeABI(),
      gas: 3000000,
      gasPrice: 1000000000,
    },
    accountFrom.privateKey
  );

  // Send Tx and Wait for Receipt
  const createReceipt = await web3mumbai.eth.sendSignedTransaction(
    createTransaction.rawTransaction
  );
  console.log(createReceipt);
}

async function getStateRoot(chainId) {
  const options = {
    method: "GET",
    url: "https://statewitness.api.chainsync.network/api/latest-signature/" + chainId,
    headers: { accept: "application/json" },
  };

  const data = await axios.request(options);
  return data.data;
}

async function getNFTConfig(chainId, contract) {
  const options = {
    method: "GET",
    url: "https://nftdataapi.chainsync.network/api/nftconfig/" + chainId + "/" + contract,
    headers: { accept: "application/json" },
  };

  const data = await axios.request(options);
  return data.data.data;
}

main().catch((err) => {
  console.log(err);
});
