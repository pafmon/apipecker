const { response } = require("express");
const { run } = require("../index.js");

const _RESET = '\x1b[0m';
const _RED = '\x1b[31m';
const _MAGENTA = '\x1b[35m';

function myUrlBuilder(userId,iteration){
    var url = "https://api.nytimes.com/svc/books/v3/lists/2022-02-02/audio-nonfiction.json?api-key="+${process.env.NYT_API_KEY};
    return url;
}

function myResponseHandler(responseInfo){
    let user = responseInfo.user;
    let iteration = responseInfo.iteration;
    if(responseInfo.responseData.status == "OK")
      console.log(`    myResponseHandler: ${user},it${iteration}, Results: ${_MAGENTA}${JSON.stringify(responseInfo.responseData.num_results)}${_RESET}`);
    else if(responseInfo.responseData.fault.detail.errorcode == "policies.ratelimit.QuotaViolation")
      console.log(`    myResponseHandler: ${user},it${iteration},  ${_RED}RATE LIMIT EXCEEDED${_RESET}`);
}
    

run({
    concurrentUsers : 1,
    iterations : 10,
    delay : 1000,
    verbose : true,
    consoleLogging : true, //Comment this line to avoid logs
    harvestResponse : true, //Comment this line to avoid harvesting response data
    timeout : 10000, // Comment this line to avoid a timeout specified in miliseconds
    urlBuilder: myUrlBuilder,
    responseHandler : myResponseHandler
});

