// By JunM。
// Please refer to Readme.md

let piexif = require("scripts/piexif");
let utils = require("scripts/utils");
let htmlLoadingTemplate = $file.read("/assets/html/loading.html").string;
let exifObjOriginal = null; // Store exif data of original photo.
let imageData = null;
let imageFormat = "";
let validPhotoFormatList = ["jpg", "JPG", "jpeg", "JPEG"];


let imageDataBase64 = null;
let userData = {
    apiKey: null
}; // TinyJPG api key.


let color_jsbox = $color("tint");

let rcHex = ("00" + ((color_jsbox.runtimeValue().invoke("redComponent") * 255).toString(16))).split(".")[0].slice(-2,);
let gcHex = ("00" + ((color_jsbox.runtimeValue().invoke("greenComponent") * 255).toString(16))).split(".")[0].slice(-2,);
let bcHex = ("00" + ((color_jsbox.runtimeValue().invoke("blueComponent") * 255).toString(16))).split(".")[0].slice(-2,);
let colorHex = `#${rcHex}${gcHex}${bcHex}`;
console.log(colorHex);
htmlLoadingTemplate = htmlLoadingTemplate.replace(/backgroundColorToBeReplaced/, colorHex);


const loadingFileView = {
    props: {
        id: "loadingFileView",
        title: $l10n("Loading Files ..."),
    },
    views: [
        {
            type: "web",
            props: {
                id: "web_view_test",
                html: htmlLoadingTemplate
            },
            layout: $layout.fill,
            events: {}
        }
    ]
};

const uploadingView = {
    props: {
        id: "uploadingView",
        title: $l10n("Uploading to TinyPNG ..."),
    },
    views: [
        {
            type: "web",
            props: {
                id: "web_view_test",
                html: htmlLoadingTemplate
            },
            layout: $layout.fill,
            events: {}
        }
    ]
};

const downloadingView = {
    props: {
        id: "downloadingView",
        title: $l10n("Downloading compressed photo ..."),
    },
    views: [
        {
            type: "web",
            props: {
                id: "web_view_test",
                html: htmlLoadingTemplate
            },
            layout: $layout.fill,
            events: {}
        }
    ]
};


function stopToast() {
    $ui.clearToast();
}


function stopScript() {
    utils.tapticTaptic(3);
    stopToast();
    $context.close();
    $app.close();
}


// Tell whether TinyJPG key exists
function query_tiny_jpg_key() {
    let p = new Promise(function (resolve, reject) {


        userData = $cache.get("userData");
        if (userData === undefined || userData.apiKey === null || userData.apiKey === undefined) {
            // let user input key

            $ui.alert({
                // TODO i18n
                title: $l10n("KEY Not Found"),
                message: $l10n("The PhotoCompress script uses piexif to process exif info and uses tinyJPG(also known as tinyPNG) to compress photos. You can compress JPG JPEG and PNG. If you choose a 'photo', your exif info will be saved, so your timeline will not be messed up."),
                actions: [
                    {
                        title: $l10n("I Have The Key"),
                        handler: function () {
                            // let user input key.
                            $input.text({
                                placeholder: $l10n("Input The Key (If You Have)"),
                                handler: function (text) {
                                    let apiKeyInput = text;
                                    $cache.set("userData", {
                                        "apiKey": apiKeyInput,
                                    });
                                    resolve("Whatever");
                                }
                            });
                        }
                    },
                    {
                        title: $l10n("Jump To TinyJPG And Apply (Free)"),
                        handler: function () {
                            // Jump to TinyJPG Page.
                            $delay(0.5, function () {
                                $app.openURL("https://tinyjpg.com/developers");
                                stopScript();
                            });

                        }
                    },
                    {
                        title: $l10n("Cancel"),
                        handler: function () {
                            stopScript();
                        }
                    }
                ]
            });
        } else {
            // apiKey = userData.apiKey;
            resolve("Whatever");
        }
    });
    return p;
}


// Upload photo to TinyJPG to compress
// Save compressed photo (with exif)
function compressPhoto(originalPhotoData) {
    return new Promise(function (resolve, reject) {
        $ui.render(uploadingView);
        $http.request({
            method: "POST",
            url: "https://api.tinify.com/shrink",
            header: {
                Authorization: "Basic " + $text.base64Encode("api:" + userData.apiKey),
            },
            body: originalPhotoData,
            handler: function (resp) {
                let response = resp.response;
                if (response.statusCode === 201 || response.statusCode === 200) {
                    let compressedImageUrl = response.headers["Location"];
                    $ui.render(downloadingView);
                    $http.download({
                        url: compressedImageUrl,
                        handler: function (resp_) {
                            if (resp_.data) {
                                imageData = resp_.data;
                                console.log("typeof image_data:\n");
                                console.log(typeof imageData);

                                if (validPhotoFormatList.indexOf(imageFormat) !== -1) {
                                    imageData = generate_new_photo_with_original_exif(imageData);
                                }

                                $photo.save({
                                    data: imageData,
                                    handler: function (result) {
                                        if (result === true) {

                                            if ($file.exists("RESULT." + imageFormat.toUpperCase())) {
                                                $file.delete("RESULT." + imageFormat.toUpperCase())
                                            }

                                            if (imageFormat.toUpperCase() === "JPG" || imageFormat.toUpperCase() === "JPEG" || imageFormat.toUpperCase() === "PNG") {
                                                $file.write({
                                                    data: imageData,
                                                    path: "RESULT." + imageFormat.toUpperCase()
                                                })
                                            }

                                            $push.schedule({
                                                title: $l10n("Compression Complete"),
                                                body: $l10n("Saved To Album, Use 3D Touch To Preview.") + "\n" + $l10n("Key Usage This Month: ") + response.headers["compression-count"] + " / 500",
                                                id: "generalNotificationIdByJunM",
                                                sound: "string",
                                                attachments: ["RESULT." + imageFormat.toUpperCase()],
                                                mute: false,
                                                repeats: false,
                                                script: null,
                                                renew: false,
                                                handler: function (result) {
                                                }
                                            });


                                            if (parseInt(response.headers["compression-count"]) >= 480) {
                                                $push.schedule({
                                                    title: $l10n("Usage Warning"),
                                                    body: $l10n("Key Usage This Month: ") + response.headers["compression-count"] + " / 500" + "\n" + $l10n("Please Change Your Key.") + $l10n("The Current Key:") + userData.apiKey,
                                                    id: null,
                                                    sound: "string",
                                                    mute: false,
                                                    repeats: false,
                                                    script: null,
                                                    renew: false,
                                                    handler: function (result) {
                                                    }
                                                });
                                            }
                                            $delay(1.5, function () {
                                                stopScript();
                                            });
                                            resolve("Whatever");
                                        } else {
                                            $ui.alert({
                                                title: "Error",
                                                message: result
                                            });
                                            stopScript();
                                        }
                                    }
                                })
                            }
                        }
                    })
                } else if (response.statusCode === 401) {

                    $ui.alert({
                        title: $l10n("Verification Failed"),
                        message: $l10n("Please make sure you have input the right key. Clear the script cache and input again if necessary.") + "\n\n" + $l10n("The Current Key:") + "\n\n"
                            + userData.apiKey,
                        actions: [
                            {
                                title: $l10n("Clear Saved Key"),
                                handler: function () {
                                    $cache.set("userData", {
                                        "apiKey": null,
                                    });
                                    stopScript();
                                }
                            },
                            {
                                title: $l10n("Cancel"),
                                handler: function () {
                                    stopScript();
                                }
                            }
                        ]
                    });
                    stopScript();
                } else if (response.statusCode === 429) {

                    $ui.alert({
                        title: $l10n("Verification Failed"),
                        message: $l10n("Error code 429. Key usage 500 / 500. Please change the key.") + "\n\n" + $l10n("The Current Key:") + "\n\n"
                            + userData.apiKey,
                        actions: [
                            {
                                title: $l10n("Clear Saved Key"),
                                handler: function () {
                                    $cache.set("userData", {
                                        "apiKey": null,
                                    });
                                    stopScript();
                                }
                            },
                            {
                                title: $l10n("Cancel"),
                                handler: function () {
                                    stopScript();
                                }
                            }
                        ]
                    });
                    stopScript();
                } else {
                    $ui.alert({
                        title: $l10n("Compression Failed"),
                        message: response,
                        actions: [
                            {
                                title: $l10n("Clear Saved Key"),
                                handler: function () {
                                    $cache.set("userData", {
                                        "apiKey": null,
                                    });
                                    stopScript();
                                }
                            },
                            {
                                title: $l10n("Cancel"),
                                handler: function () {
                                    stopScript();
                                }
                            }
                        ]
                    });
                    stopScript();
                }
            }
        });
    });
}


function store_original_exif(originalPhotoData) {

    return new Promise(function (resolve, reject) {
        imageDataBase64 = "data:image/jpg;base64," + $text.base64Encode(originalPhotoData);
        console.log("imageDataBase64:");
        console.log(imageDataBase64);

        exifObjOriginal = piexif.load(imageDataBase64);
        console.log("exifObjOriginal[\"0th\"]:");
        console.log(exifObjOriginal["0th"]);
        resolve("Whatever");
    });
}


function generate_new_photo_with_original_exif(compressed_photo_data_without_exif) {
    exifObjOriginal["0th"][piexif.ImageIFD.Orientation] = 0; // Avoid rotate
    let exifbytes = piexif.dump(exifObjOriginal);
    imageDataBase64 = "data:image/jpg;base64," + $text.base64Encode(compressed_photo_data_without_exif);
    let new_photo_base64 = piexif.insert(exifbytes, imageDataBase64);
    return $data({
        url: new_photo_base64
    })
}


// TODO
// Destroy all existing notifications
$delay(1, function () {
    $push.cancel({id: "generalNotificationIdByJunM"})
});


if (($app.env !== $env.app) && ($app.env !== $env.action)) {
    let jump_url = "jsbox://run?name=" + $text.URLEncode($addin.current.name);
    $ui.alert({
        title: $l10n("Please run in JSBox APP"),
        actions: [
            {
                title: "Jump to JSBox APP",
                handler: function () {
                    $app.openURL(jump_url);
                }
            },
            {
                title: "Exit",
                handler: function () {
                    utils.stopScript();
                }
            }
        ]
    })
} else if ($app.env === $env.action) {
    // TODO Tips

    let jump_url = "jsbox://run?name=" + $text.URLEncode($addin.current.name) + "&use_clipboard=true";
    if ($context.data) {
        $clipboard.image = $context.data;
        $context.close();
        $app.openURL(jump_url);
    } else {
        utils.stopScript();
    }
} else if ($app.env === $env.app) {
    $ui.toast("Start");
    $ui.render(loadingFileView
    );

    query_tiny_jpg_key().then(function () {
        if ($context.query["latest"] === "true") {
            $photo.fetch({
                count: 1,
                format: "data",
                handler: function (images) {
                    imageData = images[0];
                    imageFormat = imageData.info["mimeType"].slice(6,);
                    // $ui.alert(imageFormat);
                    if (validPhotoFormatList.indexOf(imageFormat) !== -1) {
                        store_original_exif(imageData).then(function () {
                            compressPhoto(imageData);
                        });
                    } else {
                        // $ui.alert("2");
                        compressPhoto(imageData);
                    }
                }
            });
        } else if ($context.query["use_clipboard"] === "true") {
            imageData = $clipboard.image;
            imageFormat = imageData.info["mimeType"].slice(6,);
            if (validPhotoFormatList.indexOf(imageFormat) !== -1) {
                store_original_exif(imageData).then(function () {
                    compressPhoto(imageData);
                });
            } else {
                compressPhoto(imageData);
            }
        } else {
            $photo.pick({
                multi: false,
                format: "data",
                handler: function (resp) {
                    if (resp["status"] === true) {
                        imageData = resp.data;
                        imageFormat = imageData.info["mimeType"].slice(6,);
                        if (validPhotoFormatList.indexOf(imageFormat) !== -1) {
                            store_original_exif(imageData).then(function () {
                                compressPhoto(imageData);
                            });
                        } else {
                            compressPhoto(imageData);
                        }
                    } else if (resp["status"] === false) {
                        utils.stopScript();
                    }
                }
            })
        }
    });
} else {
    $ui.alert($l10n("Please run this script in JSBox app or share sheet."));
    stopScript();
}







