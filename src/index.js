const { app, init } = require("./app");
const config = require("./config");

init()
  .then(() => {
    app.listen(config.API_PORT, () => {
      console.log(`API listening on port ${config.API_PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
