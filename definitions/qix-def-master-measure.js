const { qBuildArray } = require("../utils/qBuildArray");

const qMasterMeasure = (id, label, def, title, desc, grouping='N', expressions, labelExpression, tags ) => {

  const qDef = {
        qInfo: {
            qId: id,
            qType: "measure"
        },
        qMeasure: {
            qLabel: label,
            qDef: def,
            qGrouping: grouping,
            qExpressions: qBuildArray(expressions),
            qActiveExpression: 0,
            qLabelExpression: labelExpression
        },
        qMetaDef: {
            title: title,
            description: desc == "" ? label : desc,
            qSize: -1,
            tags: qBuildArray(tags)
        }
    };

  return qDef;
};

module.exports = qMasterMeasure;
