function sayHello() {
    $ui.alert($l10n('HELLO_WORLD'));
}

function tapticTaptic(repeatTimes) {
    for (let i = 0; i <= repeatTimes; i++) {
        $delay(0.3 * i, function () {
            $device.taptic(2);
        })
    }
}

function stopScript() {
    tapticTaptic(3);
    $ui.clearToast();
    $context.close();
    $app.close();
}

// TODO
function showTips() {

}

module.exports = {
    sayHello: sayHello,
    tapticTaptic: tapticTaptic,
    stopScript: stopScript
};