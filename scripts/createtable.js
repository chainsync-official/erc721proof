const { createTable } = require("../src/db");

(async () => {
  await createTable();
})();
