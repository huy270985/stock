'use strict';

/**
 * @ngdoc function
 * @name superstockApp.controller:MenuCtrl
 * @description
 * # MenuCtrl
 * Controller of the superstockApp
 */
angular.module('superstockApp')
    .controller('MenuCtrl', function ($rootScope, $scope, auth, $location, Ref, $firebaseObject, $timeout, $window) {
        $rootScope.link = '';
        var disconnectRef = null;
        var authDataSave = null;

        /**
         * Show filter controls
         */
        $scope.filterShow = function (e) {
            e.preventDefault();
            e.stopPropagation();
            if ($rootScope.link == 'main') return;
            $("#wrapper").toggleClass("toggled");
            if ($("#wrapper").hasClass('toggled')) {
                $rootScope.filterOn = true;
                $(".item-to-hide").removeClass('hidden');
            } else {
                $rootScope.filterOn = true;
                $rootScope.filterChangeGlobal();
                $rootScope.setDataForDefaultFilter();
                $("#js-navbar-collapse").find("ul > li").removeClass("active");
                $("#filter-control").addClass("active");
                $(".item-to-hide").addClass('hidden');
            }
        }

        /**
         * Redirect to home page
         */
        function redirect() {
            $location.path('/');
        }

        $scope.userSignin = {};
        $scope.userSignup = {};
        $scope.userProfile = {};
        $scope.checkEmail;
        $scope.checkPassword;
        $scope.checkSignIn = true;
        $scope.checkConfirmPassword;
        $scope.checkFullName;
        $scope.checkNewPassword;
        $scope.checkConfirmNewPassword;
        $scope.disabledButton;
        $scope.loading = false;

        /**
         * Login with provider
         * Ex: facebook,...
         */
        $scope.oauthLogin = function (provider) {

            // Send GA data
            $window.ga('send', {
                hitType: 'event',
                eventCategory: 'Đăng nhập tài khoản',
                eventAction: 'Đăng nhập',
                eventLabel: ''
            });

            var providerData = getProviderData(provider);
            if (provider == 'facebook') {
                /**
                 * Signin with facebook
                 */
                auth.$signInWithPopup(providerData)
                    .then(function (authData) {
                        return createUserProfile(authData.user);
                    }).then(function (userProfile) {
                        $('#signInModal').modal('hide');
                        redirect();
                    }).catch(function (error) {
                        console.log("login error");
                        console.log(error);
                    });
            } else {
                /**
                 * Sigin with email and password
                 */
                //Check validate
                if (!checkValidate()) {
                    $scope.checkSignIn = true;
                    return;
                }

                //Signin
                $scope.disabledButton = true;
                $scope.loading = true;
                $scope.checkSignIn = true;
                auth.$signInWithEmailAndPassword($scope.userSignin.email, $scope.userSignin.password)
                    .then(function (data) {
                        $('#signInModal').modal('hide');
                        $scope.disabledButton = false;
                        $scope.loading = false;
                        redirect();
                    }).catch(function (err) {
                        $scope.disabledButton = false;
                        $scope.loading = false;
                        if (err.code) {
                            $scope.checkSignIn = false;
                        }
                    });
            }
        };

        $scope.oauthSignUp = function () {
            $scope.checkSignUpMessage = '';
            // Check validate
            if (!checkValidate('signup'))
                return;

            // Send GA data
            $window.ga('send', {
                hitType: 'event',
                eventCategory: 'Đăng ký tài khoản',
                eventAction: 'Đăng ký',
                eventLabel: ''
            });

            // Signup
            $scope.disabledButton = true;
            $scope.loading = true;
            auth.$createUserWithEmailAndPassword($scope.userSignup.email, $scope.userSignup.password)
                .then(function (data) {
                    $rootScope.userTmp = {
                        email: $scope.userSignup.email,
                        displayName: $scope.userSignup.fullName,
                        phoneNumber: $scope.userSignup.phoneNumber,
                    }
                    return createUserProfile(data, 'password');
                })
                .then(function (data) {
                    $('#signUpModal').modal('hide');
                    $scope.disabledButton = false;
                    $scope.loading = false;
                    redirect();
                }).catch(function (err) {
                    $scope.disabledButton = false;
                    $scope.loading = false;
                    if (err.code) {
                        $scope.checkSignUp = false;
                        if (err.code == 'auth/email-already-in-use')
                            $scope.checkSignUpMessage = 'Email đã được sử dụng bởi người dùng khác.';
                        else
                            $scope.checkSignUpMessage = err.message;
                    }
                });
        }

        /**
         * Logout ad redirect to hompage
         */
        $scope.logout = function () {
            // var obj = {};
            // obj[authDataSave.uid] = false;
            // disconnectRef.set(obj);
            auth.$signOut();
            if ($rootScope.$userRef)
                $rootScope.$userRef.$destroy();
            $location.path('/');
        };

        /**
         * Open popup to download superstock guide
         */
        $rootScope.openGuideModal = function ($event) {
            $event.preventDefault();
            $('#superStockGuideModal').modal('show');
        };

        /**
         * This function only use for development
         * active and deavtive account
         */
        $rootScope.activeDeactiveAccount = function (userID, $event) {
            $event.preventDefault();
            var $userRef;
            var promise = new Promise(function (resolve, reject) {
                var $user = $firebaseObject(Ref.child('users/' + userID));
                $userRef = $user;
                $user.$loaded(function (user) {
                    if (user && user.account) {
                        resolve(user);
                    } else {
                        reject();
                    }
                });
            })

            promise.then(function (user) {
                return new Promise(function (resolve, reject) {
                    var $user = Ref.child('users/' + userID);
                    var data = {
                        active: true
                    };
                    if (user.account.active) {
                        data.active = false;

                    }
                    if (data.active) {
                        var date = new Date();
                        date.setDate(date.getUTCDate() + 1);
                        data.expired_date = date.getFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
                    } else {
                        data.expired_date = '';
                    }
                    $user.child('account').set(data, function (err) {
                        if (err) {
                            reject();
                        } else {
                            $rootScope.user.account.active = data.active;
                            if (data.expired_date)
                                $rootScope.user.account.expired_date = new Date(data.expired_date);
                            resolve();
                        }
                    });
                });
            }).then(function () {
                $($event.target).parent().addClass('hidden');
                if ($userRef)
                    $userRef.$destroy();
            }).catch(function (e) {
                $($event.target).parent().addClass('hidden');
                if ($userRef)
                    $userRef.$destroy();
            });
        };

        /**
         * Open signin form
         */
        $scope.signInForm = function () {
            $scope.checkEmail = true;
            $scope.checkPassword = true;
            $scope.checkSignIn = true;
            $scope.checkConfirmPassword = true;
            $scope.checkFullName = true;
            $scope.loading = false;
            $scope.userSignin = {};
            $('#signInModal').modal('show');
        };

        /**
         * Open signup form
         */
        $scope.signUpForm = function () {
            $scope.checkEmail = true;
            $scope.checkPassword = true;
            $scope.checkSignUp = true;
            $scope.checkConfirmPassword = true;
            $scope.checkFullName = true;
            $scope.checkPhoneNumber = true;
            $scope.loading = false;
            $scope.userSignup = {};
            $('#signUpModal').modal('show');
        };

        /**
         * Open change password form
         */
        $scope.changePasswordForm = function () {
            $scope.checkEmail = true;
            $scope.checkPassword = true;
            $scope.checkSignIn = true;
            $scope.checkConfirmPassword = true;
            $scope.checkFullName = true;
            $scope.checkPhoneNumber = true;
            $scope.loading = false;
            $scope.userSignup = {};
            $('#changePasswordModal').modal('show');
        };

        /**
         *
         */
        $scope.changeProfileForm = function () {
            $('#changeProfileModal').modal('show');
        };

        /**
         * Change password function
         */
        $scope.checkChangePassword = true;
        $scope.changePassword = function () {
            if (!checkValidate('changePassword')) {
                $scope.checkChangePassword = true;
                return;
            }
            //Change password
            $scope.loading = true;
            auth.$updatePassword($scope.userProfile.newPassword)
                .then(function (data) {
                    $('#changePasswordModal').modal('hide');
                    $scope.disabledButton = false;
                    $scope.loading = false;
                }).catch(function (err) {
                    $scope.disabledButton = false;
                    $scope.loading = false;
                    if (err.code) {
                        $scope.checkChangePassword = false;
                    }
                });
        }

        /**
         * Change profile function
         */

        $scope.checkChangeProfile = true;
        $scope.changeProfile = function () {
            if (!checkValidate('changeProfile')) {
                $scope.checkChangeProfile = true;
                return;
            }

            if ($rootScope.user) {
                $scope.loading = true;
                $scope.disabledButton = true;
                var $user = Ref.child('users/' + $rootScope.user.uid);
                $user.update({
                    'profile/fullName': $scope.userProfile.fullName,
                    'profile/phoneNumber': $scope.userProfile.phoneNumber,
                })
                .then(function() {
                    $scope.$apply(function() {
                        $scope.checkChangeProfile = true;
                        $rootScope.user.displayName = $scope.userProfile.fullName;
                        $rootScope.user.phoneNumber = $scope.userProfile.phoneNumber;
                    });
                    $('#changeProfileModal').modal('hide');
                    $scope.disabledButton = false;
                    $scope.loading = false;
                })
                .catch(function(err) {
                    console.error('Error while updating profile for user', $scope.userProfile, err);
                    $scope.checkChangeProfile = false;
                    $('#changeProfileModal').modal('hide');
                    $scope.disabledButton = false;
                    $scope.loading = false;
                })
            }
        }

        /**
         * Create or update user profile when login
         */
        function createUserProfile(userData, type) {
            var user = userData.toJSON();
            return new Promise(function (resolve, reject) {
                var $user = $firebaseObject(Ref.child('users/' + user.uid));
                $rootScope.$userRef = $user;
                $user.$loaded(function (userProfile) {
                    if (userProfile) {
                        user.account = userProfile.account;
                        resolve(user);
                    } else {
                        resolve();
                    }
                });
            }).then(function (user) {
                if (!user)
                    user = userData.toJSON();
                return new Promise(function (resolve, reject) {
                    if(!user.uid) {
                        console.error('There is no uid, user created failed', user);
                        reject();
                    }
                    function getProfile() {
                        var profile = {
                            fullName: user.displayName,
                            email: user.email,
                        };
                        if (type == 'password') {
                            profile.fullName = $scope.userSignup.fullName;
                            profile.phoneNumber = $scope.userSignup.phoneNumber;
                        }
                        if (user.providerData && user.providerData[0]) {
                            profile.email = user.providerData[0].email;
                        }
                        return profile;
                    }

                    var profile = getProfile();
                    var $user = Ref.child('users/');
                    $user.child(user.uid).update({
                        'profile/fullName': profile.fullName,
                        'profile/email': profile.email,
                    })
                    .then(function(err) {
                        console.log('Saving user fullName and email success', err);
                        $rootScope.fullName = $scope.userSignup.fullName;
                        resolve(profile);
                    })
                    .catch(function(err) {
                        console.error('Error while setting userProfile', profile, err);
                        reject();
                    })

                })
            });
        }

        /**
         * Get provider data for login
         * Ex: facebook,...
         */
        function getProviderData(provider) {
            var providerData = provider;
            if (provider == 'facebook') {
                providerData = new firebase.auth['Facebook' + "AuthProvider"]();
                for (var i in providerData) {
                    if (providerData[i] instanceof Array) {
                        providerData[i].push('email');
                    }
                }
            }
            return providerData;
        }

        function checkValidate(type) {
            var form = $scope.form;
            var user = $scope.userSignin;
            if (type == 'signup') {
                form = $scope.form_signup;
                user = $scope.userSignup;
            } else if (type == 'changePassword') {
                form = $scope.form_change_pasword;
                user = $scope.userProfile;
            } else if (type == 'changeProfile') {
                form = $scope.form_change_profile;
                user = $scope.userProfile;
            }

            var result = true;

            //Check email
            if (type != 'changePassword' && type != 'changeProfile' && ((user && !user.email) || !form.email.$valid)) {
                $scope.checkEmail = false;
                result = false;
            }
            else {
                $scope.checkEmail = true;
            }

            // Check password
            if (form.password && user && (!user.password || user.password.length < 7)) {
                $scope.checkPassword = false;
                result = false;
            }
            else {
                $scope.checkPassword = true;
            }

            // Check confirm password (if any in form)
            if (form && form.confirm_password) {
                if (user.password != user.confirmPassword || !user.confirmPassword) {
                    $scope.checkConfirmPassword = false;
                    result = false;
                } else {
                    $scope.checkConfirmPassword = true;
                }
            }

            // Check full name (if any in form)
            if (form && form.full_name) {
                //Check full name (if any in form)
                if (user && !user.fullName) {
                    $scope.checkFullName = false;
                    result = false;
                }
                else {
                    $scope.checkFullName = true;
                }
            }

            // Check new password
            if (form && form.new_password) {
                if (!user.newPassword || user.newPassword.length < 7) {
                    $scope.checkNewPassword = false;
                    result = false;
                } else {
                    $scope.checkNewPassword = true;
                }
            }

            // Check confirm new password
            if (form && form.confirm_new_password) {
                if (user.newPassword != user.confirmNewPassword || !user.confirmNewPassword) {
                    $scope.checkConfirmNewPassword = false;
                    result = false;
                } else {
                    $scope.checkConfirmNewPassword = true;
                }
            }

            // Check phone number
            if (form && form.phone_number) {
                if (!user.phoneNumber) {
                    $scope.checkPhoneNumber = false;
                    result = false;
                } else {
                    $scope.checkPhoneNumber = true;
                }
            }

            return result;
        }

        $(document).on('hidden.bs.modal', '.modal', function () {
            var $this = $(this);
            $scope.$apply(function () {
                $scope.checkEmail = true;
                $scope.checkPassword = true;
                $scope.checkSignIn = true;
                $scope.checkConfirmPassword = true;
                $scope.checkFullName = true;
                $scope.checkNewPassword = true;
                $scope.checkConfirmNewPassword = true;

            })
        });

        $(document).on('hidden.bs.modal', '.modal', function () {
            var $this = $(this);
            var $inputs = $this.find('input')
            $.each($inputs, function (index, value) {
                if ($(value).attr("name")) {
                    $(value).val('');
                }
            });
            $scope.$apply(function () {
                $scope.checkEmail = true;
                $scope.checkPassword = true;
                $scope.checkSignIn = true;
                $scope.checkSignUp = true;
                $scope.checkConfirmPassword = true;
                $scope.checkFullName = true;
                $scope.checkNewPassword = true;
                $scope.checkConfirmNewPassword = true;
                $scope.userSignin = {};
                $scope.userSignup = {};
                $scope.userProfile = {};
            })
        });

        $(document).on('shown.bs.modal', '#changeProfileModal', function () {
            $scope.$apply(function () {
                if ($rootScope.user) {
                    $scope.userProfile.fullName = $rootScope.user.displayName;
                    $scope.userProfile.phoneNumber = $rootScope.user.phoneNumber;
                }
            })
        });

        $(document).on('mouseenter', '.ag-cell', function () {
            var $this = $(this);
            var $parent = $this.parent();
            var $cells = $parent.find('.ag-cell');
            $cells.addClass('ag-cell-hover-bg');
        });

        $(document).on('mouseleave', '.ag-cell', function () {
            var $this = $(this);
            var $parent = $this.parent();
            var $cells = $parent.find('.ag-cell');
            $cells.removeClass('ag-cell-hover-bg');
        });

        $rootScope.mainSelected = '';
        $rootScope.fullSelected = '';
        $(document).on('click', '.ag-cell', function () {
            var $this = $(this);
            var symbolVal = $this.find('div').first().data('symbol');
            if ($rootScope.link == 'main')
                $rootScope.mainSelected = symbolVal;
            else
                $rootScope.fullSelected = symbolVal;
            var $agRows = $('.ag-row.clicked');
            var $parent = $this.parent();
            var $cells = $parent.find('.ag-cell');
            $agRows.find('.ag-cell').removeClass('ag-cell-focus-bg');
            $parent.addClass('clicked');
            $cells.addClass('ag-cell-focus-bg');
        });

    })