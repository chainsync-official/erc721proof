const Web3 = require("web3");
const { insertErc721Contract, getContractData, updateContractData } = require("../src/dblite");
const configs = require("../config.json");

const chain_id = 1;

const web3 = new Web3(configs[chain_id].RPC_URL);

const NFTStorageSlotFinder = require("../src/NFTStorageSlotFinder");
const nftStorageSlotFinder = new NFTStorageSlotFinder(web3);

const address0 = "0x0000000000000000000000000000000000000000";

async function main(contract_address) {
  const exist = await getContractData(chain_id, contract_address);
  if (exist && exist.owner_slot_type != 0) {
    // && exist.owner_slot_type != 0
    console.log(contract_address + " exist");
    // return;
  }

  nftStorageSlotFinder.getCollectionSlot(contract_address).then(async (data) => {
    console.log(data);
  });

  // if (!exist) {
  //   await insertErc721Contract(
  //     chain_id,
  //     contract_address,
  //     data.tokenName,
  //     data.tokenSymbol,
  //     owner_slot_type,
  //     ownerslot === null ? null : ownerslot.owner_slot_index,
  //     ownerslot === null ? null : ownerslot.owner_unpack_type
  //   );
  // } else if (ownerslot != null) {
  //   exist.owner_slot_type = owner_slot_type;
  //   exist.owner_slot_index = ownerslot.owner_slot_index;
  //   exist.owner_unpack_type = ownerslot.owner_unpack_type;
  //   updateContractData(chain_id, contract_address, exist);
  // }
}

main("0xe127ce638293fa123be79c25782a5652581db234").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
