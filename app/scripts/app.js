'use strict';

/**
 * @ngdoc overview
 * @name superstockApp
 * @description
 * # superstockApp
 *
 * Main module of the application.
 */
angular.module('superstockApp', [
    // 'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'firebase',
    'ui.grid',
    "agGrid",
    'ui.grid.pinning',
    'firebase.auth',
    'firebase.ref',
    'ui.slider',
    'btorfs.multiselect',
    'uiSwitch'
]).config(['$locationProvider', function($locationProvider) {
  $locationProvider.hashPrefix('');
}]);

$(document).on('click', '.ag-row', function() {
    var thisRow = $(this);
    var clickRow = thisRow.prop('class').indexOf('click-row');
    $('.ag-row').removeClass('click-row');
    if (clickRow > -1) {
        thisRow.removeClass('click-row');
    } else {
        thisRow.addClass('click-row');
    }
})
