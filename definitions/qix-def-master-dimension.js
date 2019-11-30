const { qBuildArray } = require("../utils/qBuildArray");

const qMasterDimension = (id, label, def, title, desc, grouping='N', tags) => {

   const qDef = {
    qInfo: {
        qId: id,
        qType: "dimension"
    },
    qDim: {
        qGrouping: grouping,
        qFieldDefs:  qBuildArray(def),
        qFieldLabels:  qBuildArray(label),
        title: title
    },
    qMetaDef: {
        title: title,
        description: desc == "" ? label : desc,
        tags: qBuildArray(tags)
    }
};

  return qDef;
};

module.exports = qMasterDimension;
