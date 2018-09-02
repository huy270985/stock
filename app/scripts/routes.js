'use strict';
/**
 * @ngdoc overview
 * @name superstockApp:routes
 * @description
 * # routes.js
 *
 * Configure routes for use with Angular, and apply authentication security
 * Add new routes using `yo angularfire-express:route` with the optional --auth-required flag.
 *
 * Any controller can be secured so that it will only load if user is logged in by
 * using `whenAuthenticated()` in place of `when()`. This requires the user to
 * be logged in to view this route, and adds the current user into the dependencies
 * which can be injected into the controller. If user is not logged in, the promise is
 * rejected, which is handled below by $routeChangeError
 *
 * Any controller can be forced to wait for authentication to resolve, without necessarily
 * requiring the user to be logged in, by adding a `resolve` block similar to the one below.
 * It would then inject `user` as a dependency. This could also be done in the controller,
 * but abstracting it makes things cleaner (controllers don't need to worry about auth state
 * or timing of displaying its UI components; it can assume it is taken care of when it runs)
 *
 *   resolve: {
 *     user: ['Auth', function($firebaseAuth) {
 *       return Auth.$getAuth();
 *     }]
 *   }
 *
 */
angular.module('superstockApp')

    /**
     * Adds a special `whenAuthenticated` method onto $routeProvider. This special method,
     * when called, invokes Auth.$requireAuth() service (see Auth.js).
     *
     * The promise either resolves to the authenticated user object and makes it available to
     * dependency injection (see AccountCtrl), or rejects the promise if user is not logged in,
     * forcing a redirect to the /login page
     */

    /*
     * Commented due to issues with the new SDK
     *
     .config(['$routeProvider', 'SECURED_ROUTES', function ($routeProvider, SECURED_ROUTES) {

     // credits for this idea: https://groups.google.com/forum/#!msg/angular/dPr9BpIZID0/MgWVluo_Tg8J
     // unfortunately, a decorator cannot be use here because they are not applied until after
     // the .config calls resolve, so they can't be used during route configuration, so we have
     // to hack it directly onto the $routeProvider object
     /*
     $routeProvider.whenAuthenticated = function (path, route) {
     route.resolve = route.resolve || {};
     route.resolve.user = ['auth', function (auth) {
     return auth.$requireSignIn();
     }];
     $routeProvider.when(path, route);
     SECURED_ROUTES[path] = true;
     return $routeProvider;
     };
     }])
     */

    // configure views; whenAuthenticated adds a resolve method to ensure users authenticate
    // before trying to access that route
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }],
                    "tableSettings": function() {
                        return {
                            "gridDataSource": "summary_data",
                            "defaultSort": "power",
                            "direction": "desc",
                        }
                    },
                    "link": function() {
                        return 'main';
                    },
                }
            })

            .when('/investment', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }],
                    "tableSettings": function() {
                        return {
                            "gridDataSource": "investment_data",
                            "defaultSort": "power",
                            "direction": "desc",
                            "hideSymbol": true,
                        }
                    },
                    "link": function() {
                        return 'investment';
                    },
                }
            })

            .when('/market_low', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }],
                    "tableSettings": function() {
                        return {
                            "gridDataSource": "market_low_data",
                            "defaultSort": "priceChange",
                            "direction": "desc",
                            "hideSymbol": true,
                        }
                    },
                    "link": function() {
                        return 'market_low';
                    },
                }
            })

            .when('/full', {
                templateUrl: 'views/full-stock.html',
                controller: 'FullStockCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }],
                    "link": function() {
                        return "full";
                    }
                }
            })

            .when('/personal', {
                templateUrl: 'views/personal-portfolio.html',
                controller: 'FullStockCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }],
                    "link": function() {
                        return "personal";
                    }
                }
            })

            .when('/market-stats', {
                templateUrl: 'views/market-stats.html',
                controller: 'MarketStatsCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }],
                    "link": function() {
                        return "market-stats";
                    }
                }
            })

            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutCtrl',
                controllerAs: 'about'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl'
            })
            .when('/account', {
                templateUrl: 'views/account.html',
                controller: 'AccountCtrl',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        // returns a promisse so the resolve waits for it to complete
                        return auth.$requireSignIn();
                    }]
                }
            })
            .when('/chat', {
                templateUrl: 'views/chat.html',
                controller: 'Chat',
                resolve: {
                    "currentAuth": ["auth", function (auth) {
                        return auth.$waitForSignIn();
                    }]
                }
            })
            .otherwise({
                redirectTo: '/'
            });

    }])

    /**
     * Apply some route security. Any route's resolve method can reject the promise with
     * "AUTH_REQUIRED" to force a redirect. This method enforces that and also watches
     * for changes in auth status which might require us to navigate away from a path
     * that we can no longer view.
     */
    .run(['$rootScope', '$location', 'loginRedirectPath', 'auth', '$firebaseObject', 'Ref',
        function ($rootScope, $location, loginRedirectPath, auth, $firebaseObject, Ref, event, next, previous, error) {
            // For new user trial
            $rootScope.globalActive = false;

            // watch for login status changes and redirect if appropriate
            auth.$onAuthStateChanged(function (authData) {
                $rootScope.user = authData ? authData.toJSON() : undefined;
                if ($rootScope.userTmp && $rootScope.user) {
                    $rootScope.user.displayName = $rootScope.userTmp.displayName;
                    $rootScope.user.phoneNumber = $rootScope.userTmp.phoneNumber;
                }
                if ($rootScope.user && $rootScope.user != null) {
                    var userRef = Ref.child('users/' + $rootScope.user.uid);
                    $rootScope.$userRefChange = $firebaseObject(userRef);
                    $rootScope.$userRefChange.$loaded(function (user) {
                        if (!$rootScope.user)
                            return;
                        var showMessage = false;
                        $rootScope.userSetting = user.userSetting;
                        $rootScope.userFilter = user.filter;
                        $rootScope.user.profile = user.profile;
                        if (user.account) {
                            $rootScope.user.account = user.account;
                            if (authData && user && user.profile) {
                                $rootScope.user.displayName = user.profile.fullName ? user.profile.fullName : $rootScope.user.displayName;
                                $rootScope.user.phoneNumber = user.profile.phoneNumber;
                            }
                            if ($rootScope.fullName) {
                                $rootScope.user.displayName = $rootScope.fullName;
                            }


                            $rootScope.user.account.expiredDate = new Date(user.account.expiredAt);

                            if ($rootScope.user.account.active != true)
                                $rootScope.user.account.active = false;

                            // $rootScope.user.account.active = true; // Always pass for development
                        } else {
                            $rootScope.user.account = {
                                active: $rootScope.globalActive // For new user trial
                            };
                        }
                        showMessage = !$rootScope.user.account.active;
                        if (showMessage) {
                            $('#expiredMessageModal').modal('show');
                            // redirect automatically to home if user is not active
                            $location.path('/');
                        }
                    });
                } else {
                    if ($rootScope.$userRefChange)
                        $rootScope.$userRefChange.$destroy();
                    if ($rootScope.filterRef)
                        $rootScope.filterRef.$destroy();
                    if ($rootScope.$userRef)
                        $rootScope.$userRef.$destroy();
                }
                $rootScope.showUI = true;
            });

            // some of our routes may reject resolve promises with the special {authRequired: true} error
            // this redirects to the login page whenever that is encountered
            $rootScope.$on("$routeChangeError", function (event, next, previous, error) {
                if (error === "AUTH_REQUIRED") {
                    $location.path(loginRedirectPath);
                }
            });
        }
    ]);