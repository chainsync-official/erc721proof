const Web3 = require("web3");
const { insertErc721Contract, getContractData, updateContractData } = require("../src/dblite");
const configs = require("../config.json");

const chainId = 1;

const web3 = new Web3(configs[chainId].RPC_URL);

const NFTStorageSlotFinder = require("../src/NFTStorageSlotFinder");
const nftStorageSlotFinder = new NFTStorageSlotFinder(web3);

const address0 = "0x0000000000000000000000000000000000000000";

async function main(contract_address) {
  const exist = await getContractData(chainId, contract_address);
  if (exist && exist.owner_slot_type != 0) {
    // && exist.owner_slot_type != 0
    console.log(contract_address + " exist");
    // return;
  }

  const data = await nftStorageSlotFinder.getCollectionSlot(chainId, contract_address);
  console.log(data);

  if (!exist) {
    await insertErc721Contract(
      chainId,
      contract_address,
      data.tokenName,
      data.tokenSymbol,
      data.owner_slot_type,
      data.ownerslot === null ? null : data.ownerslot.owner_slot_index,
      data.ownerslot === null ? null : data.ownerslot.owner_unpack_type
    );
  } else if (ownerslot != null) {
    exist.owner_slot_type = data.owner_slot_type;
    exist.owner_slot_index = data.ownerslot.owner_slot_index;
    exist.owner_unpack_type = data.ownerslot.owner_unpack_type;
    updateContractData(chainId, contract_address, exist);
  }
}

main("0x4cf2f3e3343924a4b804a8a36f76f0043b11ab37").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
