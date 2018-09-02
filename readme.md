# Super Stock

## Introduction

This is the front-end for the superstock project. This app allows user to monitor strongest stocks as well as add their own filters to find best-value stocks.

There are 2 pages:
- The main page: to grasp a summary view of the market
- The full page: to filter by stocks by choice

User can log-in using Facebook account and save their filters preference in real-time

## Technical stack

Project based on AngularJS, used the ui-grid (angular module) for layout stock board

## Prerequisite

```npm install```

```bower install```

## Build

Mở thư mục gốc của source code và execute command sau:

```grunt build```

Sau khi build thành công grunt sẽ tạo ra thư mục ```dist```

Sử dụng webserver (like Apache, IIS, nginx,..) để serve thư mục (```dist```)

Để deploy lên [Github page](https://pages.github.com/), push tất cả các files trong ```dist``` lên branch ```gh-pages```

Page sẽ đc chạy trên https://superstock.github.io/stockboard

This is the new view (2016-08-20):
- summary_data
- summary_headers

The data is stored in Firebase with these endpoints:
- superstock: main data
- superstock_fields: names of the corresponding fields
- superstock_titles: titles of of the corresponding fields
- superstock_format: format of each field - in [type]:[from]:[value]:[to]

Default URL to access: [http://localhost:9000/](http://localhost:9000/)

Market summary:
- https://superstock.firebaseio.com/market_summary.json
  {
    'data': 'actual text',
    'color': '#ff9900',
  }

Company profile:
In /profile/<symbol>, e.g.:
- https://superstock.firebaseio.com/profile/SSI.json

Stocks that have sell signals:
- https://superstock.firebaseio.com/sell_symbols.json

Data is stored in pipe delimiter format, e.g.: [field1]|[field2]|[field3]etc

## Run
```grunt serve```

## Detect errors and potential problems in code.
```grunt jshint```

## Deploy with firebase
Simply run
```
firebase deploy
```

If the project is clone the first time, firebase initialization is required:
```
firebase init
```
