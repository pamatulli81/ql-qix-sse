const qVariable = (id, title, def, name, desc, comment, inBookmark, tags) => {
  const qDef = {
    "qInfo": {
      "qId": "VB01",
      "qType": "Variable"
    },
    "qName": "Variable01",
    "qComment": "My first variable",
    "qDefinition": "=Count(Holes)"
  }
  return qDef;
};

module.exports = qVariable;
