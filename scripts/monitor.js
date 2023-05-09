const Web3 = require("web3");
const axios = require("axios");
const configs = require("../config.json");
const {
  InsertMirrorCllection,
  InsertMirrorNFT,
  batchInsertMirrorCollections,
  batchInsertMirrorNFTs,
  getMirrorChains,
  updateMirrorChain,
} = require("../src/dbmysql");
require("dotenv").config();

const mirrorerc721factoryabi = require("../abi/MirrorERC721Factory.json");

async function main() {
  const mirrorChains = await getMirrorChains();
  for (const mirrorChain of mirrorChains) {
    if (mirrorChain.mirrorFactoryContract == null) {
      continue;
    }
    const web3ws = new Web3(configs[mirrorChain.chainId].WS_RPC_URL);
    const contractws = new web3ws.eth.Contract(
      mirrorerc721factoryabi,
      mirrorChain.mirrorFactoryContract
    );
    contractws.events
      .allEvents({})
      .on("connected", function (subscriptionId) {
        console.log("chain", mirrorChain.chainId, "rpc connected", subscriptionId);
      })
      .on("data", function (eventdata) {
        if (eventdata.event == "MirrorCollectionDeployed") {
          InsertMirrorCllection({
            where: {
              chainId: eventdata.returnValues.chain_id,
              contract: eventdata.returnValues.token,
              mirrorChainId: mirrorChain.chainId,
            },
            defaults: {
              mirrorContract: eventdata.returnValues.mirrorToken,
            },
          });
        } else if (eventdata.event == "MirrorNFTClaimed") {
          InsertMirrorNFT({
            where: {
              chainId: eventdata.returnValues.chain_id,
              contract: eventdata.returnValues.token,
              tokenId: eventdata.returnValues.tokenId,
              mirrorChainId: mirrorChain.chainId,
            },
            defaults: {
              mirrorContract: eventdata.returnValues.mirrorToken,
            },
          });
        }
        updateMirrorChain(mirrorChain.chainId, { lastSyncBlock: eventdata.blockNumber });
      })
      .on("error", function (error, receipt) {
        console.log(error);
        console.log(receipt);
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      });

    const web3 = new Web3(configs[mirrorChain.chainId].RPC_URL);
    const contract = new web3.eth.Contract(
      mirrorerc721factoryabi,
      mirrorChain.mirrorFactoryContract
    );
    contract
      .getPastEvents("allEvents", {
        fromBlock: mirrorChain.lastSyncBlock + 1,
        toBlock: "latest",
      })
      .then(function (events) {
        let lastSyncBlock;
        for (const eventdata of events) {
          if (eventdata.event == "MirrorCollectionDeployed") {
            InsertMirrorCllection({
              where: {
                chainId: eventdata.returnValues.chain_id,
                contract: eventdata.returnValues.token,
                mirrorChainId: mirrorChain.chainId,
              },
              defaults: {
                mirrorContract: eventdata.returnValues.mirrorToken,
              },
            });
          } else if (eventdata.event == "MirrorNFTClaimed") {
            InsertMirrorNFT({
              where: {
                chainId: eventdata.returnValues.chain_id,
                contract: eventdata.returnValues.token,
                tokenId: eventdata.returnValues.tokenId,
                mirrorChainId: mirrorChain.chainId,
              },
              defaults: {
                mirrorContract: eventdata.returnValues.mirrorToken,
              },
            });
          }
          lastSyncBlock = eventdata.blockNumber;
        }
        updateMirrorChain(mirrorChain.chainId, { lastSyncBlock: lastSyncBlock });
      });
  }
}

main().catch((err) => {
  console.log(err);
});
