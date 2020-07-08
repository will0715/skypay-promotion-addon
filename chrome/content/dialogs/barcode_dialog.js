(function () {
    var inputObj = window.arguments[0];

    function startup() {
        document.getElementById('coupon_code').focus();

        doSetOKCancel(
            function () {
                inputObj.couponBarcode = GeckoJS.String.trim(
                    document.getElementById('coupon_code').value
                );
                inputObj.ok = true;
                return true;
            },
            function () {
                inputObj.ok = false;
                return true;
            }
        );
    }

    window.addEventListener('load', startup, false);
})();
