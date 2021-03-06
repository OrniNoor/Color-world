/*
 * Paintbucket jQuery plugin for HTML5 canvas
 *
 * Copyright (c) 2016 Erik Wibowo
 * Licensed under the MIT license.
 */
(function ($) {
  var _ = {}; // to hold internal functions

  var DEFAULT_FILL_COLOR = '#ffff00';
  var ACTIVE = 'active';
  var FILL_COLOR = 'fill-color';
  var PAINTBUCKET_ACTIVE = 'paintbucket-active';

  $.Paintbucket = function (featureElement, canvasSelector, options) {

    var canvasCursor = options && options.cursor ? options.cursor : 'pointer';

    var $featureElement = $(featureElement);
   
    $featureElement.data(FILL_COLOR, DEFAULT_FILL_COLOR);
    $featureElement.data(PAINTBUCKET_ACTIVE, ACTIVE);

    var el = $(canvasSelector).get(0);
    if (!(el instanceof HTMLCanvasElement)) {
      throw new TypeError("Invalid element type. Only usable on HTMLCanvasElement.");
    }

    var canvas = el;
    var ctx = canvas.getContext('2d');

    var devicePixelRatio = window.devicePixelRatio || 1,
        backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1,
        //ratio = devicePixelRatio / backingStoreRatio;
ratio=1;
    var w = canvas.getBoundingClientRect().width * ratio,
        h = canvas.getBoundingClientRect().height * ratio;
		const bWidth = document.documentElement.clientWidth;
const bHeight = document.documentElement.clientHeight;
   // canvas.width = Math.round(bWidth * 0.5);
   // canvas.height =Math.round(bHeight - 130);

    var clickHandler = function (event) {
     // _css(canvas, 'cursor', 'progress');

      var canvasBoundingRect = canvas.getBoundingClientRect();
      var canvasWidth = canvas.width,
          canvasHeight = canvas.height,
          top = canvasBoundingRect.top,
          left = Math.floor(canvasBoundingRect.left); // in case of non-integer value e.g. due to css width setting as percentage

      var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

      var pos = _.getFirstComponentIndexOfPixelAtXY((event.clientX - left) * ratio, (event.clientY - top) * ratio, canvasWidth);

      var colorAtClickedSpot = {
        r: imageData.data[pos],
        g: imageData.data[pos + 1],
        b: imageData.data[pos + 2],
        a: imageData.data[pos + 3]
      };

      var pickedColor = $featureElement.data(FILL_COLOR);

      _.applyColor(imageData, pickedColor, colorAtClickedSpot, pos);

      ctx.putImageData(imageData, 0, 0);

     // _css(canvas, 'cursor', canvasCursor);
    };

    $featureElement.click(function () {
		
     if($("#bucketTool").attr("class")=="slected") {
        $(this).data(PAINTBUCKET_ACTIVE, ACTIVE);
        canvas.addEventListener('click', clickHandler);
       // _css(canvas, 'cursor', canvasCursor);
      }
       else {
        $(this).data(PAINTBUCKET_ACTIVE, '');
        canvas.removeEventListener('click', clickHandler);
       // _css(canvas, 'cursor', 'default');
      } 
	});
    $("#freeTool").click(function () {
      $(this).data(PAINTBUCKET_ACTIVE, '');
      canvas.removeEventListener('click', clickHandler); 
   
    });
    return this;
  };

  _.applyColor = function (imageData, pickedColorHex, colorAtClickedSpot, clickedIndex) {
    //var pickedColor = hex2rgb(pickedColorHex.replace('#', ''));
	var cc = document.getElementById("selectedCol").innerHTML.split(",");
	var pickedColor = {r:cc[0],g:cc[1],b:cc[2]};
    _applyColor(clickedIndex, imageData, colorAtClickedSpot, pickedColor);
  };

  var _applyColor = function (refPosition, imageData, colorAtClickedSpot, pickedColor) {
    var imageComponentWidth = (imageData.width * 4);

    var refPos = refPosition;
    var left = _.calcLeftBoundary(refPos, imageComponentWidth);
    var right = _.calcRightBoundary(refPos, imageComponentWidth);

    var refPosStack = [refPosition];

    while (refPosStack.length) {
      refPos = refPosStack.pop();
      while (_.equalsColorAtClickedSpotAndNotPickedColor(imageData, refPos, colorAtClickedSpot, pickedColor)) {
        refPos -= imageComponentWidth;
        left = _.calcLeftBoundary(refPos, imageComponentWidth);
        right = _.calcRightBoundary(refPos, imageComponentWidth);
      }

      refPos += imageComponentWidth;
      left = _.calcLeftBoundary(refPos, imageComponentWidth);
      right = _.calcRightBoundary(refPos, imageComponentWidth);

      while (_.equalsColorAtClickedSpotAndNotPickedColor(imageData, refPos, colorAtClickedSpot, pickedColor)) {
        imageData.data[refPos] = pickedColor.r;
        imageData.data[refPos + 1] = pickedColor.g;
        imageData.data[refPos + 2] = pickedColor.b;
        imageData.data[refPos + 3] = 255; // fill solid color

        if (left <= refPos) {
          if (_.equalsColorAtClickedSpotAndNotPickedColor(imageData, refPos - 4, colorAtClickedSpot, pickedColor)) {
            refPosStack.push(refPos - imageComponentWidth - 4);
          }
        }

        if (refPos < right) {
          if (_.equalsColorAtClickedSpotAndNotPickedColor(imageData, refPos + 4, colorAtClickedSpot, pickedColor)) {
            refPosStack.push(refPos - imageComponentWidth + 4);
          }
        }

        refPos += imageComponentWidth;
        left = _.calcLeftBoundary(refPos, imageComponentWidth);
        right = _.calcRightBoundary(refPos, imageComponentWidth);
      }
    }
  };

  _.calcLeftBoundary = function (refPos, imageComponentWidth) {
    return refPos - (refPos % imageComponentWidth);
  };

  _.calcRightBoundary = function (refPos, imageComponentWidth) {
    return _.calcLeftBoundary(refPos, imageComponentWidth) + imageComponentWidth;
  };

  _.equalsColorAtClickedSpotAndNotPickedColor = function (imageData, refPos, colorAtClickedSpot, pickedColor) {
    return _.colorEquals(imageData, refPos, colorAtClickedSpot) &&
          !_.colorEquals(imageData, refPos, pickedColor);
  };

  _.colorEquals = function (imageData, idx, color) {
    if (_.isZeroTransparent(imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2], imageData.data[idx + 3])) {
      return _.isZeroTransparent(color.r, color.g, color.b, color.a);
    }
    return imageData.data[idx] === color.r &&
        imageData.data[idx + 1] === color.g &&
        imageData.data[idx + 2] === color.b;
  };

  _.isZeroTransparent = function (r, g, b, a) {
    return r === 0 && g === 0 && b === 0 && a === 0;
  };

  _.getFirstComponentIndexOfPixelAtXY = function (x, y, width) {
    return (y * width + x) * 4;
  };

  var hex2rgb = function (hexValue) {
    var tokens = /^(..)(..)(..)$/.exec(hexValue);

    if (tokens) {
      var rgb = tokens.slice(1).map(function (hex) {
        return parseInt(hex, 16);
      });

      return {r: rgb[0], g: rgb[1], b: rgb[2]};
    }
  };

  var _css = function (element, styleName, value) {
    element.style[styleName] = value;
  };

  $.fn.paintbucket = function (canvasSelector, options) {
    return this.each(function () {
      (new $.Paintbucket(this, canvasSelector, options));
      if (options && options.exposeInternals) {
        $(this).data('internals', _);
      }
    });
  };

}(jQuery));
