const ethers = require("ethers");
const Web3 = require("web3");
const abi = require("ethereumjs-abi");
const { bufferToHex } = require("ethereumjs-util");
const axios = require("axios");
const NFTStorageSlot = require("../src/NFTStorageSlot");
const nftStorageSlot = new NFTStorageSlot();
const configs = require("../config.json");
const NFTClaimValidatorAbi = require("../abi/NFTClaimValidator.json");
require("dotenv").config();

const NFTClaimContract = "0x34CD3FF5B9AfDf5c77da8b714F4d2041322bDA1A";

const web3s = new Web3(configs[1].RPC_URL);

const provider = new ethers.providers.JsonRpcProvider(configs[5].RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const nftClaimContract = new ethers.Contract(NFTClaimContract, NFTClaimValidatorAbi, signer);

async function oneCollectionMulti() {
  const tokenId = 15;
  const contract = "0x1a92f7381b9f03921564a437210bb9396471050c";

  const stateRootData = await getStateRoot(1);
  const nftconfig = await getNFTConfig(1, contract);

  const proof = await web3s.eth.getProof(
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
  const tx = await nftClaimContract.claimNFT(
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
    [tokenId, tokenId + 1, tokenId + 2],
    [
      bufferToHex(ethers.utils.concat(proof.accountProof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[0].proof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[1].proof)),
      bufferToHex(ethers.utils.concat(proof.storageProof[2].proof)),
    ]
  );

  console.log(tx);

  const receipt = await tx.wait();
  console.log(receipt);
}

async function multiCollectionMulti() {
  const tokenId = 20;
  const contracts = [
    "0x1a92f7381b9f03921564a437210bb9396471050c",
    "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
    "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7",
  ];

  const stateRootData = await getStateRoot(1);

  const params = [];
  for (const contract of contracts) {
    const nftconfig = await getNFTConfig(1, contract);

    const proof = await web3s.eth.getProof(
      contract,
      [
        nftStorageSlot.getOwnerSlot(nftconfig.owner_slot_type, nftconfig.owner_slot_index, tokenId),
        nftStorageSlot.getOwnerSlot(
          nftconfig.owner_slot_type,
          nftconfig.owner_slot_index,
          tokenId + 1
        ),
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
    params.push(
      nftClaimContract.interface.encodeFunctionData("claimNFT", [
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
        ],
      ])
    );
  }
  const tx = await nftClaimContract.multicall(params);
  const receipt = await tx.wait();
  console.log(receipt);
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

oneCollectionMulti().catch((err) => {
  console.log(err);
});

multiCollectionMulti().catch((err) => {
  console.log(err);
});
