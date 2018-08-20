// By JunM。
// Please refer to Readme.md

// let app = require("scripts/app");
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
// console.log(htmlLoadingTemplate);
console.log(colorHex);
htmlLoadingTemplate = htmlLoadingTemplate.replace(/background-color-to-be-replaced/, colorHex);
// console.log(htmlLoadingTemplate);


// let in_jpg = $file.read("/assets/in.jpg");
// console.log(in_jpg);

// app.sayHello();

// let imageData = in_jpg;
// console.log(typeof imageData);
// console.log(imageData);
//
// imageData = "data:image/jpg;base64," + $text.base64Encode(imageData);
// console.log(imageData);


// exifObjOriginal = piexif.load(imageData);
// console.log(exifObjOriginal);
// console.log(exifObjOriginal["0th"]);
// console.log($text.base64Decode(imageData.substring(22,)));


// $app.close();

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
                title: "没有检测到 KEY",
                message: "脚本调用 TinyJPG 的 API 进行图片压缩，KEY 是免费获取的，\n一个 KEY 每个月可以压缩 500 张照片，\n" +
                    "每月重置使用量，\n如果有更多需求，可以考虑注册多个 KEY。\n\n\n1、填写名字（随意填写）、自己的邮箱即可\n" +
                    "2、通过邮箱收到的链接查看自己的 KEY",
                actions: [
                    {
                        title: "我已经有 Key 了",
                        handler: function () {
                            // let user input key.
                            $input.text({
                                placeholder: `请输入 TinyJPG 的 KEY`,
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
                        title: "跳转到 TinyJPG 网站 KEY 获取页面",
                        handler: function () {
                            // Jump to TinyJPG Page.
                            $delay(0.5, function () {
                                $app.openURL("https://tinyjpg.com/developers");
                                stopScript();
                            });

                        }
                    },
                    {
                        title: "取消",
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
        // $ui.toast("正在上传图片至 TinyPNG……", 60);
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
                    // $ui.toast("正在压缩……", 30);
                    let compressedImageUrl = response.headers["Location"];
                    // $ui.toast("正在下载压缩后的图片……", 60);
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
                                                title: "压缩完成",
                                                body: "已保存至相册，使用 3D Touch 预览。  \n" + "本 KEY 本月已用：" + response.headers["compression-count"] + " / 500",
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
                                                    title: "用量提示",
                                                    body: "本 KEY 本月已用：" + response.headers["compression-count"] + " / 500" + "\n请尽快更换为新 KEY" + "当前 KEY 为：" + userData.apiKey,
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
                        title: "验证失败",
                        message: "请确认 API KEY 填写正确，如果有误，可以清除本脚本的缓存，重新输入。\n\n当前填写的 KEY 为：\n\n"
                            + userData.apiKey,
                        actions: [
                            {
                                title: "清除已存储的 KEY",
                                handler: function () {
                                    $cache.set("userData", {
                                        "apiKey": null,
                                    });
                                    stopScript();
                                }
                            },
                            {
                                title: "取消",
                                handler: function () {
                                    stopScript();
                                }
                            }
                        ]
                    });
                    stopScript();
                } else if (response.statusCode === 429) {

                    $ui.alert({
                        title: "验证失败",
                        message: "错误码 429，当前的 KEY 本月使用次数已经达到上限。\n\n当前填写的 KEY 为：\n\n"
                            + userData.apiKey,
                        actions: [
                            {
                                title: "清除已存储的 KEY",
                                handler: function () {
                                    $cache.set("userData", {
                                        "apiKey": null,
                                    });
                                    stopScript();
                                }
                            },
                            {
                                title: "取消",
                                handler: function () {
                                    stopScript();
                                }
                            }
                        ]
                    });
                    stopScript();
                } else {
                    $ui.alert({
                        title: "压缩失败",
                        message: response,
                        actions: [
                            {
                                title: "清除已存储的 KEY",
                                handler: function () {
                                    $cache.set("userData", {
                                        "apiKey": null,
                                    });
                                    stopScript();
                                }
                            },
                            {
                                title: "取消",
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
    $ui.alert("请在 JSBox 主应用中 或 通过分享菜单运行本脚本");
    stopScript();
}






