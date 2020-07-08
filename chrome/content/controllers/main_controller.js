(function () {
    if (typeof AppController === 'undefined') {
        include('chrome://viviecr/content/controllers/app_controller.js');
    }

    var mainWindow = Components.classes[
        '@mozilla.org/appshell/window-mediator;1'
    ]
        .getService(Components.interfaces.nsIWindowMediator)
        .getMostRecentWindow('Vivipos:Main');
    var extMgr = Components.classes[
        '@mozilla.org/extensions/manager;1'
    ].getService(Components.interfaces.nsIExtensionManager);
    var extItem = extMgr.getItemForID('viviecr@firich.com.tw');

    const __controller__ = {
        name: 'SkypayPromotionMain',
        packageName: 'skypay_promotion',
        serviceName: 'skypay_promotion',
        components: ['Acl'],
        uses: ['ShiftMarker'],
        _cartController: null,
        settings: {},

        initial: function () {
            var cart = mainWindow.GeckoJS.Controller.getInstanceByName('Cart');
            if (cart) {
                cart.addEventListener('beforeSubmit', this.beforeSubmit, this);
                cart.addEventListener(
                    'afterVoidItem',
                    this.afterVoidItem,
                    this
                );
            }

            this.setUpSevice();
        },
        /**
         * Setup service.
         */
        setUpSevice: function () {
            //setup settings
            let settings = SkypayPromotionSettings.read(true);
            this.settings = settings;
            SkypayPromotionHttpService.load(settings);

            const token = GeckoJS.Configure.read(
                'vivipos.fec.settings.skypay_promotion.token'
            );

            SkypayPromotionHttpService.setToken(token);
        },

        couponDialog: function () {
            var mainWindow = (window.mainWindow = Components.classes[
                '@mozilla.org/appshell/window-mediator;1'
            ]
                .getService(Components.interfaces.nsIWindowMediator)
                .getMostRecentWindow('Vivipos:Main'));
            var aFeatures =
                'chrome,titlebar,toolbar,left=112,top=167,modal,width=' +
                760 +
                ',height=' +
                300;
            var aURL =
                'chrome://' +
                this.packageName +
                '/content/dialogs/barcode_dialog.xul';

            let curTransaction = this._getCartController()._getTransaction();

            let remainTotal =
                curTransaction != null ? curTransaction.getRemainTotal() : 0;
            let transactionSeq =
                curTransaction != null ? curTransaction.data.seq : null;
            if (remainTotal <= 0) {
                NotifyUtils.info(
                    _('Transaction amount is lower than 0, please check amount')
                );
                return;
            }
            if (!transactionSeq) {
                NotifyUtils.info(
                    _('Data error, please contact technical support')
                );
                return;
            }

            const skypayCouponData = curTransaction.data.skypay_coupon;
            if (skypayCouponData) {
                NotifyUtils.info(_('Already use Skypay coupon'));
                return;
            }

            var inputObj = {
                remainTotal: remainTotal,
                couponBarcode: null,
            };
            try {
                GREUtils.Dialog.openWindow(
                    this.topmostWindow,
                    aURL,
                    '',
                    aFeatures,
                    inputObj
                );
                if (inputObj.ok && inputObj.couponBarcode) {
                    this.couponPromotionProcess(inputObj.couponBarcode);
                }
            } catch (e) {
                this.log('ERROR', 'Window Open Error', e);
            }
        },

        couponPromotionProcess: function (couponBarcode) {
            const curTransaction = this._getCartController()._getTransaction();
            const skypayPromotionController = GeckoJS.Controller.getInstanceByName(
                'SkypayPromotion'
            );
            let waitPanel = this._showWaitPanel(
                _('Skypay Coupon is porcessing...')
            );

            try {
                // 掃碼取得促銷內容
                let promotionData = skypayPromotionController.getCouponPromotion(
                    couponBarcode
                );
                // 促銷API失敗
                if (!promotionData) {
                    throw new Error(
                        'Connection timeout! Can not use Skypay coupon system, please check the internet connection.'
                    );
                }
                // 促銷API業務失敗
                if (promotionData.status !== 'success') {
                    throw new Error(promotionData.message);
                }
                // 促銷處理
                const discount = skypayPromotionController.couponPromotionProcess(
                    promotionData.data
                );

                this.log('WARN', discount);
                // 寫入促銷使用紀錄
                this.dispatchEvent('afterUseSkypayCoupon', {
                    code: couponBarcode,
                    promotionData: promotionData.data,
                    discount: discount,
                });
                curTransaction.data.skypay_coupon = {
                    barcode: couponBarcode,
                    promotionData: promotionData,
                    discount: discount,
                };
                this._setWaitDescription(
                    _('Use Skypay Coupon success. Discount - %S', [
                        discount || 0,
                    ])
                );
                this.sleep(2000);
            } catch (e) {
                this.log('WARN', 'Coupon Promotion Process Error', e);
                this._setWaitDescription(_(e.message));
                this.sleep(2000);
            } finally {
                if (waitPanel) {
                    waitPanel.hidePopup();
                }
            }
        },

        beforeSubmit: function (event) {
            const curTransaction = this._getCartController()._getTransaction();
            const skypayPromotionController = GeckoJS.Controller.getInstanceByName(
                'SkypayPromotion'
            );
            const skypayCouponData = curTransaction.data.skypay_coupon;

            if (!skypayCouponData) {
                return;
            }

            const promotionData = skypayCouponData.promotionData;
            const barcode = skypayCouponData.barcode;

            // TODO: memberPhone
            const memberPhone = '';

            try {
                // 核銷
                let response = skypayPromotionController.consumeCouponPromotion(
                    barcode,
                    memberPhone
                );
                this.log('DEBUG', 'Consume Skypay Coupon', response);
                // 促銷API失敗
                if (!response) {
                    throw new Error(
                        'Connection timeout! Can not use Skypay coupon system, please check the internet connection.'
                    );
                }
                // 促銷API業務失敗
                if (response.status !== 'success') {
                    throw new Error(promotionData.message);
                }

                // NOTICE: 完成核銷不做動作?
                this.log('DEBUG', 'Consume Skypay Coupon Done');
            } catch (e) {
                NotifyUtils.info(_('%S', [e.message]));
                this.log('WARN', 'Consume Skypay Coupon Error', e);
            }
        },

        afterVoidItem: function (event) {
            const curTransaction = this._getCartController()._getTransaction();
            const skypayPromotionController = GeckoJS.Controller.getInstanceByName(
                'SkypayPromotion'
            );

            const name = event.data[1].name;
            const isSkypayCoupon = skypayPromotionController.isDiscountSkypayCoupon(
                name
            );

            if (isSkypayCoupon) {
                curTransaction.data.skypay_coupon = null;
            }
        },

        _getErrorMsg: function (result) {
            if (!result) return '';
            let errorMsg = _(result['Message']);
            return errorMsg;
        },

        // Get the cart controller
        _getCartController: function () {
            if (!this._cartController) {
                var mainWindow = Components.classes[
                    '@mozilla.org/appshell/window-mediator;1'
                ]
                    .getService(Components.interfaces.nsIWindowMediator)
                    .getMostRecentWindow('Vivipos:Main');
                this._cartController = mainWindow.GeckoJS.Controller.getInstanceByName(
                    'Cart'
                );
            }
            return this._cartController;
        },

        // Get the transaction
        _getTransaction: function () {
            return this._getCartController()._getTransaction();
        },

        // Get the formula management controller
        _getSkypayPromotionMainController: function () {
            if (!this._skypayPromotionMainController) {
                var mainWindow = Components.classes[
                    '@mozilla.org/appshell/window-mediator;1'
                ]
                    .getService(Components.interfaces.nsIWindowMediator)
                    .getMostRecentWindow('Vivipos:Main');
                this._skypayPromotionMainController = mainWindow.GeckoJS.Controller.getInstanceByName(
                    'SkypayPromotionMain'
                );
            }
            return this._skypayPromotionMainController;
        },

        /**
         * show wait panel
         *
         * @param {String} description
         */
        _showWaitPanel: function (description) {
            let caption = document.getElementById('wait_caption');
            if (caption) caption.label = description;

            // hide progress bar
            let progress = document.getElementById('progress');
            if (progress) progress.setAttribute('hidden', true);

            let waitPanel = document.getElementById('wait_panel');
            if (waitPanel) waitPanel.openPopupAtScreen(0, 0);

            // release CPU for progressbar ...
            this.sleep(100);

            return waitPanel;
        },
        /**
         * set wait description.
         *
         * @param {String}
         */
        _setWaitDescription: function (description) {
            let caption = document.getElementById('wait_caption');
            if (caption) caption.setAttribute('label', description);
        },
    };

    GeckoJS.Controller.extend(__controller__);
})();
