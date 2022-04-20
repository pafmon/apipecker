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
It can be used as a module with different customization hooks.

```
const { run } = require("apipecker");

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
    console.log(JSON.stringify(results.lotStats,null,2));
    console.log(JSON.stringify(results.summary,null,2));
}

run({
    concurrentUsers : 2,
    iterations : 3,
    delay : 500,
    verbose : true,
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    resultsHandler : myResultsHandler
});
```