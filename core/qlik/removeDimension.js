const q = require("qlik-sse");
const settings = require("../../settings");
const logger = settings.LOGGER.getLogger("sse");
const sessionMgr = require("../../lib/qlik/qlikSession");
const helper = require("../../lib/qlik/qlikHelper");

const functionConfig = {
  name: "RemoveDimension",
  functionType: q.sse.FunctionType.SCALAR,
  returnType: q.sse.DataType.STRING,
  params: [
    {
      name: "qsApp",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "id",
      dataType: q.sse.DataType.STRING
    }
  ]
};

/**
 * Remove a Dimension in the calling app.
 * @function RemoveDimension
 * @param {string} app
 * @param {string} id
 * @returns {string} Status - 'Removed' plus any validation error messages.
 */
const functionDefinition = async function RemoveDimension(request) {
  request.on("data", async bundle => {
    try {
      const common = q.sse.CommonRequestHeader.decode(
        request.metadata.get("qlik-commonrequestheader-bin")[0]
      );
      const rows = [];
      let result = 0;
      for (const row of bundle.rows) {
        let qsApp = row.duals[0].strData;
        let id = row.duals[1].strData;

        result = await DoRemoveDimension({
          qsApp,
          id: id,
          commonHeader: common
        });
        rows.push({
          duals: [{ strData: result }]
        });
      }
      request.write({
        rows
      });
      request.end();
    } catch (err) {
      logger.error(`Error:${JSON.stringify(err)}`, {
        service: `NodeSseService::RemoveDimension()`
      });
    }
  });
};

const DoRemoveDimension = async function DoRemoveDimension({
  qsApp,
  id,
  commonHeader
}) {
  let retVal = "";
  let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
  let session = null;

  try {
    const appId = qsApp.length > 0 ? qsApp : commonHeader.appId;
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    const result = await app.destroyDimension({ qId: id });

    if (result) {
      logger.info("Dimension: " + id + " Removed", {
        service: `NodeSseService::DoRemoveDimension()`,
        app: appId
      });
    } else {
      logger.info("Dimension: " + id + " not removed", {
        service: `NodeSseService::DoRemoveDimension()`,
        app: appId
      });
    }
    retVal = `${id}=${result}`;

    if (isDesktop) {
      await app.doSave();
    }

    session = await sessionMgr.closeSession(session);
  } catch (err) {
    logger.error(`${JSON.stringify(err)}`, {
      service: `NodeSseService::DoRemoveDimension()`
    });
    retVal = "Error: " + err.toString();

    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

module.exports = {
  functionDefinition,
  functionConfig
};
