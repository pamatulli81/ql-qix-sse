const qVariableList = () => {
  const qDef = {
    qInfo: {
      qType: "VariableList",
      qId: ""
    },
    qVariableListDef: {
      qType: "variable",
      qData: {
        tags: "/tags"
      }
    }
  };

  return qDef;
};

module.exports = qVariableList;
