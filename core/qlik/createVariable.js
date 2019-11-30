const q = require("qlik-sse");
const settings = require("../../settings");
const logger = settings.LOGGER.getLogger("sse");
const sessionMgr = require("../../lib/qlik/qlikSession");
const qVariable = require("../../definitions/qix-def-variable");
const helper = require("../../lib/qlik/qlikHelper");
const qVariableListDef = require("../../definitions/qix-def-variable-list");

const functionConfig = {
  name: "CreateVariable",
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
      name: "title",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "def",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "name",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "desc",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "comment",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "inBookmark",
      dataType: q.sse.DataType.STRING
    },
    {
      name: "tags",
      dataType: q.sse.DataType.STRING
    }
  ]
};

/**
 * Create a Variable in the calling app.
 * @function CreateVariable
 * @param {string} qsApp
 * @param {string} id
 * @param {string} title
 * @param {string} def
 * @param {string} name
 * @param {string} desc
 * @param {string} comment
 * @param {string} inBookmark
 * @param {string} tags
 * @returns {string} Status - 'Created' or 'Updated' plus any validation error messages.
 */
const functionDefinition = async function CreateVariable(request) {
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
        let title = row.duals[2].strData;
        let def = row.duals[3].strData;
        let name = row.duals[4].strData;
        let desc = row.duals[5].strData;
        let comment = row.duals[6].strData;
        let inBookmark = row.duals[7].strData;
        let tags = row.duals[8].strData;

        result = await DoCreateVariable({
          qsApp: qsApp,
          id: id,
          title: title,
          def: def,
          name: name,
          desc: desc,
          comment: comment,
          inBookmark: inBookmark,
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
        service: `NodeSseService::CreateVariable()`
      });
    }
  });
};

const DoCreateVariable = async function DoCreateVariable({
  qsApp,
  id,
  title,
  def,
  name,
  desc,
  comment,
  inBookmark,
  tags,
  commonHeader
}) {
  let retVal = "";
  let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
  let session = null;
  let qVar = null;

  try {
    const appId = qsApp.length > 0 ? qsApp : commonHeader.appId;
    const qDef = qVariable(
      id,
      title,
      def,
      name,
      desc,
      comment,
      inBookmark,
      tags
    );

    session = sessionMgr.getSession(commonHeader);
    const global = await session.open();
    const app = await global.openDoc(appId);
    let qId = await helper.findVariableByName(app, name);

    if (!qId) {
      logger.info("Variable: " + id + " does not exist.  Creating", {
        service: `NodeSseService::DoCreateVariable()`,
        app: appId
      });
      const newVar = await app.createVariableEx(qDef);
      logger.info("Variable: " + id + " Created", {
        service: `NodeSseService::DoCreateVariable()`,
        app: appId
      });
      const layout = await newVar.getLayout();
      retVal = `New Variable created with ID ${layout.qInfo.qId}`;
    } else {
      qVar = await app.getVariableById(qId);
      let prop = await qVar.getProperties();
      logger.info("Variable: " + id + " exists.  Checking for changes.", {
        service: `NodeSseService::DoCreateVariable()`,
        app: appId
      });
      if (JSON.stringify(prop) == JSON.stringify(qDef)) {
        logger.info("Variable: " + id + " no changes found.", {
          service: `NodeSseService::DoCreateVariable()`,
          app: appId
        });
        retVal = `Variable found with same properties for ID ${id}`;
      } else {
        logger.info("Variable: " + id + " found.  Setting new properties.", {
          service: `NodeSseService::DoCreateVariable()`,
          app: appId
        });
        await qVar.setProperties(qDef);
        logger.info("Variable found and new properties set.", {
          service: `NodeSseService::DoCreateVariable()`,
          app: appId
        });
        retVal = "Update Variable with new properties set";
      }
    }

    await helper.persistApp(app, isDesktop);
    retVal += await helper.validateExpression(app, def);
    session = await sessionMgr.closeSession(session);
  } catch (err) {
    logger.error(`${JSON.stringify(err)}`, {
      service: `NodeSseService::DoCreateVariable()`
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
