(function () {
    var __class__ = (function () {
        const ClassName = 'PromotionMocks';
        let specificCupFreeMock = {
            status: 'success',
            data: {
                ruleId: 3,
                ruleLevel: 'orderRule',
                ruleType: 'specificCupFree',
                itemNo: [
                    {
                        id: 102,
                        qty: 1,
                        discount: '3.30',
                    },
                ],
                getNoFromOrder: 'Y',
                n1: '1',
                n2: '1',
                itemCodes: [],
                discountType: 'p',
                discountValue: '100',
                discountAmount: '3.30',
            },
        };

        // done
        let lowerPriceCupFreeMock = {
            status: 'success',
            data: {
                ruleId: 4,
                ruleLevel: 'orderRule',
                ruleType: 'lowerPriceCupFree',
                itemNo: [
                    {
                        id: 103,
                        qty: 1,
                        discount: '2.60',
                    },
                    {
                        id: 104,
                        qty: 1,
                        discount: '3.30',
                    },
                ],
                getNoFromOrder: 'N',
                n1: 6,
                n2: 2,
                itemCodes: [],
                discountType: 'p',
                discountValue: '100',
                discountAmount: '5.90',
            },
        };

        // done
        // 百分比折扣
        let discountOffMock = {
            status: 'success',
            data: {
                ruleId: 1,
                ruleLevel: 'orderRule',
                ruleType: 'discountOff',
                itemNo: [],
                getNoFromOrder: 'N',
                n1: '0',
                n2: '0',
                itemCodes: [],
                discountType: 'p',
                discountValue: '10.00',
                discountAmount: '0.52',
            },
        };

        // done
        // 現金折扣
        let moneyDiscountMock = {
            status: 'success',
            data: {
                ruleId: 2,
                ruleLevel: 'orderRule',
                ruleType: 'discountMoney',
                itemNo: [],
                getNoFromOrder: 'N',
                n1: '0',
                n2: '0',
                itemCodes: [],
                discountType: 'm',
                discountValue: '50.00',
                discountAmount: '1.65',
            },
        };

        let secondCupDiscountMock = {
            status: 'success',
            data: {
                ruleId: 5,
                ruleLevel: 'orderRule',
                ruleType: 'secondCupDiscount',
                itemNo: [
                    {
                        id: 108,
                        qty: 1,
                        discount: '1.65',
                    },
                ],
                getNoFromOrder: 'Y',
                n1: '2',
                n2: '1',
                itemCodes: [],
                discountType: 'p',
                discountValue: '50.00',
                discountAmount: '1.65',
            },
        };

        let itemsFreeMock = {
            status: 'success',
            data: {
                ruleId: 6,
                ruleLevel: 'itemRule',
                ruleType: 'itemDiscountOff',
                itemNo: [],
                getNoFromOrder: 'N',
                n1: '0',
                n2: '0',
                itemCodes: [
                    {
                        item_code: '00010003',
                        discount: '100',
                    },
                    {
                        item_code: '37f1b829-2cce-4e3b-8b74-75e26ae4f19e',
                        discount: '100',
                    },
                ],
                discountType: 'p',
                discountValue: '0',
                discountAmount: '2.00',
            },
        };

        let failedMock = {
            status: 'fail',
            code: 0,
            message: 'Invalid coupon code.',
        };

        function getMockData(barcode) {
            switch (barcode) {
                case '1':
                    return specificCupFreeMock;
                case '2':
                    return lowerPriceCupFreeMock;
                case '3':
                    return discountOffMock;
                case '4':
                    return secondCupDiscountMock;
                case '5':
                    return itemsFreeMock;
                case '6':
                    return moneyDiscountMock;
                default:
                    return failedMock;
            }
        }

        return {
            specificCupFreeMock: specificCupFreeMock,
            lowerPriceCupFreeMock: lowerPriceCupFreeMock,
            discountOffMock: discountOffMock,
            secondCupDiscountMock: secondCupDiscountMock,
            itemsFreeMock: itemsFreeMock,
            moneyDiscountMock: moneyDiscountMock,
            getMockData: getMockData,
        };
    })();

    var PromotionMocks = (window.PromotionMocks = __class__);
})();
