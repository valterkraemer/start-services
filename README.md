# Setup MongoDB replica set

*Setup inspiration taken from this [gist](https://gist.github.com/davisford/bb37079900888c44d2bbcb2c52a5d6e8).*

## Installation instructions

1. Install components

```
brew install mongodb
brew install postgresql
brew install elasticsearch
brew install rabbitmq
brew install redis
```

2. Init Postgresql

```
initdb db/postgresql
```

2. `node .`

3. Initiate MongoDB replica set

```
mongo
rs.initiate({_id: "myreplica", members: [{_id: 0, host: "localhost:27017"}] })
```
