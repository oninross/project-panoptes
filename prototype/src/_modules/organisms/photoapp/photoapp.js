'use strict';

import { ripple, toaster } from '../../../_assets/natseye/js/_material';
import { BASE_URL, iOS } from '../../../_assets/natseye/js/_helper';

export default class Photoapp {
    constructor() {
        if ($('.photoapp').length) {
            const that = this,
                $window = $(window);

            that.$window = $window;
            that.$message = $('.photoapp__message');
            that.$viewer = $('.photoapp__viewer');
            that.$camera = $('.photoapp__btn.-camera');
            that.rotation = 0;

            $('.js-take-photo').on('click', function () {
                $('.js-open-photo').trigger('click');
            });

            $('.js-open-photo').on('change', function (e) {
                let $this = $(this),
                    tgt = e.target || window.event.srcElement,
                    photoAppImg = document.querySelector('.photoapp__img'),
                    files = tgt.files,
                    square = $window.width() - 50;

                that.hiddenBtn = document.querySelector('.photoapp__hidden');
                that.$message.text('analysing image');
                that.$viewer.removeClass('-hide');
                that.$camera.addClass('-hide');

                // FileReader support
                if (FileReader && files && files.length) {
                    var fr = new FileReader();

                    fr.onload = function (e) {
                        var image = new Image(),
                            frRes = fr.result,
                            dataUrl;

                        image.onload = function (imageEvent) {

                            // Resize the image using canvas
                            var canvas = document.createElement('canvas'),
                                max_size = 300,// TODO : max size for a pic
                                width = image.width,
                                height = image.height;
                            if (width > height) {
                                if (width > max_size) {
                                    height *= max_size / width;
                                    width = max_size;
                                }
                            } else {
                                if (height > max_size) {
                                    width *= max_size / height;
                                    height = max_size;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            canvas.getContext('2d').drawImage(image, 0, 0, width, height);

                            //Getting base64 string;
                            dataUrl = canvas.toDataURL('image/jpeg');

                            $.ajax({
                                type: 'POST',
                                url: '//' + BASE_URL + '/godsEye',
                                dataType: 'json',
                                data: JSON.stringify({
                                    file: files,
                                    image: dataUrl
                                }),
                                contentType: 'application/json',
                                success: function (data) {
                                    console.log(data);

                                    var classes = data.images[0].classifiers[0].classes;

                                    if (classes.length) {
                                        that.$message.text(classes[0].class);

                                        that.speak('en-US', 'native', 'It\'s ' + that.checkForVowel(classes[0].class) + classes[0].class);
                                    } else {
                                        that.$message.text('unknown image');
                                        that.speak('en-US', 'native', 'Sorry, Watston does\'t know what that is.');
                                    }

                                },
                                error: function (err) {
                                    that.$message.text('oops! something went wrong');
                                    console.warn('ERROR');
                                    console.log(err);
                                }
                            });
                        }

                        image.src = e.target.result;

                        photoAppImg.src = frRes;

                        photoAppImg.onload = function () {
                            that.getOrientation(that.hiddenBtn.files[0], function (orientation) {
                                switch (orientation) {
                                    case 8:
                                        that.rotation = -90;
                                        break;
                                    case 3:
                                        that.rotation = 180;
                                        break;
                                    case 6:
                                        that.rotation = 90;
                                        break;
                                }
                            });
                        };
                    };

                    fr.onerror = function (e) {
                        console.error(e);
                    };

                    fr.readAsDataURL(files[0]);
                } else {
                    // fallback -- perhaps submit the input to an iframe and temporarily store
                    // them on the server until the user's session ends.
                }
            });

            $('.js-delete-photo').on('click', function (e) {
                const $this = $(this);

                that.reset();
            });
        }
    }

    checkForVowel(str) {
        let word = str,
            firstLetter = word.charAt(0);


        if (firstLetter.match(/[aeiouAEIOU]/)) {
            return ' an ';
        } else {
            return ' a ';
        }
    }

    getOrientation(file, callback) {
        const reader = new FileReader();

        reader.onload = function (event) {
            var view = new DataView(event.target.result);

            if (view.getUint16(0, false) != 0xFFD8) {
                return callback(-2)
            };

            var length = view.byteLength,
                offset = 2;

            while (offset < length) {
                var marker = view.getUint16(offset, false);
                offset += 2;

                if (marker == 0xFFE1) {
                    if (view.getUint32(offset += 2, false) != 0x45786966) {
                        return callback(-1);
                    }

                    var little = view.getUint16(offset += 6, false) == 0x4949;

                    offset += view.getUint32(offset + 4, little);

                    var tags = view.getUint16(offset, little);

                    offset += 2;

                    for (var i = 0; i < tags; i++) {
                        if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                            return callback(view.getUint16(offset + (i * 12) + 8, little));
                        }
                    }
                } else if ((marker & 0xFF00) != 0xFF00) {
                    break;
                } else {
                    offset += view.getUint16(offset, false);
                }
            }

            return callback(-1);
        };

        reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
    }

    reset() {
        const that = this;

        that.hiddenBtn.value = '';
        that.$message.text('tap to snap a photo');
        that.$viewer.addClass('-hide').removeClass('-disabled -preview');
        that.$camera.removeClass('-hide');
        $('.photoapp__img').removeAttr('src');
    }

    speak(newLang, newVoice, string) {
        var that = this;

        that.canITalk();

        // Create a new instance of SpeechSynthesisUtterance.
        var msg = new SpeechSynthesisUtterance();

        // Set the text.
        msg.text = string;

        msg.volume = 1; // 0 to 1
        msg.rate = 1; // 0.1 to 10
        msg.pitch = 1; //0 to 2

        // Set the language
        msg.lang = newLang;


        // If a voice has been selected, find the voice and set the
        // utterance instance's voice attribute.
        msg.voice = speechSynthesis.getVoices().filter(function (voice) {
            return voice.name == newVoice;
            // native
            // Google Deutsch
            // Google US English
            // Google UK English Female
            // Google UK English Male
            // Google español
            // Google español de Estados Unidos
            // Google français
            // Google हिन्दी
            // Google Bahasa Indonesia
            // Google italiano
            // Google 日本語
            // Google 한국의
            // Google Nederlands
            // Google polski
            // Google português do Brasil
            // Google русский
            // Google 普通话（中国大陆）
            // Google 粤語（香港）
            // Google 國語（臺灣）
        })[0];


        window.speechSynthesis.speak(msg);

        // msg.onend = function(e) {
        //     console.log('Finished in ' + event.elapsedTime + ' seconds.');
        // };
    }

    canITalk() {
        if (iOS()) {
            return false;
        }

        var SpeechSynthesisUtterance = window.webkitSpeechSynthesisUtterance || window.mozSpeechSynthesisUtterance || window.msSpeechSynthesisUtterance || window.oSpeechSynthesisUtterance || window.SpeechSynthesisUtterance;

        if (SpeechSynthesisUtterance === undefined) {
            return false;
        }
    }
}
