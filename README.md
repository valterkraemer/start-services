# Start services

MongoDB replica set setup instructions taken from this [gist](https://gist.github.com/davisford/bb37079900888c44d2bbcb2c52a5d6e8).

## Installation instructions

1. Install components

```
brew install mongodb
brew install postgresql
brew install elasticsearch
brew install rabbitmq
brew install redis
```

2. Init PostgreSQL

```
cd start-services
initdb db/postgresql
```

3. Run index.js

```
node .
```
