const NFTStorageSlot = require("./NFTStorageSlot");
const nftStorageSlot = new NFTStorageSlot();
const erc721abi = require("../abi/IERC721.json");
const axios = require("axios");

const address0 = "0x0000000000000000000000000000000000000000";

function NFTStorageSlotFinder(web3Instance) {
  if (!(this instanceof NFTStorageSlotFinder)) {
    return new NFTStorageSlotFinder(web3Instance);
  }
  this.web3 = web3Instance;
}

NFTStorageSlotFinder.prototype.getCollectionSlot = async function (chainId, contract_address) {
  let data = await this.getCollectionExistToken(chainId, contract_address);
  let owner = null;
  if (!data) {
    console.log(contract_address + " data empty");
    return;
  }

  owner = data.to;
  owner = owner.toLowerCase();

  const tokenId = this.web3.utils.toBN(data.tokenID);

  console.log(
    `Begin to find owner slot mapping position for contract address: ${contract_address}, Token ID: ${tokenId}, Owner: ${owner}`
  );

  const res = {
    tokenName: data.tokenName,
    tokenSymbol: data.tokenSymbol,
    owner_slot_type: 1,
    ownerslot: null,
  };
  try {
    res.ownerslot = await this.findSlotInMapping(contract_address, tokenId, owner);

    if (res.ownerslot === null) {
      res.owner_slot_type = 2;
      res.ownerslot = await this.findSlotInDynamicArray(contract_address, tokenId, owner);
    }

    if (res.ownerslot === null) {
      res.owner_slot_type = 3;
      res.ownerslot = await this.findSlotInERC721AStorage(contract_address, tokenId, owner);
    }
  } catch (error) {
    console.log(error);
    console.log("contract: " + contract_address + " find slot error " + error);
    return null;
  }

  if (res.ownerslot === null) {
    res.owner_slot_type = 0;
    console.log(`Could not find mapping position for contract address: ${contract_address}`);
  } else {
    console.log(
      "found nft contract: " +
        contract_address +
        " owner slot type: " +
        res.owner_slot_type +
        " found pos: " +
        res.ownerslot.owner_slot_index +
        " unpack type:" +
        res.ownerslot.owner_unpack_type
    );
  }
  return res;
};

NFTStorageSlotFinder.prototype.findSlotInMapping = async function (
  contractAddress,
  tokenId,
  owner
) {
  let slots = [];
  for (let i = 0; i < 500; i++) {
    slots.push(nftStorageSlot.calculateMappingSlot(tokenId, i));
  }
  const proofs = await this.web3.eth.getProof(contractAddress, slots, "latest");
  return this.processStorageProof(proofs, owner);
};

NFTStorageSlotFinder.prototype.findSlotInDynamicArray = async function (
  contractAddress,
  tokenId,
  owner
) {
  let slots = [];
  for (let i = 0; i < 500; i++) {
    slots.push(nftStorageSlot.calculateDynamicArraySlot(tokenId, i));
  }

  const proofs = await this.web3.eth.getProof(contractAddress, slots, "latest");
  return this.processStorageProof(proofs, owner);
};

NFTStorageSlotFinder.prototype.findSlotInERC721AStorage = async function (
  contractAddress,
  tokenId,
  owner
) {
  let slots = [];
  for (let i = 0; i < 500; i++) {
    slots.push(nftStorageSlot.calculateERC721AStorageSlot(tokenId, i));
  }

  const proofs = await this.web3.eth.getProof(contractAddress, slots, "latest");
  return this.processStorageProof(proofs, owner);
};

NFTStorageSlotFinder.prototype.processStorageProof = function (proofs, owner) {
  let nousevalues = [];
  for (const i in proofs.storageProof) {
    const proof = proofs.storageProof[i];
    if (proof.value !== "0x0") {
      if (proof.value.toLowerCase() === owner.toLowerCase()) {
        return { owner_slot_index: i, owner_unpack_type: 0 };
      } else if (nftStorageSlot.get721AOwner(proof.value).toLowerCase() === owner.toLowerCase()) {
        return { owner_slot_index: i, owner_unpack_type: 1 };
      } else if (nftStorageSlot.getStructOwner(proof.value).toLowerCase() === owner.toLowerCase()) {
        return { owner_slot_index: i, owner_unpack_type: 2 };
      } else if (
        nftStorageSlot.getERC721AStorageOwner(proof.value).toLowerCase() === owner.toLowerCase()
      ) {
        return { owner_slot_index: i, owner_unpack_type: 3 };
      }
      nousevalues.push(proof.value);
    }
  }
  console.log("nousevalues", nousevalues);
  return null;
};

NFTStorageSlotFinder.prototype.getCollectionExistToken = async function (
  chainId,
  contract_address
) {
  let url;
  let apikey;
  if (chainId == 1) {
    url = "https://api.etherscan.io/api";
    apikey = process.env.ETHERSCAN_API_KEY;
  } else if (chainId == 137) {
    url = "https://api.polygonscan.com/api";
    apikey = process.env.POLYSCAN_API_KEY;
  } else {
    console.log("none support chainID", chainId);
    return null;
  }

  const options = {
    method: "GET",
    url: url,
    params: {
      module: "account",
      action: "tokennfttx",
      contractaddress: contract_address,
      page: "1",
      offset: "20",
      startblock: "0",
      endblock: "99999999",
      sort: "desc",
      apikey: apikey,
    },
  };

  const data = await axios.request(options);
  if (data.data.status != 1) {
    console.log(data.data.message);
    return null;
  }

  for (const item of data.data.result) {
    if (item.to !== "0x0000000000000000000000000000000000000000") {
      return item;
    }
  }
  return null;
};

module.exports = NFTStorageSlotFinder;
