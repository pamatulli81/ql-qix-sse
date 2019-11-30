const qMeasureListDef = require("../../definitions/qix-def-master-measure-list");
const qDimensionListDef = require("../../definitions/qix-def-master-dimension-list");
const qVariableListDef = require("../../definitions/qix-def-variable-list");

async function findMeasureByTitle(doc, title) {
  title = title.toLowerCase(); // Case insensitive search
  let list = await getList(doc, qMeasureListDef);
  let obj = undefined;
  if (list) {
    obj = list.find(element => {
      return get(["qData", "title"], element).toLowerCase() == title;
    });
  }
  if (obj != undefined) {
    return get(["qInfo", "qId"], obj);
  } else {
    return undefined;
  }
}

async function findDimensionByTitle(doc, title) {
  title = title.toLowerCase(); // Case insensitive search
  let list = await getList(doc, qDimensionListDef);
  let obj = undefined;
  if (list) {
    obj = list.find(element => {
      return get(["qData", "title"], element).toLowerCase() == title;
    });
  }
  if (obj != undefined) {
    return get(["qInfo", "qId"], obj);
  } else {
    return undefined;
  }
}

async function findVariableByName(doc, name) {
  let list = await getList(doc, qVariableListDef);
  let obj = undefined;
  if (list) {
    obj = list.find(element => {
      if (element.qName == name) return element;
    });
  }
  return null;
}

async function getMeasures(doc) {
  let list = await getList(doc, qMeasureListDef);
  let measureDefs = [];
  for (const elem of list) {
    let qId = get(["qInfo", "qId"], elem);
    if (qId) {
      let measure = await doc.getMeasure(qId);
      let prop = await measure.getProperties();
      measureDefs.push(prop);
    }
  }
  return measureDefs;
}

async function getDimensions(doc) {
  let list = await getList(doc, qDimensionListDef);
  let dimDefs = [];
  for (const elem of list) {
    let qId = get(["qInfo", "qId"], elem);
    if (qId) {
      let dim = await doc.getDimension(qId);
      let prop = await dim.getProperties();
      dimDefs.push(prop);
    }
  }
  return dimDefs;
}

async function getList(doc, fncList) {
  try {
    const def = fncList();
    obj = await doc.createSessionObject(def);
    list = await obj.getLayout();
    return get([fncList.name, "qItems"], list);
  } catch (e) {
    console.log(e);
  }
}

async function persistApp(doc, isDesktop) {
  const appProp = await doc.getAppProperties();
  if (appProp.published) {
    await doc.publish();
    await doc.approve();
  }
  if (isDesktop) {
    await doc.doSave();
  }
}

async function validateExpression(doc, def) {
  let msg = "";

  let checkValue = await doc.checkExpression(def);
  if (checkValue.qErrorMsg) {
    msg += "; " + checkValue.qErrorMsg;
  }
  if (checkValue.qBadFieldNames.length > 0) {
    msg +=
      "; Bad field names: " +
      checkValue.qBadFieldNames
        .map(elem => def.substr(elem.qFrom, elem.qCount))
        .join(", ");
  }
  return msg;
}

/*
 * Safely get a nested object.
 *
 * @see https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
 * @param {string[]} p  - An array of the names of the desired objects.
 * @param {object} o - The object to fetch items from.
 * @returns {object} - The resulting object or null.
 */
function get(p, o) {
  return p.reduce(function(xs, x) {
    return xs && xs[x] ? xs[x] : null;
  }, o);
}

module.exports = {
  findMeasureByTitle,
  findDimensionByTitle,
  findVariableByName,
  getMeasures,
  getDimensions,
  validateExpression,
  persistApp
};
