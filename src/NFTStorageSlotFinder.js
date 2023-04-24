const NFTStorageSlot = require("./NFTStorageSlot");
const nftStorageSlot = new NFTStorageSlot();

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
    slots.push(nftStorageSlot.calculateMappingSlot(tokenId, i));
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

module.exports = NFTStorageSlotFinder;
