'use strict';

import firebase from 'firebase';
import Croppie from '../../../../node_modules/croppie/croppie';
import { ripple, toaster } from '../../../_assets/panoptes/js/_material';
import { iOS } from '../../../_assets/panoptes/js/_helper';
import Hammer from '../../../../node_modules/hammerjs/hammer.min';

export default class Photoapp {
    constructor() {
        if ($('.photoapp').length) {
            const that = this,
                polaroid = document.querySelector('.photoapp__polaroid'),
                $window = $(window)
                API_KEY = 'API_KEY';

            that.socket = io();
            that.$window = $window;
            that.$message = $('.photoapp__message');
            that.$polaroid = $('.photoapp__polaroid');
            that.$viewer = $('.photoapp__viewer');
            that.$controls = $('.photoapp__controls');
            that.$camera = $('.photoapp__btn.-camera');
            that.$loader = $('.photoapp__loader');
            that.$percent = that.$loader.find('.percent');
            that.isFlicked = false;
            that.rotation = 0;
            that.photoAppView;

            $('.js-take-photo').on('click', function () {
                $('.js-open-photo').trigger('click');
            });

            var hammertime = new Hammer(polaroid);

            hammertime.get('swipe').set({
                direction: Hammer.DIRECTION_VERTICAL
            });

            hammertime.on('swipe', function (e) {
                if (e.angle < 0) {
                    toaster('Uploading image');

                    that.$message.text('');
                    that.$viewer.removeClass('-preview');
                    that.$window.off('devicemotion');
                    that.isFlicked = true;
                    that.flickPhoto();
                }
            });

            $('.js-open-photo').on('change', function (e) {
                const $this = $(this),
                    tgt = e.target || window.event.srcElement,
                    photoAppImg = document.querySelector('.photoapp__img'),
                    hiddenBtn = document.querySelector('.photoapp__hidden'),
                    files = tgt.files,
                    square = $window.width() - 50;

                that.$message.text('crop and rotate');
                that.$camera.addClass('-hide');

                $('body').animate({
                    scrollTop: $(document).height(),
                }, {
                        duration: 500,
                        easing: 'easeOutExpo'
                    });

                // FileReader support
                if (FileReader && files && files.length) {
                    var fr = new FileReader();

                    fr.onload = function (e) {
                        var json = {
                            'requests': [
                                {
                                    'image': {
                                        'content': fr.result.replace('data:image/jpeg;base64,', '')
                                    },
                                    'features': [
                                        {
                                            'type': 'SAFE_SEARCH_DETECTION',
                                            'maxResults': 200
                                        }
                                    ]
                                }
                            ]
                        };

                        // $.ajax({
                        //     type: 'POST',
                        //     url: 'https://vision.googleapis.com/v1/images:annotate?key=' + API_KEY,
                        //     dataType: 'json',
                        //     data: JSON.stringify(json),
                        //     contentType: 'application/json',
                        //     success: function (data) {
                        //         if (that.getLikelihood(data.responses[0].safeSearchAnnotation.adult) > 3 || that.getLikelihood(data.responses[0].safeSearchAnnotation.violence) > 3) {
                        //             // Inappropriate Images
                        //             that.$message.text('sorry! you are not allowed to do that!');

                        //             that.$controls.addClass('-preview');
                        //             that.$viewer.addClass('-preview');
                        //         } else {
                        //             that.$controls.removeClass('-disabled');
                        //         }
                        //     },
                        //     error: function (err) {
                        //         console.log('ERRORS: ' + err);
                        //     }
                        // });

                        photoAppImg.src = fr.result;

                        photoAppImg.onload = function () {
                            if ($('.croppie-container').length) {
                                that.photoAppView.bind({
                                    url: photoAppImg.src
                                });
                            } else {
                                that.photoAppView = new Croppie(photoAppImg, {
                                    enableOrientation: true,
                                    viewport: {
                                        height: square,
                                        width: square
                                    },
                                    showZoomer: false
                                });
                            }

                            that.getOrientation(hiddenBtn.files[0], function (orientation) {
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

                            setTimeout(function () {
                                that.photoAppView.rotate(that.rotation);
                            }, 50);
                        };
                    };

                    fr.readAsDataURL(files[0]);
                } else {
                    // fallback -- perhaps submit the input to an iframe and temporarily store
                    // them on the server until the user's session ends.
                }
            });

            $('.js-rotate-photo').on('click', function (e) {
                const $this = $(this);

                if ($this.parent().hasClass('-preview')) {
                    return false;
                };

                that.photoAppView.rotate(-90);
            });

            $('.js-delete-photo').on('click', function (e) {
                const $this = $(this);

                if ($('.croppie-container').length) {
                    that.reset();
                };
            });

            $('.js-crop-photo').on('click', function (e) {
                const $this = $(this);

                if ($this.parent().hasClass('-preview')) {
                    return false;
                };

                that.$message.text('are you happy with your photo?');
                that.$polaroid.removeClass('-hide');
                that.$controls.addClass('-preview');
                that.$viewer.addClass('-preview');

                that.photoAppView.result({
                    type: 'base64',
                    size: {
                        width: 500,
                        height: 500
                    }
                }).then(function (base64) {
                    that.$polaroid.find('img').attr('src', base64);
                });

                that.$window.on('devicemotion', function (e) {
                    that.deviceMotion(e, that)
                });
            });
        }
    }

    getLikelihood(likelihood) {
        switch(likelihood) {
            case 'UNKNOWN':
                return 0;
                break;
            case 'VERY_UNLIKELY':
                return 1;
                break;
            case 'UNLIKELY':
                return 2;
                break;
            case 'POSSIBLE':
                return 3;
                break;
            case 'LIKELY':
                return 4;
                break;
            case 'VERY_LIKELY':
                return 5;
                break;
        }
    }

    deviceMotion(e, that) {
        if (iOS() && e.originalEvent.acceleration.y > 15 && !that.isFlicked) {
            that.isFlicked = true;
            console.log('flick')
            that.flickPhoto();
        } else if (!iOS() && e.originalEvent.acceleration.y < -15 && !that.isFlicked) {
            that.isFlicked = true;
            console.log('flick')
            that.flickPhoto();
        }
    }

    flickPhoto() {
        const that = this,
            fbDB = firebase.database(),
            storage = firebase.storage(),
            fbDBref = fbDB.ref(),
            storageRef = storage.ref();

        var progress = 0,
            newPostRef,
            url,
            date,
            name,
            task,
            f;

        that.$window.off('devicemotion');
        that.$loader.removeClass('-hide');
        that.$viewer.addClass('-disabled');
        that.$controls.addClass('-disabled');
        that.$polaroid.addClass('-throw');

        that.photoAppView.result({
            type: 'base64',
            size: {
                width: 500,
                height: 500
            }
        }).then(function (base64) {
            that.socket.emit('photo flick', base64);
        });

        newPostRef = fbDBref.child('image');
        date = new Date();

        that.photoAppView.result({
            type: 'blob',
            size: {
                width: 500,
                height: 500
            }
        }).then(function (blob) {
            name = "/" + date.getTime() + ".jpg";
            f = storageRef.child(name);
            task = f.put(blob);

            task.on('state_changed', function (snapshot) {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                console.log('Upload is ' + progress + '% done');
                that.$percent.text(progress + '%');
            }, function (error) {
                toaster("Unable to save image. -_-");
                toaster(JSON.stringify(error));
                that.$viewer.addClass('-disabled');
                that.$controls.removeClass('-disabled');
                that.$loader.addClass('-hide');
            }, function () {
                url = task.snapshot.downloadURL;

                newPostRef.push({
                    "src": url
                }).then(function () {
                    toaster('Upload successful! ^_^');

                    that.reset();
                });
            });
        });
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

        that.isFlicked = false;
        that.photoAppView.destroy();
        that.$message.text('tap to snap a photo');
        that.$viewer.removeClass('-disabled -preview');
        that.$controls.addClass('-disabled').removeClass('-preview');
        that.$camera.removeClass('-hide');
        that.$loader.addClass('-hide');
        that.$polaroid.addClass('-hide').removeClass('-throw');
        that.$percent.text('0%');
        $('.photoapp__img').unwrap().attr('src', '');
    }
}
