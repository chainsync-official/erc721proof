const Web3 = require("web3");

function NFTStorageSlotFinder(web3Instance) {
  if (!(this instanceof NFTStorageSlotFinder)) {
    return new NFTStorageSlotFinder(web3Instance);
  }
  this.web3 = web3Instance;
}

NFTStorageSlotFinder.prototype.findCorrectSlot = async function (contractAddress, tokenId, owner) {
  let slots = [];
  for (let i = 0; i < 500; i++) {
    slots.push(this.calculateStorageSlot(tokenId, i));
  }

  const proofs = await this.web3.eth.getProof(contractAddress, slots, "latest");
  for (const [index, proof] of proofs.storageProof.entries()) {
    if (proof.value !== "0x0") {
      const owner721A = this.get721AOwner(proof.value).toLowerCase();
      const ownerStruct = this.getStructOwner(proof.value).toLowerCase();

      if (
        proof.value.toLowerCase() === owner.toLowerCase() ||
        owner721A === owner.toLowerCase() ||
        ownerStruct === owner.toLowerCase()
      ) {
        return index;
      }
    }
  }

  return null;
};

NFTStorageSlotFinder.prototype.calculateStorageSlot = function (tokenId, mappingSlot) {
  const key = this.web3.utils.padLeft(this.web3.utils.toHex(tokenId), 64);
  const slot = this.web3.utils.padLeft(this.web3.utils.toHex(mappingSlot), 64);
  const dataToHash = key + slot.slice(2);

  const storageSlot = this.web3.utils.keccak256(dataToHash);

  return storageSlot;
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

module.exports = NFTStorageSlotFinder;
