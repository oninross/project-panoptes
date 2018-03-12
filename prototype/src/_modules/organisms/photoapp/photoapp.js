'use strict';

import { ripple, toaster } from '../../../_assets/panoptes/js/_material';
import { iOS } from '../../../_assets/panoptes/js/_helper';

export default class Photoapp {
    constructor() {
        if ($('.photoapp').length) {
            const that = this,
                $window = $(window),
                API_KEY = 'API_KEY';

            that.$window = $window;
            that.$message = $('.photoapp__message');
            that.$viewer = $('.photoapp__viewer');
            that.$controls = $('.photoapp__controls');
            that.$camera = $('.photoapp__btn.-camera');
            that.$loader = $('.photoapp__loader');
            that.$percent = that.$loader.find('.percent');
            that.rotation = 0;
            that.photoAppView;

            $('.js-take-photo').on('click', function () {
                $('.js-open-photo').trigger('click');
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
                            that.$controls.addClass('-preview').removeClass('-disabled');

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
                        };
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

        that.photoAppView.destroy();
        that.$message.text('tap to snap a photo');
        that.$viewer.removeClass('-disabled -preview');
        that.$controls.addClass('-disabled').removeClass('-preview');
        that.$camera.removeClass('-hide');
        that.$loader.addClass('-hide');
        that.$percent.text('0%');
        $('.photoapp__img').unwrap().attr('src', '');
    }
}
