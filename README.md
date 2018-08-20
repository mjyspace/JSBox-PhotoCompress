By [JunM](https://t.me/jun_m)

功能：<br><br>
在基本不影响画质的前提下，有效压缩照片占用的空间。<br><br>
并且压缩后的照片会保留原始照片的 EXIF 信息，不会打乱相册的时间线，适合希望在手机上保留原文件又希望节省一些空间的情形。<br><br><br>

第三方调用：<br><br>
调用 [TinyJPG (TinyPNG)](https://tinyjpg.com/) 的 API 进行照片压缩，<br><br>
调用 [piexifjs 库](https://github.com/hMatoba/piexifjs) 进行照片的 EXIF
信息的读取和写入。<br><br>

使用说明：

从相册的照片分享菜单运行 OR 直接在 JSBox 中运行。<br><br>

PS:<br><br>
由于 piexifjs 的限制，对 EXIF 的写入操作仅支持 JPG、JPEG 和 TIFF，所以本脚本不适用于 HEIF
格式。

如果有更完善的用于操作 EXIF 的 JS 库，欢迎反馈告知。<br><br>

# TODO &use_clipboard=true



安装链接：

[文件链接](https://github.com/mjyspace/JSBox/blob/master/Photo%20Compress/.output/Photo%20Compress.box?raw=true)

[JSBox 安装链接](https://xteko.com/redir?name=Photo%20Compress&url=https%3A%2F%2Fgithub.com%2Fmjyspace%2FJSBox%2Fblob%2Fmaster%2FPhoto%2520Compress%2F.output%2FPhoto%2520Compress.box%3Fraw%3Dtrue&author=JunM)