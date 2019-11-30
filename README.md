# ql-qix-sse
## Status
**Experimental**

Forked the project of the great Rob Wunderlich https://github.com/RobWunderlich/qcb-qlik-sse, with the idea to build a QIX interface using SSE. The current state of the art includes all the necessary Master Item management functions, some generic commands to retrieve some basic info from the QIX engine and some more stuff. As I have already build a complete Node.js API on top of the QIX Engine I could re-use some of the functions. The repo delivers a sample application where you can find the Qlik Script with the calls to the SSE. The prupose of the this qliklab project is to give something to the Qlik Community to help and speed up the development of the Qlik Sense apps. Still Experimental release, very thankful for any feedback and contribution!

### /functions
  
Contains functions to be added to the server. Each function is written as an individual .js files. Subdirectories are allowed. 

The functions must export the following symbols:

* `functionDefinition`  the function that will be used as the first parameter to [server.addFunction(fn, config)](https://github.com/miralemd/qlik-sse/blob/master/docs/api.md).

* `functionConfig` an object that that will be used as the second parameter to [server.addFunction(fn, config)](https://github.com/miralemd/qlik-sse/blob/master/docs/api.md).

Functions should catch any potential errors.  An uncaught error may terminate the entire server task.

Read more about writing functions in the [qlik-sse doc](https://github.com/miralemd/qlik-sse/blob/master/README.md)

### Running the Server
Configure the SSE in your Qlik installation by following [these instructions](https://github.com/qlik-oss/server-side-extension/blob/master/docs/configuration.md)

`node server.js`

startup options:

* `--allowScript=true`  enable inline script execution.
* `--port n`  specify server port. Default is 50051.

## Contributions
Contributions are welcome