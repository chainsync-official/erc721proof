const ethers = require("ethers");
const Web3 = require("web3");
const abi = require("ethereumjs-abi");
const { bufferToHex } = require("ethereumjs-util");
const axios = require("axios");
const NFTStorageSlot = require("../src/NFTStorageSlot");
const nftStorageSlot = new NFTStorageSlot();
require("dotenv").config();

console.log(process.env.WEB3_PROVIDER);
const web3 = new Web3(process.env.WEB3_PROVIDER);

async function main() {
  const tokenId = 15;
  const tokenId1 = 16;
  const tokenId2 = 17;
  const contract = "0x29ec6f235b1d7cb6ab501ae8e5428974baf90e56";

  const stateRootData = await getStateRoot(1);
  const nftconfig = await getNFTConfig(1, contract);

  const proof = await web3.eth.getProof(
    contract,
    [
      nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId),
      nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId1),
      nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId2),
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

  const params = [
    bufferToHex(stateMessage),
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
    [tokenId, tokenId1, tokenId2],
    [
      bufferToHex(ethers.utils.concat(proof.accountProof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[0].proof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[1].proof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[2].proof)),
    ],
  ];
  console.log(params);

  //call mirrorERC721Factory.claimNFT
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
