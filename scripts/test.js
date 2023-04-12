const Web3 = require("web3");
const web3 = new Web3(
  "https://api.bitstack.com/v1/wNFxbiJyQsSeLrX8RRCHi7NpRxrlErZk/DjShIqLishPCTB9HiMkPHXjUM9CNM9Na/ETH/mainnet"
);

const ethers = require("ethers");

const STORAGE_SLOT = web3.utils.keccak256("ERC721A.contracts.storage.ERC721A").toString();
const BITMASK_BURNED = BigInt(1) << BigInt(224);

const abi = require("../abi/test.json");
// Assuming you have the contract ABI and address
const contract = new web3.eth.Contract(abi, "0xf5bf369c02ef563473babbe725e6b1c7a2dcae7a");

async function getPackedOwnershipOf(tokenId) {
  console.log(ethers.utils);
  const tokenIdAsUint256 = ethers.utils.hexZeroPad(
    ethers.BigNumber.from(tokenId).toHexString(),
    32
  );
  const mappacked = ethers.utils.solidityPack(
    ["uint256", "bytes32"],
    [tokenIdAsUint256, STORAGE_SLOT]
  );
  const mappingSlot = ethers.utils.keccak256(mappacked);

  // Call the contract's 'getStorageAt' function to get the packed ownership data
  let packed = BigInt(await web3.eth.getStorageAt(contract.options.address, mappingSlot));

  if ((packed & BITMASK_BURNED) === BigInt(0)) {
    let currentTokenId = BigInt(tokenId);
    while (packed === BigInt(0)) {
      currentTokenId--;
      const currentTokenIdAsUint256 = ethers.utils.hexZeroPad(
        ethers.BigNumber.from(currentTokenId).toHexString(),
        32
      );
      const currentPacked = ethers.utils.solidityPack(
        ["uint256", "bytes32"],
        [currentTokenIdAsUint256, STORAGE_SLOT]
      );
      const currentMappingSlot = ethers.utils.keccak256(currentPacked);
      packed = BigInt(await web3.eth.getStorageAt(contract.options.address, currentMappingSlot));
      console.log(currentTokenId, currentMappingSlot, packed);
    }
    return packed;
  } else {
    throw new Error("OwnerQueryForNonexistentToken");
  }
}

async function getOwnerOf(tokenId) {
  const packed = await getPackedOwnershipOf(tokenId);
  const owner = "0x" + packed.toString(16).substring(0, 40);
  return owner;
}

getOwnerOf(4993).then(console.log);
