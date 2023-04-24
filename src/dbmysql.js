const { Sequelize, QueryTypes, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  "mysql://" +
    process.env.MYSQL_USER +
    ":" +
    process.env.MYSQL_PASSWORD +
    "@" +
    process.env.MYSQL_HOST +
    ":3306/" +
    process.env.MYSQL_DB
);

const NFTConfig = sequelize.define(
  "nftConfig",
  {
    chainId: {
      type: DataTypes.INTEGER,
    },
    contract: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    symbol: {
      type: DataTypes.STRING,
    },
    owner_slot_type: {
      type: DataTypes.INTEGER,
    },
    owner_slot_index: {
      type: DataTypes.INTEGER,
    },
    owner_unpack_type: {
      type: DataTypes.INTEGER,
    },
    proof: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: false,
  }
);

const TruncateNFTConfig = async () => {
  return await sequelize.query("TRUNCATE TABLE nftConfigs", {
    type: QueryTypes.DELETE,
  });
};

const batchInsertNFTConfig = async (nftConfigs) => {
  await NFTConfig.bulkCreate(nftConfigs);
};

const getNFTConfig = async (chain_id, contract) => {
  const res = await sequelize.query(
    "SELECT * FROM nftConfigs WHERE chainId = $1 AND contract = $2",
    {
      bind: [chain_id, contract],
      type: QueryTypes.SELECT,
    }
  );
  if (res.length == 0) {
    return null;
  }
  return res[0];
};

module.exports = {
  TruncateNFTConfig,
  batchInsertNFTConfig,
  getNFTConfig,
};
