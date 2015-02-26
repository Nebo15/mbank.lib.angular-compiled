(function() {


// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Gulp

// Config
angular.module('mbank.lib.angular.config', [])
	.value('mbank.lib.angular.config', {
	    debug: true
	});

// Modules
var Mbank = angular.module('mbank.lib.angular',
    [
        'mbank.lib.angular.config'
    ]);

Mbank.config(['$httpProvider','$mbankApiProvider', function($httpProvider, $mbankApiProvider) {
//    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
//    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    console.log('$mbankApiProvider', $mbankApiProvider);
    $mbankApiProvider.set('url', 'http://0.0.0.0:1234/api.mbank.nebo15.me/v1/');
}]);


Mbank.provider('$mbankApi', function () {


    function MBankApiRequest (url, auth, type) {
        if (typeof url !== 'string' || typeof auth !== 'boolean' || ['post','get','delete'].indexOf(type) < 0)
            throw new TypeError("Not valid input parameters", arguments);

        this.url = url;
        this.auth = auth;
        this.type = type;
    }
    var __config = {
        url: 'http://api.mbank.nebo15.me/v1/'
    }, __requests = {
        'options': new MBankApiRequest('options', true,'get'),
        'walletCreate': new MBankApiRequest ('wallet', false, 'post'),
        'walletActivate': new MBankApiRequest ('wallet/activate', false, 'post'),
        'walletResendCode': new MBankApiRequest ('wallet/resend_code', false, 'post'),
        'walletSendPasswordResetCode': new MBankApiRequest ('wallet/send_password_reset_code', false, 'post'),
        'walletResetPassword': new MBankApiRequest ('wallet/reset_password', false, 'post'),
        'walletGet': new MBankApiRequest ('wallet', true, 'get'),
        'walletDelete': {}, // not working on production environment
        'walletPersonSet': new MBankApiRequest ('wallet/person', true, 'post'),
        'walletPersonGet': new MBankApiRequest ('wallet/person', true,  'get'),
        'walletPictureUpload': new MBankApiRequest ('wallet/picture', true, 'post'),
        'walletPictureDelete': new MBankApiRequest ('wallet/picture', true, 'delete'),
        'walletFind': new MBankApiRequest ('wallet/find', true, 'post'),
        'walletReplenishmentPoints': new MBankApiRequest ('wallet/replenishment_points', true, 'get'),
        'walletSettings': new MBankApiRequest ('wallet/settings', true, 'post'),
        'services': new MBankApiRequest ('services', true, 'get'),
        'servicesListGroups': new MBankApiRequest ('services/groups', true, 'get'),
        'servicesOrder': new MBankApiRequest ('services/order', true, 'post'),
        'payments': new MBankApiRequest ('payments', true, 'post'),
        'cardsCreate': new MBankApiRequest ('cards', true, 'post'),
        'limits': new MBankApiRequest ('limits', true, 'get'), // limits of the user
        'invoiceCreate': new MBankApiRequest ('invoices', true, 'post'), // create the new invoice
        'invoices': new MBankApiRequest ('invoices', true, 'get'), // list of invoices for the user
        'invoicesCreated': new MBankApiRequest ('invoices/created', true, 'get') // list of invoices created by user

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
        $get: MbankApi
    }
});

MbankApi.$inject = [
    '$http',
    '$log',
    'Base64'
];
function MbankApi ($http, $log, Base64) {

    var credentials = '',
        availableTypes = ['post','get','delete'];

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
    var uuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    function MbankApiService (url) {
        this.url = url;
    }
    MbankApiService.prototype.Utils = {
        uuid: uuid
    };
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
        $log.debug("$$request", url, data, auth, type, arguments);

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
    // manual add some request to provide right interfaces

    // TODO: add methods to simplify payment creation

    var mongoDbIdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;

    MbankApiService.prototype.servicesGet = function (id) {
        id = parseInt(id) || null;
        if (!id) throw new TypeError("Not valid id of the service", id);
        return this.$$request('services/'+id, false, 'get');
    };
    MbankApiService.prototype.servicesMobile = function (mobile) {
        mobile = parseInt(mobile) || null;
        if (!mobile) throw new TypeError("Not valid mobile phone number", mobile);
        return this.$$request('services/mobile/'+mobile, false, 'get');
    };
    MbankApiService.prototype.paymentPay = function (paymentId) {
        paymentId = parseInt(paymentId) || null;
        if (!paymentId) throw new TypeError("Not valid paymentId", paymentId);
        return this.$$request('payments/'+paymentId+'/pay', true, 'post');
    };
    MbankApiService.prototype.paymentInfo = function (paymentId) {
        paymentId = parseInt(paymentId) || null;
        if (!paymentId) throw new TypeError("Not valid paymentId", paymentId);
        return this.$$request('payments/'+paymentId, true, 'get');
    };
    MbankApiService.prototype.paymentUpdate = function (paymentId) {
        paymentId = parseInt(paymentId) || null;
        if (!paymentId) throw new TypeError("Not valid paymentId", paymentId);
        return this.$$request('payments/'+paymentId, true, 'post');
    };
    MbankApiService.prototype.paymentsHistory = function (page, size) {
        page = parseInt(page);
        size = parseInt(size);
        if (typeof page !== 'number' || page < 0) throw new TypeError("Not valid page parameter", page);
        if (typeof size !== 'number' || size < 0) throw new TypeError("Not valid size parameter", size);

        return this.$$request('payments?page='+page+'&size='+size, true, 'get');
    };
    MbankApiService.prototype.cards = function (states) {
        var url = 'cards';
        if (Array.isArray(states)) url += '?state='+states.join();

        return this.$$request(url, true, 'get');
    };
    MbankApiService.prototype.cardInfo = function (cardId) {
        cardId = parseInt(cardId) || null;
        if (!cardId) throw new TypeError("Not valid cardId", cardId);

        return this.$$request('cards/'+cardId, true, 'get');
    };
    MbankApiService.prototype.cardDelete = function (cardId) {
        cardId = parseInt(cardId) || null;
        if (!cardId) throw new TypeError("Not valid cardId", cardId);
        return this.$$request('cards/'+cardId, true, 'delete');
    };
    MbankApiService.prototype.invoiceDublicate = function (invoiceId) {
        invoiceId = invoiceId.toString() || null;
        if (!mongoDbIdRegExp.text(invoiceId)) throw new TypeError("Not valid invoiceId", invoiceId);
        return this.$$request('invoices/'+invoiceId+'/dublicate', true, 'get');
    };
    MbankApiService.prototype.invoiceCancel = function (invoiceId) {
        invoiceId = invoiceId.toString() || null;
        if (!mongoDbIdRegExp.text(invoiceId)) throw new TypeError("Not valid invoiceId", invoiceId);
        return this.$$request('invoices/'+invoiceId+'/cancel', true, 'get');
    };
    MbankApiService.prototype.invoicePay = function (invoiceId) {
        invoiceId = invoiceId.toString() || null;
        if (!mongoDbIdRegExp.text(invoiceId)) throw new TypeError("Not valid invoiceId", invoiceId);
        return this.$$request('invoices/'+invoiceId+'/pay', true, 'post');
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