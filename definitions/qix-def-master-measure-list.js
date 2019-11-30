const qMeasureList = () => {

    const qDef = {
        qInfo: {
          qType: "MeasureList",
          qId: ""
        },
        qMeasureListDef: {
          qType: "measure",
          qData: {
            title: "/qMetaDef/title",
            tags: "/qMetaDef/tags"
          }
        }
      };
  
    return qDef;
  };
  
  module.exports = qMeasureList;
  