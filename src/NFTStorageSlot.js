const Web3 = require("web3");

function NFTStorageSlot() {
  if (!(this instanceof NFTStorageSlot)) {
    return new NFTStorageSlot();
  }
  this.web3 = new Web3();
}

NFTStorageSlot.prototype.getOwnerSlot = function (owner_slot_type, owner_slot_index, tokenId) {
  if (owner_slot_type == 1) {
    return this.calculateMappingSlot(tokenId, owner_slot_index);
  } else if (owner_slot_type == 2) {
    return this.calculateERC721AStorageSlot(tokenId, owner_slot_index);
  } else if (owner_slot_type == 3) {
    return this.calculateDynamicArraySlot(tokenId, owner_slot_index);
  } else {
    throw "Invalid slot type";
  }
};

NFTStorageSlot.prototype.calculateMappingSlot = function (tokenId, mappingSlot) {
  const key = this.web3.utils.padLeft(this.web3.utils.toHex(tokenId), 64);
  const slot = this.web3.utils.padLeft(this.web3.utils.toHex(mappingSlot), 64);
  const dataToHash = key + slot.slice(2);

  return this.web3.utils.keccak256(dataToHash);
};

NFTStorageSlot.prototype.calculateERC721AStorageSlot = function (tokenId, mappingSlot) {
  let baseStorageSlot = this.web3.utils.keccak256("ERC721A.contracts.storage.ERC721A");
  baseStorageSlot = this.web3.utils.toBN(baseStorageSlot).add(this.web3.utils.toBN(mappingSlot));
  return this.calculateMappingSlot(tokenId, baseStorageSlot);
};

NFTStorageSlot.prototype.calculateDynamicArraySlot = function (tokenId, arrayPosition) {
  const firstElementSlot = this.web3.utils.keccak256(
    this.web3.utils.padLeft(this.web3.utils.toHex(arrayPosition), 64)
  );
  return this.web3.utils.toHex(this.web3.utils.toBN(firstElementSlot).add(tokenId));
};

NFTStorageSlot.prototype.get721AOwner = function (packedData) {
  return (
    "0x" +
    BigInt(BigInt(packedData) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"))
      .toString(16)
      .padStart(40, "0")
  );
};

NFTStorageSlot.prototype.getStructOwner = function (packedData) {
  return "0x" + packedData.slice(2, 42);
};

NFTStorageSlot.prototype.getERC721AStorageOwner = function (packedData) {
  const addrMask = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") << BigInt(160);
  const addrBigInt = (BigInt(packedData) & addrMask) >> BigInt(160);

  return "0x" + addrBigInt.toString(16).padStart(40, "0");
};

module.exports = NFTStorageSlot;
