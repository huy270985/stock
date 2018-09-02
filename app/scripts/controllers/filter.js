'use strict';

/**
 * @ngdoc function
 * @name superstockApp.controller:FilterCtrl
 * @description
 * # FilterCtrl
 * Controller of the superstockApp
 */
angular.module('superstockApp')
    .controller('FilterCtrl', ['$rootScope', '$scope', 'Ref', '$firebaseArray', '$compile', '$window',
        function ($rootScope, $scope, Ref, $firebaseArray, $compile, $window) {
            $scope.defaultFilter = [
                {
                    "id": 1,
                    "EPS": { term: 1000, condition: 'greaterThan' },
                    "maVol30": { term: 30e3, condition: 'greaterThan' },
                    "point": { term: 7, condition: 'greaterThan' },
                    "profitChange": { term: 20, condition: 'greaterThan' },
                    "roe": { term: 7, condition: 'greaterThan' },
                    "filterName": "Cơ bản tốt"
                }, {
                    "id": 2,
                    "canslim": { term: 'Canslim', condition: 'contains' },
                    "maVol30": { term: 30e3, condition: 'greaterThanOrEqual' },
                    "filterName": "Canslim"
                }, {
                    "id": 3,
                    "totalValue": { term: 5e9, condition: 'greaterThanOrEqual' },
                    "priceChange": { term: 1, condition: 'greaterThanOrEqual' },
                    "EPS": { term: 3e3, condition: 'greaterThanOrEqual' },
                    "point": { term: 7, condition: 'greaterThanOrEqual' },
                    "filterName": "Siêu cổ phiếu"
                }, {
                    "id": 4,
                    "capital": { term: 10e3, condition: 'greaterThanOrEqual' },
                    "filterName": "Vốn hóa lớn"
                }, {
                    "id": 5,
                    "sideway": { term: "sideway", condition: 'contains' },
                    "maVol30": { term: 30e3, condition: 'greaterThanOrEqual' },
                    "filterName": "Các mã sideway"
                }, {
                    "id": 6,
                    "totalValue": { term: 3e9, condition: 'greaterThanOrEqual' },
                    "pricePeak": { term: "Cao nhất 30 phiên", condition: 'contains' },
                    "filterName": "Vượt đỉnh"
                }, {
                    "id": 7,
                    "totalValue": { term: 2e9, condition: 'greaterThanOrEqual' },
                    "disruptQtty": { term: 30, condition: 'greaterThanOrEqual' },
                    "maVol30": { term: 20e3, condition: 'greaterThanOrEqual' },
                    "filterName": "Đột biến KL"
                }, {
                    "id": 8,
                    "totalValue": { term: 2e9, condition: 'greaterThanOrEqual' },
                    "maVol30": { term: 20e3, condition: 'greaterThanOrEqual' },
                    "priceChange": { term: 1, condition: 'greaterThanOrEqual' },
                    "shorttermSignal": { term: "xMua nếu cơ bản tốt", condition: 'contains' },
                    "filterName": "Điểm mua ngắn hạn"
                }, {
                    "id": 9,
                    "symbol": ["AAA", "VND"],
                    "filterName": "Danh mục cá nhân",
                },

                ];

            $scope.individualFilter = false;
            $scope.publicFilter = true;
            $scope.filterModes;

            /**
             * Filter by search (by CP)
             */
            $rootScope.$watch('searchTerm', function () {
                if ($rootScope.search)
                    $rootScope.search($rootScope.searchTerm)
            })

            /**
             * Public filter change
             */
            $scope.filterChange = function () {
                if ($scope.filter && $scope.filter.length == 0) {
                    $scope.filter = null;
                }
                $rootScope.filterData = $scope.filter;
                if ($rootScope.filterModes)
                    $rootScope.filterModes($scope.filterModes);

                $rootScope.saveFilterSetting();

                /**
                 * Send data to google analytics
                 */
                if (!$scope.filterModes && $rootScope.filterData && $rootScope.filterData.length > 0) {
                    $window.ga('send', {
                        hitType: 'event',
                        eventCategory: 'Bộ lọc',
                        eventAction: 'Bộ loc có sẵn',
                        eventLabel: 'Lọc theo ' + $rootScope.filterData[0].filterName
                    });
                }
            }

            /**
             * Public function $scope.filterChange for menu.js
             */
            $rootScope.filterChangeGlobal = function () {
                $scope.filterChange();
            }


            /**
             * Filter mode Public or Individual
             */
            $scope.$watch('filterModes', function () {
                if ($rootScope.filterModes) {
                    if ($scope.filterModes) {
                        // For individual filter
                        $scope.publicFilter = false;
                        $scope.individualFilter = true;
                        $rootScope.filterModes(true);
                    } else {
                        // For public filter
                        $scope.publicFilter = true;
                        $scope.individualFilter = false;
                        $rootScope.filterModes(false);
                    }

                    $rootScope.saveFilterSetting();
                }
            });

            /**
             * Reset filter mode
             */
            $rootScope.resetFilterModes = function () {
                $scope.filterModes = false;
                $scope.publicFilter = true;
                $scope.individualFilter = false;
            }

            /**
             * Hide filter controls when click outsite
             */
            $(document).on('click', '#container-fluit-area, #footer-area, #header-area', function (event) {
                if (!$("#sidebar-wrapper").parent().hasClass("toggled")) {
                    $("#filter-control").removeClass('ng-hide');
                    $("#wrapper").toggleClass("toggled");

                    if (!$scope.filter && !$scope.filterModes)
                        $rootScope.filterOn = false;

                    if (!$rootScope.filterOn) {
                        $("#js-navbar-collapse").find("ul > li").removeClass("active");
                        $("#full-stock").addClass("active");
                    }
                    $(".item-to-hide").removeClass('hidden');

                    $scope.$apply(function () {
                        // $rootScope.filterOn = false;
                        // $rootScope.resetFilterModes();
                        // $rootScope.resetFilter();
                    })
                }
            });

            /**
             * Reset filter when click full stock lin
             */
            $(document).on('click', '#full-stock', function (event) {
                event.preventDefault();
                if ($rootScope.link == 'full') {
                    $("#js-navbar-collapse").find("ul > li").removeClass("active");
                    $(this).addClass("active");
                    $rootScope.resetFilterModes();
                    $rootScope.resetFilter();
                }
                $rootScope.filterOn = false;
            });

            /**
             * Set data for default filter
             */
            $rootScope.setDataForDefaultFilter = function () {
                // $scope.filter = $scope.defaultFilter;
            }

            /**
             * Save filter setting
             */
            $rootScope.saveFilterSetting = function () {
                var filter = {};
                if ($rootScope.userFilter) {
                    filter = $rootScope.userFilter;
                    if (!filter.filterMode && !filter.publicFilter && !filter.individualFilter)
                        filter = {};
                }
                // FIlter mode
                filter.filterMode = $scope.filterModes;

                // Public filter
                var publicFilter = [];
                if ($scope.filter && $scope.filter != null) {
                    for (var i in $scope.filter) {
                        publicFilter.push($scope.filter[i].id);
                    }
                }

                if (publicFilter)
                    filter.publicFilter = publicFilter;

                // Individual filter
                var individualFilter = filterConvert($rootScope.filterList, null);
                if (individualFilter && Object.keys($rootScope.filterList).length > 0)
                    filter.individualFilter = individualFilter;

                var user = Ref.child('users/' + $rootScope.user.uid);
                user.child('filter').set(filter, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Saved filter setting');
                    }
                });
            }

            /**
             * Set filter by user setting
             */
            $rootScope.setFilterSetting = function () {
                if ($rootScope.userFilter && $rootScope.userFilter.filterMode != undefined) {
                    $scope.filterModes = $rootScope.userFilter.filterMode;
                    if ($rootScope.userFilter.publicFilter) {
                        var filters = [];
                        for (var i in $rootScope.userFilter.publicFilter) {
                            var id = $rootScope.userFilter.publicFilter[i];
                            var filter = $scope.defaultFilter.filter(function (value) {
                                return id == value.id;
                            });
                            if (filter && filter[0])
                                filters.push(filter[0]);
                        }
                        if (filters && filters.length > 0)
                            $scope.filter = filters;
                    }
                    // if (!$scope.filterModes) {
                    //     $scope.filterChange();
                    // }
                }
            }
        }]);