'use strict';

/**
 * @ngdoc function
 * @name superstockApp.controller:FullStockCtrl
 * @description
 * # FullStockCtrl
 * Controller of the superstockApp
 */
angular.module('superstockApp')
    .controller('FullStockCtrl', ['$rootScope', '$scope', 'auth', '$firebaseArray',
        '$firebaseObject', 'Ref', 'draw', 'uiGridConstants', '$sce', 'utils', 'currentAuth', '$window', '$compile', '$filter', '$timeout',
        'link',
        function ($rootScope, $scope, auth, $firebaseArray,
            $firebaseObject, Ref, draw, uiGridConstants, $sce, utils, currentAuth, $window, $compile, $filter, $timeout,
            link
            ) {
            $rootScope.link = link;
            $window.ga('send', 'pageview', "Đầy đủ");
            var userFilters = null;
            var user = null;
            var userAuthData = null;
            var filterData = null;
            var filterChangeFlag = 0;
            var filterMode = false;
            $rootScope.filterList = {};

            // firebase integration for personalStocks
            var portfolio = $firebaseObject(Ref.child('users/' + currentAuth.uid + '/portfolio'));
            portfolio.$loaded(function(data) {
                $scope.personalStocks = data.$value;
            });

            $rootScope.filterPersonalStocks = function() {
                var data = [];
                var stockList;
                if(!$scope.personalStocks) {
                    $scope.personalStocks = "MWG,PNJ,FPT";  // sample list
                }
                if($scope.fullData) {
                    stockList = $scope.personalStocks.split(',');
                    stockList = stockList.map(function(x) {return x.toUpperCase().trim()});
                    for(var i = 0; i < $scope.fullData.length; i++) {
                        var stock = $scope.fullData[i];
                        if(stockList.indexOf(stock['symbol']) !== -1) {
                            data.push(stock);
                        }
                    }
                    if ($scope.gridOptions.api && $scope.gridOptions.api != null) {
                        $scope.gridOptions.api.setRowData(data);
                    }
                    portfolio.$value = $scope.personalStocks;
                    portfolio.$save();
                }
                else{
                    console.error('Data is not loaded fully yet, please try again');
                }
            }

            //check user login
            if (currentAuth) {
                var filter = $firebaseObject(Ref.child('users/' + currentAuth.uid + '/filter'));
                $rootScope.filterRef = filter;
                filter.$loaded(function (data) {
                    filterData = {};
                    if (data.individualFilter) {
                        for (var i in data.individualFilter) {
                            if (i.charAt(0) != '$' && i != 'forEach') {
                                filterData[i] = data[i];
                            }
                        }
                    }
                });

                /**
                User personal portfolio
                */
                var portfolio = $firebaseObject(Ref.child('users/' + currentAuth.uid + '/portfolio'));
                portfolio.$loaded(
                    function(data) {
                        console.log('User portfolio loaded', data);
                    },
                    function(error) {
                        console.error('Error encounter while loading user portfolio', error);
                    }
                );
            }

            //setup ag-grid
            $scope.gridOptions = {
                enableSorting: true,
                enableFilter: true,
                suppressColumnVirtualisation: true,
                suppressContextMenu: true,
                rowData: [],
                data: [],
                enableColResize: true,
                headerHeight: 50,
                overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Đang xử lý dữ liệu...</span>',
                sortingOrder: ['desc', 'asc'],
                //filter changed event
                onAfterFilterChanged: function () {
                    // user = Ref.child('users/' + currentAuth.uid);
                    // var filter = filterConvert($rootScope.filterList, null);
                    // //save filter
                    // user.child('filter').set(filter, function (err) {
                    //     if (err) {
                    //         console.log(err);
                    //     } else {
                    //         console.log('Saved filter');
                    //     }
                    // });
                },
                onCellClicked: function (params) { }
            };

            /**
             * Filter change
             */
            var notLoading = false;
            function filterChange(loading, filters) {
                if (!$rootScope.filterOn)
                    return;
                if (loading != undefined)
                    notLoading = loading;
                // if ($rootScope.filterOn) {
                if (filterMode) {
                    filterIndividualChange();
                } else {
                    if ($rootScope.filterData && $rootScope.filterData != null)
                        filterPublicChange($rootScope.filterData);
                    else
                        $rootScope.resetFilter();
                }
                // }
            }

            /**
             * Filter change for public mode
             */
            function filterPublicChange(filter) {
                if (filter)
                    filter = filter[0];

                // $window.ga('send', 'event', "Filter", filter.filterName);

                if (!notLoading) {
                    if ($scope.gridOptions.api && $scope.gridOptions.api != null)
                        $scope.gridOptions.api.showLoadingOverlay();
                    notLoading = true;
                }
                $timeout(function () {
                    var filterModel = {};
                    for (var i in filter) {
                        if (filter[i].condition && filter[i].term) {
                            filterModel[i] = {
                                type: filter[i].condition,
                                filter: filter[i].term
                            };
                        }
                    }
                    if (!$scope.gridOptions.api)
                        return;
                    $scope.gridOptions.api.setFilterModel(filterModel);
                    $scope.gridOptions.api.onFilterChanged();
                }, 500);
            }

            /**
             * Filter change for individual
             * Filter change event into angular $watch ($rootScope.filterList[i]...)
             */
            function filterIndividualChange(newVal, oldVal) {
                filterChangeFlag++;
                // if (!filterMode) return;
                if (filterChangeFlag <= Object.keys($rootScope.filterList).length) return;
                if (!notLoading) {
                    if ($scope.gridOptions.api && $scope.gridOptions.api != null)
                        $scope.gridOptions.api.showLoadingOverlay();
                    notLoading = true;
                }
                $timeout(function () {
                    if (!$scope.gridOptions.api || $scope.gridOptions.api == null)
                        return;
                    $scope.gridOptions.api.setFilterModel(null);
                    for (var key in $rootScope.filterList) {
                        var filterItem = $rootScope.filterList[key];
                        var filterApi = $scope.gridOptions.api.getFilterApi(key);
                        if (filterItem.filter) {
                            var term = filterItem.filter.term;
                            if (term && term.length > 0) {
                                var model = [];
                                for (var i in term) {
                                    model.push(term[i].value);
                                }
                                if (model.length > 0) {
                                    // if (filterApi.selectEverything)
                                    filterApi.setModel(model);
                                } else {
                                    if (filterApi.selectEverything)
                                        filterApi.selectEverything();
                                }
                            } else {
                                if (filterApi.selectEverything)
                                    filterApi.selectEverything();
                            }

                        } else if (filterItem.filters) {
                            if (filterItem.filters[0]) {
                                var filterGreater = $scope.gridOptions.api.getFilterApi(key);
                                if (filterGreater.GREATER_THAN || filterItem.filters[0].condition) {
                                    if (filterItem.filters[0].term || filterItem.filters[0].term == 0) {
                                        var filterType = filterGreater.GREATER_THAN ? filterGreater.GREATER_THAN : filterItem.filters[0].condition
                                        filterGreater.setType(filterType);
                                        filterGreater.setFilter(filterItem.filters[0].term);
                                    }
                                }
                            }
                        }
                    }
                    $scope.gridOptions.api.onFilterChanged();
                }, 600)
                $rootScope.saveFilterSetting();
            }

            /**
             * Filter mode: public or individual
             * false: public, true: individual
             */
            $rootScope.filterModes = function (mode) {
                filterMode = mode;
                filterChange(undefined);
            }

            //convert bigNum term = term/bigNum
            $rootScope.parseBigNum = function (term) {
                var newTerm = parseFloat(term) / bigNum;
                return newTerm;
            }

            /**
             * Reset filter when disanled filter control
             */

            $rootScope.resetFilter = function () {
                if ($scope.gridOptions.api && $scope.gridOptions.api != null)
                    $scope.gridOptions.api.showLoadingOverlay();
                $timeout(function () {
                    if (!$scope.gridOptions.api)
                        return;
                    $scope.gridOptions.api.setFilterModel(null);
                    $scope.gridOptions.api.onFilterChanged();
                }, 600)
            }

            //search base on 'symbol'
            $rootScope.search = function (searchTerm) {
                var filterApi = $scope.gridOptions.api.getFilterApi('symbol');
                filterApi.setType(filterApi.CONTAINS || 'contains');
                filterApi.setFilter(searchTerm);
                $scope.gridOptions.api.onFilterChanged();
            }

            /**
             * Export data sheet
             */
            $scope.rowAfterFilter = [];
            $rootScope.exportDatasheet = function ($event) {
                $event.preventDefault();
                // Show loading
                $('#exportProccessing').modal('show');

                $timeout(function () {
                    var data = {};
                    if ($scope.rowAfterFilter && $scope.rowAfterFilter.length > 0) {
                        for (var i in $scope.rowAfterFilter) {
                            var node = $scope.rowAfterFilter[i];
                            var value = node.data;
                            data[node.childIndex] = value;
                            if (data[node.childIndex]) {
                                data[node.childIndex].basicCustom = 'http://ivt.ssi.com.vn/CorporateProfile.aspx?Ticket=' + data[node.childIndex]['symbol'];
                                data[node.childIndex].chartCustom = 'https://banggia.vndirect.com.vn/chart/?symbol=' + data[node.childIndex]['symbol'];
                            }
                        }
                    } else {
                        if (!$scope.gridOptions.api)
                            return;
                        $scope.gridOptions.api.forEachNode(function (node) {
                            var value = node.data;
                            data[node.childIndex] = value;
                            if (data[node.childIndex]) {
                                data[node.childIndex].basicCustom = 'http://ivt.ssi.com.vn/CorporateProfile.aspx?Ticket=' + data[node.childIndex]['symbol'];
                                data[node.childIndex].chartCustom = 'https://banggia.vndirect.com.vn/chart/?symbol=' + data[node.childIndex]['symbol'];
                            }
                        });
                    }


                    // Config to map data of field with template cell
                    // data: {'key': 'value'}
                    // config: {'key': {cell: 'XY', format: format}}
                    var fieldsArr = fields.data.split('|');
                    var formatArr = format.data.split('|');
                    var config = {};
                    var characters = ['A', 'B', 'C', 'D', 'E', 'F',
                        'G', 'H', 'I', 'J', 'K', 'L',
                        'M', 'N', 'O', 'P', 'Q', 'R',
                        'S', 'T', 'U', 'V', 'W', 'X',
                        'Y', 'Z',
                        'AA', 'AB', 'AC', 'AD', 'AE', 'AF',
                        'AG', 'AH', 'AI', 'AJ', 'AK', 'AL',
                        'AM', 'AN', 'AO', 'AP', 'AQ', 'AR',
                        'AS', 'AT', 'AU', 'AV', 'AW', 'AX',
                        'AY', 'AZ'
                    ];
                    for(var i in fieldsArr) {
                        config[fieldsArr[i]] = {
                            cell: characters[i],
                            format: fieldsArr[i]
                        }
                    }
                    // var forSymbol2 = 0;
                    // var count = 3;
                    // for (var i in fieldsArr) {
                    //     var key = i;
                    //     if (fieldsArr[i] != 'symbol') {
                    //         key = count.toString();
                    //     }
                    //     var field = {
                    //         cell: characters[key],
                    //         format: formatArr[i]
                    //     }
                    //     if (fieldsArr[i] == 'symbol2') {
                    //         config[fieldsArr[i] + forSymbol2] = field;
                    //         forSymbol2++;
                    //     } else {
                    //         config[fieldsArr[i]] = field;
                    //     }
                    //     if (fieldsArr[i] != 'symbol') {
                    //         count++;
                    //     }
                    // }

                    /**
                    config['basicCustom'] = {
                        cell: characters[1],
                        format: ''
                    };

                    config['chartCustom'] = {
                        cell: characters[2],
                        format: ''
                    };
                     */

                    // Call write funtction
                    utils.writeData2Worksheet(data, config).then(function (workBook) {
                        // Disabled loadding
                        utils.generateWorksheetFile(workBook, function () {
                            $('#exportProccessing').modal('hide');
                        });
                    });

                }, 500);

            };

            //Begin get data for ag-grid
            var bigNum = 1000000000;
            var titles = $firebaseObject(Ref.child('superstock_titles'));
            var fields = $firebaseObject(Ref.child('superstock_fields'));
            var format = $firebaseObject(Ref.child('superstock_format'));
            fields.$loaded(function () { //load superstock_fields
                titles.$loaded(function () { //load superstock_titles
                    format.$loaded(function () { //load
                        var titlesArr = titles.data.split('|');
                        var fieldsArr = fields.data.split('|');
                        var formatArr = format.data.split('|');
                        var formatList = {};
                        // console.log(formatArr);
                        // console.log(titlesArr);
                        // console.log(fieldsArr);
                        //set up column size
                        var sizeArr = [
                            90, 220, 130, 95, 100, 140, 140, 120,
                            90, 135, 145, 135, 75, 155, 90, 110,
                            125, 120, 120, 100, 80, 120, 90, 125,
                            125, 125, 155, 100, 150, 100, 100, 90,
                            110, 110, 130, 120, 120, 110, 100, 95,
                            130, 125, 80, 125
                        ];
                        var columnDefs = [];
                        var config = {
                            idLabel: 'Mã',
                            labelList: []
                        }
                        for (var i in titlesArr) {
                            formatList[fieldsArr[i]] = formatArr[i];
                            config.labelList.push({
                                fieldName: fieldsArr[i],
                                format: formatArr[i]
                            });
                            var formatType = null;
                            var cellClass = null;
                            var filter = 'text';

                            if (formatArr[i].indexOf('bigNum') > -1 || formatArr[i].indexOf('number') > -1) {
                                formatType = 'number';
                                filter = 'number';
                            } else if (formatArr[i].indexOf('percent') > -1) {
                                filter = 'number';
                            }
                            //setup column data
                            var def = {
                                field: fieldsArr[i], //field name
                                width: sizeArr[i], //column width
                                headerName: titlesArr[i], //column title
                                cellClass: cellClass, //css class of cell in column
                                enableTooltip: true,
                                tooltipField: fieldsArr[i], //show tolltip
                                cellRenderer: function (params) { //cell render data
                                    if (params.colDef.field == 'symbol2') {
                                        /*
                                        * For "symbol2" column
                                        * - signal1 & signal2 is empty, show empty value
                                        */
                                        if (!params.data.buySignal1)
                                            params.data.buySignal1 = '';
                                        else {
                                            // console.log('');
                                        }
                                        if (!params.data.buySignal2)
                                            params.data.buySignal2 = '';
                                        else {
                                            // console.log('');
                                        }
                                        if (params.data.buySignal1 == '' && params.data.buySignal2 == '')
                                            return '<div data-symbol="' + params.data.symbol + '" title=""></div>';
                                        else
                                            return '<div class="chart-icon" data-symbol="' + params.data.symbol + '" title="' + params.value + '" data-industry = "' + params.node.data.industry + '">' + params.value + '</div>';
                                    } else if (params.colDef.field == 'newPoint' || params.colDef.field == 'EPS'
                                        || params.colDef.field == 'fxEffect' || params.colDef.field == 'cashFlow') {
                                        /*
                                        * For "newPoint" and "EPS" column
                                        * - Show number with format which has 2 points
                                        */
                                        var value = '';
                                        if (isNaN(parseFloat(params.value))) {
                                            value = $filter('number')(0, 2);
                                        } else {
                                            value = $filter('number')(parseFloat(params.value), 2);
                                        }
                                        return '<div data-symbol="' + params.data.symbol + '" title="' + value + '">' + value + '</div>';
                                    } else if (params.colDef.field == 'buyDate') {
                                        // if (params.value && params.value != null && params.value != '')
                                        //     return $filter('date')(params.value, 'dd/MM/yyyy');
                                    } else {
                                        var value = '';
                                        if (formatList[params.colDef.field].indexOf('number') > -1 || formatList[params.colDef.field].indexOf('bigNum') > -1 || formatList[params.colDef.field].indexOf('percent') > -1) {
                                            value = $filter('number')(params.value);
                                            if (formatList[params.colDef.field].indexOf('percent') > -1) {
                                                if (isNaN(parseFloat(params.value))) {
                                                    value = '';
                                                } else {
                                                    value = $filter('number')(params.value, 2);
                                                    value = value + '%';
                                                }
                                            }

                                            if (params.colDef.field == 'maVol30') {
                                                value = $filter('number')(params.value, 0);
                                                if (value < 0)
                                                    value = '';
                                            } else if (params.colDef.field == 'pe') {
                                                value = $filter('number')(params.value, 2);
                                            }
                                            return '<div data-symbol="' + params.data.symbol + '" title="' + value + '">' + value + '</div>';
                                        }
                                    }

                                    if (params.colDef.field == 'pe') {
                                        var value = parseFloat(params.value);
                                        if (isNaN(value))
                                            value = 0;
                                        value = $filter('number')(value, 2);
                                        return '<div data-symbol="' + params.data.symbol + '" title="' + value + '">' + value + '</div>';
                                    }
                                    return '<div data-symbol="' + params.data.symbol + '" title="' + params.value + '">' + params.value + '</div>';
                                },
                                headerCellTemplate: function () {
                                    return (
                                        '<div class="ag-header-cell ag-header-cell-sortable ag-header-cell-sorted-none">' +
                                        '<table style="width:100%;height:100%">' +
                                        '<tr>' +
                                        '<td width="20px" style="vertical-align:top">' +
                                        '<span id="agMenu" class="ag-header-icon ag-header-cell-menu-button" style="opacity: 0; transition: opacity 0.2s, border 0.2s;">' +
                                        '<svg width="12" height="12"><rect y="0" width="12" height="2" class="ag-header-icon"></rect><rect y="5" width="12" height="2" class="ag-header-icon"></rect><rect y="10" width="12" height="2" class="ag-header-icon"></rect></svg>' +
                                        '</span>' +
                                        '</td>' +
                                        '<td>' +
                                        '<div id="agHeaderCellLabel" class="ag-header-cell-label">' +
                                        '<span id="agText" class="ag-header-cell-text"></span>' +
                                        '</div>' +
                                        '</td>' +
                                        '<td width="20px">' +
                                        '<div id="" class="ag-header-cell-label"><span id="agSortAsc" class="ag-header-icon ag-sort-ascending-icon ag-hidden"><svg width="10" height="10"><polygon points="0,10 5,0 10,10"></polygon></svg></span>    <span id="agSortDesc" class="ag-header-icon ag-sort-descending-icon ag-hidden"><svg width="10" height="10"><polygon points="0,0 5,10 10,0"></polygon></svg></span><span id="agNoSort" class="ag-header-icon ag-sort-none-icon ag-hidden"><svg width="10" height="10"><polygon points="0,4 5,0 10,4"></polygon><polygon points="0,6 5,10 10,6"></polygon></svg></span><span id="agFilter" class="ag-header-icon ag-filter-icon ag-hidden"><svg width="10" height="10"><polygon points="0,0 4,4 4,10 6,10 6,4 10,0" class="ag-header-icon"></polygon></svg></span></div>' +
                                        '</td>' +
                                        '</tr>' +
                                        '</table>' +
                                        '</div>'
                                    )
                                }
                            }

                            // Set sort by user setting
                            if ($rootScope.userSetting && $rootScope.userSetting.sort && $rootScope.userSetting.sort.full) {
                                if (def.field == $rootScope.userSetting.sort.full.colId) {
                                    def.sort = $rootScope.userSetting.sort.full.sort;
                                }
                            }

                            // Pinned column by user setting
                            if ($rootScope.userSetting && $rootScope.userSetting.pinColumns && $rootScope.userSetting.pinColumns.full) {
                                var check = $rootScope.userSetting.pinColumns.full.indexOf(def.field)
                                if (check > -1) {
                                    def.pinned = 'left';
                                }
                            }

                            // Visible column by user setting
                            if ($rootScope.userSetting && $rootScope.userSetting.hiddenColumns && $rootScope.userSetting.hiddenColumns.full) {
                                var check = $rootScope.userSetting.hiddenColumns.full.indexOf(def.field)
                                if (check > -1) {
                                    def.hide = true;
                                }
                            }

                            if (formatType) def.cellFilter = formatType; // add cell format (number or string)
                            if (filter) def.filter = filter; //add filter
                            if (formatArr[i] != '') { //add filter from A to B
                                var arr = formatArr[i].split(':');
                                if (arr.length === 4) {
                                    var filters = [{
                                        condition: 'greaterThan',
                                        term: (arr[0] == 'bigNum') ? parseFloat(arr[2]) * bigNum : parseFloat(arr[2]),
                                        min: (arr[0] == 'bigNum') ? parseFloat(arr[1]) * bigNum : parseFloat(arr[1]),
                                        bigNum: (arr[0] == 'bigNum') ? true : false
                                    }, {
                                        condition: 'lessThan',
                                        term: Infinity,
                                        max: (arr[0] == 'bigNum') ? parseFloat(arr[3]) * bigNum : parseFloat(arr[3])
                                    }];
                                    $rootScope.filterList[def.field] = {
                                        headerName: def.headerName,
                                        filters: filters
                                    }
                                }
                            }
                            if (fieldsArr[i] == 'Mã') { //cell template for 'symbol' column
                                def.filter = 'text';
                                def.pinned = 'left'; //pin column to left
                                def.cellRenderer = function (params) { // render 'symbol' cell template
                                    var id = params.value;
                                    return '<div><span>' + params.value + '</span>' +
                                        '<img class="chart-icon" data-symbol="' + id +
                                        '" data-industry = "' + params.node.data.industry + '" src="./images/icon-graph.png">' +
                                        '<img class="information-icon" data-symbol="' + id +
                                        '" data-industry = "' + params.node.data.industry + '" src="./images/icon-information.png" />' + '</div>';
                                }
                            }
                            //add filter for 'shorttermSignal' (filter selete option)
                            if (fieldsArr[i] == 'shorttermSignal') {
                                /*
                                def.filter = 'set';
                                var filter = {
                                    term: null,
                                    selectOptions: [{
                                        value: 'xBán',
                                        label: 'Bán'
                                    }, {
                                        value: 'xMua nếu cơ bản tốt',
                                        label: 'Mua'
                                    }]
                                }
                                $rootScope.filterList[def.field] = {
                                    headerName: def.headerName,
                                    filter: filter
                                }
                                */
                            }
                            //add filter for 'industry' (filter selete option)
                            else if (fieldsArr[i] == 'industry') {
                                def.filter = 'set';
                                var filter = {
                                    term: null,
                                    selectOptions: [{
                                        value: 'Bao bì & đóng gói',
                                        label: 'Bao bì & đóng gói'
                                    }, {
                                        value: 'Công trình xây dựng',
                                        label: 'Công trình xây dựng'
                                    }, {
                                        value: 'Dịch vụ đầu tư',
                                        label: 'Dịch vụ đầu tư'
                                    }, {
                                        value: 'Đầu tư và phát triển BDS',
                                        label: 'Đầu tư và phát triển BDS'
                                    }, {
                                        value: 'Đồ may mặc, trang sức, phụ kiện',
                                        label: 'Đồ may mặc, trang sức, phụ kiện'
                                    }, {
                                        value: 'Dược phẩm',
                                        label: 'Dược phẩm'
                                    }, {
                                        value: 'Gas',
                                        label: 'Gas'
                                    }, {
                                        value: 'Nông sản và thủy hải sản',
                                        label: 'Nông sản và thủy hải sản'
                                    }, {
                                        value: 'Ngân hàng',
                                        label: 'Ngân hàng'
                                    }, {
                                        value: 'Thực phẩm',
                                        label: 'Thực phẩm'
                                    }, {
                                        value: 'Thép',
                                        label: 'Thép'
                                    }, {
                                        value: 'Vận tải biển',
                                        label: 'Vận tải biển'
                                    }],
                                    typeSearch: 'multiple'
                                }
                                $rootScope.filterList[def.field] = {
                                    headerName: def.headerName,
                                    filter: filter
                                }

                                def.minWidth = 200;
                            }

                            //add css class for cell base on cell date (utils factory)
                            def.cellClass = function (params) {
                                var selectedSyle = '';
                                if (params.data.symbol == $rootScope.fullSelected)
                                    selectedSyle = $rootScope.fullSelected;
                                return utils.getCellClass(params, formatList, selectedSyle);
                            }
                            columnDefs.push(def);
                        }
                        $rootScope.filters = columnDefs;

                        $rootScope.setFilterSetting();
                        if ($rootScope.userFilter) {
                            if ($rootScope.userFilter.individualFilter)
                                $rootScope.filterList = filterConvert($rootScope.filterList, $rootScope.userFilter.individualFilter);
                            filterMode = $rootScope.userFilter.filterMode;
                        }
                        var $eventTimeout;
                        var $gridData = [];

                        if ($scope.gridOptions.api) {
                            $scope.gridOptions.api.setColumnDefs(columnDefs);
                            $scope.gridOptions.api.showLoadingOverlay();
                            draw.drawGrid(Ref.child('superstock'), config, function (data) {
                                //loading data
                            }, function (data) {
                                if (!$scope.gridOptions.api)
                                    return;
                                $scope.gridOptions.api.hideOverlay();
                                //Add event after sort changed
                                $scope.gridOptions.api.addEventListener('afterSortChanged', function (params) {

                                    var setting = $rootScope.userSetting;
                                    if (!setting) {
                                        setting = {
                                            sort: {
                                                full: {

                                                }
                                            },
                                            pinColumns: {

                                            }
                                        };
                                    }
                                    if (!setting.sort) {
                                        setting.sort = {
                                            full: {

                                            }
                                        }
                                    }

                                    if (!setting.sort.full)
                                        setting.sort.full = {};
                                    var sortModel = $scope.gridOptions.api.getSortModel();
                                    if (sortModel && sortModel[0])
                                        setting.sort.full = sortModel[0];

                                    var $user = Ref.child('users/' + currentAuth.uid);
                                    $user.child('userSetting').set(setting, function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('Saved user setting');
                                        }
                                    })

                                    /**
                                     * Send data to google analytics
                                     */
                                    var sortModel = $scope.gridOptions.api.getSortModel();
                                    if (sortModel) {
                                        for (var i in sortModel) {
                                            var colId = sortModel[i].colId;
                                            var sort = sortModel[i].sort;
                                            var column = $scope.gridOptions.columnApi.getColumn(colId);
                                            var headerName = column.colDef.headerName;
                                            $window.ga('send', {
                                                hitType: 'event',
                                                eventCategory: 'Đầy đủ - Sắp xếp dữ liệu',
                                                eventAction: 'Sắp xếp',
                                                eventLabel: 'Sắp xếp ' + (sort == 'desc' ? 'giảm dần' : 'tăng dần') + ' theo ' + headerName
                                            });
                                        }
                                    }

                                });

                                //Add event after column pinned
                                $scope.gridOptions.api.addEventListener('columnPinned', function (params) {

                                    var setting = $rootScope.userSetting;
                                    if (!setting) {
                                        setting = {
                                            sort: {
                                                full: {

                                                }
                                            },
                                            pinColumns: {
                                                full: {

                                                }
                                            }
                                        };
                                    }
                                    if (!setting.pinColumns) {
                                        setting.pinColumns = {
                                            full: []
                                        }
                                    }
                                    if (!setting.pinColumns.full)
                                        setting.pinColumns.full = [];

                                    var pinnedColumns = $scope.gridOptions.columnApi.getDisplayedLeftColumns();
                                    setting.pinColumns.full = [];
                                    if (pinnedColumns) {
                                        for (var i in pinnedColumns) {
                                            var colId = pinnedColumns[i].colId;
                                            setting.pinColumns.full.push(colId);
                                        }
                                    }

                                    var $user = Ref.child('users/' + currentAuth.uid);
                                    $user.child('userSetting').set(setting, function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('Saved user setting');
                                        }
                                    });

                                });

                                //Add event before filter changed
                                $scope.gridOptions.api.addEventListener('beforeFilterChanged', function (params) {

                                });

                                //Add event after filter changed
                                $scope.gridOptions.api.addEventListener('afterFilterChanged', function (params) {
                                    $scope.gridOptions.api.hideOverlay();
                                    $scope.rowAfterFilter = $scope.gridOptions.api.rowModel.rowsToDisplay;

                                    if (filterMode) {
                                        var filterModel = $scope.gridOptions.api.getFilterModel();
                                        for (var i in filterModel) {
                                            var label = '';
                                            var column = $scope.gridOptions.columnApi.getColumn(i);
                                            if (filterModel[i] instanceof Array) {
                                                label = column.colDef.headerName + ' là ' + filterModel[i].join(' và ')
                                            } else {
                                                var filter = $filter('number')(filterModel[i].filter);
                                                label = column.colDef.headerName + ' có giá trị >= ' + filter;
                                            }
                                            $window.ga('send', {
                                                hitType: 'event',
                                                eventCategory: 'Bộ lọc',
                                                eventAction: 'Bộ lọc cá nhân',
                                                eventLabel: label
                                            });
                                        }
                                    }
                                });

                                //Add event after column pinned
                                $scope.gridOptions.api.addEventListener('columnVisible', function (params) {

                                    var setting = $rootScope.userSetting;
                                    if (!setting) {
                                        setting = {
                                            sort: {
                                                full: {

                                                }
                                            },
                                            pinColumns: {
                                                full: []
                                            },
                                            hiddenColumns: {
                                                full: []
                                            }
                                        };
                                    }
                                    if (!setting.hiddenColumns) {
                                        setting.hiddenColumns = {
                                            full: []
                                        }
                                    }
                                    if (!setting.hiddenColumns.full)
                                        setting.hiddenColumns.full = [];

                                    var columns = $scope.gridOptions.columnApi.getAllColumns();
                                    var hiddenColumns = columns.filter(function (value) {
                                        return value.visible == false;
                                    })
                                    var data = [];
                                    if (hiddenColumns) {
                                        for (var i in hiddenColumns) {
                                            data.push(hiddenColumns[i].colId);
                                        }
                                    }

                                    setting.hiddenColumns.full = data;
                                    var $user = Ref.child('users/' + currentAuth.uid);
                                    $user.child('userSetting').set(setting, function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('Saved user setting');
                                        }
                                    });
                                });

                                // $scope.gridOptions.columnApi.autoSizeColumns(fieldsArr);
                                for (var i in $rootScope.filterList) {
                                    if ($rootScope.filterList[i].filters) {
                                        $scope.$watch('filterList["' + i + '"].filters[0].term', function (newVal, oldVal) {
                                            filterIndividualChange(newVal, oldVal);
                                        })
                                    }
                                    if ($rootScope.filterList[i].filter) {
                                        $scope.$watch('filterList["' + i + '"].filter.term', function (newVal, oldVal) {
                                            filterIndividualChange(newVal, oldVal);
                                        })
                                    }
                                }
                                setTimeout(function () {
                                    align();
                                }, 1000);
                            }, {
                                    added: function (data, childSnapshot, id) {
                                        /*
                                        * Update data in grid when server update data
                                        */
                                        if (isNaN(data.disruptQtty)) {
                                            data.disruptQtty = 0;
                                        }
                                        /**
                                        We don't have a way to trigger data filtering yet
                                        */
                                        $gridData.push(data);
                                        // if(personalStocks.indexOf(data['symbol']) !== -1) {
                                        //     $gridData.push(data);
                                        // }
                                        if ($eventTimeout) {
                                            //
                                        } else {
                                            $eventTimeout = $timeout(function () {
                                                if ($scope.gridOptions.api && $scope.gridOptions.api != null)
                                                    if($rootScope.link === 'full') {
                                                        $scope.gridOptions.api.setRowData($gridData);
                                                    }
                                                    else if($rootScope.link === 'personal') {
                                                        $scope.fullData = $gridData;
                                                        $scope.filterPersonalStocks();
                                                    }
                                                filterChange(false);
                                                $gridData = [];
                                                $eventTimeout = undefined;
                                            }, 1000);
                                        }
                                    },
                                    changed: function (data, childSnapshot, id) {
                                        /*
                                        * Data Changed Event
                                        */
                                    },
                                    removed: function (oldChildSnapshot) {
                                        /*
                                        * Data Removed Event
                                        */
                                    }
                                })
                        }

                    })
                })
            });

            /**
             * Format UI
             */
            function align() {
                $('.ui-grid-header-cell').each(function () {
                    var thisTag = $(this);
                    var span = thisTag.find('span');
                    if (span.text().indexOf('\n') < 0) {
                        span.parent().css('line-height', '40px');
                        thisTag.css('text-align', 'center');
                    } else {
                        span.last().css('margin-top', '-2px');
                    }
                })
            }

            $(document).ready(function () {
                $(document).on('change', '.subTerm', function () {
                    $(this).each(function () {
                        var subTerm = $(this);
                        subTerm.prop('value', subTerm.val());
                        var field = subTerm.data('model');
                        $scope.$apply(function () {
                            $rootScope.filterList[field].filters[0].term = parseFloat(subTerm.val()) * bigNum;
                            subTerm.prop('value', subTerm.val());
                        });
                        subTerm.parent().next().children().slider({
                            slide: function (event, ui) {
                                subTerm.prop('value', ui.value / bigNum);
                            }
                        });
                    });
                });

                /*
                * Graph chart click event
                */
                $(document).on('click', '.chart-icon', function () {
                    $('#myModal').modal('show');
                    $scope.stockInfo = $(this).data('symbol') + ' - ' + $(this).data('industry');
                    $scope.iSrc = 'https://banggia.vndirect.com.vn/chart/?symbol=' + $(this).data('symbol');
                    $scope.iSrcTrust = $sce.trustAsResourceUrl($scope.iSrc);
                });

                /*
                * Company information click event
                */
                $(document).on('click', '.information-icon', function () {
                    $('#companyModal').modal('show');
                    var symbolVal = $(this).data('symbol');
                    var industryVal = $(this).data('industry');
                    $scope.companyInfo = symbolVal + ' - ' + industryVal;

                    utils.getCompanyInformation(symbolVal).then(function (data) {
                        $scope.companyDatas = data;
                    }).catch(function (ex) {

                    });
                });
            });
        }])
    .directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });

/**
         * convert columnDefs to filters and opposite
         */
function filterConvert(rowDefs, filters) {
    if (filters) {
        for (var i in rowDefs) {
            if (rowDefs[i].filter) {
                if (filters && filters[i])
                    rowDefs[i].filter.term = filters[i];
            }
            if (rowDefs[i].filters) {
                if (filters && (filters[i] || filters[i] == 0))
                    rowDefs[i].filters[0].term = filters[i];
            }
        }
        return rowDefs;
    } else {
        var filters = {};
        for (var i in rowDefs) {
            if (rowDefs[i].filter) {
                if (rowDefs[i].filter.term)
                    filters[i] = rowDefs[i].filter.term;
            }
            if (rowDefs[i].filters) {
                if (rowDefs[i].filters[0].term || rowDefs[i].filters[0].term == 0)
                    filters[i] = rowDefs[i].filters[0].term;
            }
        }
        return filters;
    }
}