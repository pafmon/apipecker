# APIPecker
*A simple API Performance tester*

Usage: `apipecker <concurrentUsers> <iterations> <delay in ms> <url> [true|false]`

Last parameter enables the VERBOSE mode if true (default=false)

##Install:
```terminal
npm install apipecker -g
```
##Usage examples:
```terminal
apipecker 10 20 100 http://knapsack-api.herokuapp.com/api/v1/stress/10000/10
apipecker 10 20 100 http://knapsack-api.herokuapp.com/api/v1/stress/10000/10 true

```
