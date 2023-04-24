const { ethers } = require("hardhat");
const Web3 = require("web3");
const abi = require("ethereumjs-abi");
const axios = require("axios");
const NFTStorageSlot = require("../src/NFTStorageSlot");
const nftStorageSlot = new NFTStorageSlot();
require("dotenv").config();

const web3 = new Web3(process.env.WEB3_PROVIDER);

async function main() {
  const tokenId = 930;
  const tokenId1 = 931;
  const contract = "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7";

  const stateRootData = await getStateRoot(1);
  const nftconfig = await getNFTConfig(1, contract);

  const proof = await web3.eth.getProof(
    tokenContract,
    [
      nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId),
      nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId1),
    ],
    stateRootData.block_number
  );

  const stateMessage = abi.solidityPack(
    ["uint256", "uint256", "bytes32", "uint256"],
    [
      stateRootData.chain_id,
      stateRootData.block_number,
      stateRootData.state_root,
      stateRootData.timestamp,
    ]
  );

  console.log(
    await mirrorERC721Factory.claimNFT(
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
      [tokenId, tokenId1],
      [
        ethers.utils.concat(proof.accountProof),
        ethers.utils.concat(proof.storageProof[0].proof),
        ethers.utils.concat(proof.storageProof[1].proof),
      ]
    )
  );
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
