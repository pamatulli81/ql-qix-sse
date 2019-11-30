const q = require('qlik-sse');
const settings = require('./settings');
const logger = settings.LOGGER.getLogger('sse');
const argv = require('yargs')
  .options({
    allowScript: {default: false},
    port: {default: 50051}
  }).argv

  let allowScript = null
  
  if (argv.allowScript) {
    allowScript = {
      scriptAggr: true,
      scriptAggrStr: true,
      scriptAggrEx: true,
      scriptAggrExStr: true,
      scriptEval: true,
      scriptEvalStr: true,
      scriptEvalEx: true,
      scriptEvalExStr: true,
      } 
  }
// create an instance of the server
const s = q.server({
  identifier: 'QlQixSSE',
  version: '0.1.0',
  allowScript,
});

var libs = require('require-all')({
  dirname : __dirname + '/core',
  recursive : true
})
Object.values(libs).forEach((mod) => {
  registerFunction(mod)
})

// start the server
s.start({
  port: argv.port
});

// Functions should catch thier own errors.  This process.on() is a last
// ditch effort to keep an uncaught function error from crashing the process.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception => ' + err.message + ': ' + err.stack, {
    service: `NodeSseService::InitSse()`
  });
});

// Register this function if it contains function metadata
function registerFunction(mod) {
  if(mod.functionDefinition && mod.functionConfig) {
    logger.info('Registering function: ' + mod.functionConfig.name || mod.functionDefinition.name, {
      service: `NodeSseService::InitSse()`
    });
    s.addFunction(mod.functionDefinition, mod.functionConfig)
  } 
  else {  // May be a subdirectory, recourse it looking for functions.
    Object.values(mod).forEach((submod) => {
      registerFunction(submod)
    })
  }
}

  

