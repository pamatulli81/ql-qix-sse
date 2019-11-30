const q = require("qlik-sse");
const settings = require("../../settings");
const logger = settings.LOGGER.getLogger("sse");
const sessionMgr = require("../../lib/qlik/qlikSession");
const qDimensionList = require("../../definitions/qix-def-master-dimension-list");
const qMeasureList = require("../../definitions/qix-def-master-measure-list");
const qVariableList = require("../../definitions/qix-def-variable-list");
const helper = require("../../lib/qlik/qlikHelper");

const functionConfig = {
  name: "GetList",
  functionType: q.sse.FunctionType.SCALAR,
  returnType: q.sse.DataType.STRING,
  params: [
    {
      name: "qsApp",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "type",
      dataType: q.sse.DataType.STRING
    }
  ]
};

/**
 * Create a Dimension in the calling app.
 * @function GetList
 * @param {string} qsApp
 * @param {string} type
 * @returns {object} Returns an array ob object items
 */
const functionDefinition = async function GetList(request) {
  request.on("data", async bundle => {
    try {
      const common = q.sse.CommonRequestHeader.decode(
        request.metadata.get("qlik-commonrequestheader-bin")[0]
      );
      const rows = [];
      let result = 0;
      for (const row of bundle.rows) {
        let qsApp = row.duals[0].strData;
        let type = row.duals[1].strData;

        result = await DoGetList({
          qsApp,
          type: type,
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
        service: `NodeSseService::GetAppEntry()`
      });
    }
  });
};

const DoGetList = async function DoGetList({ qsApp, type, commonHeader }) {
  let retVal = "";
  let session = null;
  try {
    let items = [],
      layout = null,
      qDef;
    const appId = qsApp.length > 0 ? qsApp : commonHeader.appId;
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    
    switch (type) {
      case "MasterDimensionList":
        qDef = qDimensionList();
        list = await app.createSessionObject(qDef);
        layout = await list.getLayout();
        items = layout.qDimensionList.qItems;
        break;
      case "MasterMeasureList":
        qDef = qMeasureList();
        list = await app.createSessionObject(qDef);
        layout = await list.getLayout();
        items = layout.qMeasureList.qItems;
        break;
      case "VariableList":
        qDef = qVariableList();
        list = await app.createSessionObject(qDef);
        layout = await list.getLayout();
        items = layout.qVariableList.qItems;
        break;
      default:
        break;
    }
    retVal = items.toString();
  } catch (err) {
    logger.error(`${JSON.stringify(err)}`, {
      service: `NodeSseService::DoGetList()`
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
