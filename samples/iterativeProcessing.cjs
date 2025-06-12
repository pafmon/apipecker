const { run } = require("../index.js");

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
         

function myResultsHandler(results){
    let stats = results.lotStats;

    console.log(`Number of stats=${stats.length}`);
    
    let lotSize = 5;
    let lotCount = Math.ceil(stats.length/lotSize);
    let lotIndex = 1;
    let lot = [];

    for(let i=0; i<stats.length; i++){
        let stat = stats[i];
        //console.log(`    stat[${i}]: ${JSON.stringify(stat,null,2)}`);

        lot.push(stat);
        
        if((i+1)%lotSize == 0){
            console.log(`    New lot[${lotIndex}/${lotCount}]: ${JSON.stringify(lot,null,2)}`);
            lotIndex++;
            lot = [];
        }
    };     

}

run({
    concurrentUsers : 2,
    iterations : 10,
    delay : 500,
    verbose : true,
    consoleLogging : true, //Comment this line to avoid logs
    harvestResponse : true, //Comment this line to avoid harvesting response data
    timeout : 600, // Comment this line to avoid a timeout specified in miliseconds
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    resultsHandler : myResultsHandler
});

