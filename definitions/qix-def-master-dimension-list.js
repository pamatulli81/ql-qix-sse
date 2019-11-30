const qDimensionList = () => {
  const qDef = {
    qInfo: {
      qType: "DimensionList",
      qId: ""
    },
    qDimensionListDef: {
      qType: "dimension",
      qData: {
        title: "/qMetaDef/title",
        tags: "/qMetaDef/tags",
        grouping: "/qDim/qGrouping",
        info: "/qDimInfos"
      }
    }
  };

  return qDef;
};

module.exports = qDimensionList;
