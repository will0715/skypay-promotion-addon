(function () {
    // include project locale properties
    GeckoJS.StringBundle.createBundle(
        'chrome://skypay_promotion/locale/messages.properties'
    );

    // include viviconnect settings model
    include('chrome://viviconnect/content/models/viviconnect_setting.js');

    // TODO: to jsc
    // include core
    include('chrome://skypay_promotion/content/skypay_promotion_settings.jsc');
    include('chrome://skypay_promotion/content/skypay_promotion_http.jsc');
    include(
        'chrome://skypay_promotion/content/controllers/main_controller.jsc'
    );
    include(
        'chrome://skypay_promotion/content/controllers/promotion_controller.jsc'
    );
    include(
        'chrome://skypay_promotion/content/controllers/settings_controller.js'
    );

    // mainWindow register ejournal
    var mainWindow = Components.classes[
        '@mozilla.org/appshell/window-mediator;1'
    ]
        .getService(Components.interfaces.nsIWindowMediator)
        .getMostRecentWindow('Vivipos:Main');

    if (mainWindow === window) {
        let SkypayPromotionMain = GeckoJS.Controller.getInstanceByName(
            'SkypayPromotionMain'
        );
        //do something when vivipos startup
        window.addEventListener(
            'ViviposStartup',
            function () {
                SkypayPromotionMain.initial();
            },
            false
        );

        var main = GeckoJS.Controller.getInstanceByName('Main');
        if (main) {
            //do something before ecr's main controller initial
            main.addEventListener('beforeInitial', function () {});

            //do something after ecr's main controller initial
            main.addEventListener('afterInitial', function () {});

            //do something before viviecr restart
            window.addEventListener('unload', function () {}, false);
        }
    }
})();
