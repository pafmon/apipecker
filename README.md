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
    -> user1: Response recieved in 438.757ms
 - iteration2 started.
  - user1: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
  - user2: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
    -> user2: Response recieved in 786.775ms
  -> iteration1 completed (1/3 of 3)
    -> user2: Response recieved in 379.304ms
    -> user1: Response recieved in 494.648ms
  -> iteration2 completed (2/3 of 3)
 - iteration3 started.
  - user1: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
  - user2: Request to <http://knapsack-api.herokuapp.com/api/v1/stress/10000/10>...
    -> user2: Response recieved in 488.973ms
    -> user1: Response recieved in 610.516ms
  -> iteration3 completed (3/3 of 3)

Result:
{
  "count": 6,
  "min": 379.304,
  "max": 786.775,
  "mean": 533.162,
  "std": 145.824
}

```
