const Web3 = require("web3");
const BigNumber = require("bignumber.js");

function NFTStorageSlotFinder(web3Instance) {
  if (!(this instanceof NFTStorageSlotFinder)) {
    return new NFTStorageSlotFinder(web3Instance);
  }
  this.web3 = web3Instance;
}

NFTStorageSlotFinder.prototype.findSlotInMapping = async function (
  contractAddress,
  tokenId,
  owner
) {
  let slots = [];
  for (let i = 0; i < 500; i++) {
    slots.push(this.calculateMappingSlot(tokenId, i));
  }

  let nousevalues = [];

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
    slots.push(this.calculateERC721AStorageSlot(tokenId, i));
  }

  let nousevalues = [];

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
    slots.push(this.calculateDynamicArraySlot(tokenId, i));
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
      } else if (this.get721AOwner(proof.value).toLowerCase() === owner.toLowerCase()) {
        return { owner_slot_index: i, owner_unpack_type: 1 };
      } else if (this.getStructOwner(proof.value).toLowerCase() === owner.toLowerCase()) {
        return { owner_slot_index: i, owner_unpack_type: 2 };
      } else if (this.getERC721AStorageOwner(proof.value).toLowerCase() === owner.toLowerCase()) {
        return { owner_slot_index: i, owner_unpack_type: 3 };
      }
      nousevalues.push(proof.value);
    }
  }
  console.log("nousevalues", nousevalues);
  return null;
};

NFTStorageSlotFinder.prototype.calculateMappingSlot = function (tokenId, mappingSlot) {
  const key = this.web3.utils.padLeft(this.web3.utils.toHex(tokenId), 64);
  const slot = this.web3.utils.padLeft(this.web3.utils.toHex(mappingSlot), 64);
  const dataToHash = key + slot.slice(2);

  return this.web3.utils.keccak256(dataToHash);
};

NFTStorageSlotFinder.prototype.calculateERC721AStorageSlot = function (tokenId, mappingSlot) {
  const storageSlot = this.web3.utils.keccak256("ERC721A.contracts.storage.ERC721A");
  const baseStoragePosition = new BigNumber(storageSlot).plus(new BigNumber(mappingSlot));

  return this.web3.utils.keccak256(tokenId.plus(baseStoragePosition).toString(16, 64));
};

NFTStorageSlotFinder.prototype.calculateDynamicArraySlot = function (tokenId, arrayPosition) {
  const firstElementSlot = this.web3.utils.keccak256(
    this.web3.utils.padLeft(this.web3.utils.toHex(arrayPosition), 64)
  );

  return this.web3.utils.toHex(new BigNumber(firstElementSlot).plus(tokenId));
};

NFTStorageSlotFinder.prototype.get721AOwner = function (packedData) {
  return (
    "0x" +
    BigInt(BigInt(packedData) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"))
      .toString(16)
      .padStart(40, "0")
  );
};

NFTStorageSlotFinder.prototype.getStructOwner = function (packedData) {
  return "0x" + packedData.slice(2, 42);
};

NFTStorageSlotFinder.prototype.getERC721AStorageOwner = function (packedData) {
  const addrMask = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") << BigInt(160);
  const addrBigInt = (BigInt(packedData) & addrMask) >> BigInt(160);

  return "0x" + addrBigInt.toString(16).padStart(40, "0");
};

module.exports = NFTStorageSlotFinder;
