const { run } = require("../index.js");

function myUrlBuilder(userId){
    var url = "https://api-echo.herokuapp.com/echo/myapi/request/test-"+userId+"withpartams=true";
    return url;
}

function myRequestBuilder(userId){
    var data = {
        user : userId
    };

    var jsonData = JSON.stringify(data);

    var requestConfig = {
        options : {
            method: "POST",
            headers: {
                'Api-Token': 'TOKEN-'+userId,
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            }
        },
        data : jsonData
    }

    return requestConfig;
}

function myResultsHandler(results){
    // To show the detailed data, uncomment the following:
    // console.log(JSON.stringify(results.lotStats,null,2));
    
    // To show a global summary, uncomment the following:
    // console.log(JSON.stringify(results.summary,null,2));
}

run({
    concurrentUsers : 2,
    iterations : 3,
    delay : 500,
    verbose : true,
    consoleLogging : true, //Comment this line to avoid logs
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    resultsHandler : myResultsHandler
});

