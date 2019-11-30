const q = require("qlik-sse");
const settings = require("../../settings");
const logger = settings.LOGGER.getLogger("sse");
const sessionMgr = require("../../lib/qlik/qlikSession");
const qMasterMeasure = require("../../definitions/qix-def-master-measure");
const helper = require("../../lib/qlik/qlikHelper");

const functionConfig = {
  name: "CreateMeasure",
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
      name: "expressions",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "labelExpression",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "tags",
      dataType: q.sse.DataType.STRING
    }
  ]
};

/**
 * Create a Measure in the calling app.
 * @function CreateMeasure
 * @param {string} qsApp
 * @param {string} id
 * @param {string} label
 * @param {string} def
 * @param {string} title
 * @param {string} desc
 * @param {string} grouping
 * @param {string} expressions
 * @param {string} tags
 * @returns {string} Status - 'Created' or 'Replaced' plus any validation error messages.
 */
const functionDefinition = async function CreateMeasure(request) {
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
        let expressions = row.duals[7].strData;
        let labelExpression = row.duals[8].strData;
        let tags = row.duals[9].strData;

        result = await DoCreateMeasure({
          qsApp: qsApp,
          id: id,
          label: label,
          def: def,
          title: title,
          desc: desc,
          grouping: grouping,
          expressions: expressions,
          labelExpression: labelExpression,
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
        service: `NodeSseService::CreateMeasure()`
      });
    }
  });
};

const DoCreateMeasure = async function DoCreateMeasure({
  qsApp,
  id,
  label,
  def,
  title,
  desc,
  grouping,
  expressions,
  labelExpression,
  tags,
  commonHeader
}) {
  let retVal = "";
  let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
  let session = null;
  let measure = null;

  try {
    const appId = qsApp.length > 0 ? qsApp : commonHeader.appId;
    const qDef = qMasterMeasure(
      id,
      label,
      def,
      title,
      desc,
      grouping,
      expressions,
      labelExpression,
      tags
    );
    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    let qId = await helper.findMeasureByTitle(app, title);

    if (!qId) {
      logger.info("Measure: " + id + " does not exist.  Creating", {
        service: `NodeSseService::DoCreateMeasure()`,
        app: appId
      });
      const newMeasue = await app.createMeasure(qDef);
      logger.info("Measure: " + id + " Created", {
        service: `NodeSseService::DoCreateMeasure()`,
        app: appId
      });
      const layout = await newMeasue.getLayout();
      retVal = `New Measure: created with ID ${layout.qInfo.qId}`;
    } else {
      measure = await app.getMeasure(qId);
      let prop = await measure.getProperties();
      logger.info("Measure: " + id + " exists.  Checking for changes.", {
        service: `NodeSseService::DoCreateMeasure()`,
        app: appId
      });
      if (JSON.stringify(prop) == JSON.stringify(qDef)) {
        logger.info("Measure: " + id + " no changes found.", {
          service: `NodeSseService::DoCreateMeasure()`,
          app: appId
        });
        retVal = `Measure: found with same properties for ID ${id}`;
      } else {
        logger.info("Measure: " + id + " found.  Setting new properties.", {
          service: `NodeSseService::DoCreateMeasure()`,
          app: appId
        });
        const mProp = await mProp.setProperties(qDef);
        logger.info("Measure: found and new properties set.", {
          service: `NodeSseService::DoCreateMeasure()`,
          app: appId
        });
        retVal = "Measure replaced with new properties";
      }
    }

    await helper.persistApp(app, isDesktop);
    retVal += await helper.validateExpression(app, def);
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    logger.error(`${JSON.stringify(err)}`, {
      service: `NodeSseService::DoCreateMeasure()`
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
