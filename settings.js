const log4js = require("log4js");

log4js.configure({
  appenders: {
    sse: { type: "file", filename: "logs/sse.log" },
  },
  categories: {
    default: {
      appenders: ["sse"],
      level: "info"
    },
    sse: {
      appenders: ["sse"],
      level: "info"
    },
  }
});

const desktopUser = "Personal\\Me";
const serverCertPath = "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates";

let settings = {
   LOGGER: log4js,
   DESKTOP_USER: desktopUser,
   SERVER_CERT_PATH: serverCertPath,
   SERVER_WS_PORT: 9076,
   DESKTOP_WS_PORT: 4747,
};

module.exports = Object.freeze(settings);
