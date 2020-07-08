(function () {
    var __controller__ = {
        name: 'SkypayPromotion',
        promotionName: 'skypay_discount',
        discountName: {
            discountOff: 'skypay_discount_discount_off',
            discountMoney: 'skypay_discount_discount_money',
            specificCupFree: 'skypay_discount_specific_cup_free',
            lowerPriceCupFree: 'skypay_discount_lower_price_cup_free',
            secondCupDiscount: 'skypay_discount_second_cup_discount',
            itemsFree: 'skypay_discount_items_free',
        },

        /**
         * Get order by id.
         *
         * @param {string} orderId - Order ID
         * @returns {Object|null}
         */
        getCouponPromotion: function (orderId) {
            let response = SkypayPromotionHttpService.api(
                'GET',
                '/order/' + orderId,
                {},
                false
            );

            return response;
        },

        /**
         * Get coupon promotion.
         *
         * @param {string} barcode - coupon barcode
         * @returns {Object|null}
         */
        getCouponPromotion: function (barcode) {
            let response = SkypayPromotionHttpService.api(
                'GET',
                '/coupon',
                {
                    code: barcode,
                },
                false
            );

            return response;
        },

        /**
         * Consume Coupon.
         *
         * @param {string} barcode - coupon barcode
         * @param {string} memberPhone - member phone
         * @returns {Object|null}
         */
        consumeCouponPromotion: function (barcode, memberPhone) {
            let response = SkypayPromotionHttpService.api(
                'POST',
                '/coupon/consume',
                {
                    code: barcode,
                    mobile: memberPhone,
                },
                false
            );

            return response;
        },

        isDiscountSkypayCoupon: function (name) {
            return (
                GeckoJS.BaseObject.getValues(this.discountName).indexOf(
                    name
                ) !== -1
            );
        },

        getItemSinglePrice: function (transactionItem) {
            return (
                transactionItem.current_price +
                transactionItem.current_condiment / transactionItem.current_qty
            );
        },

        couponPromotionProcess: function (promotionData) {
            let cart = GeckoJS.Controller.getInstanceByName('Cart');
            this.log('DEBUG', 'Promotion Data', promotionData);
            let totalDiscount = 0;

            switch (promotionData.ruleType) {
                case 'specificCupFree':
                    totalDiscount = this.processSpecificCupFree(promotionData);
                    break;
                case 'lowerPriceCupFree':
                    totalDiscount = this.processLowerPriceCupFree(
                        promotionData
                    );
                    break;
                case 'discountOff':
                    totalDiscount = this.processPercentageDiscount(
                        promotionData
                    );
                    break;
                case 'secondCupDiscount':
                    totalDiscount = this.processSecondCupDiscount(
                        promotionData
                    );
                    break;
                case 'discountMoney':
                    totalDiscount = this.processAmountDiscount(promotionData);
                    break;
                case 'itemDiscountOff':
                    totalDiscount = this.processItemsFreeBasic(promotionData);
                    break;
                default:
            }

            return totalDiscount;
        },

        // 百分比折扣
        processPercentageDiscount: function (promotionData) {
            let cart = GeckoJS.Controller.getInstanceByName('Cart');

            const discount = promotionData.discountValue;

            cart.addMarker('subtotal');
            cart._addDiscount(discount, '%', 'skypay_discount_discount_off');

            this.log('DEBUG', 'Percentage Discount: ' + discount + '%');
            return discount;
        },

        // 固定金額折扣
        processAmountDiscount: function (promotionData) {
            let cart = GeckoJS.Controller.getInstanceByName('Cart');

            const discount = promotionData.discountValue;

            cart.addMarker('subtotal');
            cart._addDiscount(discount, '$', 'skypay_discount_discount_money');

            this.log('DEBUG', 'Amount Discount: ' + discount + '$');
            return discount;
        },

        // 買1送1
        processSpecificCupFree: function (promotionData) {
            let cart = GeckoJS.Controller.getInstanceByName('Cart');
            let curTransaction = cart._getTransaction();

            const itemFreeCondition = promotionData.n1;
            const itemFreeCount = promotionData.n2;
            const itemFreePercentage = promotionData.discountValue;

            const selectIndex = cart._cartView.getSelectedIndex();
            const itemTrans = curTransaction.getItemAt(selectIndex);
            const itemQty = itemTrans.current_qty;

            const itemSinglePrice = this.getItemSinglePrice(itemTrans);

            if (itemQty < Number(itemFreeCondition) + Number(itemFreeCount)) {
                throw new Error('items count not enough');
            }

            const discount =
                itemSinglePrice * itemFreeCount * (itemFreePercentage / 100);

            cart._addDiscount(
                discount,
                '$',
                'skypay_discount_specific_cup_free'
            );
            this.log('DEBUG', 'Specific Cup Free: ' + discount + '$');
            return discount;
        },

        // 買x送y
        processLowerPriceCupFree: function (promotionData) {
            const self = this;
            let cart = GeckoJS.Controller.getInstanceByName('Cart');
            let curTransaction = cart._getTransaction();

            const itemCountCondition = promotionData.n1;
            const lowestCount = promotionData.n2;

            const transactionItemCount = curTransaction.data.qty_subtotal;

            // 品項數是否達標
            if (itemCountCondition > transactionItemCount) {
                throw new Error('items count not enough');
            }

            const transactionItems = GeckoJS.BaseObject.clone(
                curTransaction.data.items
            );

            // 按照單價由低到高排列
            const sortedTransactionItems = GeckoJS.BaseObject.getValues(
                transactionItems
            ).sort(function (a, b) {
                const aTotal = self.getItemSinglePrice(a);
                const bTotal = self.getItemSinglePrice(b);
                return aTotal - bTotal;
            });

            let totalDiscount = 0;
            let getItems = 0;
            for (
                let index = 0;
                index <= sortedTransactionItems.length &&
                getItems < lowestCount;
                index++
            ) {
                const transactionItem = sortedTransactionItems[index];
                const itemSinglePrice = this.getItemSinglePrice(
                    transactionItem
                );

                const needItemCount = lowestCount - getItems;
                // 如果品項總數 > 需要折扣的數量
                if (transactionItem.current_qty > needItemCount) {
                    totalDiscount += needItemCount * itemSinglePrice;
                    getItems += lowestCount;
                } else {
                    totalDiscount +=
                        transactionItem.current_qty * itemSinglePrice;
                    getItems += transactionItem.current_qty;
                }
            }

            cart.addMarker('subtotal');
            cart._addDiscount(
                totalDiscount,
                '$',
                'skypay_discount_lower_price_cup_free'
            );

            this.log('DEBUG', 'Lower Price Cup Free: ' + totalDiscount + '$');
            return totalDiscount;
        },

        // 第二件折扣
        processSecondCupDiscount: function (promotionData) {
            let cart = GeckoJS.Controller.getInstanceByName('Cart');
            let curTransaction = cart._getTransaction();

            const itemFreeCondition = promotionData.n1;
            const itemFreeCount = promotionData.n2;
            const itemFreePercentage = promotionData.discountValue;

            const selectIndex = cart._cartView.getSelectedIndex();
            const itemTrans = curTransaction.getItemAt(selectIndex);
            const itemQty = itemTrans.current_qty;

            const itemSinglePrice = this.getItemSinglePrice(itemTrans);

            if (itemQty < Number(itemFreeCondition)) {
                throw new Error('items count not enough');
            }

            const discount =
                itemSinglePrice * itemFreeCount * (itemFreePercentage / 100);

            cart._addDiscount(
                discount,
                '$',
                'skypay_discount_second_cup_discount'
            );

            this.log('DEBUG', 'Second Cup Discount: ' + discount + '$');
            return discount;
        },

        processItemsFreeBasic: function (promotionData) {
            let cart = GeckoJS.Controller.getInstanceByName('Cart');
            let curTransaction = cart._getTransaction();

            const discountItemCodes = promotionData.itemCodes.map(function (c) {
                return c.item_code;
            });

            let cartList = this._getCartlist();
            const cartItems = GeckoJS.BaseObject.clone(
                curTransaction.data.items
            );

            // 總折價
            let totalDiscount = 0;
            GeckoJS.BaseObject.getValues(cartItems).forEach(function (item) {
                let itemDiscount = 0;
                const itemIndex = item.index;
                const itemQty = item.current_qty;
                const discountPromoteItemIndex = discountItemCodes.indexOf(
                    item.no
                );
                if (discountPromoteItemIndex !== -1) {
                    const discountItem =
                        promotionData.itemCodes[discountPromoteItemIndex];
                    itemDiscount +=
                        item.current_price *
                        itemQty *
                        (discountItem.discount / 100);
                }

                // search condiment
                const condiments = item.condiments;
                GeckoJS.BaseObject.getValues(condiments).forEach(function (
                    condiment
                ) {
                    const discountPromoteItemIndex = discountItemCodes.indexOf(
                        condiment.condiment_id
                    );
                    if (discountPromoteItemIndex !== -1) {
                        const discountItem =
                            promotionData.itemCodes[discountPromoteItemIndex];
                        itemDiscount +=
                            condiment.price *
                            itemQty *
                            (discountItem.discount / 100);
                    }
                });

                // 如果有折價，新增discount
                if (itemDiscount > 0) {
                    let itemDisplay = curTransaction.getDisplayIndexByIndex(
                        itemIndex
                    );
                    cartList.selection.select(itemDisplay);
                    cart._addDiscount(
                        itemDiscount,
                        '$',
                        'skypay_discount_items_free'
                    );
                    totalDiscount += itemDiscount;
                }
            });

            return totalDiscount;
        },

        _getCartlist: function () {
            return document.getElementById('cartList');
        },

        destroy: function () {},
    };

    AppController.extend(__controller__);
})();
