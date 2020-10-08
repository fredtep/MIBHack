var adminWebApp = angular.module('captcha', ['ngAnimate', 'pascalprecht.translate']);
adminWebApp.config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useUrlLoader('getI18n');
    $translateProvider.preferredLanguage('fr');
    $translateProvider.useSanitizeValueStrategy(null);
}]);

adminWebApp.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);

adminWebApp.controller('captchaCtrl', function ($http, $scope, $location, $window, $translate, focus) {
    var cCtrl = this;
    $scope.currentPage = -1;

    // used only for old templates (not in Base64)
    var captchaUrl = 'captcha';
    $scope.captchaUrl = captchaUrl;
    this.lang = $location.search().lang;
    $translate.use(this.lang);
    $scope.showCaptchaAudio = false
    $scope.soundUrl = ""
    $scope.soundReady = false
    $scope.failedToGetAudio = false
    $scope.audio = new Audio()

    $scope.showCaptchaAudioFunc = function () {
        $scope.showCaptchaAudio = !$scope.showCaptchaAudio
        $scope.audio.pause()
        focus('capcha-audio-listen');
    }

    $scope.getAudioUrl = function() {
        $http({
            method: 'GET',
            url: 'captchaAudio',
        }).then(function successCallback(response) {
            $scope.soundReady = true
            $scope.soundUrl = response.data.downloadUrl
            $scope.failedToGetAudio = false
        }, function errorCallback(response) {
            $scope.soundReady = true
            $scope.failedToGetAudio = true

            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    // new templates
    $scope.getImageUrl = function() {
        $http({
            method: 'GET',
            url: 'captchaB64',
        }).then(function successCallback(response) {
            $scope.imageBytes = response.data
            $scope.getAudioUrl()
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    $scope.getImageUrl()

    $scope.playAudio = function() {
        $scope.audio.src = $scope.soundUrl
        setTimeout(function () {$scope.audio.play()},2000)
    };

    $scope.refresh = function () {
        $scope.soundReady = false
        $scope.audio.pause()
        $scope.getImageUrl()

        // for old templates
        $scope.captchaUrl = 'captcha?a=' + new Date().getTime();
    };

    focus('capcha-input');

    $scope.getRecipients = function () {
        $http({
            method: 'GET',
            url: 'nextRecipients'
        }).then(function successCallback(response) {
            let recipients = "";
            // foreach not working with IE
            for(let index in response.data) {
                if (recipients === "") {
                    recipients = recipients + response.data[index].email
                } else {
                    recipients = recipients + ", " + response.data[index].email
                }
            }
            $scope.recipientsData = response.data;
            $scope.recipients = recipients;
            $scope.currentPage++;
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.getFields = function () {
        $http({
            method: 'GET',
            url: 'getFields?timestamp=' + Date.now(),
        }).then(function successCallback(response) {
            $scope.data = response.data;
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.getRecipients();
    $scope.getFields();


    $scope.validate = function () {
        $http({
            method: 'POST',
            url: 'validate',
            data: $scope.word
        }).then(function successCallback(response) {
            var result = response.data;
            if (result.result == 'end') {
                //actualise
                $window.location.reload();
            } else if (result.result == 'notEnd') {
                $scope.getRecipients();
                $scope.refresh();
            } else {
                $scope.error = "bad word";
                $scope.refresh();
            }
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.refreshTemplate = function() {
        $http({
            method: 'POST',
            url: 'updateInvitation',
        }).then(function successCallback() {
            window.location.reload();
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }
});

adminWebApp.directive('eventFocus', function(focus) {
    return function(scope, elem, attr) {
        elem.on(attr.eventFocus, function() {
            focus(attr.eventFocusId);
        });

        scope.$on('$destroy', function() {
            elem.off(attr.eventFocus);
        });
    };
});

adminWebApp.factory('focus', function($timeout, $window) {
    return function(id) {
        $timeout(function() {
            var element = $window.document.getElementById(id);
            if(element)
                element.focus();
        });
    };
});
