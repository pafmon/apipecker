# APIPecker
*A simple API Performance tester* inspired by [*Woody Woodpecker*](https://en.wikipedia.org/wiki/Woody_Woodpecker)

Usage: `apipecker <concurrentUsers> <iterations> <delay in ms> <url> [-v]`

Last parameter enables the verbose mode to show metrics for each request.

## Install:
```terminal
npm install apipecker -g
```
or directly with npx:
```terminal
npx apipecker <concurrentUsers> <iterations> <delay in ms> <url> [-v]
```

## Usage examples:
```terminal
apipecker 2 3 500 http://knapsack-api.herokuapp.com/api/v1/stress/10000/10
```
Output: 
```terminal
Stress configuration:
  - Concurrent users: 2
  - Iterations: 3
  - Delay: 500
  - URL: <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>
Stressing:
  -> iteration1 completed (1/3 of 3)
  -> iteration2 completed (2/3 of 3)
  -> iteration3 completed (3/3 of 3)

Result:
{
  "count": 6,
  "min": 255.549,
  "max": 799.441,
  "mean": 462.869,
  "std": 202.144
}
```

Verbose mode example: 
```terminal
npx apipecker 2 3 500 http://knapsack-api.herokuapp.com/api/v1/stress/10000/10 -v
```
Output: 

```terminal
Stress configuration:
  - Concurrent users: 2
  - Iterations: 3
  - Delay: 500
  - URL: <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>
Stressing:
 - iteration1 started.
  - user1: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
  - user2: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
    -> user1: Status Code 200
    -> user1: Response recieved in 237.627ms
 - iteration2 started.
  - user1: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
  - user2: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
    -> user2: Status Code 200
    -> user2: Response recieved in 833.701ms
  -> iteration1 completed (1/3 of 3)
    -> user1: Status Code 200
    -> user1: Response recieved in 395.205ms
    -> user2: Status Code 200
    -> user2: Response recieved in 445.836ms
  -> iteration2 completed (2/3 of 3)
 - iteration3 started.
  - user1: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
  - user2: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
    -> user1: Status Code 200
    -> user1: Response recieved in 213.436ms
    -> user2: Status Code 200
    -> user2: Response recieved in 236.131ms
  -> iteration3 completed (3/3 of 3)

Result:
{
  "count": 6,
  "min": 213.436,
  "max": 833.701,
  "mean": 393.656,
  "std": 235.798
}
```

## Module usage 
It can be used as a module with different [customization hooks](#Customization-hooks) and more control over the execution flow with extra parameters (``harvestResponse``, ``timeout``, etc). See [samples folder](/samples/) for different examples of apipecker usage as a module.

```js
const { run } = require("apipecker");
// import { run } from "apipecker";  // in ES6 modules


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

```

### Customization hooks
The hooks are optional and can be used to customize the execution of apipecker in your project,
and have more control over the execution flow and handle the results.

 - `urlBuilder`: function to build the URL to be requested
 - `requestBuilder`: function to build the request options
 - `responseHandler`: function to handle the response data
 - `resultsHandler`: function to handle the results stats
 
### Response harvesting
By default, apipecker will not harvest the response data, but you can enable it by setting the `harvestResponse` flag to `true`, e.g.:
```js
run({
    concurrentUsers : 2,
    iterations : 3,
    delay : 500,
    harvestResponse : true
});
```

## Tests

To run the tests (development mode), execute the following command:
```terminal
npm test
``` 

