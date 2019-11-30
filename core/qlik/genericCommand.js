const q = require("qlik-sse");
const settings = require("../../settings");
const logger = settings.LOGGER.getLogger("sse");
const sessionMgr = require("../../lib/qlik/qlikSession");
const helper = require("../../lib/qlik/qlikHelper");
const qDimensionListDef = require("../../definitions/qix-def-master-dimension-list");
const qMeasureListDef = require("../../definitions/qix-def-master-measure-list");

const functionConfig = {
  name: "GenericCommand",
  functionType: q.sse.FunctionType.SCALAR,
  returnType: q.sse.DataType.STRING,
  params: [
    {
      name: "qsApp",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "command",
      dataType: q.sse.DataType.STRING
    }
  ]
};

/**
 * Remove a Measure in the calling app.
 * @function GenericCommand
 * @param {string} app
 * @param {string} command
 * @returns {string} Returns a string with the requested information
 * /**
 */
const functionDefinition = async function ClearMeasures(request) {
  request.on("data", async bundle => {
    try {
      const common = q.sse.CommonRequestHeader.decode(
        request.metadata.get("qlik-commonrequestheader-bin")[0]
      );
      const rows = [];
      let result = 0;
      for (const row of bundle.rows) {
        let qsApp = row.duals[0].strData;
        let command = row.duals[1].strData;
        switch (command) {
          case "EngineVersion":
            result = await DoGetEngineVersion({
              commonHeader: common
            });
            break;
          case "OSVersion":
            result = await DoGetOsVersion({
              commonHeader: common
            });
            break;
          case "OSName":
            result = await DoGetOsName({
              commonHeader: common
            });
            break;
          case "IsDesktopMode":
            result = await DoIsDesktopMode({
              commonHeader: common
            });
            break;
          case "QTProduct":
            result = await DoGetQTProduct({
              commonHeader: common
            });
            break;

          case "GetStreamList":
            result = await DoGetStreamList({
              commonHeader: common
            });
            break;
          case "GetAppList":
            result = await DoGetAppList({
              commonHeader: common
            });
            break;
          case "ClearMasterMeasure":
            result = await DoClearMeasures({
              qsApp,
              commonHeader: common
            });
            break;
          case "ClearMasterDimension":
            result = await DoClearDimensions({
              qsApp,
              commonHeader: common
            });
            break;

          default:
            break;
        }
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
        service: `NodeSseService::GenericCommand()`
      });
    }
  });
};

const DoClearDimensions = async function DoClearDimensions({
  qsApp,
  commonHeader
}) {
  let retVal = "";
  let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
  let session = null;
  let cleared;

  try {
    const appId =
      qsApp.length > 0
        ? qsApp
        : commonHeader.userId !== settings.DESKTOP_USER
        ? commonHeader.appId
        : commonHeader.appId.replace(/^.*[\\\/]/, "");
        
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    const obj = await app.createSessionObject(qDimensionListDef());
    const list = await obj.getLayout();

    for (let item of list.qDimensionList.qItems) {
      cleared = await app.destroyDimension({ qId: item.qInfo.qId });
      logger.info("Dimension: " + item.qInfo.qId + " Removed", {
        service: `NodeSseService::DoClearDimensions()`,
        app: appId
      });
      retVal += `${item.qInfo.qId}=${cleared};`;
    }
    if (isDesktop) {
      await app.doSave();
    }
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    logger.error(`Error:${JSON.stringify(err)}`, {
      service: `NodeSseService::DoClearDimensions()`
    });
    retVal = "Error: " + err.toString();

    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoClearMeasures = async function DoClearMeasures({
  qsApp,
  commonHeader
}) {
  let retVal = "";
  let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
  let session = null;
  let cleared;

  try {
    const appId =
      qsApp.length > 0
        ? qsApp
        : commonHeader.userId !== settings.DESKTOP_USER
        ? commonHeader.appId
        : commonHeader.appId.replace(/^.*[\\\/]/, "");
    
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    const obj = await app.createSessionObject(qMeasureListDef());
    const list = await obj.getLayout();
    
    for (let item of list.qMeasureList.qItems) {
      cleared = await app.destroyMeasure({ qId: item.qInfo.qId });
      logger.info("Measure: " + item.qInfo.qId + " Removed", {
        service: `NodeSseService::DoClearMeasures()`,
        app: appId
      });
      retVal += `${item.qInfo.qId}=${cleared};`;
    }
    if (isDesktop) {
      await app.doSave();
    }
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    logger.error(`Error:${JSON.stringify(err)}`, {
      service: `NodeSseService::DoClearMeasures()`
    });
    retVal = "Error: " + err.toString();

    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoGetAppList = async function DoGetAppList({ commonHeader }) {
  let retVal = "";
  let list = [];
  let docs = [];
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();   
    list = await global.getDocList();
    docs = list.map(doc => doc.qDocName);
    retVal = docs.join();
    session = await sessionMgr.closeSession(session);

  } catch (err) {
    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoGetStreamList = async function DoGetStreamList({ commonHeader }) {
  let retVal = "";
  let list = [];
  let streams = [];
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    list = await global.getStreamList();
    streams = list.map(stream => stream.qDocName);
    retVal = streams.join();
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoGetEngineVersion = async function DoGetEngineVersion({
  commonHeader
}) {
  let retVal = "";
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    retVal = await global.engineVersion();
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoGetOsVersion = async function DoGetOsVersion({ commonHeader }) {
  let retVal = "";
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    retVal = await global.oSVersion();
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoGetOsName = async function DoGetOsName({ commonHeader }) {
  let retVal = "";
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
     retVal = await global.oSName();
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoIsDesktopMode = async function DoIsDesktopMode({ commonHeader }) {
  let retVal = "";
  let isDesktopMode;
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    isDesktopMode = await global.isDesktopMode();
    retVal = isDesktopMode.toString();
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    if (session) {
      session = await sessionMgr.closeSession(session);
    }
  }
  return Promise.resolve(retVal);
};

const DoGetQTProduct = async function DoGetQTProduct({ commonHeader }) {
  let retVal = "";
  let session = null;
  try {
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    session = await sessionMgr.closeSession(session);
  } catch (err) {
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
