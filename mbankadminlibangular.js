(function() {


// Config
angular.module('mbank.admin.lib.angular.config', [])
    .value('mbank.admin.lib.angular.config', {
        debug: true
    });
// Modules
var Mbank = angular.module('mbank.admin.lib.angular',
    [
        'mbank.admin.lib.angular.config'
    ]);

Mbank.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
}]);


Mbank.provider('$mbankAdminApi', function () {

    function MBankApiRequest (url, auth, type) {
        if (typeof url !== 'string' || typeof auth !== 'boolean' || ['post','get','delete'].indexOf(type) < 0)
            throw new TypeError("Not valid input parameters", arguments);

        this.url = url;
        this.auth = auth;
        this.type = type;
    }
    var __config = {
        url: 'http://api.mbank.dev/adm2/'
    }, __requests = {
        'services': new MBankApiRequest ('services', true, 'get')
    };

    return {
        set: function (name, value) {
            __config[name] = value;
        },
        request: function (name, options) {
            if (!name) throw new TypeError("Undefined name of request");
            __requests[name] = options;
            return __requests;
        },
        get: function (name) {
            return __config[name];
        },
        $$requests: function () {
            return __requests;
        },
        $get: MbankAdminApi
    }
});

MbankAdminApi.$inject = [
    '$http',
    '$log',
    'Base64'
];
function MbankAdminApi ($http, $log, Base64) {

    var credentials = '',
        availableTypes = ['post','get','delete', 'options'];

    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    })();

    function MbankApiService (url) {
        this.url = url;
    }
    MbankApiService.prototype.setCredentials = function (username, password) {
        credentials = Base64.encode(username+':'+password);
    };
    MbankApiService.prototype.$$request = function (url, auth, type, data) {
        auth = auth || false;
        if (auth) $http.defaults.headers.common['Authorization'] = 'Basic ' + credentials;
        else delete $http.defaults.headers.common['Authorization'];
        if (availableTypes.indexOf(type) < 0) throw new TypeError('Incorrect request type', type);

        var baseUrl = this.url || null;
        if (baseUrl == null) throw new TypeError("Undefined baseUrl");
        $log.debug("$$request", url, data, auth, type, arguments, $http.defaults.headers.common);

        return $http({
            method: type,
            url: this.url +url,
            data: data
        });
    };

    // wallet requests
    var requests = this.$$requests();
    for (var req in requests) {
        if (!requests.hasOwnProperty(req)) continue;

        if (requests[req].constructor.name === 'MBankApiRequest')
            MbankApiService.prototype[req] = (function (requestInfo) {
                var url = requestInfo.url,
                    auth = requestInfo.auth,
                    type = requestInfo.type;

                if (!requestInfo.type) throw new TypeError('Undefined requestInfo.type');

                return function (data) {
                    $log.debug(req, "::", data);
                    return this.$$request.apply(this, [url, auth, type, data]);
                };
            })(requests[req]);
    }

    MbankApiService.prototype.services = function () {
        return this.$$request('services', true, 'get');
    };
    return new MbankApiService(this.get('url'));

}

Mbank.factory('Base64', function () {
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };

    /* jshint ignore:end */
});

}());