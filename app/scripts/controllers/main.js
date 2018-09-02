'use strict';

/**
 * @ngdoc function
 * @name superstockApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the superstockApp
 */
angular.module('superstockApp')
    .controller('MainCtrl', ['$rootScope', '$scope', 'auth', '$firebaseArray',
        '$firebaseObject', 'Ref', 'draw', 'uiGridConstants', '$sce', 'utils', 'currentAuth', '$window', '$compile', '$filter', '$timeout',
        'tableSettings', 'link',
        function ($rootScope, $scope, auth, $firebaseArray,
            $firebaseObject, Ref, draw, uiGridConstants, $sce, utils, currentAuth, $window, $compile, $filter, $timeout,
            tableSettings, link) {
            $rootScope.link = link;
            $window.ga('send', 'pageview', "Tổng hợp");
            //Setup ag-grid
            $scope.gridMainOptions = {
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
                onAfterFilterChanged: function () { },
                onCellClicked: function (params) { }
            };
            var columnDefs = [
                {
                    headerName: "Báo bán",
                    field: "sellSignal",
                    width: 70,
                    headerCellTemplate: function (params) {
                        /*
                        * Header cell template, this will be render for all header cell of grid
                        */
                        var colorClass = 'ag-header-cell-red';

                        return (
                            '<div class="ag-header-cell ' + colorClass + ' ag-header-cell-sortable ag-header-cell-sorted-none">' +
                            '<table style="width:100%;height:100%">' +
                            '<tr>' +
                            '<td>' +
                            '<div id="agHeaderCellLabel" class="ag-header-cell-label">' +
                            '<span id="agText" class="ag-header-cell-text"></span>' +
                            '</div>' +
                            '</td>' +
                            '</tr>' +
                            '</table>' +
                            '</div>'
                        )
                    },
                    cellClass: function (params) {
                        // Get cell style
                        var selectedSyle = '';
                        if (params.data.symbol == $rootScope.mainSelected)
                            selectedSyle = $rootScope.mainSelected;
                        return utils.getCellClassSummary(params, { sellSignal: '' }, selectedSyle);
                    }
                }
            ];


            $scope.gridMarketOptions = {
                enableSorting: false,
                enableFilter: false,
                rowData: [],
                data: [],
                headerHeight: 50,
                enableColResize: false,
                suppressNoRowsOverlay: true,
                columnDefs: columnDefs
            }

            /*
            * Get market summary data
            */
            utils.getMarketSummary().then(function (data) {
                $scope.headerTitle = data;
            }).catch(function (ex) {
                console.error('Exception when getMarketSummary')
            });

            /*
            * Update trading date
            */
            utils.getTradingDate().then(function (data) {
                $scope.tradingDate = data;
            }).catch(function (ex) {
                console.error('Exception when getTradingDate')
            });

            /*
            * Load title, header and format of field form server
            */
            var bigNum = 1000000000;
            var titles = $firebaseObject(Ref.child('summary_titles'));
            var fields = $firebaseObject(Ref.child('summary_headers'));
            var format = $firebaseObject(Ref.child('summary_format'));
            titles.$loaded(function () {
                fields.$loaded(function () {
                    format.$loaded(function () {
                        var titlesArr = titles.data.split('|');
                        var fieldsArr = fields.data.split('|');
                        var formatArr = format.data.split('|');
                        var formatList = {};

                        // Define size of field in client
                        //"symbol|matchPrice|priceChange|totalValue|volumeChange|EPS|newPoint|Canslim|pricePeak|signal1|symbol2"
                        var sizes = {
                            symbol: 90,
                            matchPrice: 100,
                            priceChange: 100,
                            totalValue: 125,
                            volumeChange: 95,
                            EPS: 65,
                            newPoint: 75,
                            Canslim: 105,
                            pricePeak: 100,
                            signal1: 130,
                            symbol2: 75,
                            signal2: 130
                        }
                        var columnDefs = [];
                        var config = {
                            idLabel: 'Mã',
                            labelList: []
                        }

                        /**
                         * Innitial column Def
                         */
                        var count = 0;
                        for (var i in titlesArr) {
                            formatList[fieldsArr[i]] = formatArr[i];
                            config.labelList.push({
                                fieldName: fieldsArr[i],
                                format: formatArr[i]
                            });
                            var formatType = null;
                            var cellClass = null;
                            if (formatArr[i].indexOf('bigNum') > -1 || formatArr[i].indexOf('number') > -1) {
                                formatType = 'number';
                                cellClass = 'ui-cell-align-right'
                            } else if (formatArr[i].indexOf('percent') > -1) {
                                cellClass = 'ui-cell-align-right'
                            } else {
                                cellClass = 'ui-cell-align-left'
                            }

                            //Setup column data
                            var def = {
                                field: fieldsArr[i], //field name
                                width: sizes[fieldsArr[i]] || 90, //column width
                                headerName: titlesArr[i], //column title
                                cellClass: cellClass, //css class of cell in column
                                enableTooltip: true,
                                tooltipField: fieldsArr[i], //show tolltip
                                cellRenderer: function (params) { //cell render event
                                    if (params.colDef.field == 'symbol2') {
                                        /*
                                        * For "symbol2" column
                                        * - signal1 & signal2 is empty, show empty value
                                        */
                                        if (params.data.signal1 == '' && params.data.signal2 == '') {
                                            return '<div data-symbol="' + params.data.symbol + '" title=""></div>';
                                        } else {
                                            return '<div class="chart-icon" data-symbol="' + params.data.symbol + '" title="' + params.value + '">' + params.value + '</div>';
                                        }
                                    } else if (params.colDef.field == 'newPoint' || params.colDef.field == 'EPS') {
                                        /*
                                        * For "newPoint" and "EPS" column
                                        * - Show number with format which has 2 points
                                        */
                                        var value = '';
                                        if (isNaN(parseFloat(params.value))) {
                                            value = $filter('number')(0, 0);
                                        } else {
                                            value = $filter('number')(parseFloat(params.value), 0);
                                        }
                                        return '<div data-symbol="' + params.data.symbol + '" title="' + value + '">' + value + '</div>';
                                    }
                                    else {
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
                                            return '<div data-symbol="' + params.data.symbol + '" title="' + value + '">' + value + '</div>';
                                        }
                                    }
                                    return '<div data-symbol="' + params.data.symbol + '" title="' + params.value + '">' + params.value + '</div>';
                                },
                                headerCellTemplate: function (params) {
                                    /*
                                    * Header cell template, this will be render for all header cell of grid
                                    */
                                    var column = params.column;
                                    var colId = column.colId;
                                    var colorClass = '';
                                    if (colId == 'signal1' || colId == 'symbol2' || colId == 'signal2')
                                        colorClass = 'ag-header-cell-green';
                                    var agMenu = '<td width="20px" style="vertical-align:top">' +
                                        '<span id="agMenu" class="ag-header-icon ag-header-cell-menu-button" style="opacity: 0; transition: opacity 0.2s, border 0.2s;">' +
                                        '<svg width="12" height="12"><rect y="0" width="12" height="2" class="ag-header-icon"></rect><rect y="5" width="12" height="2" class="ag-header-icon"></rect><rect y="10" width="12" height="2" class="ag-header-icon"></rect></svg>' +
                                        '</span>' +
                                        '</td>';
                                    var agSort = '<td width="20px">' +
                                        '<div id="" class="ag-header-cell-label"><span id="agSortAsc" class="ag-header-icon ag-sort-ascending-icon ag-hidden"><svg width="10" height="10"><polygon points="0,10 5,0 10,10"></polygon></svg></span>    <span id="agSortDesc" class="ag-header-icon ag-sort-descending-icon ag-hidden"><svg width="10" height="10"><polygon points="0,0 5,10 10,0"></polygon></svg></span><span id="agNoSort" class="ag-header-icon ag-sort-none-icon ag-hidden"><svg width="10" height="10"><polygon points="0,4 5,0 10,4"></polygon><polygon points="0,6 5,10 10,6"></polygon></svg></span><span id="agFilter" class="ag-header-icon ag-filter-icon ag-hidden"><svg width="10" height="10"><polygon points="0,0 4,4 4,10 6,10 6,4 10,0" class="ag-header-icon"></polygon></svg></span></div>' +
                                        '</td>';
                                    if (colId == 'sellSignal') {
                                        agSort = '';
                                        agMenu = '';
                                        colorClass = 'ag-header-cell-red';
                                    }
                                    return (
                                        '<div class="ag-header-cell ' + colorClass + ' ag-header-cell-sortable ag-header-cell-sorted-none">' +
                                        '<table style="width:100%;height:100%">' +
                                        '<tr>' +
                                        agMenu +
                                        '<td>' +
                                        '<div id="agHeaderCellLabel" class="ag-header-cell-label">' +
                                        '<span id="agText" class="ag-header-cell-text"></span>' +
                                        '</div>' +
                                        '</td>' +
                                        agSort +
                                        '</tr>' +
                                        '</table>' +
                                        '</div>'
                                    )
                                }
                            };
                            if(def.field === tableSettings.defaultSort) { // default #sort column in summary table
                                def.sort = tableSettings.direction;
                            }
                            count++;

                            if (formatType) def.cellFilter = formatType; // add cell format (number or string)
                            if (fieldsArr[i] == 'symbol') { //cell template for 'symbol' column
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
                            } else if (fieldsArr[i] == 'sellSignal') {
                                def.suppressSorting = true;
                            }

                            def.cellClass = function (params) {
                                // Get cell style
                                var selectedSyle = '';
                                if (params.data.symbol == $rootScope.mainSelected)
                                    selectedSyle = $rootScope.mainSelected;
                                return utils.getCellClassSummary(params, formatList, selectedSyle);
                            }

                            columnDefs.push(def);
                        }

                        $rootScope.filters = columnDefs;

                        /*
                        * Get data from server and render to Grid
                        */
                        var $eventTimeout;
                        var $gridData = [];

                        var sellSignalDatas = [];
                        if ($scope.gridMainOptions.api) {
                            $scope.gridMainOptions.api.setColumnDefs(columnDefs);

                            var gridDiv = document.querySelector('#grid-market-options');
                            new agGrid.Grid(gridDiv, $scope.gridMarketOptions);

                            draw.drawGrid(Ref.child(tableSettings.gridDataSource), config, function (data) {
                                //loading data
                                $scope.gridMainOptions.api.showLoadingOverlay()
                            }, function (data) {
                                /*
                                Hide data for unpaid user
                                */
                                if(!$rootScope.user.account.active) {
                                    for(var i = 0; i < data.length; i++) {
                                        var txt = "Bản thu phí";
                                        data[i].signal1 = txt;
                                        data[i].signal2 = txt;
                                        data[i].symbol2 = txt;
                                        data[i].Canslim = txt;
                                        data[i].power = txt;
                                        if(tableSettings.hideSymbol) {
                                            data[i].symbol = txt;
                                        }
                                    }
                                }
                                //loaded data
                                $scope.gridMainOptions.api.setRowData(data);
                                // add the handler function
                                $scope.gridMainOptions.api.addEventListener('afterSortChanged', function (params) {
                                    var updatedNodes = [];
                                    if ($scope.gridMainOptions.api && $scope.gridMainOptions.api != null) {
                                        $scope.gridMainOptions.api.forEachNode(function (node) {
                                            var value = '';
                                            if (sellSignalDatas[node.childIndex])
                                                value = sellSignalDatas[node.childIndex];
                                            node.data.sellSignal = value;
                                            updatedNodes.push(node);
                                        });
                                        $scope.gridMainOptions.api.refreshCells(updatedNodes, ['sellSignal']);

                                        /**
                                         * Send data to google analytics
                                         */
                                        var sortModel = $scope.gridMainOptions.api.getSortModel();
                                        if (sortModel) {
                                            for (var i in sortModel) {
                                                var colId = sortModel[i].colId;
                                                var sort = sortModel[i].sort;
                                                var column = $scope.gridMainOptions.columnApi.getColumn(colId);
                                                var headerName = column.colDef.headerName;
                                                $window.ga('send', {
                                                    hitType: 'event',
                                                    eventCategory: 'Tổng hợp - Sắp xếp dữ liệu',
                                                    eventAction: 'Xắp xếp',
                                                    eventLabel: 'Xắp xếp ' + (sort == 'desc' ? 'giảm dần' : 'tăng dần') + ' theo ' + headerName
                                                });
                                            }
                                        }
                                    }
                                });
                            }, {
                                    added: function (data, childSnapshot, id) {
                                        /*
                                        * Update data in grid when server update data
                                        * Here we hide signal for inactive user, only paid user see the details.
                                        TODO: duplicate with first load process
                                        */
                                        if(!$rootScope.user.account.active) {
                                            var txt = "Bản thu phí";
                                            data.signal1 = txt;
                                            data.signal2 = txt;
                                            data.symbol2 = txt;
                                            data.Canslim = txt;
                                            data.power = txt;
                                            if(tableSettings.hideSymbol) {
                                                data.symbol = txt;
                                            }
                                        }

                                        $gridData.push(data);
                                        if ($eventTimeout) {
                                            //
                                        } else {
                                            $eventTimeout = $timeout(function () {
                                                if ($scope.gridMainOptions.api && $scope.gridMainOptions.api != null) {
                                                    $scope.gridMainOptions.api.setRowData($gridData);
                                                    /**
                                                     * Fill data for sell signal column
                                                     */
                                                    utils.getSellSignals().then(function (data) {
                                                        $scope.gridMarketOptions.api.setRowData(data);
                                                        /**
                                                         * Set height for sellSignal
                                                         */
                                                        var $agBody = $('div[ng-grid="gridMainOptions"]').find('.ag-body');
                                                        var $pinLeft = $('div[ng-grid="gridMainOptions"]').find('.ag-pinned-left-cols-container');
                                                        var $gridMarket = $('#grid-market-options').find('.ag-body-viewport');
                                                        var height = $pinLeft.height();
                                                        if (height >= $agBody.height())
                                                            height = $agBody.height();
                                                        $gridMarket.height(height);
                                                        $gridMarket.css('background', '#F4CCCC');
                                                    }).catch(function (ex) {
                                                    });
                                                }
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

                        $(document).ready(function () {
                            /*
                            * Graph chart click event
                            */
                            $(document).on('click', '.chart-icon', function () {
                                $('#myModal').modal('show');
                                $scope.stockInfo = $(this).data('symbol');
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
                                $scope.companyInfo = symbolVal;

                                utils.getCompanyInformation(symbolVal).then(function (data) {
                                    $scope.companyDatas = data;
                                }).catch(function (ex) {

                                });
                            });

                        });
                    })
                })
            })
        }]);