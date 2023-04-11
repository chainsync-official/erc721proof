const Web3 = require("web3");
const web3 = new Web3(
  "https://api.bitstack.com/v1/wNFxbiJyQsSeLrX8RRCHi7NpRxrlErZk/DjShIqLishPCTB9HiMkPHXjUM9CNM9Na/ETH/mainnet"
); // 请替换为您的以太坊节点URL

const erc721abi = require("../abi/IERC721.json");
const axios = require("axios");
const NFTStorageSlotFinder = require("../src/storageSlotFinder");
const nftStorageSlotFinder = new NFTStorageSlotFinder(web3);
const { insertErc721Contract, getContractData, updateContractData } = require("../src/db");
const BigNumber = require("bignumber.js");

async function main() {
  let page = 4;
  while (true) {
    console.log(page, "start");
    const cs = await getCollections(page);
    if (cs.length == 0) {
      break;
    }
    for (let i = 0; i < cs.length; i++) {
      const contract = cs[i];

      await getCollectionSlot(contract);
    }
    page++;
  }
}

async function getCollectionSlot(element) {
  const exist = await getContractData(element.contract_address);
  if (exist && exist.owner_slot_type != 0) {
    // && exist.owner_slot_type != 0
    console.log(element.contract_address + " exist");
    return;
  }

  let data = await getCollectionExistToken(element.contract_address);
  if (!data) {
    console.log(element.contract_address + " no data");
    return;
  }

  let owner = data.to;
  if (!owner) {
    const contract = new web3.eth.Contract(erc721abi, element.contract_address);
    owner = await contract.methods.ownerOf(data.tokenID).call();
  }
  owner = owner.toLowerCase();

  const tokenId = new BigNumber(data.tokenID);

  console.log(
    `Begin to find owner slot mapping position for contract address: ${element.contract_address}, Token ID: ${tokenId}, Owner: ${owner}`
  );

  let owner_slot_type = 1;
  let ownerslot = null;
  try {
    ownerslot = await nftStorageSlotFinder.findSlotInMapping(
      element.contract_address,
      tokenId,
      owner
    );

    if (ownerslot === null) {
      owner_slot_type = 2;
      ownerslot = await nftStorageSlotFinder.findSlotInDynamicArray(
        element.contract_address,
        tokenId,
        owner
      );
    }

    if (ownerslot === null) {
      owner_slot_type = 3;
      ownerslot = await nftStorageSlotFinder.findSlotInERC721AStorage(
        element.contract_address,
        tokenId,
        owner
      );
    }
  } catch (error) {
    console.log("contract: " + element.contract_address + " find slot error " + error);
  }

  if (ownerslot === null) {
    owner_slot_type = 0;
    console.log(
      `Could not find mapping position for contract address: ${element.contract_address}`
    );
  } else {
    console.log(
      "found nft contract: " +
        element.contract_address +
        " owner slot type: " +
        owner_slot_type +
        " found pos: " +
        ownerslot.owner_slot_index +
        " unpack type:" +
        ownerslot.owner_unpack_type
    );
  }

  if (!exist) {
    await insertErc721Contract(
      element.contract_address,
      data.tokenName,
      data.tokenSymbol,
      owner_slot_type,
      ownerslot === null ? null : ownerslot.owner_slot_index,
      ownerslot === null ? null : ownerslot.owner_unpack_type
    );
  } else if (ownerslot != null) {
    exist.owner_slot_type = owner_slot_type;
    exist.owner_slot_index = ownerslot.owner_slot_index;
    exist.owner_unpack_type = ownerslot.owner_unpack_type;
    updateContractData(element.contract_address, exist);
  }
}

async function getCollections(page) {
  const options = {
    method: "GET",
    url: "https://api.nftport.xyz/v0/contracts/top",
    params: {
      page_size: "50",
      page_number: page,
      period: "24h",
      order_by: "volume",
      chain: ["ethereum"],
    },
    headers: {
      accept: "application/json",
      Authorization: "1e48df89-a7ff-4845-ab3b-e93f43295d9b",
    },
  };

  const data = await axios.request(options);
  return data.data.contracts;
}

async function getBlockDeamonCollections(offset) {
  const options = {
    method: "GET",
    url: "https://svc.blockdaemon.com/nft/v1/ethereum/mainnet/collections?token_type=ERC721",
    headers: {
      accept: "application/json",
      Authorization: "Bearer 7-G4vv1K8OyLd31GZ0ogOVqqrjZicrXTqw2RjDxjZIjjR9L8",
    },
  };

  const data = await axios.request(options);
  return data.data.data;
}

async function getCollectionExistToken(contract_address) {
  const options = {
    method: "GET",
    url: "https://api.etherscan.io/api",
    params: {
      module: "account",
      action: "tokennfttx",
      contractaddress: contract_address,
      page: "1",
      offset: "1",
      startblock: "0",
      endblock: "99999999",
      sort: "desc",
      apikey: "VF1WUSV8BS4WMZ8F1GKCITT76TGPSA8HZV",
    },
  };

  const data = await axios.request(options);
  if (data.data.status != 1) {
    console.log(data.data.message);
    return null;
  }

  return data.data.result[0];
}

async function getCollectionExistTokenFromNFTPORT(contract_address) {
  let res = null;

  const options = {
    method: "GET",
    url: "https://api.nftport.xyz/v0/nfts/" + contract_address,
    params: {
      chain: "ethereum",
      page_number: "1",
      page_size: "50",
      include: "default",
      refresh_metadata: "false",
    },
    headers: {
      accept: "application/json",
      Authorization: "1e48df89-a7ff-4845-ab3b-e93f43295d9b",
    },
  };

  const data = await axios.request(options);
  if (data.data.nfts.length > 0) {
    for (let index = 0; index < data.data.nfts.length; index++) {
      if (data.data.nfts[index].owner != null) {
        res = data.data.nfts[index];
        break;
      }
    }

    if (res == null) {
      res = data.data.nfts[0];
    }

    res.to = res.owner;
    res.tokenID = res.token_id;
    res.tokenName = data.data.contract.name;
    res.tokenSymbol = data.data.contract.symbol;
  }

  return res;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});