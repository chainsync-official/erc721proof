const Web3 = require("web3");

const web3 = new Web3(
  "https://api.bitstack.com/v1/wNFxbiJyQsSeLrX8RRCHi7NpRxrlErZk/DjShIqLishPCTB9HiMkPHXjUM9CNM9Na/ETH/mainnet"
); // 请替换为您的以太坊节点URL

const erc721abi = require("./abi/IERC721.json");
const axios = require("axios");

async function main() {
  const cs = await getCollections();

  for (let i = 0; i < cs.length; i++) {
    await getCollectionSlot(cs[i]);
  }
}

async function getCollectionSlot(element) {
  const data = await getCollection(element.contract_address);
  if (!data) {
    console.log(element.contract_address + "no data");
    return;
  }

  const collection = data.collection;
  const nft = data.nft;

  const tokenId = nft.token_id;
  const contract = new web3.eth.Contract(erc721abi, element.contract_address);
  let owner;
  try {
    owner = (await contract.methods.ownerOf(tokenId).call()).toLowerCase();
  } catch {
    owner = nft.owner;
  }

  // console.log(`Begin to find owner slot mapping position for contract address: ${element.contract_address}, Token ID: ${tokenId}, Owner: ${owner}`);

  let slots = [];
  for (let i = 0; i < 500; i++) {
    // 计算特定 tokenId 在映射变量中的存储插槽
    slots.push(calculateStorageSlot(tokenId, i));
  }

  let foundPos = null;

  // 获取MPT证明
  const proofs = await web3.eth.getProof(element.contract_address, slots, "latest");
  proofs.storageProof.forEach((ele, index) => {
    if (ele.value != "0x0") {
      if (ele.value.toLowerCase() == owner) {
        console.log(
          `Collection: ${collection.name} Contract Address: ${element.contract_address}, Slot Mapping Position: ${index}`
        );
        foundPos = index;
      } else if (get721AOwner(ele.value).toLowerCase() == owner) {
        foundPos = index;
        console.log(
          `Collection: ${collection.name} Contract Address: ${element.contract_address}, Slot Mapping Position: ${index}`
        );
        return;
      } else if (getStructOwner(ele.value).toLowerCase() == owner) {
        foundPos = index;
        console.log(
          `Collection: ${collection.name} Contract Address: ${element.contract_address}, Slot Mapping Position: ${index}`
        );
        return;
      } else {
        // console.log(`Contract Address: ${element.contract_address}, Storage Proof Value: ${ele.value}`);
      }
    }
  });

  if (foundPos === null) {
    console.log(
      `Could not find mapping position for contract address: ${element.contract_address}`
    );
  }
}

async function getCollections() {
  const options = {
    method: "GET",
    url: "https://api.nftport.xyz/v0/contracts/top",
    params: {
      page_size: "50",
      page_number: "1",
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

async function getCollection(contract_address) {
  const options = {
    method: "GET",
    url: "https://api.nftport.xyz/v0/nfts/" + contract_address,
    params: {
      chain: "ethereum",
      page_number: "1",
      page_size: "20",
      include: "default",
      refresh_metadata: "false",
    },
    headers: {
      accept: "application/json",
      Authorization: "1e48df89-a7ff-4845-ab3b-e93f43295d9b",
    },
  };

  const data = await axios.request(options);
  if (data.data.nfts.length == 0) {
    console.log(data);
    return null;
  }

  for (let index = 0; index < data.data.nfts.length; index++) {
    if (data.data.nfts[index].owner != null) {
      return { collection: data.data.contract, nft: data.data.nfts[index] };
    }
  }
  return { collection: data.data.contract, nft: data.data.nfts[0] };
}

function calculateStorageSlot(tokenId, mappingSlot) {
  const key = web3.utils.padLeft(web3.utils.toHex(tokenId), 64);
  const slot = web3.utils.padLeft(web3.utils.toHex(mappingSlot), 64);
  const dataToHash = key + slot.slice(2);

  const storageSlot = web3.utils.keccak256(dataToHash);

  return storageSlot;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function get721AOwner(packedData) {
  return (
    "0x" +
    BigInt(BigInt(packedData) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"))
      .toString(16)
      .padStart(40, "0")
  );
}

function getStructOwner(packedData) {
  return "0x" + packedData.slice(2, 42);
}
