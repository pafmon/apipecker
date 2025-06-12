import { run } from "../index.js";

function myUrlBuilder(userId,iteration){
    var url = "https://api-echo.herokuapp.com/echo/myapi/request/test-"+userId+"-"+iteration;
    return url;
}

function myRequestBuilder(userId,iteration){
    var data = {
        user : userId
    };

    var jsonData = JSON.stringify(data);

    var requestConfig = {
        options : {
            method: "POST",
            headers: {
                'Api-Token': 'TOKEN-'+userId+'-'+iteration,
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            }
        },
        data : jsonData
    }

    return requestConfig;
}

function myResponseHandler(responseInfo){
    let user = responseInfo.user;
    let iteration = responseInfo.iteration;
    let timestamp = responseInfo.responseData.timestamp;

    console.log(`    myResponseHandler: ${user},it${iteration},${timestamp}`);
}
         

function myResultsHandler(results){
    // To show the detailed data
    console.log(JSON.stringify(results.lotStats,null,2));
    
    // To show a global summary
    console.log(JSON.stringify(results.summary,null,2));
}

run({
    concurrentUsers : 2,
    iterations : 3,
    delay : 500,
    verbose : true,
    consoleLogging : true, //Comment this line to avoid logs
    harvestResponse : true, //Comment this line to avoid harvesting response data
    timeout : 600, // Comment this line to avoid a timeout specified in miliseconds
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    responseHandler : myResponseHandler,
    resultsHandler : myResultsHandler
});

