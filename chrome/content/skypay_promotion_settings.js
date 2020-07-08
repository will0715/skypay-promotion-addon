(function () {
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    var SkypayPromotionSettings = (window.SkypayPromotionSettings = function () {
        this.name = 'SkypayPromotionSettings';
    });

    SkypayPromotionSettings.settingFile = 'skypay_promotion_settings.ini';

    SkypayPromotionSettings._settings = false;
    /**
     * use ini for settings not database
     */
    SkypayPromotionSettings.read = function (refresh) {
        if (!this.isSetting()) return null;

        refresh = refresh || false;
        if (refresh) SkypayPromotionSettings._settings = false;
        if (SkypayPromotionSettings._settings)
            return SkypayPromotionSettings._settings;
        SkypayPromotionSettings._settings = {};
        var file = this.getSettingFile(); // nsILocalFile
        var iniparser = this.getINIParser(file); // nsIINIParser
        var keysEnum = iniparser.getKeys('main');

        while (keysEnum.hasMore()) {
            var key = keysEnum.getNext();

            var value = iniparser.getString('main', key);
            try {
                SkypayPromotionSettings._settings[key] = value.trim();
            } catch (e) {
                SkypayPromotionSettings._settings[key] = value;
            }
        }
        return SkypayPromotionSettings._settings;
    };

    SkypayPromotionSettings.isSetting = function () {
        var file = SkypayPromotionSettings.getSettingFile();

        return file.exists();
    };
    /**
     *
     * @return {nsILocalFile}
     */
    SkypayPromotionSettings.getSettingFile = function () {
        var extId = 'skypay_promotion@vivicloud.net';
        var factoryServicesIni = Cc['@mozilla.org/extensions/manager;1']
            .getService(Ci.nsIExtensionManager)
            .getInstallLocation(extId)
            .getItemFile(extId, 'skypay_promotion_settings.ini');
        return factoryServicesIni;
    };
    SkypayPromotionSettings.getINIParser = function (file) {
        var iniparser = Cc['@mozilla.org/xpcom/ini-parser-factory;1']
            .getService(Ci.nsIINIParserFactory)
            .createINIParser(file);
        return iniparser;
    };
    /**
     * get ini value
     *
     * @public
     * @static
     * @function
     * @name SkypayPromotionSettings.getIniValue
     * @return {Object}
     */
    SkypayPromotionSettings.getIniValue = function (
        section,
        prop,
        defaultValue
    ) {
        var iniFile = SkypayPromotionSettings.getSettingFile(); // nsILocalFile
        if (!iniFile) return defaultValue;
        var iniParser = SkypayPromotionSettings.getINIParser(iniFile); // nsIINIParser
        try {
            return iniParser.getString(section, prop);
        } catch (e) {
            return defaultValue;
        }
    };
})();
