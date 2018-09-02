'use strict';

/**
 * @ngdoc function
 * @name superstockApp.controller:PersonalPortfolioCtrl
 * @description
 * #PersonalPortfolioCtrl
 * Controller of the superstockApp
 */
angular.module('superstockApp')
    .controller('MarketStatsCtrl', ['$rootScope', '$scope', 'auth', '$firebaseArray',
        '$firebaseObject', 'Ref', 'utils', 'currentAuth', 'link',
        function ($rootScope, $scope, auth, $firebaseArray,
            $firebaseObject, ref, $utils, currentAuth, link) {
        // so tab can highlight correctly
        $rootScope.link = link;

        /*
            1. Đếm số mã hiện lên bảng tổng hợp
            2. Đếm số mã báo mua trên bảng tổng hợp
            3. Số mã giao dịch >= 1 tỷ và tăng giá ( ko giảm)
            4. Số mã giao dịch >= 1 tỷ và giảm giá
            5. Số mã giao dịch >= 1 tỷ và uptrend
            6. Số mã giao dịch >= 1 tỷ và downtrend
            7. Số mã vốn hóa> 10.000 tỷ tăng giá
            8. Số mã vốn hóa >10.000 tỷ giảm giá
            9. Số mã giao dịch >=1 tỷ và lãi sau t+3
            10. Số mã 1 tỷ và power >=8
        */


        var $stats = $firebaseObject(ref.child('market_stats'));
        $stats.$loaded()
            .then(function(){
                $rootScope.stats = {
                    data: [
                        {
                            title: 'Báo mua/lên bảng',
                            value: $stats.disrupt_count + '/' + $stats.summary_count,
                        },
                        {
                            title: 'Giao dịch >= 1 tỷ (tăng giá/giảm giá)',
                            value: $stats.up_with_big_value + '/' + $stats.down_with_big_value,
                        },
                        {
                            title: 'Giao dịch >= 1 tỷ (uptrend/downtrend)',
                            value: $stats.uptrend_with_big_value + '/' + $stats.downtrend_with_big_value,
                        },
                        {
                            title: 'Vốn hoá >= 10,000 tỷ (tăng giá/giảm giá)',
                            value: $stats.up_with_big_capital + '/' + $stats.down_with_big_capital,
                        },
                        {
                            title: 'Giao dịch >= 1 tỷ, power >= 8',
                            value: $stats.big_power_and_value,
                        },
                        {
                            title: 'Giao dịch >= 1 tỷ, lãi sau T+3',
                            value: $stats.big_value_and_c4_profit,
                        },
                    ],
                };
            })
            .catch(function(error) {
                var message = 'Không lấy được thống kê thị trường, xin thử lại.'
                console.error(message, error);
                $rootScope.system = {
                    message: message,
                    error: error
                }
                $('#sysModal').modal('show')
            });
    }]);
