const q = require("qlik-sse");
const settings = require("../../settings");
const logger = settings.LOGGER.getLogger("sse");
const sessionMgr = require("../../lib/qlik/qlikSession");
const qMasterDimension = require("../../definitions/qix-def-master-dimension");
const helper = require("../../lib/qlik/qlikHelper");

const functionConfig = {
  name: "CreateDimension",
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
    },
    {
      name: "label",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "def",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "title",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "desc",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "grouping",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "tags",
      dataType: q.sse.DataType.STRING
    }
  ]
};

/**
 * Create a Dimension in the calling app.
 * @function CreateDimension
 * @param {string} qsApp
 * @param {string} id
 * @param {string} label
 * @param {string} def
 * @param {string} title
 * @param {string} desc
 * @param {string} grouping
 * @param {string} tags
 * @returns {string} Status - 'Created' or 'Updated' plus any validation error messages.
 */
const functionDefinition = async function CreateDimension(request) {
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
        let label = row.duals[2].strData;
        let def = row.duals[3].strData;
        let title = row.duals[4].strData;
        let desc = row.duals[5].strData;
        let grouping = row.duals[6].strData;
        let tags = row.duals[7].strData;

        result = await DoCreateDimension({
          qsApp: qsApp,
          id: id,
          label: label,
          def: def,
          title: title,
          desc: desc,
          grouping: grouping,
          tags: tags,
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
        service: `NodeSseService::CreateDimension()`
      });
    }
  });
};

const DoCreateDimension = async function DoCreateDimension({
  qsApp,
  id,
  label,
  def,
  title,
  desc,
  grouping,
  tags,
  commonHeader
}) {
  let retVal = "";
  let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
  let session = null;
  let dim = null;

  try {
    const appId = qsApp.length > 0 ? qsApp : commonHeader.appId;
    const qDef = qMasterDimension(id, label, def, title, desc, grouping, tags);
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    let qId = await helper.findDimensionByTitle(app, title);

    if (!qId) {
      logger.info("Dimension: " + id + " does not exist.  Creating", {
        service: `NodeSseService::DoCreateDimension()`,
        app: appId
      });
      const newDim = await app.createDimension(qDef);
      logger.info("Dimension: " + id + " Created", {
        service: `NodeSseService::DoCreateDimension()`,
        app: appId
      });
      const layout = await newDim.getLayout();
      retVal = `New Dimension created with ID ${layout.qInfo.qId}`;
    } else {
      dim = await app.getDimension(qId);
      let prop = await dim.getProperties();
      logger.info("Dimension: " + id + " exists.  Checking for changes.", {
        service: `NodeSseService::DoCreateDimension()`,
        app: appId
      });
      if (JSON.stringify(prop) == JSON.stringify(qDef)) {
        logger.info("Dimension: " + id + " no changes found.", {
          service: `NodeSseService::DoCreateDimension()`,
          app: appId
        });
        retVal = `Dimension found with same properties for ID ${id}`;
      } else {
        logger.info("Dimension: " + id + " found.  Setting new properties.", {
          service: `NodeSseService::DoCreateDimension()`,
          app: appId
        });
        const dim = await dim.setProperties(qDef);
        logger.info("Dimension found and new properties set.", {
          service: `NodeSseService::DoCreateDimension()`,
          app: appId
        });
        retVal = "Update Dimension with new properties set";
      }
    }

    await helper.persistApp(app, isDesktop);
    retVal += await helper.validateExpression(app, def);
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    logger.error(`${JSON.stringify(err)}`, {
      service: `NodeSseService::DoCreateDimension()`
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
