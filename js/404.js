//This is .js player
(function (root, factory) { if(typeof define === "function" && define.amd) { define( factory); } else if(typeof module === "object" && module.exports) { module.exports = factory(); } else { root.bodymovin = factory(); } }(window, function() {var svgNS = "http://www.w3.org/2000/svg";
var subframeEnabled = true;
var expressionsPlugin;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var cachedColors = {};
var bm_rounder = Math.round;
var bm_rnd;
var bm_pow = Math.pow;
var bm_sqrt = Math.sqrt;
var bm_abs = Math.abs;
var bm_floor = Math.floor;
var bm_max = Math.max;
var bm_min = Math.min;
var blitter = 10;

var BMMath = {};
(function(){
    var propertyNames = Object.getOwnPropertyNames(Math);
    var i, len = propertyNames.length;
    for(i=0;i<len;i+=1){
        BMMath[propertyNames[i]] = Math[propertyNames[i]];
    }
}());

function ProjectInterface(){return {}};

BMMath.random = Math.random;
BMMath.abs = function(val){
    var tOfVal = typeof val;
    if(tOfVal === 'object' && val.length){
        var absArr = Array.apply(null,{length:val.length});
        var i, len = val.length;
        for(i=0;i<len;i+=1){
            absArr[i] = Math.abs(val[i]);
        }
        return absArr;
    }
    return Math.abs(val);

}
var defaultCurveSegments = 150;
var degToRads = Math.PI/180;
var roundCorner = 0.5519;

function roundValues(flag){
    if(flag){
        bm_rnd = Math.round;
    }else{
        bm_rnd = function(val){
            return val;
        };
    }
}
roundValues(false);

function roundTo2Decimals(val){
    return Math.round(val*10000)/10000;
}

function roundTo3Decimals(val){
    return Math.round(val*100)/100;
}

function styleDiv(element){
    element.style.position = 'absolute';
    element.style.top = 0;
    element.style.left = 0;
    element.style.display = 'block';
    element.style.transformOrigin = element.style.webkitTransformOrigin = '0 0';
    element.style.backfaceVisibility  = element.style.webkitBackfaceVisibility = 'visible';
    element.style.transformStyle = element.style.webkitTransformStyle = element.style.mozTransformStyle = "preserve-3d";
}

function styleUnselectableDiv(element){
    element.style.userSelect = 'none';
    element.style.MozUserSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.oUserSelect = 'none';

}

function BMEnterFrameEvent(n,c,t,d){
    this.type = n;
    this.currentTime = c;
    this.totalTime = t;
    this.direction = d < 0 ? -1:1;
}

function BMCompleteEvent(n,d){
    this.type = n;
    this.direction = d < 0 ? -1:1;
}

function BMCompleteLoopEvent(n,c,t,d){
    this.type = n;
    this.currentLoop = c;
    this.totalLoops = t;
    this.direction = d < 0 ? -1:1;
}

function BMSegmentStartEvent(n,f,t){
    this.type = n;
    this.firstFrame = f;
    this.totalFrames = t;
}

function BMDestroyEvent(n,t){
    this.type = n;
    this.target = t;
}

function _addEventListener(eventName, callback){

    if (!this._cbs[eventName]){
        this._cbs[eventName] = [];
    }
    this._cbs[eventName].push(callback);

}

function _removeEventListener(eventName,callback){

    if (!callback){
        this._cbs[eventName] = null;
    }else if(this._cbs[eventName]){
        var i = 0, len = this._cbs[eventName].length;
        while(i<len){
            if(this._cbs[eventName][i] === callback){
                this._cbs[eventName].splice(i,1);
                i -=1;
                len -= 1;
            }
            i += 1;
        }
        if(!this._cbs[eventName].length){
            this._cbs[eventName] = null;
        }
    }

}

function _triggerEvent(eventName, args){
    if (this._cbs[eventName]) {
        var len = this._cbs[eventName].length;
        for (var i = 0; i < len; i++){
            this._cbs[eventName][i](args);
        }
    }
}

function randomString(length, chars){
    if(chars === undefined){
        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    }
    var i;
    var result = '';
    for (i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [ r,
        g,
         b ];
}

function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [
         h,
         s,
         v
    ];
}

function addSaturationToRGB(color,offset){
    var hsv = RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);
    hsv[1] += offset;
    if (hsv[1] > 1) {
        hsv[1] = 1;
    }
    else if (hsv[1] <= 0) {
        hsv[1] = 0;
    }
    return HSVtoRGB(hsv[0],hsv[1],hsv[2]);
}

function addBrightnessToRGB(color,offset){
    var hsv = RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);
    hsv[2] += offset;
    if (hsv[2] > 1) {
        hsv[2] = 1;
    }
    else if (hsv[2] < 0) {
        hsv[2] = 0;
    }
    return HSVtoRGB(hsv[0],hsv[1],hsv[2]);
}

function addHueToRGB(color,offset) {
    var hsv = RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);
    hsv[0] += offset/360;
    if (hsv[0] > 1) {
        hsv[0] -= 1;
    }
    else if (hsv[0] < 0) {
        hsv[0] += 1;
    }
    return HSVtoRGB(hsv[0],hsv[1],hsv[2]);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
}

var rgbToHex = (function(){
    var colorMap = [];
    var i;
    var hex;
    for(i=0;i<256;i+=1){
        hex = i.toString(16);
        colorMap[i] = hex.length == 1 ? '0' + hex : hex;
    }

    return function(r, g, b) {
        if(r<0){
            r = 0;
        }
        if(g<0){
            g = 0;
        }
        if(b<0){
            b = 0;
        }
        return '#' + colorMap[r] + colorMap[g] + colorMap[b];
    };
}());

function fillToRgba(hex,alpha){
    if(!cachedColors[hex]){
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        cachedColors[hex] = parseInt(result[1], 16)+','+parseInt(result[2], 16)+','+parseInt(result[3], 16);
    }
    return 'rgba('+cachedColors[hex]+','+alpha+')';
}

var fillColorToString = (function(){

    var colorMap = [];
    return function(colorArr,alpha){
        if(alpha !== undefined){
            colorArr[3] = alpha;
        }
        if(!colorMap[colorArr[0]]){
            colorMap[colorArr[0]] = {};
        }
        if(!colorMap[colorArr[0]][colorArr[1]]){
            colorMap[colorArr[0]][colorArr[1]] = {};
        }
        if(!colorMap[colorArr[0]][colorArr[1]][colorArr[2]]){
            colorMap[colorArr[0]][colorArr[1]][colorArr[2]] = {};
        }
        if(!colorMap[colorArr[0]][colorArr[1]][colorArr[2]][colorArr[3]]){
            colorMap[colorArr[0]][colorArr[1]][colorArr[2]][colorArr[3]] = 'rgba(' + colorArr.join(',')+')';
        }
        return colorMap[colorArr[0]][colorArr[1]][colorArr[2]][colorArr[3]];
    };
}());

function RenderedFrame(tr,o) {
    this.tr = tr;
    this.o = o;
}

function LetterProps(o,sw,sc,fc,m,p){
    this.o = o;
    this.sw = sw;
    this.sc = sc;
    this.fc = fc;
    this.m = m;
    this.props = p;
}

function iterateDynamicProperties(num){
    var i, len = this.dynamicProperties;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue(num);
    }
}

function reversePath(paths){
    var newI = [], newO = [], newV = [];
    var i, len, newPaths = {};
    var init = 0;
    if (paths.c) {
        newI[0] = paths.o[0];
        newO[0] = paths.i[0];
        newV[0] = paths.v[0];
        init = 1;
    }
    len = paths.i.length;
    var cnt = len - 1;

    for (i = init; i < len; i += 1) {
        newI.push(paths.o[cnt]);
        newO.push(paths.i[cnt]);
        newV.push(paths.v[cnt]);
        cnt -= 1;
    }

    newPaths.i = newI;
    newPaths.o = newO;
    newPaths.v = newV;

    return newPaths;
}
/*!
 Transformation Matrix v2.0
 (c) Epistemex 2014-2015
 www.epistemex.com
 By Ken Fyrstenberg
 Contributions by leeoniya.
 License: MIT, header required.
 */

/**
 * 2D transformation matrix object initialized with identity matrix.
 *
 * The matrix can synchronize a canvas context by supplying the context
 * as an argument, or later apply current absolute transform to an
 * existing context.
 *
 * All values are handled as floating point values.
 *
 * @param {CanvasRenderingContext2D} [context] - Optional context to sync with Matrix
 * @prop {number} a - scale x
 * @prop {number} b - shear y
 * @prop {number} c - shear x
 * @prop {number} d - scale y
 * @prop {number} e - translate x
 * @prop {number} f - translate y
 * @prop {CanvasRenderingContext2D|null} [context=null] - set or get current canvas context
 * @constructor
 */

var Matrix = (function(){

    function reset(){
        this.props[0] = 1;
        this.props[1] = 0;
        this.props[2] = 0;
        this.props[3] = 0;
        this.props[4] = 0;
        this.props[5] = 1;
        this.props[6] = 0;
        this.props[7] = 0;
        this.props[8] = 0;
        this.props[9] = 0;
        this.props[10] = 1;
        this.props[11] = 0;
        this.props[12] = 0;
        this.props[13] = 0;
        this.props[14] = 0;
        this.props[15] = 1;
        return this;
    }

    function rotate(angle) {
        if(angle === 0){
            return this;
        }
        var mCos = Math.cos(angle);
        var mSin = Math.sin(angle);
        return this._t(mCos, -mSin,  0, 0
            , mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1);
    }

    function rotateX(angle){
        if(angle === 0){
            return this;
        }
        var mCos = Math.cos(angle);
        var mSin = Math.sin(angle);
        return this._t(1, 0, 0, 0
            , 0, mCos, -mSin, 0
            , 0, mSin,  mCos, 0
            , 0, 0, 0, 1);
    }

    function rotateY(angle){
        if(angle === 0){
            return this;
        }
        var mCos = Math.cos(angle);
        var mSin = Math.sin(angle);
        return this._t(mCos,  0,  mSin, 0
            , 0, 1, 0, 0
            , -mSin,  0,  mCos, 0
            , 0, 0, 0, 1);
    }

    function rotateZ(angle){
        if(angle === 0){
            return this;
        }
        var mCos = Math.cos(angle);
        var mSin = Math.sin(angle);
        return this._t(mCos, -mSin,  0, 0
            , mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1);
    }

    function shear(sx,sy){
        return this._t(1, sy, sx, 1, 0, 0);
    }

    function skew(ax, ay){
        return this.shear(Math.tan(ax), Math.tan(ay));
    }

    function skewFromAxis(ax, angle){
        var mCos = Math.cos(angle);
        var mSin = Math.sin(angle);
        return this._t(mCos, mSin,  0, 0
            , -mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1)
            ._t(1, 0,  0, 0
            , Math.tan(ax),  1, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1)
            ._t(mCos, -mSin,  0, 0
            , mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1);
        //return this._t(mCos, mSin, -mSin, mCos, 0, 0)._t(1, 0, Math.tan(ax), 1, 0, 0)._t(mCos, -mSin, mSin, mCos, 0, 0);
    }

    function scale(sx, sy, sz) {
        sz = isNaN(sz) ? 1 : sz;
        if(sx == 1 && sy == 1 && sz == 1){
            return this;
        }
        return this._t(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    }

    function setTransform(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
        this.props[0] = a;
        this.props[1] = b;
        this.props[2] = c;
        this.props[3] = d;
        this.props[4] = e;
        this.props[5] = f;
        this.props[6] = g;
        this.props[7] = h;
        this.props[8] = i;
        this.props[9] = j;
        this.props[10] = k;
        this.props[11] = l;
        this.props[12] = m;
        this.props[13] = n;
        this.props[14] = o;
        this.props[15] = p;
        return this;
    }

    function translate(tx, ty, tz) {
        tz = tz || 0;
        if(tx !== 0 || ty !== 0 || tz !== 0){
            return this._t(1,0,0,0,0,1,0,0,0,0,1,0,tx,ty,tz,1);
        }
        return this;
    }

    function transform(a2, b2, c2, d2, e2, f2, g2, h2, i2, j2, k2, l2, m2, n2, o2, p2) {

        if(a2 === 1 && b2 === 0 && c2 === 0 && d2 === 0 && e2 === 0 && f2 === 1 && g2 === 0 && h2 === 0 && i2 === 0 && j2 === 0 && k2 === 1 && l2 === 0){
            if(m2 !== 0 || n2 !== 0 || o2 !== 0){

                this.props[12] = this.props[12] * a2 + this.props[13] * e2 + this.props[14] * i2 + this.props[15] * m2 ;
                this.props[13] = this.props[12] * b2 + this.props[13] * f2 + this.props[14] * j2 + this.props[15] * n2 ;
                this.props[14] = this.props[12] * c2 + this.props[13] * g2 + this.props[14] * k2 + this.props[15] * o2 ;
                this.props[15] = this.props[12] * d2 + this.props[13] * h2 + this.props[14] * l2 + this.props[15] * p2 ;
            }
            return this;
        }

        var a1 = this.props[0];
        var b1 = this.props[1];
        var c1 = this.props[2];
        var d1 = this.props[3];
        var e1 = this.props[4];
        var f1 = this.props[5];
        var g1 = this.props[6];
        var h1 = this.props[7];
        var i1 = this.props[8];
        var j1 = this.props[9];
        var k1 = this.props[10];
        var l1 = this.props[11];
        var m1 = this.props[12];
        var n1 = this.props[13];
        var o1 = this.props[14];
        var p1 = this.props[15];

        /* matrix order (canvas compatible):
         * ace
         * bdf
         * 001
         */
        this.props[0] = a1 * a2 + b1 * e2 + c1 * i2 + d1 * m2;
        this.props[1] = a1 * b2 + b1 * f2 + c1 * j2 + d1 * n2 ;
        this.props[2] = a1 * c2 + b1 * g2 + c1 * k2 + d1 * o2 ;
        this.props[3] = a1 * d2 + b1 * h2 + c1 * l2 + d1 * p2 ;

        this.props[4] = e1 * a2 + f1 * e2 + g1 * i2 + h1 * m2 ;
        this.props[5] = e1 * b2 + f1 * f2 + g1 * j2 + h1 * n2 ;
        this.props[6] = e1 * c2 + f1 * g2 + g1 * k2 + h1 * o2 ;
        this.props[7] = e1 * d2 + f1 * h2 + g1 * l2 + h1 * p2 ;

        this.props[8] = i1 * a2 + j1 * e2 + k1 * i2 + l1 * m2 ;
        this.props[9] = i1 * b2 + j1 * f2 + k1 * j2 + l1 * n2 ;
        this.props[10] = i1 * c2 + j1 * g2 + k1 * k2 + l1 * o2 ;
        this.props[11] = i1 * d2 + j1 * h2 + k1 * l2 + l1 * p2 ;

        this.props[12] = m1 * a2 + n1 * e2 + o1 * i2 + p1 * m2 ;
        this.props[13] = m1 * b2 + n1 * f2 + o1 * j2 + p1 * n2 ;
        this.props[14] = m1 * c2 + n1 * g2 + o1 * k2 + p1 * o2 ;
        this.props[15] = m1 * d2 + n1 * h2 + o1 * l2 + p1 * p2 ;

        return this;
    }

    function clone(matr){
        var i;
        for(i=0;i<16;i+=1){
            matr.props[i] = this.props[i];
        }
    }

    function cloneFromProps(props){
        var i;
        for(i=0;i<16;i+=1){
            this.props[i] = props[i];
        }
    }

    function applyToPoint(x, y, z) {

        return {
            x: x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12],
            y: x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13],
            z: x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14]
        };
        /*return {
         x: x * me.a + y * me.c + me.e,
         y: x * me.b + y * me.d + me.f
         };*/
    }
    function applyToX(x, y, z) {
        return x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12];
    }
    function applyToY(x, y, z) {
        return x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13];
    }
    function applyToZ(x, y, z) {
        return x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14];
    }

    function inversePoints(pts){
        //var determinant = this.a * this.d - this.b * this.c;
        var determinant = this.props[0] * this.props[5] - this.props[1] * this.props[4];
        var a = this.props[5]/determinant;
        var b = - this.props[1]/determinant;
        var c = - this.props[4]/determinant;
        var d = this.props[0]/determinant;
        var e = (this.props[4] * this.props[13] - this.props[5] * this.props[12])/determinant;
        var f = - (this.props[0] * this.props[13] - this.props[1] * this.props[12])/determinant;
        var i, len = pts.length, retPts = [];
        for(i=0;i<len;i+=1){
            retPts[i] = [pts[i][0] * a + pts[i][1] * c + e, pts[i][0] * b + pts[i][1] * d + f, 0]
        }
        return retPts;
    }

    function applyToPointArray(x,y,z,dimensions){
        if(dimensions && dimensions === 2) {
            var arr = point_pool.newPoint();
            arr[0] = x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12]; 
            arr[1] = x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13]; 
            return arr;    
        }
        return [x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12],x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13],x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14]];
    }
    function applyToPointStringified(x, y) {
        return (bm_rnd(x * this.props[0] + y * this.props[4] + this.props[12]))+','+(bm_rnd(x * this.props[1] + y * this.props[5] + this.props[13]));
    }

    function toArray() {
        return [this.props[0],this.props[1],this.props[2],this.props[3],this.props[4],this.props[5],this.props[6],this.props[7],this.props[8],this.props[9],this.props[10],this.props[11],this.props[12],this.props[13],this.props[14],this.props[15]];
    }

    function toCSS() {
        if(isSafari){
            return "matrix3d(" + roundTo2Decimals(this.props[0]) + ',' + roundTo2Decimals(this.props[1]) + ',' + roundTo2Decimals(this.props[2]) + ',' + roundTo2Decimals(this.props[3]) + ',' + roundTo2Decimals(this.props[4]) + ',' + roundTo2Decimals(this.props[5]) + ',' + roundTo2Decimals(this.props[6]) + ',' + roundTo2Decimals(this.props[7]) + ',' + roundTo2Decimals(this.props[8]) + ',' + roundTo2Decimals(this.props[9]) + ',' + roundTo2Decimals(this.props[10]) + ',' + roundTo2Decimals(this.props[11]) + ',' + roundTo2Decimals(this.props[12]) + ',' + roundTo2Decimals(this.props[13]) + ',' + roundTo2Decimals(this.props[14]) + ',' + roundTo2Decimals(this.props[15]) + ')';
        } else {
            this.cssParts[1] = this.props.join(',');
            return this.cssParts.join('');
        }
    }

    function to2dCSS() {
        return "matrix(" + this.props[0] + ',' + this.props[1] + ',' + this.props[4] + ',' + this.props[5] + ',' + this.props[12] + ',' + this.props[13] + ")";
    }

    function toString() {
        return "" + this.toArray();
    }

    return function(){
        this.reset = reset;
        this.rotate = rotate;
        this.rotateX = rotateX;
        this.rotateY = rotateY;
        this.rotateZ = rotateZ;
        this.skew = skew;
        this.skewFromAxis = skewFromAxis;
        this.shear = shear;
        this.scale = scale;
        this.setTransform = setTransform;
        this.translate = translate;
        this.transform = transform;
        this.applyToPoint = applyToPoint;
        this.applyToX = applyToX;
        this.applyToY = applyToY;
        this.applyToZ = applyToZ;
        this.applyToPointArray = applyToPointArray;
        this.applyToPointStringified = applyToPointStringified;
        this.toArray = toArray;
        this.toCSS = toCSS;
        this.to2dCSS = to2dCSS;
        this.toString = toString;
        this.clone = clone;
        this.cloneFromProps = cloneFromProps;
        this.inversePoints = inversePoints;
        this._t = this.transform;

        this.props = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

        this.cssParts = ['matrix3d(','',')'];
    }
}());

function Matrix() {


}

/*
 Copyright 2014 David Bau.
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:
 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (pool, math) {
//
// The following constants are related to IEEE 754 limits.
//
    var global = this,
        width = 256,        // each RC4 output is 0 <= x < 256
        chunks = 6,         // at least six RC4 outputs for each double
        digits = 52,        // there are 52 significant digits in a double
        rngname = 'random', // rngname: name for Math.random and Math.seedrandom
        startdenom = math.pow(width, chunks),
        significance = math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1,
        nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
    function seedrandom(seed, options, callback) {
        var key = [];
        options = (options == true) ? { entropy: true } : (options || {});

        // Flatten the seed string or build one from local entropy if needed.
        var shortseed = mixkey(flatten(
            options.entropy ? [seed, tostring(pool)] :
                (seed == null) ? autoseed() : seed, 3), key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(key);

        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.
        var prng = function() {
            var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
                d = startdenom,                 //   and denominator d = 2 ^ 48.
                x = 0;                          //   and no 'extra last byte'.
            while (n < significance) {          // Fill up all significant digits by
                n = (n + x) * width;              //   shifting numerator and
                d *= width;                       //   denominator and generating a
                x = arc4.g(1);                    //   new least-significant-byte.
            }
            while (n >= overflow) {             // To avoid rounding up, before adding
                n /= 2;                           //   last byte, shift everything
                d /= 2;                           //   right using integer math until
                x >>>= 1;                         //   we have exactly the desired bits.
            }
            return (n + x) / d;                 // Form the number within [0, 1).
        };

        prng.int32 = function() { return arc4.g(4) | 0; }
        prng.quick = function() { return arc4.g(4) / 0x100000000; }
        prng.double = prng;

        // Mix the randomness into accumulated entropy.
        mixkey(tostring(arc4.S), pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return (options.pass || callback ||
        function(prng, seed, is_math_call, state) {
            if (state) {
                // Load the arc4 state from the given state if it has an S array.
                if (state.S) { copy(state, arc4); }
                // Only provide the .state method if requested via options.state.
                prng.state = function() { return copy(arc4, {}); }
            }

            // If called as a method of Math (Math.seedrandom()), mutate
            // Math.random because that is how seedrandom.js has worked since v1.0.
            if (is_math_call) { math[rngname] = prng; return seed; }

            // Otherwise, it is a newer calling convention, so return the
            // prng directly.
            else return prng;
        })(
            prng,
            shortseed,
            'global' in options ? options.global : (this == math),
            options.state);
    }
    math['seed' + rngname] = seedrandom;

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
    function ARC4(key) {
        var t, keylen = key.length,
            me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

        // The empty key [] is treated as [0].
        if (!keylen) { key = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) {
            s[i] = i++;
        }
        for (i = 0; i < width; i++) {
            s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
            s[j] = t;
        }

        // The "g" method returns the next (count) outputs as one number.
        (me.g = function(count) {
            // Using instance members instead of closure state nearly doubles speed.
            var t, r = 0,
                i = me.i, j = me.j, s = me.S;
            while (count--) {
                t = s[i = mask & (i + 1)];
                r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
            }
            me.i = i; me.j = j;
            return r;
            // For robust unpredictability, the function call below automatically
            // discards an initial batch of values.  This is called RC4-drop[256].
            // See http://google.com/search?q=rsa+fluhrer+response&btnI
        })(width);
    }

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
    function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
    };

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
    function flatten(obj, depth) {
        var result = [], typ = (typeof obj), prop;
        if (depth && typ == 'object') {
            for (prop in obj) {
                try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
            }
        }
        return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
    function mixkey(seed, key) {
        var stringseed = seed + '', smear, j = 0;
        while (j < stringseed.length) {
            key[mask & j] =
                mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
        }
        return tostring(key);
    }

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
    function autoseed() {
        try {
            if (nodecrypto) { return tostring(nodecrypto.randomBytes(width)); }
            var out = new Uint8Array(width);
            (global.crypto || global.msCrypto).getRandomValues(out);
            return tostring(out);
        } catch (e) {
            var browser = global.navigator,
                plugins = browser && browser.plugins;
            return [+new Date, global, plugins, global.screen, tostring(pool)];
        }
    }

//
// tostring()
// Converts an array of charcodes to a string
//
    function tostring(a) {
        return String.fromCharCode.apply(0, a);
    }

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
    mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//

// End anonymous scope, and pass initial values.
})(
    [],     // pool: entropy pool starts empty
    BMMath    // math: package containing random, pow, and seedrandom
);
var BezierFactory = (function(){
    /**
     * BezierEasing - use bezier curve for transition easing function
     * by Ga禱tan Renaudeau 2014 - 2015 �� MIT License
     *
     * Credits: is based on Firefox's nsSMILKeySpline.cpp
     * Usage:
     * var spline = BezierEasing([ 0.25, 0.1, 0.25, 1.0 ])
     * spline.get(x) => returns the easing value | x must be in [0, 1] range
     *
     */

        var ob = {};
    ob.getBezierEasing = getBezierEasing;
    var beziers = {};

    function getBezierEasing(a,b,c,d,nm){
        var str = nm || ('bez_' + a+'_'+b+'_'+c+'_'+d).replace(/\./g, 'p');
        if(beziers[str]){
            return beziers[str];
        }
        var bezEasing = new BezierEasing([a,b,c,d]);
        beziers[str] = bezEasing;
        return bezEasing;
    }

// These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === "function";

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier (aT, aA1, aA2) {
        return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
    }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope (aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    }

    function binarySubdivide (aX, aA, aB, mX1, mX2) {
        var currentX, currentT, i = 0;
        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
                aB = currentT;
            } else {
                aA = currentT;
            }
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
        return currentT;
    }

    function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
        for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) return aGuessT;
            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }

    /**
     * points is an array of [ mX1, mY1, mX2, mY2 ]
     */
    function BezierEasing (points) {
        this._p = points;
        this._mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
        this._precomputed = false;

        this.get = this.get.bind(this);
    }

    BezierEasing.prototype = {

        get: function (x) {
            var mX1 = this._p[0],
                mY1 = this._p[1],
                mX2 = this._p[2],
                mY2 = this._p[3];
            if (!this._precomputed) this._precompute();
            if (mX1 === mY1 && mX2 === mY2) return x; // linear
            // Because JavaScript number are imprecise, we should guarantee the extremes are right.
            if (x === 0) return 0;
            if (x === 1) return 1;
            return calcBezier(this._getTForX(x), mY1, mY2);
        },

        // Private part

        _precompute: function () {
            var mX1 = this._p[0],
                mY1 = this._p[1],
                mX2 = this._p[2],
                mY2 = this._p[3];
            this._precomputed = true;
            if (mX1 !== mY1 || mX2 !== mY2)
                this._calcSampleValues();
        },

        _calcSampleValues: function () {
            var mX1 = this._p[0],
                mX2 = this._p[2];
            for (var i = 0; i < kSplineTableSize; ++i) {
                this._mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
        },

        /**
         * getTForX chose the fastest heuristic to determine the percentage value precisely from a given X projection.
         */
        _getTForX: function (aX) {
            var mX1 = this._p[0],
                mX2 = this._p[2],
                mSampleValues = this._mSampleValues;

            var intervalStart = 0.0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }
            --currentSample;

            // Interpolate to provide an initial guess for t
            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;

            var initialSlope = getSlope(guessForT, mX1, mX2);
            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
            } else if (initialSlope === 0.0) {
                return guessForT;
            } else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
            }
        }
    };

    return ob;

}())


function matrixManagerFunction(){

    var mat = new Matrix();

    var returnMatrix2D = function(rX, scaleX, scaleY, tX, tY){
        return mat.reset().translate(tX,tY).rotate(rX).scale(scaleX,scaleY).toCSS();
    };

    var getMatrix = function(animData){
        return returnMatrix2D(animData.tr.r[2],animData.tr.s[0],animData.tr.s[1],animData.tr.p[0],animData.tr.p[1]);
    };

    return {
        getMatrix : getMatrix
    };

}
var MatrixManager = matrixManagerFunction;
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if(!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
function createElement(parent,child,params){
    if(child){
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.prototype._parent = parent.prototype;
    }else{
        var instance = Object.create(parent.prototype,params);
        var getType = {};
        if(instance && getType.toString.call(instance.init) === '[object Function]'){
            instance.init();
        }
        return instance;
    }
}

function extendPrototype(source,destination){
    for (var attr in source.prototype) {
        if (source.prototype.hasOwnProperty(attr)) destination.prototype[attr] = source.prototype[attr];
    }
}
function bezFunction(){

    var easingFunctions = [];
    var math = Math;

    function pointOnLine2D(x1,y1, x2,y2, x3,y3){
        var det1 = (x1*y2) + (y1*x3) + (x2*y3) - (x3*y2) - (y3*x1) - (x2*y1);
        return det1 > -0.0001 && det1 < 0.0001;
    }

    function pointOnLine3D(x1,y1,z1, x2,y2,z2, x3,y3,z3){
        return pointOnLine2D(x1,y1, x2,y2, x3,y3) && pointOnLine2D(x1,z1, x2,z2, x3,z3);
    }

    /*function getEasingCurve(aa,bb,cc,dd,encodedFuncName) {
        if(!encodedFuncName){
            encodedFuncName = ('bez_' + aa+'_'+bb+'_'+cc+'_'+dd).replace(/\./g, 'p');
        }
        if(easingFunctions[encodedFuncName]){
            return easingFunctions[encodedFuncName];
        }
        var A0, B0, C0;
        var A1, B1, C1;
        easingFunctions[encodedFuncName] = function(tt) {
            var x = tt;
            var i = 0, z;
            while (++i < 20) {
                C0 = 3 * aa;
                B0 = 3 * (cc - aa) - C0;
                A0 = 1 - C0 - B0;
                z = (x * (C0 + x * (B0 + x * A0))) - tt;
                if (bm_abs(z) < 1e-3) break;
                x -= z / (C0 + x * (2 * B0 + 3 * A0 * x));
            }
            C1 = 3 * bb;
            B1 = 3 * (dd - bb) - C1;
            A1 = 1 - C1 - B1;
            var polyB = x * (C1 + x * (B1 + x * A1));
            //return c * polyB + b;
            return polyB;
        };
        return easingFunctions[encodedFuncName];
    }*/
    var getBezierLength = (function(){

        function Segment(l,p){
            this.l = l;
            this.p = p;
        }

        return function(pt1,pt2,pt3,pt4){
            var curveSegments = defaultCurveSegments;
            var k;
            var i, len;
            var ptCoord,perc,addedLength = 0;
            var ptDistance;
            var point = [],lastPoint = [];
            var lengthData = {
                addedLength: 0,
                segments: []
            };
            len = pt3.length;
            for(k=0;k<curveSegments;k+=1){
                perc = k/(curveSegments-1);
                ptDistance = 0;
                for(i=0;i<len;i+=1){
                    ptCoord = bm_pow(1-perc,3)*pt1[i]+3*bm_pow(1-perc,2)*perc*pt3[i]+3*(1-perc)*bm_pow(perc,2)*pt4[i]+bm_pow(perc,3)*pt2[i];
                    point[i] = ptCoord;
                    if(lastPoint[i] !== null){
                        ptDistance += bm_pow(point[i] - lastPoint[i],2);
                    }
                    lastPoint[i] = point[i];
                }
                if(ptDistance){
                    ptDistance = bm_sqrt(ptDistance);
                    addedLength += ptDistance;
                }
                lengthData.segments.push(new Segment(addedLength,perc));
            }
            lengthData.addedLength = addedLength;
            return lengthData;
        };
    }());

    function BezierData(length){
        this.segmentLength = 0;
        this.points = new Array(length);
    }

    function PointData(partial,point){
        this.partialLength = partial;
        this.point = point;
    }

    var buildBezierData = (function(){

        var storedData = {};

        return function (keyData){
            var pt1 = keyData.s;
            var pt2 = keyData.e;
            var pt3 = keyData.to;
            var pt4 = keyData.ti;
            var bezierName = (pt1.join('_')+'_'+pt2.join('_')+'_'+pt3.join('_')+'_'+pt4.join('_')).replace(/\./g, 'p');
            if(storedData[bezierName]){
                keyData.bezierData = storedData[bezierName];
                return;
            }
        var curveSegments = defaultCurveSegments;
        var k, i, len;
            var ptCoord,perc,addedLength = 0;
            var ptDistance;
            var point,lastPoint = null;
            if(pt1.length === 2 && (pt1[0] != pt2[0] || pt1[1] != pt2[1]) && pointOnLine2D(pt1[0],pt1[1],pt2[0],pt2[1],pt1[0]+pt3[0],pt1[1]+pt3[1]) && pointOnLine2D(pt1[0],pt1[1],pt2[0],pt2[1],pt2[0]+pt4[0],pt2[1]+pt4[1])){
                curveSegments = 2;
            }
            var bezierData = new BezierData(curveSegments);
            len = pt3.length;
            for(k=0;k<curveSegments;k+=1){
            point = new Array(len);
                perc = k/(curveSegments-1);
                ptDistance = 0;
                for(i=0;i<len;i+=1){
                ptCoord = bm_pow(1-perc,3)*pt1[i]+3*bm_pow(1-perc,2)*perc*(pt1[i] + pt3[i])+3*(1-perc)*bm_pow(perc,2)*(pt2[i] + pt4[i])+bm_pow(perc,3)*pt2[i];
                point[i] = ptCoord;
                    if(lastPoint !== null){
                    ptDistance += bm_pow(point[i] - lastPoint[i],2);
                    }
                }
            ptDistance = bm_sqrt(ptDistance);
                addedLength += ptDistance;
                bezierData.points[k] = new PointData(ptDistance,point);
                lastPoint = point;
            }
            bezierData.segmentLength = addedLength;
            keyData.bezierData = bezierData;
            storedData[bezierName] = bezierData;

        }
    }());

    function getDistancePerc(perc,bezierData){
        var segments = bezierData.segments;
        var len = segments.length;
        var initPos = bm_floor((len-1)*perc);
        var lengthPos = perc*bezierData.addedLength;
        var lPerc = 0;
        if(lengthPos == segments[initPos].l){
            return segments[initPos].p;
        }else{
            var dir = segments[initPos].l > lengthPos ? -1 : 1;
            var flag = true;
            while(flag){
                if(segments[initPos].l <= lengthPos && segments[initPos+1].l > lengthPos){
                    lPerc = (lengthPos - segments[initPos].l)/(segments[initPos+1].l-segments[initPos].l);
                    flag = false;
                }else{
                    initPos += dir;
                }
                if(initPos < 0 || initPos >= len - 1){
                    flag = false;
                }
            }
            return segments[initPos].p + (segments[initPos+1].p - segments[initPos].p)*lPerc;
        }
    }

    function SegmentPoints(){
        this.pt1 = new Array(2);
        this.pt2 = new Array(2);
        this.pt3 = new Array(2);
        this.pt4 = new Array(2);
    }

    function getNewSegment(pt1,pt2,pt3,pt4,startPerc,endPerc, bezierData){

        var pts = new SegmentPoints();
        startPerc = startPerc < 0 ? 0 : startPerc > 1 ? 1 : startPerc;
        var t0 = getDistancePerc(startPerc,bezierData);
        endPerc = endPerc > 1 ? 1 : endPerc;
        var t1 = getDistancePerc(endPerc,bezierData);
        var i, len = pt1.length;
        var u0 = 1 - t0;
        var u1 = 1 - t1;
        //Math.round(num * 100) / 100
        for(i=0;i<len;i+=1){
            pts.pt1[i] =  Math.round((u0*u0*u0* pt1[i] + (t0*u0*u0 + u0*t0*u0 + u0*u0*t0) * pt3[i] + (t0*t0*u0 + u0*t0*t0 + t0*u0*t0)* pt4[i] + t0*t0*t0* pt2[i])* 1000) / 1000;
            pts.pt3[i] = Math.round((u0*u0*u1*pt1[i] + (t0*u0*u1 + u0*t0*u1 + u0*u0*t1)* pt3[i] + (t0*t0*u1 + u0*t0*t1 + t0*u0*t1)* pt4[i] + t0*t0*t1* pt2[i])* 1000) / 1000;
            pts.pt4[i] = Math.round((u0*u1*u1* pt1[i] + (t0*u1*u1 + u0*t1*u1 + u0*u1*t1)* pt3[i] + (t0*t1*u1 + u0*t1*t1 + t0*u1*t1)* pt4[i] + t0*t1*t1* pt2[i])* 1000) / 1000;
            pts.pt2[i] = Math.round((u1*u1*u1* pt1[i] + (t1*u1*u1 + u1*t1*u1 + u1*u1*t1)* pt3[i] + (t1*t1*u1 + u1*t1*t1 + t1*u1*t1)*pt4[i] + t1*t1*t1* pt2[i])* 1000) / 1000;
        }
        return pts;
    }

    return {
        //getEasingCurve : getEasingCurve,
        getBezierLength : getBezierLength,
        getNewSegment : getNewSegment,
        buildBezierData : buildBezierData,
        pointOnLine2D : pointOnLine2D,
        pointOnLine3D : pointOnLine3D
    };
}

var bez = bezFunction();
function dataFunctionManager(){

    //var tCanvasHelper = document.createElement('canvas').getContext('2d');

    function completeLayers(layers, comps, fontManager){
        var layerData;
        var animArray, lastFrame;
        var i, len = layers.length;
        var j, jLen, k, kLen;
        for(i=0;i<len;i+=1){
            layerData = layers[i];
            if(!('ks' in layerData) || layerData.completed){
                continue;
            }
            layerData.completed = true;
            if(layerData.tt){
                layers[i-1].td = layerData.tt;
            }
            animArray = [];
            lastFrame = -1;
            if(layerData.hasMask){
                var maskProps = layerData.masksProperties;
                jLen = maskProps.length;
                for(j=0;j<jLen;j+=1){
                    if(maskProps[j].pt.k.i){
                        convertPathsToAbsoluteValues(maskProps[j].pt.k);
                    }else{
                        kLen = maskProps[j].pt.k.length;
                        for(k=0;k<kLen;k+=1){
                            if(maskProps[j].pt.k[k].s){
                                convertPathsToAbsoluteValues(maskProps[j].pt.k[k].s[0]);
                            }
                            if(maskProps[j].pt.k[k].e){
                                convertPathsToAbsoluteValues(maskProps[j].pt.k[k].e[0]);
                            }
                        }
                    }
                }
            }
            if(layerData.ty===0){
                layerData.layers = findCompLayers(layerData.refId, comps);
                completeLayers(layerData.layers,comps, fontManager);
            }else if(layerData.ty === 4){
                completeShapes(layerData.shapes);
            }else if(layerData.ty == 5){
                completeText(layerData, fontManager);
            }
        }
    }

    function findCompLayers(id,comps){
        var i = 0, len = comps.length;
        while(i<len){
            if(comps[i].id === id){
                return comps[i].layers;
            }
            i += 1;
        }
    }

    function completeShapes(arr){
        var i, len = arr.length;
        var j, jLen;
        var hasPaths = false;
        for(i=len-1;i>=0;i-=1){
            if(arr[i].ty == 'sh'){
                if(arr[i].ks.k.i){
                    convertPathsToAbsoluteValues(arr[i].ks.k);
                }else{
                    jLen = arr[i].ks.k.length;
                    for(j=0;j<jLen;j+=1){
                        if(arr[i].ks.k[j].s){
                            convertPathsToAbsoluteValues(arr[i].ks.k[j].s[0]);
                        }
                        if(arr[i].ks.k[j].e){
                            convertPathsToAbsoluteValues(arr[i].ks.k[j].e[0]);
                        }
                    }
                }
                hasPaths = true;
            }else if(arr[i].ty == 'gr'){
                completeShapes(arr[i].it);
            }
        }
        /*if(hasPaths){
            //mx: distance
            //ss: sensitivity
            //dc: decay
            arr.splice(arr.length-1,0,{
                "ty": "ms",
                "mx":20,
                "ss":10,
                 "dc":0.001,
                "maxDist":200
            });
        }*/
    }

    function convertPathsToAbsoluteValues(path){
        var i, len = path.i.length;
        for(i=0;i<len;i+=1){
            path.i[i][0] += path.v[i][0];
            path.i[i][1] += path.v[i][1];
            path.o[i][0] += path.v[i][0];
            path.o[i][1] += path.v[i][1];
        }
    }

    function checkVersion(minimum,animVersionString){
        var animVersion = animVersionString ? animVersionString.split('.') : [100,100,100];
        if(minimum[0]>animVersion[0]){
            return true;
        } else if(animVersion[0] > minimum[0]){
            return false;
        }
        if(minimum[1]>animVersion[1]){
            return true;
        } else if(animVersion[1] > minimum[1]){
            return false;
        }
        if(minimum[2]>animVersion[2]){
            return true;
        } else if(animVersion[2] > minimum[2]){
            return false;
        }
    }

    var checkText = (function(){
        var minimumVersion = [4,4,14];

        function updateTextLayer(textLayer){
            var documentData = textLayer.t.d;
            textLayer.t.d = {
                k: [
                    {
                        s:documentData,
                        t:0
                    }
                ]
            }
        }

        function iterateLayers(layers){
            var i, len = layers.length;
            for(i=0;i<len;i+=1){
                if(layers[i].ty === 5){
                    updateTextLayer(layers[i]);
                }
            }
        }

        return function (animationData){
            if(checkVersion(minimumVersion,animationData.v)){
                iterateLayers(animationData.layers);
                if(animationData.assets){
                    var i, len = animationData.assets.length;
                    for(i=0;i<len;i+=1){
                        if(animationData.assets[i].layers){
                            iterateLayers(animationData.assets[i].layers);

                        }
                    }
                }
            }
        }
    }())

    var checkColors = (function(){
        var minimumVersion = [4,1,9];

        function iterateShapes(shapes){
            var i, len = shapes.length;
            var j, jLen;
            for(i=0;i<len;i+=1){
                if(shapes[i].ty === 'gr'){
                    iterateShapes(shapes[i].it);
                }else if(shapes[i].ty === 'fl' || shapes[i].ty === 'st'){
                    if(shapes[i].c.k && shapes[i].c.k[0].i){
                        jLen = shapes[i].c.k.length;
                        for(j=0;j<jLen;j+=1){
                            if(shapes[i].c.k[j].s){
                                shapes[i].c.k[j].s[0] /= 255;
                                shapes[i].c.k[j].s[1] /= 255;
                                shapes[i].c.k[j].s[2] /= 255;
                                shapes[i].c.k[j].s[3] /= 255;
                            }
                            if(shapes[i].c.k[j].e){
                                shapes[i].c.k[j].e[0] /= 255;
                                shapes[i].c.k[j].e[1] /= 255;
                                shapes[i].c.k[j].e[2] /= 255;
                                shapes[i].c.k[j].e[3] /= 255;
                            }
                        }
                    } else {
                        shapes[i].c.k[0] /= 255;
                        shapes[i].c.k[1] /= 255;
                        shapes[i].c.k[2] /= 255;
                        shapes[i].c.k[3] /= 255;
                    }
                }
            }
        }

        function iterateLayers(layers){
            var i, len = layers.length;
            for(i=0;i<len;i+=1){
                if(layers[i].ty === 4){
                    iterateShapes(layers[i].shapes);
                }
            }
        }

        return function (animationData){
            if(checkVersion(minimumVersion,animationData.v)){
                iterateLayers(animationData.layers);
                if(animationData.assets){
                    var i, len = animationData.assets.length;
                    for(i=0;i<len;i+=1){
                        if(animationData.assets[i].layers){
                            iterateLayers(animationData.assets[i].layers);

                        }
                    }
                }
            }
        }
    }());

    var checkShapes = (function(){
        var minimumVersion = [4,4,18];



        function completeShapes(arr){
            var i, len = arr.length;
            var j, jLen;
            var hasPaths = false;
            for(i=len-1;i>=0;i-=1){
                if(arr[i].ty == 'sh'){
                    if(arr[i].ks.k.i){
                        arr[i].ks.k.c = arr[i].closed;
                    }else{
                        jLen = arr[i].ks.k.length;
                        for(j=0;j<jLen;j+=1){
                            if(arr[i].ks.k[j].s){
                                arr[i].ks.k[j].s[0].c = arr[i].closed;
                            }
                            if(arr[i].ks.k[j].e){
                                arr[i].ks.k[j].e[0].c = arr[i].closed;
                            }
                        }
                    }
                    hasPaths = true;
                }else if(arr[i].ty == 'gr'){
                    completeShapes(arr[i].it);
                }
            }
        }

        function iterateLayers(layers){
            var layerData;
            var i, len = layers.length;
            var j, jLen, k, kLen;
            for(i=0;i<len;i+=1){
                layerData = layers[i];
                if(layerData.hasMask){
                    var maskProps = layerData.masksProperties;
                    jLen = maskProps.length;
                    for(j=0;j<jLen;j+=1){
                        if(maskProps[j].pt.k.i){
                            maskProps[j].pt.k.c = maskProps[j].cl;
                        }else{
                            kLen = maskProps[j].pt.k.length;
                            for(k=0;k<kLen;k+=1){
                                if(maskProps[j].pt.k[k].s){
                                    maskProps[j].pt.k[k].s[0].c = maskProps[j].cl;
                                }
                                if(maskProps[j].pt.k[k].e){
                                    maskProps[j].pt.k[k].e[0].c = maskProps[j].cl;
                                }
                            }
                        }
                    }
                }
                if(layerData.ty === 4){
                    completeShapes(layerData.shapes);
                }
            }
        }

        return function (animationData){
            if(checkVersion(minimumVersion,animationData.v)){
                iterateLayers(animationData.layers);
                if(animationData.assets){
                    var i, len = animationData.assets.length;
                    for(i=0;i<len;i+=1){
                        if(animationData.assets[i].layers){
                            iterateLayers(animationData.assets[i].layers);

                        }
                    }
                }
            }
        }
    }());

    /*function blitPaths(path){
        var i, len = path.i.length;
        for(i=0;i<len;i+=1){
            path.i[i][0] /= blitter;
            path.i[i][1] /= blitter;
            path.o[i][0] /= blitter;
            path.o[i][1] /= blitter;
            path.v[i][0] /= blitter;
            path.v[i][1] /= blitter;
        }
    }
    function blitShapes(arr){
        var i, len = arr.length;
        var j, jLen;
        var hasPaths = false;
        for(i=len-1;i>=0;i-=1){
            if(arr[i].ty == 'sh'){
                if(arr[i].ks.k.i){
                    blitPaths(arr[i].ks.k);
                }else{
                    jLen = arr[i].ks.k.length;
                    for(j=0;j<jLen;j+=1){
                        if(arr[i].ks.k[j].s){
                            blitPaths(arr[i].ks.k[j].s[0]);
                        }
                        if(arr[i].ks.k[j].e){
                            blitPaths(arr[i].ks.k[j].e[0]);
                        }
                    }
                }
                hasPaths = true;
            }else if(arr[i].ty == 'gr'){
                blitShapes(arr[i].it);
            }else if(arr[i].ty == 'rc'){
                blitProperty(arr[i].p);
                blitProperty(arr[i].s);
            }else if(arr[i].ty == 'st'){
                blitProperty(arr[i].w);
            }else if(arr[i].ty == 'tr'){
                blitProperty(arr[i].p);
                blitProperty(arr[i].sk);
                blitProperty(arr[i].a);
            }else if(arr[i].ty == 'el'){
                blitProperty(arr[i].p);
                blitProperty(arr[i].s);
            }else if(arr[i].ty == 'rd'){
                blitProperty(arr[i].r);
            }else{
                //console.log(arr[i].ty );
            }
        }
    }
    function blitText(data, fontManager){
    }
    function blitValue(val){
        if(typeof(val) === 'number'){
            val /= blitter;
        } else {
            var i = val.length-1;
            while(i>=0){
                val[i] /= blitter;
                i-=1;
            }
        }
        return val;
    }
    function blitProperty(data){
        if(!data.k.length){
            data.k = blitValue(data.k);
        }else if(typeof(data.k[0]) === 'number'){
            data.k = blitValue(data.k);
        } else {
            var i, len = data.k.length;
            for(i=0;i<len;i+=1){
                if(data.k[i].s){
                    //console.log('pre S: ', data.k[i].s);
                    data.k[i].s = blitValue(data.k[i].s);
                    //console.log('post S: ', data.k[i].s);
                }
                if(data.k[i].e){
                    //console.log('pre E: ', data.k[i].e);
                    data.k[i].e = blitValue(data.k[i].e);
                    //console.log('post E: ', data.k[i].e);
                }
            }
        }
    }
    function blitLayers(layers,comps, fontManager){
        var layerData;
        var animArray, lastFrame;
        var i, len = layers.length;
        var j, jLen, k, kLen;
        for(i=0;i<len;i+=1){
            layerData = layers[i];
            if(!('ks' in layerData)){
                continue;
            }
            blitProperty(layerData.ks.a);
            blitProperty(layerData.ks.p);
            layerData.completed = true;
            if(layerData.tt){
                layers[i-1].td = layerData.tt;
            }
            animArray = [];
            lastFrame = -1;
            if(layerData.hasMask){
                var maskProps = layerData.masksProperties;
                jLen = maskProps.length;
                for(j=0;j<jLen;j+=1){
                    if(maskProps[j].pt.k.i){
                        blitPaths(maskProps[j].pt.k);
                    }else{
                        kLen = maskProps[j].pt.k.length;
                        for(k=0;k<kLen;k+=1){
                            if(maskProps[j].pt.k[k].s){
                                blitPaths(maskProps[j].pt.k[k].s[0]);
                            }
                            if(maskProps[j].pt.k[k].e){
                                blitPaths(maskProps[j].pt.k[k].e[0]);
                            }
                        }
                    }
                }
            }
            if(layerData.ty===0){
                layerData.w = Math.round(layerData.w/blitter);
                layerData.h = Math.round(layerData.h/blitter);
                blitLayers(layerData.layers,comps, fontManager);
            }else if(layerData.ty === 4){
                blitShapes(layerData.shapes);
            }else if(layerData.ty == 5){
                blitText(layerData, fontManager);
            }else if(layerData.ty == 1){
                layerData.sh /= blitter;
                layerData.sw /= blitter;
            } else {
            }
        }
    }
    function blitAnimation(animationData,comps, fontManager){
        blitLayers(animationData.layers,comps, fontManager);
    }*/

    function completeData(animationData, fontManager){
        if(animationData.__complete){
            return;
        }
        checkColors(animationData);
        checkText(animationData);
        checkShapes(animationData);
        completeLayers(animationData.layers, animationData.assets, fontManager);
        animationData.__complete = true;
        //blitAnimation(animationData, animationData.assets, fontManager);
    }

    function completeText(data, fontManager){
        var letters;
        var keys = data.t.d.k;
        var k, kLen = keys.length;
        for(k=0;k<kLen;k+=1){
            var documentData = data.t.d.k[k].s;
            letters = [];
            var i, len;
            var newLineFlag, index = 0, val;
            var anchorGrouping = data.t.m.g;
            var currentSize = 0, currentPos = 0, currentLine = 0, lineWidths = [];
            var lineWidth = 0;
            var maxLineWidth = 0;
            var j, jLen;
            var fontData = fontManager.getFontByName(documentData.f);
            var charData, cLength = 0;
            var styles = fontData.fStyle.split(' ');

            var fWeight = 'normal', fStyle = 'normal';
            len = styles.length;
            for(i=0;i<len;i+=1){
                if (styles[i].toLowerCase() === 'italic') {
                    fStyle = 'italic';
                }else if (styles[i].toLowerCase() === 'bold') {
                    fWeight = '700';
                } else if (styles[i].toLowerCase() === 'black') {
                    fWeight = '900';
                } else if (styles[i].toLowerCase() === 'medium') {
                    fWeight = '500';
                } else if (styles[i].toLowerCase() === 'regular' || styles[i].toLowerCase() === 'normal') {
                    fWeight = '400';
                } else if (styles[i].toLowerCase() === 'light' || styles[i].toLowerCase() === 'thin') {
                    fWeight = '200';
                }
            }
            documentData.fWeight = fWeight;
            documentData.fStyle = fStyle;
            len = documentData.t.length;
            if(documentData.sz){
                var boxWidth = documentData.sz[0];
                var lastSpaceIndex = -1;
                for(i=0;i<len;i+=1){
                    newLineFlag = false;
                    if(documentData.t.charAt(i) === ' '){
                        lastSpaceIndex = i;
                    }else if(documentData.t.charCodeAt(i) === 13){
                        lineWidth = 0;
                        newLineFlag = true;
                    }
                    if(fontManager.chars){
                        charData = fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, fontData.fFamily);
                        cLength = newLineFlag ? 0 : charData.w*documentData.s/100;
                    }else{
                        //tCanvasHelper.font = documentData.s + 'px '+ fontData.fFamily;
                        cLength = fontManager.measureText(documentData.t.charAt(i), documentData.f, documentData.s);
                    }
                    if(lineWidth + cLength > boxWidth){
                        if(lastSpaceIndex === -1){
                            //i -= 1;
                            documentData.t = documentData.t.substr(0,i) + "\r" + documentData.t.substr(i);
                            len += 1;
                        } else {
                            i = lastSpaceIndex;
                            documentData.t = documentData.t.substr(0,i) + "\r" + documentData.t.substr(i+1);
                        }
                        lastSpaceIndex = -1;
                        lineWidth = 0;
                    }else {
                        lineWidth += cLength;
                    }
                }
                len = documentData.t.length;
            }
            lineWidth = 0;
            cLength = 0;
            for (i = 0;i < len ;i += 1) {
                newLineFlag = false;
                if(documentData.t.charAt(i) === ' '){
                    val = '\u00A0';
                }else if(documentData.t.charCodeAt(i) === 13){
                    lineWidths.push(lineWidth);
                    maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
                    lineWidth = 0;
                    val = '';
                    newLineFlag = true;
                    currentLine += 1;
                }else{
                    val = documentData.t.charAt(i);
                }
                if(fontManager.chars){
                    charData = fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, fontManager.getFontByName(documentData.f).fFamily);
                    cLength = newLineFlag ? 0 : charData.w*documentData.s/100;
                }else{
                    //var charWidth = fontManager.measureText(val, documentData.f, documentData.s);
                    //tCanvasHelper.font = documentData.s + 'px '+ fontManager.getFontByName(documentData.f).fFamily;
                    cLength = fontManager.measureText(val, documentData.f, documentData.s);
                }

                //
                lineWidth += cLength;
                letters.push({l:cLength,an:cLength,add:currentSize,n:newLineFlag, anIndexes:[], val: val, line: currentLine});
                if(anchorGrouping == 2){
                    currentSize += cLength;
                    if(val == '' || val == '\u00A0' || i == len - 1){
                        if(val == '' || val == '\u00A0'){
                            currentSize -= cLength;
                        }
                        while(currentPos<=i){
                            letters[currentPos].an = currentSize;
                            letters[currentPos].ind = index;
                            letters[currentPos].extra = cLength;
                            currentPos += 1;
                        }
                        index += 1;
                        currentSize = 0;
                    }
                }else if(anchorGrouping == 3){
                    currentSize += cLength;
                    if(val == '' || i == len - 1){
                        if(val == ''){
                            currentSize -= cLength;
                        }
                        while(currentPos<=i){
                            letters[currentPos].an = currentSize;
                            letters[currentPos].ind = index;
                            letters[currentPos].extra = cLength;
                            currentPos += 1;
                        }
                        currentSize = 0;
                        index += 1;
                    }
                }else{
                    letters[index].ind = index;
                    letters[index].extra = 0;
                    index += 1;
                }
            }
            documentData.l = letters;
            maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
            lineWidths.push(lineWidth);
            if(documentData.sz){
                documentData.boxWidth = documentData.sz[0];
                documentData.justifyOffset = 0;
            }else{
                documentData.boxWidth = maxLineWidth;
                switch(documentData.j){
                    case 1:
                        documentData.justifyOffset = - documentData.boxWidth;
                        break;
                    case 2:
                        documentData.justifyOffset = - documentData.boxWidth/2;
                        break;
                    default:
                        documentData.justifyOffset = 0;
                }
            }
            documentData.lineWidths = lineWidths;

            var animators = data.t.a;
            jLen = animators.length;
            var based, ind, indexes = [];
            for(j=0;j<jLen;j+=1){
                if(animators[j].a.sc){
                    documentData.strokeColorAnim = true;
                }
                if(animators[j].a.sw){
                    documentData.strokeWidthAnim = true;
                }
                if(animators[j].a.fc || animators[j].a.fh || animators[j].a.fs || animators[j].a.fb){
                    documentData.fillColorAnim = true;
                }
                ind = 0;
                based = animators[j].s.b;
                for(i=0;i<len;i+=1){
                    letters[i].anIndexes[j] = ind;
                    if((based == 1 && letters[i].val != '') || (based == 2 && letters[i].val != '' && letters[i].val != '\u00A0') || (based == 3 && (letters[i].n || letters[i].val == '\u00A0' || i == len - 1)) || (based == 4 && (letters[i].n || i == len - 1))){
                        if(animators[j].s.rn === 1){
                            indexes.push(ind);
                        }
                        ind += 1;
                    }
                }
                data.t.a[j].s.totalChars = ind;
                var currentInd = -1, newInd;
                if(animators[j].s.rn === 1){
                    for(i = 0; i < len; i += 1){
                        if(currentInd != letters[i].anIndexes[j]){
                            currentInd = letters[i].anIndexes[j];
                            newInd = indexes.splice(Math.floor(Math.random()*indexes.length),1)[0];
                        }
                        letters[i].anIndexes[j] = newInd;
                    }
                }
            }
            if(jLen === 0 && !('m' in data.t.p)){
                data.singleShape = true;
            }
            documentData.yOffset = documentData.lh || documentData.s*1.2;
            documentData.ascent = fontData.ascent*documentData.s/100;
        }

    }

    var moduleOb = {};
    moduleOb.completeData = completeData;

    return moduleOb;
}

var dataManager = dataFunctionManager();
var FontManager = (function(){

    var maxWaitingTime = 5000;

    function setUpNode(font, family){
        var parentNode = document.createElement('span');
        parentNode.style.fontFamily    = family;
        var node = document.createElement('span');
        // Characters that vary significantly among different fonts
        node.innerHTML = 'giItT1WQy@!-/#';
        // Visible - so we can measure it - but not on the screen
        parentNode.style.position      = 'absolute';
        parentNode.style.left          = '-10000px';
        parentNode.style.top           = '-10000px';
        // Large font size makes even subtle changes obvious
        parentNode.style.fontSize      = '300px';
        // Reset any font properties
        parentNode.style.fontVariant   = 'normal';
        parentNode.style.fontStyle     = 'normal';
        parentNode.style.fontWeight    = 'normal';
        parentNode.style.letterSpacing = '0';
        parentNode.appendChild(node);
        document.body.appendChild(parentNode);

        // Remember width with no applied web font
        var width = node.offsetWidth;
        node.style.fontFamily = font + ', '+family;
        return {node:node, w:width, parent:parentNode};
    }

    function checkLoadedFonts() {
        var i, len = this.fonts.length;
        var node, w;
        var loadedCount = len;
        for(i=0;i<len; i+= 1){
            if(this.fonts[i].loaded){
                loadedCount -= 1;
                continue;
            }
            if(this.fonts[i].fOrigin === 't'){
                if(window.Typekit && window.Typekit.load && this.typekitLoaded === 0){
                    this.typekitLoaded = 1;
                    try{window.Typekit.load({
                        async: true,
                        active: function() {
                            this.typekitLoaded = 2;
                        }.bind(this)
                    });}catch(e){}
                }
                if(this.typekitLoaded === 2) {
                    this.fonts[i].loaded = true;
                }
            } else if(this.fonts[i].fOrigin === 'n'){
                this.fonts[i].loaded = true;
            } else{
                node = this.fonts[i].monoCase.node;
                w = this.fonts[i].monoCase.w;
                if(node.offsetWidth !== w){
                    loadedCount -= 1;
                    this.fonts[i].loaded = true;
                }else{
                    node = this.fonts[i].sansCase.node;
                    w = this.fonts[i].sansCase.w;
                    if(node.offsetWidth !== w){
                        loadedCount -= 1;
                        this.fonts[i].loaded = true;
                    }
                }
                if(this.fonts[i].loaded){
                    this.fonts[i].sansCase.parent.parentNode.removeChild(this.fonts[i].sansCase.parent);
                    this.fonts[i].monoCase.parent.parentNode.removeChild(this.fonts[i].monoCase.parent);
                }
            }
        }

        if(loadedCount !== 0 && Date.now() - this.initTime < maxWaitingTime){
            setTimeout(checkLoadedFonts.bind(this),20);
        }else{
            setTimeout(function(){this.loaded = true;}.bind(this),0);

        }
    };

    function createHelper(def, fontData){
        var tHelper = document.createElementNS(svgNS,'text');
        tHelper.style.fontSize = '100px';
        tHelper.style.fontFamily = fontData.fFamily;
        tHelper.textContent = '1';
        if(fontData.fClass){
            tHelper.style.fontFamily = 'inherit';
            tHelper.className = fontData.fClass;
        } else {
            tHelper.style.fontFamily = fontData.fFamily;
        }
        def.appendChild(tHelper);
        var tCanvasHelper = document.createElement('canvas').getContext('2d');
        tCanvasHelper.font = '100px '+ fontData.fFamily;
        return tCanvasHelper;
        return tHelper;
    }

    function addFonts(fontData, defs){
        if(!fontData){
            this.loaded = true;
            return;
        }
        if(this.chars){
            this.loaded = true;
            this.fonts = fontData.list;
            return;
        }

        var fontArr = fontData.list;
        var i, len = fontArr.length;
        for(i=0; i<len; i+= 1){
            fontArr[i].loaded = false;
            fontArr[i].monoCase = setUpNode(fontArr[i].fFamily,'monospace');
            fontArr[i].sansCase = setUpNode(fontArr[i].fFamily,'sans-serif');
            if(!fontArr[i].fPath) {
                fontArr[i].loaded = true;
            }else if(fontArr[i].fOrigin === 'p'){
                var s = document.createElement('style');
                s.type = "text/css";
                s.innerHTML = "@font-face {" + "font-family: "+fontArr[i].fFamily+"; font-style: normal; src: url('"+fontArr[i].fPath+"');}";
                defs.appendChild(s);
            } else if(fontArr[i].fOrigin === 'g'){
                //<link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet' type='text/css'>
                var l = document.createElement('link');
                l.type = "text/css";
                l.rel = "stylesheet";
                l.href = fontArr[i].fPath;
                defs.appendChild(l);
            } else if(fontArr[i].fOrigin === 't'){
                //<link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet' type='text/css'>
                var sc = document.createElement('script');
                sc.setAttribute('src',fontArr[i].fPath);
                defs.appendChild(sc);
            }
            fontArr[i].helper = createHelper(defs,fontArr[i]);
            this.fonts.push(fontArr[i]);
        }
        checkLoadedFonts.bind(this)();
    }

    function addChars(chars){
        if(!chars){
            return;
        }
        if(!this.chars){
            this.chars = [];
        }
        var i, len = chars.length;
        var j, jLen = this.chars.length, found;
        for(i=0;i<len;i+=1){
            j = 0;
            found = false;
            while(j<jLen){
                if(this.chars[j].style === chars[i].style && this.chars[j].fFamily === chars[i].fFamily && this.chars[j].ch === chars[i].ch){
                    found = true;
                }
                j += 1;
            }
            if(!found){
                this.chars.push(chars[i]);
                jLen += 1;
            }
        }
    }

    function getCharData(char, style, font){
        var i = 0, len = this.chars.length;
        while( i < len) {
            if(this.chars[i].ch === char && this.chars[i].style === style && this.chars[i].fFamily === font){
                return this.chars[i];
            }
            i+= 1;
        }
    }

    function measureText(char, fontName, size){
        var fontData = this.getFontByName(fontName);
        var tHelper = fontData.helper;
        //tHelper.textContent = char;
        return tHelper.measureText(char).width*size/100;
        //return tHelper.getComputedTextLength()*size/100;
    }

    function getFontByName(name){
        var i = 0, len = this.fonts.length;
        while(i<len){
            if(this.fonts[i].fName === name) {
                return this.fonts[i];
            }
            i += 1;
        }
        return 'sans-serif';
    }

    var Font = function(){
        this.fonts = [];
        this.chars = null;
        this.typekitLoaded = 0;
        this.loaded = false;
        this.initTime = Date.now();
    };
    Font.prototype.addChars = addChars;
    Font.prototype.addFonts = addFonts;
    Font.prototype.getCharData = getCharData;
    Font.prototype.getFontByName = getFontByName;
    Font.prototype.measureText = measureText;

    return Font;

}());
var PropertyFactory = (function(){

    var initFrame = -999999;

    function getValue(){
        if(this.elem.globalData.frameId === this.frameId){
            return;
        }
        this.mdf = false;
        var frameNum = this.comp.renderedFrame - this.offsetTime;
        if(!(frameNum === this.lastFrame || (this.lastFrame !== initFrame && ((this.lastFrame >= this.keyframes[this.keyframes.length- 1].t-this.offsetTime && frameNum >= this.keyframes[this.keyframes.length- 1].t-this.offsetTime) || (this.lastFrame < this.keyframes[0].t-this.offsetTime && frameNum < this.keyframes[0].t-this.offsetTime))))){
            var i = this.lastFrame < frameNum ? this._lastIndex : 0;
            var len = this.keyframes.length- 1,flag = true;
            var keyData, nextKeyData;

            while(flag){
                keyData = this.keyframes[i];
                nextKeyData = this.keyframes[i+1];
                if(i == len-1 && frameNum >= nextKeyData.t - this.offsetTime){
                    if(keyData.h){
                        keyData = nextKeyData;
                    }
                    break;
                }
                if((nextKeyData.t - this.offsetTime) > frameNum){
                    break;
                }
                if(i < len - 1){
                    i += 1;
                }else{
                    flag = false;
                }
            }

            this._lastIndex = i;

            var k, kLen,perc,jLen, j, fnc;
            if(keyData.to){

                if(!keyData.bezierData){
                    bez.buildBezierData(keyData);
                }
                var bezierData = keyData.bezierData;
                if(frameNum >= nextKeyData.t-this.offsetTime || frameNum < keyData.t-this.offsetTime){
                    var ind = frameNum >= nextKeyData.t-this.offsetTime ? bezierData.points.length - 1 : 0;
                    kLen = bezierData.points[ind].point.length;
                    for(k = 0; k < kLen; k += 1){
                        this.pv[k] = bezierData.points[ind].point[k];
                        this.v[k] = this.mult ? this.pv[k]*this.mult : this.pv[k];
                        if(this.lastPValue[k] !== this.pv[k]) {
                            this.mdf = true;
                            this.lastPValue[k] = this.pv[k];
                        }
                    }
                    this._lastBezierData = null;
                }else{
                    if(keyData.__fnct){
                        fnc = keyData.__fnct;
                    }else{
                        fnc = BezierFactory.getBezierEasing(keyData.o.x,keyData.o.y,keyData.i.x,keyData.i.y,keyData.n).get;
                        keyData.__fnct = fnc;
                    }
                    perc = fnc((frameNum-(keyData.t-this.offsetTime))/((nextKeyData.t-this.offsetTime)-(keyData.t-this.offsetTime)));
                    var distanceInLine = bezierData.segmentLength*perc;

                    var segmentPerc;
                    var addedLength =  (this.lastFrame < frameNum && this._lastBezierData === bezierData) ? this._lastAddedLength : 0;
                    j =  (this.lastFrame < frameNum && this._lastBezierData === bezierData) ? this._lastPoint : 0;
                    flag = true;
                    jLen = bezierData.points.length;
                    while(flag){
                        addedLength +=bezierData.points[j].partialLength;
                        if(distanceInLine === 0 || perc === 0 || j == bezierData.points.length - 1){
                            kLen = bezierData.points[j].point.length;
                            for(k=0;k<kLen;k+=1){
                                this.pv[k] = bezierData.points[j].point[k];
                                this.v[k] = this.mult ? this.pv[k]*this.mult : this.pv[k];
                                if(this.lastPValue[k] !== this.pv[k]) {
                                    this.mdf = true;
                                    this.lastPValue[k] = this.pv[k];
                                }
                            }
                            break;
                        }else if(distanceInLine >= addedLength && distanceInLine < addedLength + bezierData.points[j+1].partialLength){
                            segmentPerc = (distanceInLine-addedLength)/(bezierData.points[j+1].partialLength);
                            kLen = bezierData.points[j].point.length;
                            for(k=0;k<kLen;k+=1){
                                this.pv[k] = bezierData.points[j].point[k] + (bezierData.points[j+1].point[k] - bezierData.points[j].point[k])*segmentPerc;
                                this.v[k] = this.mult ? this.pv[k] * this.mult : this.pv[k];
                                if(this.lastPValue[k] !== this.pv[k]) {
                                    this.mdf = true;
                                    this.lastPValue[k] = this.pv[k];
                                }
                            }
                            break;
                        }
                        if(j < jLen - 1){
                            j += 1;
                        }else{
                            flag = false;
                        }
                    }
                    this._lastPoint = j;
                    this._lastAddedLength = addedLength - bezierData.points[j].partialLength;
                    this._lastBezierData = bezierData;
                }
            }else{
                var outX,outY,inX,inY, keyValue;
                len = keyData.s.length;
                for(i=0;i<len;i+=1){
                    if(keyData.h !== 1){
                        if(frameNum >= nextKeyData.t-this.offsetTime){
                            perc = 1;
                        }else if(frameNum < keyData.t-this.offsetTime){
                            perc = 0;
                        }else{
                            if(keyData.o.x instanceof Array){
                                if(!keyData.__fnct){
                                    keyData.__fnct = [];
                                }
                                if (!keyData.__fnct[i]) {
                                    outX = keyData.o.x[i] || keyData.o.x[0];
                                    outY = keyData.o.y[i] || keyData.o.y[0];
                                    inX = keyData.i.x[i] || keyData.i.x[0];
                                    inY = keyData.i.y[i] || keyData.i.y[0];
                                    fnc = BezierFactory.getBezierEasing(outX,outY,inX,inY).get;
                                    keyData.__fnct[i] = fnc;
                                } else {
                                    fnc = keyData.__fnct[i];
                                }
                            } else {
                                if (!keyData.__fnct) {
                                    outX = keyData.o.x;
                                    outY = keyData.o.y;
                                    inX = keyData.i.x;
                                    inY = keyData.i.y;
                                    fnc = BezierFactory.getBezierEasing(outX,outY,inX,inY).get;
                                    keyData.__fnct = fnc;
                                } else{
                                    fnc = keyData.__fnct;
                                }
                            }
                            perc = fnc((frameNum-(keyData.t-this.offsetTime))/((nextKeyData.t-this.offsetTime)-(keyData.t-this.offsetTime)));
                        }
                    }
                    if(this.sh && keyData.h !== 1){
                        var initP = keyData.s[i];
                        var endP = keyData.e[i];
                        if(initP-endP < -180){
                            initP += 360;
                        } else if(initP-endP > 180){
                            initP -= 360;
                        }
                        keyValue = initP+(endP-initP)*perc;
                    } else {
                        keyValue = keyData.h === 1 ? keyData.s[i] : keyData.s[i]+(keyData.e[i]-keyData.s[i])*perc;
                    }
                    if(len === 1){
                        this.v = this.mult ? keyValue*this.mult : keyValue;
                        this.pv = keyValue;
                        if(this.lastPValue != this.pv){
                            this.mdf = true;
                            this.lastPValue = this.pv;
                        }
                    }else{
                        this.v[i] = this.mult ? keyValue*this.mult : keyValue;
                        this.pv[i] = keyValue;
                        if(this.lastPValue[i] !== this.pv[i]){
                            this.mdf = true;
                            this.lastPValue[i] = this.pv[i];
                        }
                    }
                }
            }
        }
        this.lastFrame = frameNum;
        this.frameId = this.elem.globalData.frameId;
    }

    function getNoValue(){}

    function ValueProperty(elem,data, mult){
        this.mult = mult;
        this.v = mult ? data.k * mult : data.k;
        this.pv = data.k;
        this.mdf = false;
        this.comp = elem.comp;
        this.k = false;
        this.kf = false;
        this.vel = 0;
        this.getValue = getNoValue;
    }

    function MultiDimensionalProperty(elem,data, mult){
        this.mult = mult;
        this.data = data;
        this.mdf = false;
        this.comp = elem.comp;
        this.k = false;
        this.kf = false;
        this.frameId = -1;
        this.v = Array.apply(null, {length:data.k.length});
        this.pv = Array.apply(null, {length:data.k.length});
        this.lastValue = Array.apply(null, {length:data.k.length});
        var arr = Array.apply(null, {length:data.k.length});
        this.vel = arr.map(function () { return 0 });
        var i, len = data.k.length;
        for(i = 0;i<len;i+=1){
            this.v[i] = mult ? data.k[i] * mult : data.k[i];
            this.pv[i] = data.k[i];
        }
        this.getValue = getNoValue;
    }

    function KeyframedValueProperty(elem, data, mult){
        this.keyframes = data.k;
        this.offsetTime = elem.data.st;
        this.lastValue = -99999;
        this.lastPValue = -99999;
        this.frameId = -1;
        this._lastIndex = 0;
        this.k = true;
        this.kf = true;
        this.data = data;
        this.mult = mult;
        this.elem = elem;
        this.comp = elem.comp;
        this.lastFrame = initFrame;
        this.v = mult ? data.k[0].s[0]*mult : data.k[0].s[0];
        this.pv = data.k[0].s[0];
        this.getValue = getValue;
    }

    function KeyframedMultidimensionalProperty(elem, data, mult){
        var i, len = data.k.length;
        var s, e,to,ti;
        for(i=0;i<len-1;i+=1){
            if(data.k[i].to && data.k[i].s && data.k[i].e ){
                s = data.k[i].s;
                e = data.k[i].e;
                to = data.k[i].to;
                ti = data.k[i].ti;
                if((s.length === 2 && !(s[0] === e[0] && s[1] === e[1]) && bez.pointOnLine2D(s[0],s[1],e[0],e[1],s[0] + to[0],s[1] + to[1]) && bez.pointOnLine2D(s[0],s[1],e[0],e[1],e[0] + ti[0],e[1] + ti[1])) || (s.length === 3 && !(s[0] === e[0] && s[1] === e[1] && s[2] === e[2]) && bez.pointOnLine3D(s[0],s[1],s[2],e[0],e[1],e[2],s[0] + to[0],s[1] + to[1],s[2] + to[2]) && bez.pointOnLine3D(s[0],s[1],s[2],e[0],e[1],e[2],e[0] + ti[0],e[1] + ti[1],e[2] + ti[2]))){
                    data.k[i].to = null;
                    data.k[i].ti = null;
                }
            }
        }
        this.keyframes = data.k;
        this.offsetTime = elem.data.st;
        this.k = true;
        this.kf = true;
        this.mult = mult;
        this.elem = elem;
        this.comp = elem.comp;
        this.getValue = getValue;
        this.frameId = -1;
        this._lastIndex = 0;
        this.v = Array.apply(null, {length:data.k[0].s.length});
        this.pv = Array.apply(null, {length:data.k[0].s.length});
        this.lastValue = Array.apply(null, {length:data.k[0].s.length});
        this.lastPValue = Array.apply(null, {length:data.k[0].s.length});
        this.lastFrame = initFrame;
    }

    var TransformProperty = (function() {
        function positionGetter() {
            return ExpressionValue(this.p);
        }
        function xPositionGetter() {
            return ExpressionValue(this.px);
        }
        function yPositionGetter() {
            return ExpressionValue(this.py);
        }
        function zPositionGetter() {
            return ExpressionValue(this.pz);
        }
        function anchorGetter() {
            return ExpressionValue(this.a);
        }
        function orientationGetter() {
            return ExpressionValue(this.or);
        }
        function rotationGetter() {
            return ExpressionValue(this.r, 1/degToRads);
        }
        function scaleGetter() {
            return ExpressionValue(this.s, 100);
        }
        function opacityGetter() {
            return ExpressionValue(this.o, 100);
        }
        function skewGetter() {
            return ExpressionValue(this.sk);
        }
        function skewAxisGetter() {
            return ExpressionValue(this.sa);
        }
        function applyToMatrix(mat) {
            var i, len = this.dynamicProperties.length;
            for(i = 0; i < len; i += 1) {
                this.dynamicProperties[i].getValue();
                if (this.dynamicProperties[i].mdf) {
                    this.mdf = true;
                }
            }
            if (this.a) {
                mat.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
            }
            if (this.s) {
                mat.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
            }
            if (this.r) {
                mat.rotate(-this.r.v);
            } else {
                mat.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
            }
            if (this.data.p.s) {
                if (this.data.p.z) {
                    mat.translate(this.px.v, this.py.v, -this.pz.v);
                } else {
                    mat.translate(this.px.v, this.py.v, 0);
                }
            } else {
                mat.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
            }
        }
        function processKeys(){
            if (this.elem.globalData.frameId === this.frameId) {
                return;
            }

            this.mdf = false;
            var i, len = this.dynamicProperties.length;

            for(i = 0; i < len; i += 1) {
                this.dynamicProperties[i].getValue();
                if (this.dynamicProperties[i].mdf) {
                    this.mdf = true;
                }
            }
            if (this.mdf) {
                this.v.reset();
                if (this.a) {
                    this.v.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
                }
                if(this.s) {
                    this.v.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
                }
                if (this.sk) {
                    this.v.skewFromAxis(-this.sk.v, this.sa.v);
                }
                if (this.r) {
                    this.v.rotate(-this.r.v);
                } else {
                    this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
                }
                if (this.autoOriented && this.p.keyframes && this.p.getValueAtTime) {
                    var v1,v2;
                    if (this.p.lastFrame+this.p.offsetTime <= this.p.keyframes[0].t) {
                        v1 = this.p.getValueAtTime((this.p.keyframes[0].t + 0.01) / this.elem.globalData.frameRate,0);
                        v2 = this.p.getValueAtTime(this.p.keyframes[0].t / this.elem.globalData.frameRate, 0);
                    } else if(this.p.lastFrame+this.p.offsetTime >= this.p.keyframes[this.p.keyframes.length - 1].t) {
                        v1 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t / this.elem.globalData.frameRate), 0);
                        v2 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t - 0.01) / this.elem.globalData.frameRate, 0);
                    } else {
                        v1 = this.p.pv;
                        v2 = this.p.getValueAtTime((this.p.lastFrame+this.p.offsetTime - 0.01) / this.elem.globalData.frameRate, this.p.offsetTime);
                    }
                    this.v.rotate(-Math.atan2(v1[1] - v2[1], v1[0] - v2[0]));
                }
                if(this.data.p.s){
                    if(this.data.p.z) {
                        this.v.translate(this.px.v, this.py.v, -this.pz.v);
                    } else {
                        this.v.translate(this.px.v, this.py.v, 0);
                    }
                }else{
                    this.v.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);
                }
            }
            //console.log(this.v.to2dCSS())
            this.frameId = this.elem.globalData.frameId;
        }

        function setInverted(){
            this.inverted = true;
            this.iv = new Matrix();
            if(!this.k){
                if(this.data.p.s){
                    this.iv.translate(this.px.v,this.py.v,-this.pz.v);
                }else{
                    this.iv.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);
                }
                if(this.r){
                    this.iv.rotate(-this.r.v);
                }else{
                    this.iv.rotateX(-this.rx.v).rotateY(-this.ry.v).rotateZ(this.rz.v);
                }
                if(this.s){
                    this.iv.scale(this.s.v[0],this.s.v[1],1);
                }
                if(this.a){
                    this.iv.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);
                }
            }
        }

        function autoOrient(){
            //
            //var prevP = this.getValueAtTime();
        }

        return function TransformProperty(elem,data,arr){
            this.elem = elem;
            this.frameId = -1;
            this.type = 'transform';
            this.dynamicProperties = [];
            this.mdf = false;
            this.data = data;
            this.getValue = processKeys;
            this.applyToMatrix = applyToMatrix;
            this.setInverted = setInverted;
            this.autoOrient = autoOrient;
            this.v = new Matrix();
            if(data.p.s){
                this.px = PropertyFactory.getProp(elem,data.p.x,0,0,this.dynamicProperties);
                this.py = PropertyFactory.getProp(elem,data.p.y,0,0,this.dynamicProperties);
                if(data.p.z){
                    this.pz = PropertyFactory.getProp(elem,data.p.z,0,0,this.dynamicProperties);
                }
            }else{
                this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            }
            if(data.r) {
                this.r = PropertyFactory.getProp(elem, data.r, 0, degToRads, this.dynamicProperties);
            } else if(data.rx) {
                this.rx = PropertyFactory.getProp(elem, data.rx, 0, degToRads, this.dynamicProperties);
                this.ry = PropertyFactory.getProp(elem, data.ry, 0, degToRads, this.dynamicProperties);
                this.rz = PropertyFactory.getProp(elem, data.rz, 0, degToRads, this.dynamicProperties);
                this.or = PropertyFactory.getProp(elem, data.or, 1, degToRads, this.dynamicProperties);
            }
            if(data.sk){
                this.sk = PropertyFactory.getProp(elem, data.sk, 0, degToRads, this.dynamicProperties);
                this.sa = PropertyFactory.getProp(elem, data.sa, 0, degToRads, this.dynamicProperties);
            }
            if(data.a) {
                this.a = PropertyFactory.getProp(elem,data.a,1,0,this.dynamicProperties);
            }
            if(data.s) {
                this.s = PropertyFactory.getProp(elem,data.s,1,0.01,this.dynamicProperties);
            }
            if(data.o){
                this.o = PropertyFactory.getProp(elem,data.o,0,0.01,arr);
            } else {
                this.o = {mdf:false,v:1};
            }
            if(this.dynamicProperties.length){
                arr.push(this);
            }else{
                if(this.a){
                    this.v.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);
                }
                if(this.s){
                    this.v.scale(this.s.v[0],this.s.v[1],this.s.v[2]);
                }
                if(this.sk){
                    this.v.skewFromAxis(-this.sk.v,this.sa.v);
                }
                if(this.r){
                    this.v.rotate(-this.r.v);
                }else{
                    this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
                }
                if(this.data.p.s){
                    if(data.p.z) {
                        this.v.translate(this.px.v, this.py.v, -this.pz.v);
                    } else {
                        this.v.translate(this.px.v, this.py.v, 0);
                    }
                }else{
                    this.v.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);
                }
            }
            Object.defineProperty(this, "position", { get: positionGetter});
            Object.defineProperty(this, "xPosition", { get: xPositionGetter});
            Object.defineProperty(this, "yPosition", { get: yPositionGetter});
            Object.defineProperty(this, "orientation", { get: orientationGetter});
            Object.defineProperty(this, "anchorPoint", { get: anchorGetter});
            Object.defineProperty(this, "rotation", { get: rotationGetter});
            Object.defineProperty(this, "scale", { get: scaleGetter});
            Object.defineProperty(this, "opacity", { get: opacityGetter});
            Object.defineProperty(this, "skew", { get: skewGetter});
            Object.defineProperty(this, "skewAxis", { get: skewAxisGetter});
        }
    }());

    function getProp(elem,data,type, mult, arr) {
        var p;
        if(type === 2){
            p = new TransformProperty(elem, data, arr);
        } else if(data.a === 0){
            if(type === 0) {
                p = new ValueProperty(elem,data,mult);
            } else {
                p = new MultiDimensionalProperty(elem,data, mult);
            }
        } else if(data.a === 1){
            if(type === 0) {
                p = new KeyframedValueProperty(elem,data,mult);
            } else {
                p = new KeyframedMultidimensionalProperty(elem,data, mult);
            }
        } else if(!data.k.length){
            p = new ValueProperty(elem,data, mult);
        }else if(typeof(data.k[0]) === 'number'){
            p = new MultiDimensionalProperty(elem,data, mult);
        }else{
            switch(type){
                case 0:
                    p = new KeyframedValueProperty(elem,data,mult);
                    break;
                case 1:
                    p = new KeyframedMultidimensionalProperty(elem,data,mult);
                    break;
            }
        }
        if(p.k){
            arr.push(p);
        }
        return p;
    }

    var getGradientProp = (function(){

        function getValue(forceRender){
            this.prop.getValue();
            this.cmdf = false;
            this.omdf = false;
            if(this.prop.mdf || forceRender){
                var i, len = this.data.p*4;
                var mult, val;
                for(i=0;i<len;i+=1){
                    mult = i%4 === 0 ? 100 : 255;
                    val = Math.round(this.prop.v[i]*mult);
                    if(this.c[i] !== val){
                        this.c[i] = val;
                        this.cmdf = true;
                    }
                }
                if(this.o.length){
                    len = this.prop.v.length;
                    for(i=this.data.p*4;i<len;i+=1){
                        mult = i%2 === 0 ? 100 : 1;
                        val = i%2 === 0 ?  Math.round(this.prop.v[i]*100):this.prop.v[i];
                        if(this.o[i-this.data.p*4] !== val){
                            this.o[i-this.data.p*4] = val;
                            this.omdf = true;
                        }
                    }
                }
            }

        }

        function gradientProp(elem,data,arr){
            this.prop = getProp(elem,data.k,1,null,[]);
            this.data = data;
            this.k = this.prop.k;
            this.c = Array.apply(null,{length:data.p*4});
            var cLength = data.k.k[0].s ? (data.k.k[0].s.length - data.p*4) : data.k.k.length - data.p*4;
            this.o = Array.apply(null,{length:cLength});
            this.cmdf = false;
            this.omdf = false;
            this.getValue = getValue;
            if(this.prop.k){
                arr.push(this);
            }
            this.getValue(true);
        }

        return function getGradientProp(elem,data,arr){
            return new gradientProp(elem,data,arr);
        }
    }());




    var DashProperty = (function(){

        function processKeys(forceRender){
            var i = 0, len = this.dataProps.length;

            if(this.elem.globalData.frameId === this.frameId && !forceRender){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;
            while(i<len){
                if(this.dataProps[i].p.mdf){
                    this.mdf = true;
                    break;
                }
                i+=1;
            }
            if(this.mdf || forceRender){
                if(this.renderer === 'svg') {
                    this.dasharray = '';
                }
                for(i=0;i<len;i+=1){
                    if(this.dataProps[i].n != 'o'){
                        if(this.renderer === 'svg') {
                            this.dasharray += ' ' + this.dataProps[i].p.v;
                        }else{
                            this.dasharray[i] = this.dataProps[i].p.v;
                        }
                    }else{
                        this.dashoffset = this.dataProps[i].p.v;
                    }
                }
            }
        }

        return function(elem, data,renderer, dynamicProperties){
            this.elem = elem;
            this.frameId = -1;
            this.dataProps = new Array(data.length);
            this.renderer = renderer;
            this.mdf = false;
            this.k = false;
            if(this.renderer === 'svg'){
                this.dasharray = '';
            }else{

                this.dasharray = new Array(data.length - 1);
            }
            this.dashoffset = 0;
            var i, len = data.length, prop;
            for(i=0;i<len;i+=1){
                prop = PropertyFactory.getProp(elem,data[i].v,0, 0, dynamicProperties);
                this.k = prop.k ? true : this.k;
                this.dataProps[i] = {n:data[i].n,p:prop};
            }
            this.getValue = processKeys;
            if(this.k){
                dynamicProperties.push(this);
            }else{
                this.getValue(true);
            }

        }
    }());

    function getDashProp(elem, data,renderer, dynamicProperties) {
        return new DashProperty(elem, data,renderer, dynamicProperties);
    };

    var TextSelectorProp = (function(){
        var max = Math.max;
        var min = Math.min;
        var floor = Math.floor;
        function updateRange(){
            if(this.dynamicProperties.length){
                var i, len = this.dynamicProperties.length;
                for(i=0;i<len;i+=1){
                    this.dynamicProperties[i].getValue();
                    if(this.dynamicProperties[i].mdf){
                        this.mdf = true;
                    }
                }
            }
            var totalChars = this.data.totalChars;
            var divisor = this.data.r === 2 ? 1 : 100/totalChars;
            var o = this.o.v/divisor;
            var s = this.s.v/divisor + o;
            var e = (this.e.v/divisor) + o;
            if(s>e){
                var _s = s;
                s = e;
                e = _s;
            }
            this.finalS = s;
            this.finalE = e;
        }

        function getMult(ind){
            //var easer = bez.getEasingCurve(this.ne.v/100,0,1-this.xe.v/100,1);
            var easer = BezierFactory.getBezierEasing(this.ne.v/100,0,1-this.xe.v/100,1).get;
            var mult = 0;
            var s = this.finalS;
            var e = this.finalE;
            var type = this.data.sh;
            if(type == 2){
                if(e === s){
                    mult = ind >= e ? 1 : 0;
                }else{
                    mult = max(0,min(0.5/(e-s) + (ind-s)/(e-s),1));
                }
                mult = easer(mult);
            }else if(type == 3){
                if(e === s){
                    mult = ind >= e ? 0 : 1;
                }else{
                    mult = 1 - max(0,min(0.5/(e-s) + (ind-s)/(e-s),1));
                }

                mult = easer(mult);
            }else if(type == 4){
                if(e === s){
                    mult = 0;
                }else{
                    mult = max(0,min(0.5/(e-s) + (ind-s)/(e-s),1));
                    if(mult<.5){
                        mult *= 2;
                    }else{
                        mult = 1 - 2*(mult-0.5);
                    }
                }
                mult = easer(mult);
            }else if(type == 5){
                if(e === s){
                    mult = 0;
                }else{
                    var tot = e - s;
                    /*ind += 0.5;
                    mult = -4/(tot*tot)*(ind*ind)+(4/tot)*ind;*/
                    ind = min(max(0,ind+0.5-s),e-s);
                    var x = -tot/2+ind;
                    var a = tot/2;
                    mult = Math.sqrt(1 - (x*x)/(a*a));
                }
                mult = easer(mult);
            }else if(type == 6){
                if(e === s){
                    mult = 0;
                }else{
                    ind = min(max(0,ind+0.5-s),e-s);
                    mult = (1+(Math.cos((Math.PI+Math.PI*2*(ind)/(e-s)))))/2;
                    /*
                     ind = Math.min(Math.max(s,ind),e-1);
                     mult = (1+(Math.cos((Math.PI+Math.PI*2*(ind-s)/(e-1-s)))))/2;
                     mult = Math.max(mult,(1/(e-1-s))/(e-1-s));*/
                }
                mult = easer(mult);
            }else {
                if(ind >= floor(s)){
                    if(ind-s < 0){
                        mult = 1 - (s - ind);
                    }else{
                        mult = max(0,min(e-ind,1));
                    }
                }
                mult = easer(mult);
            }
            return mult*this.a.v;
        }

        return function TextSelectorProp(elem,data, arr){
            this.mdf = false;
            this.k = false;
            this.data = data;
            this.dynamicProperties = [];
            this.getValue = updateRange;
            this.getMult = getMult;
            this.comp = elem.comp;
            this.finalS = 0;
            this.finalE = 0;
            this.s = PropertyFactory.getProp(elem,data.s || {k:0},0,0,this.dynamicProperties);
            if('e' in data){
                this.e = PropertyFactory.getProp(elem,data.e,0,0,this.dynamicProperties);
            }else{
                this.e = {v:data.r === 2 ? data.totalChars : 100};
            }
            this.o = PropertyFactory.getProp(elem,data.o || {k:0},0,0,this.dynamicProperties);
            this.xe = PropertyFactory.getProp(elem,data.xe || {k:0},0,0,this.dynamicProperties);
            this.ne = PropertyFactory.getProp(elem,data.ne || {k:0},0,0,this.dynamicProperties);
            this.a = PropertyFactory.getProp(elem,data.a,0,0.01,this.dynamicProperties);
            if(this.dynamicProperties.length){
                arr.push(this);
            }else{
                this.getValue();
            }
        }
    }());

    function getTextSelectorProp(elem, data,arr) {
        return new TextSelectorProp(elem, data, arr);
    };

    var ob = {};
    ob.getProp = getProp;
    ob.getDashProp = getDashProp;
    ob.getTextSelectorProp = getTextSelectorProp;
    ob.getGradientProp = getGradientProp;
    return ob;
}());
function ShapePath(){
	this.c = false;
	this._length = 0;
	this._maxLength = 8;
	this.v = Array.apply(null,{length:this._maxLength});
	this.o = Array.apply(null,{length:this._maxLength});
	this.i = Array.apply(null,{length:this._maxLength});
};

ShapePath.prototype.setPathData = function(closed, len) {
	this.c = closed;
	while(len > this._maxLength){
		this.doubleArrayLength();
	}
	var i = 0;
	while(i < len){
		this.v[i] = point_pool.newPoint();
		this.o[i] = point_pool.newPoint();
		this.i[i] = point_pool.newPoint();
		i += 1;
	}
	this._length = len;
};

ShapePath.prototype.doubleArrayLength = function() {
	this.v = this.v.concat(Array.apply(null,{length:this._maxLength}))
	this.i = this.i.concat(Array.apply(null,{length:this._maxLength}))
	this.o = this.o.concat(Array.apply(null,{length:this._maxLength}))
	this._maxLength *= 2;
};

ShapePath.prototype.setXYAt = function(x, y, type, pos, replace) {
	var arr;
	this._length = Math.max(this._length, pos + 1);
	if(this._length >= this._maxLength) {
		this.doubleArrayLength();
	}
	switch(type){
		case 'v':
			arr = this.v;
			break;
		case 'i':
			arr = this.i;
			break;
		case 'o':
			arr = this.o;
			break;
	}
	if(!arr[pos] || (arr[pos] && !replace)){
		arr[pos] = point_pool.newPoint();
	}
	arr[pos][0] = x;
	arr[pos][1] = y;
};

ShapePath.prototype.setTripleAt = function(vX,vY,oX,oY,iX,iY,pos, replace) {
	this.setXYAt(vX,vY,'v',pos, replace);
	this.setXYAt(oX,oY,'o',pos, replace);
	this.setXYAt(iX,iY,'i',pos, replace);
};
var ShapePropertyFactory = (function(){

    var initFrame = -999999;

    function interpolateShape() {
        if(this.elem.globalData.frameId === this.frameId){
            return;
        }
        this.mdf = false;
        var frameNum = this.comp.renderedFrame - this.offsetTime;
        if(!((this.lastFrame !== initFrame && ((this.lastFrame < this.keyframes[0].t-this.offsetTime && frameNum < this.keyframes[0].t-this.offsetTime) || (this.lastFrame > this.keyframes[this.keyframes.length - 1].t-this.offsetTime && frameNum > this.keyframes[this.keyframes.length - 1].t-this.offsetTime))))){
            var keyPropS,keyPropE,isHold;
            if(frameNum < this.keyframes[0].t-this.offsetTime){
                keyPropS = this.keyframes[0].s[0];
                isHold = true;
                this._lastIndex = 0;
            }else if(frameNum >= this.keyframes[this.keyframes.length - 1].t-this.offsetTime){
                if(this.keyframes[this.keyframes.length - 2].h === 1){
                    keyPropS = this.keyframes[this.keyframes.length - 1].s[0];
                }else{
                    keyPropS = this.keyframes[this.keyframes.length - 2].e[0];
                }
                isHold = true;
            }else{
                var i = this.lastFrame < initFrame ? this._lastIndex : 0;
                var len = this.keyframes.length- 1,flag = true,keyData,nextKeyData, j, jLen, k, kLen;
                while(flag){
                    keyData = this.keyframes[i];
                    nextKeyData = this.keyframes[i+1];
                    if((nextKeyData.t - this.offsetTime) > frameNum){
                        break;
                    }
                    if(i < len - 1){
                        i += 1;
                    }else{
                        flag = false;
                    }
                }
                isHold = keyData.h === 1;
                this._lastIndex = i;

                var perc;
                if(!isHold){
                    if(frameNum >= nextKeyData.t-this.offsetTime){
                        perc = 1;
                    }else if(frameNum < keyData.t-this.offsetTime){
                        perc = 0;
                    }else{
                        var fnc;
                        if(keyData.__fnct){
                            fnc = keyData.__fnct;
                        }else{
                            fnc = BezierFactory.getBezierEasing(keyData.o.x,keyData.o.y,keyData.i.x,keyData.i.y).get;
                            keyData.__fnct = fnc;
                        }
                        perc = fnc((frameNum-(keyData.t-this.offsetTime))/((nextKeyData.t-this.offsetTime)-(keyData.t-this.offsetTime)));
                    }
                    keyPropE = keyData.e[0];
                }
                keyPropS = keyData.s[0];
            }
            jLen = this.v._length;
            kLen = keyPropS.i[0].length;
            var hasModified = false;
            var vertexValue;
            for(j=0;j<jLen;j+=1){
                for(k=0;k<kLen;k+=1){
                    if(isHold){
                        vertexValue = keyPropS.i[j][k];
                        if(this.v.i[j][k] !== vertexValue){
                            this.v.i[j][k] = vertexValue;
                            this.pv.i[j][k] = vertexValue;
                            hasModified = true;
                        }
                        vertexValue = keyPropS.o[j][k];
                        if(this.v.o[j][k] !== vertexValue){
                            this.v.o[j][k] = vertexValue;
                            this.pv.o[j][k] = vertexValue;
                            hasModified = true;
                        }
                        vertexValue = keyPropS.v[j][k];
                        if(this.v.v[j][k] !== vertexValue){
                            this.v.v[j][k] = vertexValue;
                            this.pv.v[j][k] = vertexValue;
                            hasModified = true;
                        }
                    }else{
                        vertexValue = keyPropS.i[j][k]+(keyPropE.i[j][k]-keyPropS.i[j][k])*perc;
                        if(this.v.i[j][k] !== vertexValue){
                            this.v.i[j][k] = vertexValue;
                            this.pv.i[j][k] = vertexValue;
                            hasModified = true;
                        }
                        vertexValue = keyPropS.o[j][k]+(keyPropE.o[j][k]-keyPropS.o[j][k])*perc;
                        if(this.v.o[j][k] !== vertexValue){
                            this.v.o[j][k] = vertexValue;
                            this.pv.o[j][k] = vertexValue;
                            hasModified = true;
                        }
                        vertexValue = keyPropS.v[j][k]+(keyPropE.v[j][k]-keyPropS.v[j][k])*perc;
                        if(this.v.v[j][k] !== vertexValue){
                            this.v.v[j][k] = vertexValue;
                            this.pv.v[j][k] = vertexValue;
                            hasModified = true;
                        }
                    }
                }
            }
            this.mdf = hasModified;
            this.v.c = keyPropS.c;
            this.paths = this.localShapeCollection;
        }

        this.lastFrame = frameNum;
        this.frameId = this.elem.globalData.frameId;
    }

    function getShapeValue(){
        return this.v;
    }

    function resetShape(){
        this.paths = this.localShapeCollection;
        if(!this.k){
            this.mdf = false;
        }
    }

    function ShapeProperty(elem, data, type){
        this.comp = elem.comp;
        this.k = false;
        this.mdf = false;
        this.v = shape_pool.newShape();
        var pathData = type === 3 ? data.pt.k : data.ks.k;
        this.v.v = pathData.v;
        this.v.i = pathData.i;
        this.v.o = pathData.o;
        this.v.c = pathData.c;
        this.v._length = this.v.v.length;
        this.getValue = getShapeValue;
        this.pv = shape_pool.clone(this.v);
        this.localShapeCollection = shapeCollection_pool.newShapeCollection();
        this.paths = this.localShapeCollection;
        this.paths.addShape(this.v);
        this.reset = resetShape;
    }

    function KeyframedShapeProperty(elem,data,type){
        this.comp = elem.comp;
        this.elem = elem;
        this.offsetTime = elem.data.st;
        this._lastIndex = 0;
        this.getValue = interpolateShape;
        this.keyframes = type === 3 ? data.pt.k : data.ks.k;
        this.k = true;
        var i, len = this.keyframes[0].s[0].i.length;
        var jLen = this.keyframes[0].s[0].i[0].length;
        this.v = shape_pool.newShape();
        this.v.setPathData(this.keyframes[0].s[0].c, len);
        this.pv = shape_pool.clone(this.v);
        this.localShapeCollection = shapeCollection_pool.newShapeCollection();
        this.paths = this.localShapeCollection;
        this.paths.addShape(this.v);
        this.lastFrame = initFrame;
        this.reset = resetShape;
    }

    var EllShapeProperty = (function(){

        var cPoint = roundCorner;

        function convertEllToPath(){
            var p0 = this.p.v[0], p1 = this.p.v[1], s0 = this.s.v[0]/2, s1 = this.s.v[1]/2;
            if(this.d !== 3){
                this.v.v[0][0] = p0;
                this.v.v[0][1] = p1-s1;
                this.v.v[1][0] = p0 + s0;
                this.v.v[1][1] = p1;
                this.v.v[2][0] = p0;
                this.v.v[2][1] = p1+s1;
                this.v.v[3][0] = p0 - s0;
                this.v.v[3][1] = p1;
                this.v.i[0][0] = p0 - s0*cPoint;
                this.v.i[0][1] = p1 - s1;
                this.v.i[1][0] = p0 + s0;
                this.v.i[1][1] = p1 - s1*cPoint;
                this.v.i[2][0] = p0 + s0*cPoint;
                this.v.i[2][1] = p1 + s1;
                this.v.i[3][0] = p0 - s0;
                this.v.i[3][1] = p1 + s1*cPoint;
                this.v.o[0][0] = p0 + s0*cPoint;
                this.v.o[0][1] = p1 - s1;
                this.v.o[1][0] = p0 + s0;
                this.v.o[1][1] = p1 + s1*cPoint;
                this.v.o[2][0] = p0 - s0*cPoint;
                this.v.o[2][1] = p1 + s1;
                this.v.o[3][0] = p0 - s0;
                this.v.o[3][1] = p1 - s1*cPoint;
            }else{
                this.v.v[0][0] = p0;
                this.v.v[0][1] = p1-s1;
                this.v.v[1][0] = p0 - s0;
                this.v.v[1][1] = p1;
                this.v.v[2][0] = p0;
                this.v.v[2][1] = p1+s1;
                this.v.v[3][0] = p0 + s0;
                this.v.v[3][1] = p1;
                this.v.i[0][0] = p0 + s0*cPoint;
                this.v.i[0][1] = p1 - s1;
                this.v.i[1][0] = p0 - s0;
                this.v.i[1][1] = p1 - s1*cPoint;
                this.v.i[2][0] = p0 - s0*cPoint;
                this.v.i[2][1] = p1 + s1;
                this.v.i[3][0] = p0 + s0;
                this.v.i[3][1] = p1 + s1*cPoint;
                this.v.o[0][0] = p0 - s0*cPoint;
                this.v.o[0][1] = p1 - s1;
                this.v.o[1][0] = p0 - s0;
                this.v.o[1][1] = p1 + s1*cPoint;
                this.v.o[2][0] = p0 + s0*cPoint;
                this.v.o[2][1] = p1 + s1;
                this.v.o[3][0] = p0 + s0;
                this.v.o[3][1] = p1 - s1*cPoint;
            }
        }

        function processKeys(frameNum){
            var i, len = this.dynamicProperties.length;
            if(this.elem.globalData.frameId === this.frameId){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;

            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue(frameNum);
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
            if(this.mdf){
                this.convertEllToPath();
            }
        }

        return function EllShapeProperty(elem,data) {
            /*this.v = {
                v: Array.apply(null,{length:4}),
                i: Array.apply(null,{length:4}),
                o: Array.apply(null,{length:4}),
                c: true
            };*/
            this.v = shape_pool.newShape();
            this.v.setPathData(true, 4);
            this.localShapeCollection = shapeCollection_pool.newShapeCollection();
            this.paths = this.localShapeCollection;
            this.localShapeCollection.addShape(this.v);
            this.d = data.d;
            this.dynamicProperties = [];
            this.elem = elem;
            this.comp = elem.comp;
            this.frameId = -1;
            this.mdf = false;
            this.getValue = processKeys;
            this.convertEllToPath = convertEllToPath;
            this.reset = resetShape;
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            this.s = PropertyFactory.getProp(elem,data.s,1,0,this.dynamicProperties);
            if(this.dynamicProperties.length){
                this.k = true;
            }else{
                this.convertEllToPath();
            }
        }
    }());

    var StarShapeProperty = (function() {

        function convertPolygonToPath(){
            var numPts = Math.floor(this.pt.v);
            var angle = Math.PI*2/numPts;
            /*this.v.v.length = numPts;
            this.v.i.length = numPts;
            this.v.o.length = numPts;*/
            var rad = this.or.v;
            var roundness = this.os.v;
            var perimSegment = 2*Math.PI*rad/(numPts*4);
            var i, currentAng = -Math.PI/ 2;
            var dir = this.data.d === 3 ? -1 : 1;
            currentAng += this.r.v;
            this.v._length = 0;
            for(i=0;i<numPts;i+=1){
                var x = rad * Math.cos(currentAng);
                var y = rad * Math.sin(currentAng);
                var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
                var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
                x +=  + this.p.v[0];
                y +=  + this.p.v[1];
                this.v.setTripleAt(x,y,x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir,x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir, i, true);
                /*this.v.v[i] = [x,y];
                this.v.i[i] = [x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir];
                this.v.o[i] = [x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir];*/
                currentAng += angle*dir;
            }
            this.paths.length = 0;
            this.paths[0] = this.v;
        }

        function convertStarToPath() {
            var numPts = Math.floor(this.pt.v)*2;
            var angle = Math.PI*2/numPts;
            /*this.v.v.length = numPts;
            this.v.i.length = numPts;
            this.v.o.length = numPts;*/
            var longFlag = true;
            var longRad = this.or.v;
            var shortRad = this.ir.v;
            var longRound = this.os.v;
            var shortRound = this.is.v;
            var longPerimSegment = 2*Math.PI*longRad/(numPts*2);
            var shortPerimSegment = 2*Math.PI*shortRad/(numPts*2);
            var i, rad,roundness,perimSegment, currentAng = -Math.PI/ 2;
            currentAng += this.r.v;
            var dir = this.data.d === 3 ? -1 : 1;
            this.v._length = 0;
            for(i=0;i<numPts;i+=1){
                rad = longFlag ? longRad : shortRad;
                roundness = longFlag ? longRound : shortRound;
                perimSegment = longFlag ? longPerimSegment : shortPerimSegment;
                var x = rad * Math.cos(currentAng);
                var y = rad * Math.sin(currentAng);
                var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
                var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
                x +=  + this.p.v[0];
                y +=  + this.p.v[1];
                this.v.setTripleAt(x,y,x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir,x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir, i, true);

                /*this.v.v[i] = [x,y];
                this.v.i[i] = [x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir];
                this.v.o[i] = [x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir];
                this.v._length = numPts;*/
                longFlag = !longFlag;
                currentAng += angle*dir;
            }
        }

        function processKeys() {
            if(this.elem.globalData.frameId === this.frameId){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;
            var i, len = this.dynamicProperties.length;

            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue();
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
            if(this.mdf){
                this.convertToPath();
            }
        }

        return function StarShapeProperty(elem,data) {
            /*this.v = {
                v: [],
                i: [],
                o: [],
                c: true
            };*/
            this.v = shape_pool.newShape();
            this.v.setPathData(true, 0);
            this.elem = elem;
            this.comp = elem.comp;
            this.data = data;
            this.frameId = -1;
            this.d = data.d;
            this.dynamicProperties = [];
            this.mdf = false;
            this.getValue = processKeys;
            this.reset = resetShape;
            if(data.sy === 1){
                this.ir = PropertyFactory.getProp(elem,data.ir,0,0,this.dynamicProperties);
                this.is = PropertyFactory.getProp(elem,data.is,0,0.01,this.dynamicProperties);
                this.convertToPath = convertStarToPath;
            } else {
                this.convertToPath = convertPolygonToPath;
            }
            this.pt = PropertyFactory.getProp(elem,data.pt,0,0,this.dynamicProperties);
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            this.r = PropertyFactory.getProp(elem,data.r,0,degToRads,this.dynamicProperties);
            this.or = PropertyFactory.getProp(elem,data.or,0,0,this.dynamicProperties);
            this.os = PropertyFactory.getProp(elem,data.os,0,0.01,this.dynamicProperties);
            this.localShapeCollection = shapeCollection_pool.newShapeCollection();
            this.localShapeCollection.addShape(this.v);
            this.paths = this.localShapeCollection;
            if(this.dynamicProperties.length){
                this.k = true;
            }else{
                this.convertToPath();
            }
        }
    }());

    var RectShapeProperty = (function() {
        function processKeys(frameNum){
            if(this.elem.globalData.frameId === this.frameId){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;
            var i, len = this.dynamicProperties.length;

            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue(frameNum);
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
            if(this.mdf){
                this.convertRectToPath();
            }

        }

        function convertRectToPath(){
            var p0 = this.p.v[0], p1 = this.p.v[1], v0 = this.s.v[0]/2, v1 = this.s.v[1]/2;
            var round = bm_min(v0,v1,this.r.v);
            var cPoint = round*(1-roundCorner);
            this.v._length = 0;

            if(this.d === 2 || this.d === 1) {
                this.v.setTripleAt(p0+v0, p1-v1+round,p0+v0, p1-v1+round,p0+v0,p1-v1+cPoint,0, true);
                this.v.setTripleAt(p0+v0, p1+v1-round,p0+v0, p1+v1-cPoint,p0+v0, p1+v1-round,1, true);
                if(round!== 0){
                    this.v.setTripleAt(p0+v0-round, p1+v1,p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,2, true);
                    this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,p0-v0+round,p1+v1,3, true);
                    this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,4, true);
                    this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,p0-v0,p1-v1+round,5, true);
                    this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,6, true);
                    this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,p0+v0-round,p1-v1,7, true);
                } else {
                    this.v.setTripleAt(p0-v0,p1+v1,p0-v0+cPoint,p1+v1,p0-v0,p1+v1,2);
                    this.v.setTripleAt(p0-v0,p1-v1,p0-v0,p1-v1+cPoint,p0-v0,p1-v1,3);
                }
            }else{
                this.v.setTripleAt(p0+v0,p1-v1+round,p0+v0,p1-v1+cPoint,p0+v0,p1-v1+round,0, true);
                if(round!== 0){
                    this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,1, true);
                    this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,p0-v0+round,p1-v1,2, true);
                    this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,3, true);
                    this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,p0-v0,p1+v1-round,4, true);
                    this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,5, true);
                    this.v.setTripleAt(p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,p0+v0-round,p1+v1,6, true);
                    this.v.setTripleAt(p0+v0,p1+v1-round,p0+v0,p1+v1-round,p0+v0,p1+v1-cPoint,7, true);
                } else {
                    this.v.setTripleAt(p0-v0,p1-v1,p0-v0+cPoint,p1-v1,p0-v0,p1-v1,1, true);
                    this.v.setTripleAt(p0-v0,p1+v1,p0-v0,p1+v1-cPoint,p0-v0,p1+v1,2, true);
                    this.v.setTripleAt(p0+v0,p1+v1,p0+v0-cPoint,p1+v1,p0+v0,p1+v1,3, true);

                }
            }
        }

        return function RectShapeProperty(elem,data) {
            this.v = shape_pool.newShape();
            this.v.c = true;
            this.localShapeCollection = shapeCollection_pool.newShapeCollection();
            this.localShapeCollection.addShape(this.v);
            this.paths = this.localShapeCollection;
            this.elem = elem;
            this.comp = elem.comp;
            this.frameId = -1;
            this.d = data.d;
            this.dynamicProperties = [];
            this.mdf = false;
            this.getValue = processKeys;
            this.convertRectToPath = convertRectToPath;
            this.reset = resetShape;
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            this.s = PropertyFactory.getProp(elem,data.s,1,0,this.dynamicProperties);
            this.r = PropertyFactory.getProp(elem,data.r,0,0,this.dynamicProperties);
            if(this.dynamicProperties.length){
                this.k = true;
            }else{
                this.convertRectToPath();
            }
        }
    }());

    function getShapeProp(elem,data,type, arr){
        var prop;
        if(type === 3 || type === 4){
            var dataProp = type === 3 ? data.pt : data.ks;
            var keys = dataProp.k;
            if(dataProp.a === 1 || keys.length){
                prop = new KeyframedShapeProperty(elem, data, type);
            }else{
                prop = new ShapeProperty(elem, data, type);
            }
        }else if(type === 5){
            prop = new RectShapeProperty(elem, data);
        }else if(type === 6){
            prop = new EllShapeProperty(elem, data);
        }else if(type === 7){
            prop = new StarShapeProperty(elem, data);
        }
        if(prop.k){
            arr.push(prop);
        }
        return prop;
    }

    var ob = {};
    ob.getShapeProp = getShapeProp;
    return ob;
}());
var ShapeModifiers = (function(){
    var ob = {};
    var modifiers = {};
    ob.registerModifier = registerModifier;
    ob.getModifier = getModifier;

    function registerModifier(nm,factory){
        if(!modifiers[nm]){
            modifiers[nm] = factory;
        }
    }

    function getModifier(nm,elem, data, dynamicProperties){
        return new modifiers[nm](elem, data, dynamicProperties);
    }

    return ob;
}());

function ShapeModifier(){}
ShapeModifier.prototype.initModifierProperties = function(){};
ShapeModifier.prototype.addShapeToModifier = function(){};
ShapeModifier.prototype.addShape = function(data){
    if(!this.closed){
        this.shapes.push({shape:data.sh, data: data, localShapeCollection:shapeCollection_pool.newShapeCollection()});
        this.addShapeToModifier(data.sh);
    }
}
ShapeModifier.prototype.init = function(elem,data,dynamicProperties){
    this.elem = elem;
    this.frameId = -1;
    this.shapes = [];
    this.dynamicProperties = [];
    this.mdf = false;
    this.closed = false;
    this.k = false;
    this.isTrimming = false;
    this.comp = elem.comp;
    this.initModifierProperties(elem,data);
    if(this.dynamicProperties.length){
        this.k = true;
        dynamicProperties.push(this);
    }else{
        this.getValue(true);
    }
}
function TrimModifier(){};
extendPrototype(ShapeModifier,TrimModifier);
TrimModifier.prototype.processKeys = function(forceRender){
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    this.mdf = forceRender ? true : false;
    this.frameId = this.elem.globalData.frameId;
    var i, len = this.dynamicProperties.length;

    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        if(this.dynamicProperties[i].mdf){
            this.mdf = true;
        }
    }
    if(this.mdf || forceRender){
        var o = (this.o.v%360)/360;
        if(o < 0){
            o += 1;
        }
        var s = this.s.v + o;
        var e = this.e.v + o;
        if(s == e){

        }
        if(s>e){
            var _s = s;
            s = e;
            e = _s;
        }
        this.sValue = s;
        this.eValue = e;
        this.oValue = o;
    }
}
TrimModifier.prototype.initModifierProperties = function(elem,data){
    this.sValue = 0;
    this.eValue = 0;
    this.oValue = 0;
    this.getValue = this.processKeys;
    this.s = PropertyFactory.getProp(elem,data.s,0,0.01,this.dynamicProperties);
    this.e = PropertyFactory.getProp(elem,data.e,0,0.01,this.dynamicProperties);
    this.o = PropertyFactory.getProp(elem,data.o,0,0,this.dynamicProperties);
    this.m = data.m;
    if(!this.dynamicProperties.length){
        this.getValue(true);
    }
};

TrimModifier.prototype.getSegmentsLength = function(shapeData){
    var closed = shapeData.c;
    var pathV = shapeData.v;
    var pathO = shapeData.o;
    var pathI = shapeData.i;
    var i, len = shapeData._length;
    var lengths = [];
    var totalLength = 0;
    for(i=0;i<len-1;i+=1){
        lengths[i] = bez.getBezierLength(pathV[i],pathV[i+1],pathO[i],pathI[i+1]);
        totalLength += lengths[i].addedLength;
    }
    if(closed){
        lengths[i] = bez.getBezierLength(pathV[i],pathV[0],pathO[i],pathI[0]);
        totalLength += lengths[i].addedLength;
    }
    return {lengths:lengths,totalLength:totalLength};
}

TrimModifier.prototype.calculateShapeEdges = function(s, e, shapeLength, addedLength, totalModifierLength) {
    var segments = []
    if(e <= 1){
        segments.push({
            s: s,
            e: e
        })
    }else if(s >= 1){
        segments.push({
            s: s - 1,
            e: e - 1
        })
    }else{
        segments.push({
            s: s,
            e: 1
        })
        segments.push({
            s: 0,
            e: e - 1
        })
    }
    var shapeSegments = [];
    var i, len = segments.length, segmentOb;
    for(i = 0; i < len; i += 1) {
        segmentOb = segments[i];
        if (segmentOb.e * totalModifierLength < addedLength || segmentOb.s * totalModifierLength > addedLength + shapeLength) {
            
        } else {
            var shapeS, shapeE;
            if(segmentOb.s * totalModifierLength <= addedLength) {
                shapeS = 0;
            } else {
                shapeS = (segmentOb.s * totalModifierLength - addedLength) / shapeLength;
            }
            if(segmentOb.e * totalModifierLength >= addedLength + shapeLength) {
                shapeE = 1;
            } else {
                shapeE = ((segmentOb.e * totalModifierLength - addedLength) / shapeLength);
            }
            shapeSegments.push([shapeS, shapeE]);
        }
    }
    if(!shapeSegments.length){
        shapeSegments.push([0,0]);
    }
    return shapeSegments;
}

TrimModifier.prototype.processShapes = function(firstFrame){
    var shapePaths;
    var i, len = this.shapes.length;
    var j, jLen;
    var s = this.sValue;
    var e = this.eValue;
    var pathsData,pathData, totalShapeLength, totalModifierLength = 0;

    if(e === s){
        for(i=0;i<len;i+=1){
            this.shapes[i].localShapeCollection.releaseShapes();
            this.shapes[i].shape.mdf = true;
            this.shapes[i].shape.paths = this.shapes[i].localShapeCollection;
        }
    } else if(!((e === 1 && s === 0) || (e===0 && s === 1))){
        var segments = [], shapeData, localShapeCollection;
        for(i=0;i<len;i+=1){
            shapeData = this.shapes[i];
            if(!shapeData.shape.mdf && !this.mdf && !firstFrame && this.m !== 2){
                shapeData.shape.paths = shapeData.localShapeCollection;
            } else {
                shapePaths = shapeData.shape.paths;
                jLen = shapePaths._length;
                totalShapeLength = 0;
                if(!shapeData.shape.mdf && shapeData.pathsData){
                    totalShapeLength = shapeData.totalShapeLength;
                } else {
                    pathsData = [];
                    for(j=0;j<jLen;j+=1){
                        pathData = this.getSegmentsLength(shapePaths.shapes[j]);
                        pathsData.push(pathData);
                        totalShapeLength += pathData.totalLength;
                    }
                    shapeData.totalShapeLength = totalShapeLength;
                    shapeData.pathsData = pathsData;
                }

                totalModifierLength += totalShapeLength;
                shapeData.shape.mdf = true;
            }
        }
        var shapeS = s, shapeE = e, addedLength = 0;
        var j, jLen;
        for(i = len - 1; i >= 0; i -= 1){
            shapeData = this.shapes[i];
            if (shapeData.shape.mdf) {
                localShapeCollection = shapeData.localShapeCollection;
                localShapeCollection.releaseShapes();
                if(this.m === 2 && len > 1) {
                    var edges = this.calculateShapeEdges(s, e, shapeData.totalShapeLength, addedLength, totalModifierLength);
                    addedLength += shapeData.totalShapeLength;
                } else {
                    edges = [[shapeS, shapeE]]
                }
                jLen = edges.length;
                for (j = 0; j < jLen; j += 1) {
                    shapeS = edges[j][0];
                    shapeE = edges[j][1];
                    segments.length = 0;
                    if(shapeE <= 1){
                        segments.push({
                            s:shapeData.totalShapeLength * shapeS,
                            e:shapeData.totalShapeLength * shapeE
                        })
                    }else if(shapeS >= 1){
                        segments.push({
                            s:shapeData.totalShapeLength * (shapeS - 1),
                            e:shapeData.totalShapeLength * (shapeE - 1)
                        })
                    }else{
                        segments.push({
                            s:shapeData.totalShapeLength * shapeS,
                            e:shapeData.totalShapeLength
                        })
                        segments.push({
                            s:0,
                            e:shapeData.totalShapeLength*(shapeE - 1)
                        })
                    }
                    var newShapesData = this.addShapes(shapeData,segments[0]);
                    if (segments[0].s !== segments[0].e) {
                        var lastPos;
                        if(segments.length > 1){
                            if(shapeData.shape.v.c){
                                var lastShape = newShapesData.pop();
                                this.addPaths(newShapesData, localShapeCollection);
                                newShapesData = this.addShapes(shapeData,segments[1], lastShape);
                            } else {
                                this.addPaths(newShapesData, localShapeCollection);
                                newShapesData = this.addShapes(shapeData,segments[1]);
                            }
                        } 
                        this.addPaths(newShapesData, localShapeCollection);
                    }
                    
                }
                shapeData.shape.paths = localShapeCollection;
            }
        }
    }
    if(!this.dynamicProperties.length){
        this.mdf = false;
    }
}

TrimModifier.prototype.addPaths = function(newPaths, localShapeCollection) {
    var i, len = newPaths.length;
    for(i = 0; i < len; i += 1) {
        localShapeCollection.addShape(newPaths[i])
    }
}

TrimModifier.prototype.addSegment = function(pt1,pt2,pt3,pt4,shapePath,pos, newShape) {
    /*console.log(pt1, 'vertex: v, at: ', pos);
    console.log(pt2, 'vertex: o, at: ', pos);
    console.log(pt3, 'vertex: i, at: ', pos + 1);
    console.log(pt4, 'vertex: v, at: ', pos + 1);
    console.log('newShape: ', newShape);*/
    shapePath.setXYAt(pt2[0],pt2[1],'o',pos);
    shapePath.setXYAt(pt3[0],pt3[1],'i',pos + 1);
    if(newShape){
        shapePath.setXYAt(pt1[0],pt1[1],'v',pos);
    }
    shapePath.setXYAt(pt4[0],pt4[1],'v',pos + 1);
}

TrimModifier.prototype.addShapes = function(shapeData, shapeSegment, shapePath){
    var pathsData = shapeData.pathsData;
    var shapePaths = shapeData.shape.paths.shapes;
    var i, len = shapeData.shape.paths._length, j, jLen;
    var addedLength = 0;
    var currentLengthData,segmentCount;
    var lengths;
    var segment;
    var shapes = [];
    var initPos;
    var newShape = true;
    if(!shapePath){
        shapePath = shape_pool.newShape();
        segmentCount = 0;
        initPos = 0;
    } else {
        segmentCount = shapePath._length;
        initPos = shapePath._length;
    }
    shapes.push(shapePath);
    for(i=0;i<len;i+=1){
        lengths = pathsData[i].lengths;
        shapePath.c = shapePaths[i].c;
        jLen = shapePaths[i].c ? lengths.length : lengths.length + 1;
        for(j=1;j<jLen;j+=1){
            currentLengthData = lengths[j-1];
            if(addedLength + currentLengthData.addedLength < shapeSegment.s){
                addedLength += currentLengthData.addedLength;
                shapePath.c = false;
            } else if(addedLength > shapeSegment.e){
                shapePath.c = false;
                break;
            } else {
                if(shapeSegment.s <= addedLength && shapeSegment.e >= addedLength + currentLengthData.addedLength){
                    this.addSegment(shapePaths[i].v[j-1],shapePaths[i].o[j-1],shapePaths[i].i[j],shapePaths[i].v[j],shapePath,segmentCount,newShape);
                    newShape = false;
                } else {
                    segment = bez.getNewSegment(shapePaths[i].v[j-1],shapePaths[i].v[j],shapePaths[i].o[j-1],shapePaths[i].i[j], (shapeSegment.s - addedLength)/currentLengthData.addedLength,(shapeSegment.e - addedLength)/currentLengthData.addedLength, lengths[j-1]);
                    this.addSegment(segment.pt1,segment.pt3,segment.pt4,segment.pt2,shapePath,segmentCount,newShape);
                    newShape = false;
                    shapePath.c = false;
                }
                addedLength += currentLengthData.addedLength;
                segmentCount += 1;
            }
        }
        if(shapePaths[i].c){
            currentLengthData = lengths[j-1];
            if(addedLength <= shapeSegment.e){
                var segmentLength = lengths[j-1].addedLength;
                if(shapeSegment.s <= addedLength && shapeSegment.e >= addedLength + segmentLength){
                    this.addSegment(shapePaths[i].v[j-1],shapePaths[i].o[j-1],shapePaths[i].i[0],shapePaths[i].v[0],shapePath,segmentCount,newShape);
                    newShape = false;
                }else{
                    segment = bez.getNewSegment(shapePaths[i].v[j-1],shapePaths[i].v[0],shapePaths[i].o[j-1],shapePaths[i].i[0], (shapeSegment.s - addedLength)/segmentLength,(shapeSegment.e - addedLength)/segmentLength, lengths[j-1]);
                    this.addSegment(segment.pt1,segment.pt3,segment.pt4,segment.pt2,shapePath,segmentCount,newShape);
                    newShape = false;
                    shapePath.c = false;
                }
            } else {
                shapePath.c = false;
            }
            addedLength += currentLengthData.addedLength;
            segmentCount += 1;
        }
        if(shapePath._length){
            shapePath.setXYAt(shapePath.v[initPos][0],shapePath.v[initPos][1],'i',initPos);
            shapePath.setXYAt(shapePath.v[shapePath._length - 1][0],shapePath.v[shapePath._length - 1][1],'o',shapePath._length - 1);
        }
        if(addedLength > shapeSegment.e){
            break;
        }
        if(i<len-1){
            shapePath = shape_pool.newShape();
            newShape = true;
            shapes.push(shapePath);
            segmentCount = 0;
        }
    }
    return shapes;

}


ShapeModifiers.registerModifier('tm',TrimModifier);
function RoundCornersModifier(){};
extendPrototype(ShapeModifier,RoundCornersModifier);
RoundCornersModifier.prototype.processKeys = function(forceRender){
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    this.mdf = forceRender ? true : false;
    this.frameId = this.elem.globalData.frameId;
    var i, len = this.dynamicProperties.length;

    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        if(this.dynamicProperties[i].mdf){
            this.mdf = true;
        }
    }
}
RoundCornersModifier.prototype.initModifierProperties = function(elem,data){
    this.getValue = this.processKeys;
    this.rd = PropertyFactory.getProp(elem,data.r,0,null,this.dynamicProperties);
    if(!this.dynamicProperties.length){
        this.getValue(true);
    }
};

RoundCornersModifier.prototype.processPath = function(path, round){
    var cloned_path = shape_pool.newShape();
    cloned_path.c = path.c;
    var i, len = path._length;
    var currentV,currentI,currentO,closerV, newV,newO,newI,distance,newPosPerc,index = 0;
    var vX,vY,oX,oY,iX,iY;
    for(i=0;i<len;i+=1){
        currentV = path.v[i];
        currentO = path.o[i];
        currentI = path.i[i];
        if(currentV[0]===currentO[0] && currentV[1]===currentO[1] && currentV[0]===currentI[0] && currentV[1]===currentI[1]){
            if((i===0 || i === len - 1) && !path.c){
                cloned_path.setTripleAt(currentV[0],currentV[1],currentO[0],currentO[1],currentI[0],currentI[1],index);
                /*cloned_path.v[index] = currentV;
                cloned_path.o[index] = currentO;
                cloned_path.i[index] = currentI;*/
                index += 1;
            } else {
                if(i===0){
                    closerV = path.v[len-1];
                } else {
                    closerV = path.v[i-1];
                }
                distance = Math.sqrt(Math.pow(currentV[0]-closerV[0],2)+Math.pow(currentV[1]-closerV[1],2));
                newPosPerc = distance ? Math.min(distance/2,round)/distance : 0;
                vX = iX = currentV[0]+(closerV[0]-currentV[0])*newPosPerc;
                vY = iY = currentV[1]-(currentV[1]-closerV[1])*newPosPerc;
                oX = vX-(vX-currentV[0])*roundCorner;
                oY = vY-(vY-currentV[1])*roundCorner;
                cloned_path.setTripleAt(vX,vY,oX,oY,iX,iY,index);
                /*newV = [currentV[0]+(closerV[0]-currentV[0])*newPosPerc,currentV[1]-(currentV[1]-closerV[1])*newPosPerc];
                newI = newV;
                newO = [newV[0]-(newV[0]-currentV[0])*roundCorner,newV[1]-(newV[1]-currentV[1])*roundCorner];
                cloned_path.v[index] = newV;
                cloned_path.i[index] = newI;
                cloned_path.o[index] = newO;*/
                index += 1;

                if(i === len - 1){
                    closerV = path.v[0];
                } else {
                    closerV = path.v[i+1];
                }
                distance = Math.sqrt(Math.pow(currentV[0]-closerV[0],2)+Math.pow(currentV[1]-closerV[1],2));
                newPosPerc = distance ? Math.min(distance/2,round)/distance : 0;
                vX = oX = currentV[0]+(closerV[0]-currentV[0])*newPosPerc;
                vY = oY = currentV[1]+(closerV[1]-currentV[1])*newPosPerc;
                iX = vX-(vX-currentV[0])*roundCorner;
                iY = vY-(vY-currentV[1])*roundCorner;
                cloned_path.setTripleAt(vX,vY,oX,oY,iX,iY,index);

                /*newV = [currentV[0]+(closerV[0]-currentV[0])*newPosPerc,currentV[1]+(closerV[1]-currentV[1])*newPosPerc];
                newI = [newV[0]-(newV[0]-currentV[0])*roundCorner,newV[1]-(newV[1]-currentV[1])*roundCorner];
                newO = newV;
                cloned_path.v[index] = newV;
                cloned_path.i[index] = newI;
                cloned_path.o[index] = newO;*/
                index += 1;
            }
        } else {
            /*cloned_path.v[index] = path.v[i];
            cloned_path.o[index] = path.o[i];
            cloned_path.i[index] = path.i[i];*/
            cloned_path.setTripleAt(path.v[i][0],path.v[i][1],path.o[i][0],path.o[i][1],path.i[i][0],path.i[i][1],index);
            index += 1;
        }
    }
    return cloned_path;
}

RoundCornersModifier.prototype.processShapes = function(firstFrame){
    var shapePaths;
    var i, len = this.shapes.length;
    var j, jLen;
    var rd = this.rd.v;

    if(rd !== 0){
        var shapeData, newPaths, localShapeCollection;
        for(i=0;i<len;i+=1){
            shapeData = this.shapes[i];
            newPaths = shapeData.shape.paths;
            localShapeCollection = shapeData.localShapeCollection;
            if(!(!shapeData.shape.mdf && !this.mdf && !firstFrame)){
                localShapeCollection.releaseShapes();
                shapeData.shape.mdf = true;
                shapePaths = shapeData.shape.paths.shapes;
                jLen = shapeData.shape.paths._length;
                for(j=0;j<jLen;j+=1){
                    localShapeCollection.addShape(this.processPath(shapePaths[j],rd));
                }
            }
            shapeData.shape.paths = shapeData.localShapeCollection;
        }

    }
    if(!this.dynamicProperties.length){
        this.mdf = false;
    }
}


ShapeModifiers.registerModifier('rd',RoundCornersModifier);
function RepeaterModifier(){};
extendPrototype(ShapeModifier,RepeaterModifier);
RepeaterModifier.prototype.processKeys = function(forceRender){
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    this.mdf = forceRender ? true : false;
    this.frameId = this.elem.globalData.frameId;
    var i, len = this.dynamicProperties.length;

    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        if(this.dynamicProperties[i].mdf){
            this.mdf = true;
        }
    }
};
RepeaterModifier.prototype.initModifierProperties = function(elem,data){
    this.getValue = this.processKeys;
    this.c = PropertyFactory.getProp(elem,data.c,0,null,this.dynamicProperties);
    this.o = PropertyFactory.getProp(elem,data.o,0,null,this.dynamicProperties);
    this.tr = PropertyFactory.getProp(elem,data.tr,2,null,this.dynamicProperties);
    if(!this.dynamicProperties.length){
        this.getValue(true);
    }
    this.pMatrix = new Matrix();
    this.rMatrix = new Matrix();
    this.sMatrix = new Matrix();
    this.tMatrix = new Matrix();
    this.matrix = new Matrix();
};

RepeaterModifier.prototype.applyTransforms = function(pMatrix, rMatrix, sMatrix, transform, perc, inv){
    var dir = inv ? -1 : 1;
    var scaleX = transform.s.v[0] + (1 - transform.s.v[0]) * (1 - perc);
    var scaleY = transform.s.v[1] + (1 - transform.s.v[1]) * (1 - perc);
    pMatrix.translate(transform.p.v[0] * dir * perc, transform.p.v[1] * dir * perc, transform.p.v[2]);
    rMatrix.translate(-transform.a.v[0], -transform.a.v[1], transform.a.v[2]);
    rMatrix.rotate(-transform.r.v * dir * perc);
    rMatrix.translate(transform.a.v[0], transform.a.v[1], transform.a.v[2]);
    sMatrix.translate(-transform.a.v[0], -transform.a.v[1], transform.a.v[2]);
    sMatrix.scale(inv ? 1/scaleX : scaleX, inv ? 1/scaleY : scaleY);
    sMatrix.translate(transform.a.v[0], transform.a.v[1], transform.a.v[2]);
}

RepeaterModifier.prototype.processShapes = function(firstFrame){
    if(!this.dynamicProperties.length){
        this.mdf = false;
    }
    var i, len = this.shapes.length;
    var j, jLen;
    var shapeData, localShapeCollection, currentPath;
    var copies = Math.ceil(this.c.v);
    var offset = this.o.v;
    var offsetModulo = offset%1;
    var roundOffset = offset > 0 ? Math.floor(offset) : Math.ceil(offset);
    var k, pathData, shapeCollection, shapeCollectionList;
    var tMat = this.tr.v.props;
    var pProps = this.pMatrix.props;
    var rProps = this.rMatrix.props;
    var sProps = this.sMatrix.props;
    var iteration = 0;
    var l, lLen, tProps,transformers, maxLvl;
    for(i=0;i<len;i+=1){
        shapeData = this.shapes[i];
        localShapeCollection = shapeData.localShapeCollection;
        if(!(!shapeData.shape.mdf && !this.mdf && !firstFrame)){
            localShapeCollection.releaseShapes();
            shapeData.shape.mdf = true;
            shapeCollection = shapeData.shape.paths;
            shapeCollectionList = shapeCollection.shapes;
            jLen = shapeCollection._length;
            iteration = 0;
            this.pMatrix.reset();
            this.rMatrix.reset();
            this.sMatrix.reset();
            this.tMatrix.reset();
            this.matrix.reset();

            if(offset > 0) {
                while(iteration<roundOffset){
                    this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, false);
                    iteration += 1;
                }
                if(offsetModulo){
                    this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, offsetModulo, false);
                    iteration += offsetModulo;
                }
            } else if(roundOffset < 0) {
                while(iteration>roundOffset){
                    this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, true);
                    iteration -= 1;
                }
                if(offsetModulo){
                    this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, - offsetModulo, true);
                    iteration -= offsetModulo;
                }
            }
            for(j=0;j<jLen;j+=1){
                currentPath = shapeCollectionList[j];
                for(k=0;k<copies;k+=1) {
                    if(k !== 0) {
                        this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, false);
                    }
                    if(shapeData.data.transformers) {
                        shapeData.data.lvl = 0;
                        maxLvl = 0;
                        lLen = shapeData.data.elements.length;
                        for(l = 0; l < lLen; l += 1) {
                            maxLvl = Math.max(maxLvl, shapeData.data.elements[l].st.lvl);
                        } 
                        transformers = shapeData.data.transformers;
                        lLen = transformers.length;
                        for(l = lLen - 1; l >= maxLvl; l -= 1) {
                            tProps = transformers[l].mProps.v.props;
                            this.matrix.transform(tProps[0],tProps[1],tProps[2],tProps[3],tProps[4],tProps[5],tProps[6],tProps[7],tProps[8],tProps[9],tProps[10],tProps[11],tProps[12],tProps[13],tProps[14],tProps[15]);
                        }
                    }
                    if(iteration !== 0){
                        this.matrix.transform(rProps[0],rProps[1],rProps[2],rProps[3],rProps[4],rProps[5],rProps[6],rProps[7],rProps[8],rProps[9],rProps[10],rProps[11],rProps[12],rProps[13],rProps[14],rProps[15]);
                        this.matrix.transform(sProps[0],sProps[1],sProps[2],sProps[3],sProps[4],sProps[5],sProps[6],sProps[7],sProps[8],sProps[9],sProps[10],sProps[11],sProps[12],sProps[13],sProps[14],sProps[15]);
                        this.matrix.transform(pProps[0],pProps[1],pProps[2],pProps[3],pProps[4],pProps[5],pProps[6],pProps[7],pProps[8],pProps[9],pProps[10],pProps[11],pProps[12],pProps[13],pProps[14],pProps[15]);
                    }
                    localShapeCollection.addShape(this.processPath(currentPath, this.matrix));
                    this.matrix.reset();
                    iteration += 1;
                }
            }
        }
        shapeData.shape.paths = localShapeCollection;
    }
};

RepeaterModifier.prototype.processPath = function(path, transform) {
    var clonedPath = shape_pool.clone(path, transform);
    return clonedPath;
};


ShapeModifiers.registerModifier('rp',RepeaterModifier);
function ShapeCollection(){
	this._length = 0;
	this._maxLength = 4;
	this.shapes = Array.apply(null,{length:this._maxLength});
};

ShapeCollection.prototype.addShape = function(shapeData){
	if(this._length === this._maxLength){
		this.shapes = this.shapes.concat(Array.apply(null,{length:this._maxLength}));
		this._maxLength *= 2;
	}
	this.shapes[this._length] = shapeData;
	this._length += 1;
};

ShapeCollection.prototype.releaseShapes = function(){
	var i;
	for(i = 0; i < this._length; i += 1) {
		shape_pool.release(this.shapes[i]);
	}
	this._length = 0;
};
var ImagePreloader = (function(){

    function imageLoaded(){
        this.loadedAssets += 1;
        if(this.loadedAssets === this.totalImages){
        }
    }

    function getAssetsPath(assetData){
        var path = '';
        if(this.assetsPath){
            var imagePath = assetData.p;
            if(imagePath.indexOf('images/') !== -1){
                imagePath = imagePath.split('/')[1];
            }
            path = this.assetsPath + imagePath;
        } else {
            path = this.path;
            path += assetData.u ? assetData.u : '';
            path += assetData.p;
        }
        return path;
    }

    function loadImage(path){
        var img = document.createElement('img');
        img.addEventListener('load', imageLoaded.bind(this), false);
        img.addEventListener('error', imageLoaded.bind(this), false);
        img.src = path;
    }
    function loadAssets(assets){
        this.totalAssets = assets.length;
        var i;
        for(i=0;i<this.totalAssets;i+=1){
            if(!assets[i].layers){
                loadImage.bind(this)(getAssetsPath.bind(this)(assets[i]));
                this.totalImages += 1;
            }
        }
    }

    function setPath(path){
        this.path = path || '';
    }

    function setAssetsPath(path){
        this.assetsPath = path || '';
    }

    return function ImagePreloader(){
        this.loadAssets = loadAssets;
        this.setAssetsPath = setAssetsPath;
        this.setPath = setPath;
        this.assetsPath = '';
        this.path = '';
        this.totalAssets = 0;
        this.totalImages = 0;
        this.loadedAssets = 0;
    }
}());
var featureSupport = (function(){
	var ob = {
		maskType: true
	}
	if (/MSIE 10/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent)) {
	   ob.maskType = false;
	}
	return ob;
}());
var filtersFactory = (function(){
	var ob = {};
	ob.createFilter = createFilter;
	ob.createAlphaToLuminanceFilter = createAlphaToLuminanceFilter;

	function createFilter(filId){
        	var fil = document.createElementNS(svgNS,'filter');
        	fil.setAttribute('id',filId);
                fil.setAttribute('filterUnits','objectBoundingBox');
                fil.setAttribute('x','0%');
                fil.setAttribute('y','0%');
                fil.setAttribute('width','100%');
                fil.setAttribute('height','100%');
                return fil;
	}

	function createAlphaToLuminanceFilter(){
                var feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
                feColorMatrix.setAttribute('type','matrix');
                feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
                feColorMatrix.setAttribute('values','0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1');
                return feColorMatrix;
	}

	return ob;
}())
var pooling = (function(){

	function double(arr){
		return arr.concat(Array.apply(null,{length:arr.length}))
	}

	return {
		double: double
	}
}());
var point_pool = (function(){
	var ob = {
		newPoint: newPoint,
		release: release
		/*,getLength:function(){return _length}
		,getCont:function(){return cont}*/
	}

	var _length = 0;
	var _maxLength = 8;
	var pool = Array.apply(null,{length:_maxLength});

	//var cont = 0;

	function newPoint(){
		//window.bm_newPoint = window.bm_newPoint ? window.bm_newPoint + 1 : 1;
		var point;
		if(_length){
			_length -= 1;
			point = pool[_length];
			//window.bm_reuse = window.bm_reuse ? window.bm_reuse + 1 : 1;
		} else {
			point = [0.1,0.1];
			//cont++;
			//console.log('new');
			//window.bm_new = window.bm_new ? window.bm_new + 1 : 1;
			//point._tst = cont++;
		}
		return point;
	}

	function release(point) {
		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		pool[_length] = point;
		_length += 1;
		//window.bm_release = window.bm_release ? window.bm_release + 1 : 1;
		//console.log('release');
	}


	return ob;
}());
var shape_pool = (function(){
	var ob = {
		clone: clone,
		newShape: newShape,
		release: release,
		releaseArray: releaseArray
	}

	var _length = 0;
	var _maxLength = 4;
	var pool = Array.apply(null,{length:_maxLength});

	function newShape(){
		var shapePath;
		if(_length){
			_length -= 1;
			shapePath = pool[_length];
		} else {
			shapePath = new ShapePath();
		}
		return shapePath;
	}

	function release(shapePath) {
		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		var len = shapePath._length, i;
		for(i = 0; i < len; i += 1) {
			point_pool.release(shapePath.v[i]);
			point_pool.release(shapePath.i[i]);
			point_pool.release(shapePath.o[i]);
		}
		shapePath._length = 0;
		shapePath.c = false;
		pool[_length] = shapePath;
		_length += 1;
	}

	function releaseArray(shapePathsCollection, length) {
		while(length--) {
			release(shapePathsCollection[length]);
		}
	}

	function clone(shape, transform) {
		var i, len = shape._length;
		var cloned = newShape();
		cloned._length = shape._length;
		cloned.c = shape.c;

		var pt;
		
		for(i = 0; i < len; i += 1) {
			if(transform){
				pt = transform.applyToPointArray(shape.v[i][0],shape.v[i][1],0,2);
				cloned.setXYAt(pt[0],pt[1],'v',i);
				point_pool.release(pt);
				pt = transform.applyToPointArray(shape.o[i][0],shape.o[i][1],0,2);
				cloned.setXYAt(pt[0],pt[1],'o',i);
				point_pool.release(pt);
				pt = transform.applyToPointArray(shape.i[i][0],shape.i[i][1],0,2);
				cloned.setXYAt(pt[0],pt[1],'i',i);
				point_pool.release(pt);
			}else{
				cloned.setTripleAt(shape.v[i][0],shape.v[i][1],shape.o[i][0],shape.o[i][1],shape.i[i][0],shape.i[i][1], i);
			}
		}
		return cloned
	}


	return ob;
}());
var shapeCollection_pool = (function(){
	var ob = {
		newShapeCollection: newShapeCollection,
		release: release,
		clone: clone
	}

	var _length = 0;
	var _maxLength = 4;
	var pool = Array.apply(null,{length:_maxLength});

	var cont = 0;

	function newShapeCollection(){
		var shapeCollection;
		if(_length){
			_length -= 1;
			shapeCollection = pool[_length];
		} else {
			shapeCollection = new ShapeCollection();
		}
		return shapeCollection;
	}

	function release(shapeCollection) {
		var i, len = shapeCollection._length;
		for(i = 0; i < len; i += 1) {
			shape_pool.release(shapeCollection.shapes[i]);
		}
		shapeCollection._length = 0;

		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		pool[_length] = shapeCollection;
		_length += 1;
	}

	function clone(shapeCollection, originCollection) {
		release(shapeCollection);
		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		pool[_length] = shapeCollection;
		_length += 1;
	}


	return ob;
}());
function BaseRenderer(){}
BaseRenderer.prototype.checkLayers = function(num){
    var i, len = this.layers.length, data;
    this.completeLayers = true;
    for (i = len - 1; i >= 0; i--) {
        if (!this.elements[i]) {
            data = this.layers[i];
            if(data.ip - data.st <= (num - this.layers[i].st) && data.op - data.st > (num - this.layers[i].st))
            {
                this.buildItem(i);
            }
        }
        this.completeLayers = this.elements[i] ? this.completeLayers:false;
    }
    this.checkPendingElements();
};

BaseRenderer.prototype.createItem = function(layer){
    switch(layer.ty){
        case 2:
            return this.createImage(layer);
        case 0:
            return this.createComp(layer);
        case 1:
            return this.createSolid(layer);
        case 4:
            return this.createShape(layer);
        case 5:
            return this.createText(layer);
        case 99:
            return null;
    }
    return this.createBase(layer);
};
BaseRenderer.prototype.buildAllItems = function(){
    var i, len = this.layers.length;
    for(i=0;i<len;i+=1){
        this.buildItem(i);
    }
    this.checkPendingElements();
};

BaseRenderer.prototype.includeLayers = function(newLayers){
    this.completeLayers = false;
    var i, len = newLayers.length;
    var j, jLen = this.layers.length;
    for(i=0;i<len;i+=1){
        j = 0;
        while(j<jLen){
            if(this.layers[j].id == newLayers[i].id){
                this.layers[j] = newLayers[i];
                break;
            }
            j += 1;
        }
    }
};

BaseRenderer.prototype.setProjectInterface = function(pInterface){
    this.globalData.projectInterface = pInterface;
};

BaseRenderer.prototype.initItems = function(){
    if(!this.globalData.progressiveLoad){
        this.buildAllItems();
    }
};
BaseRenderer.prototype.buildElementParenting = function(element, parentName, hierarchy){
    hierarchy = hierarchy || [];
    var elements = this.elements;
    var layers = this.layers;
    var i=0, len = layers.length;
    while(i<len){
        if(layers[i].ind == parentName){
            if(!elements[i] || elements[i] === true){
                this.buildItem(i);
                this.addPendingElement(element);
            } else if(layers[i].parent !== undefined){
                hierarchy.push(elements[i]);
                elements[i]._isParent = true;
                this.buildElementParenting(element,layers[i].parent, hierarchy);
            } else {
                hierarchy.push(elements[i]);
                elements[i]._isParent = true;
                element.setHierarchy(hierarchy);
            }


        }
        i += 1;
    }
};

BaseRenderer.prototype.addPendingElement = function(element){
    this.pendingElements.push(element);
};
function SVGRenderer(animationItem, config){
    this.animationItem = animationItem;
    this.layers = null;
    this.renderedFrame = -1;
    this.globalData = {
        frameNum: -1
    };
    this.renderConfig = {
        preserveAspectRatio: (config && config.preserveAspectRatio) || 'xMidYMid meet',
        progressiveLoad: (config && config.progressiveLoad) || false
    };
    this.elements = [];
    this.pendingElements = [];
    this.destroyed = false;

}

extendPrototype(BaseRenderer,SVGRenderer);

SVGRenderer.prototype.createBase = function (data) {
    return new SVGBaseElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.createShape = function (data) {
    return new IShapeElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.createText = function (data) {
    return new SVGTextElement(data, this.layerElement,this.globalData,this);

};

SVGRenderer.prototype.createImage = function (data) {
    return new IImageElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.createComp = function (data) {
    return new ICompElement(data, this.layerElement,this.globalData,this);

};

SVGRenderer.prototype.createSolid = function (data) {
    return new ISolidElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.configAnimation = function(animData){
    this.layerElement = document.createElementNS(svgNS,'svg');
    this.layerElement.setAttribute('xmlns','http://www.w3.org/2000/svg');
    this.layerElement.setAttribute('width',animData.w);
    this.layerElement.setAttribute('height',animData.h);
    this.layerElement.setAttribute('viewBox','0 0 '+animData.w+' '+animData.h);
    this.layerElement.setAttribute('preserveAspectRatio',this.renderConfig.preserveAspectRatio);
    this.layerElement.style.width = '100%';
    this.layerElement.style.height = '100%';
    //this.layerElement.style.transform = 'translate3d(0,0,0)';
    //this.layerElement.style.transformOrigin = this.layerElement.style.mozTransformOrigin = this.layerElement.style.webkitTransformOrigin = this.layerElement.style['-webkit-transform'] = "0px 0px 0px";
    this.animationItem.wrapper.appendChild(this.layerElement);
    //Mask animation
    var defs = document.createElementNS(svgNS, 'defs');
    this.globalData.defs = defs;
    this.layerElement.appendChild(defs);
    this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
    this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
    this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
    this.globalData.frameId = 0;
    this.globalData.nm = animData.nm;
    this.globalData.compSize = {
        w: animData.w,
        h: animData.h
    };
    this.data = animData;
    this.globalData.frameRate = animData.fr;
    var maskElement = document.createElementNS(svgNS, 'clipPath');
    var rect = document.createElementNS(svgNS,'rect');
    rect.setAttribute('width',animData.w);
    rect.setAttribute('height',animData.h);
    rect.setAttribute('x',0);
    rect.setAttribute('y',0);
    var maskId = 'animationMask_'+randomString(10);
    maskElement.setAttribute('id', maskId);
    maskElement.appendChild(rect);
    var maskedElement = document.createElementNS(svgNS,'g');
    maskedElement.setAttribute("clip-path", "url(#"+maskId+")");
    this.layerElement.appendChild(maskedElement);
    defs.appendChild(maskElement);
    this.layerElement = maskedElement;
    this.layers = animData.layers;
    this.globalData.fontManager = new FontManager();
    this.globalData.fontManager.addChars(animData.chars);
    this.globalData.fontManager.addFonts(animData.fonts,defs);
    this.elements = Array.apply(null,{length:animData.layers.length});
};


SVGRenderer.prototype.destroy = function () {
    this.animationItem.wrapper.innerHTML = '';
    this.layerElement = null;
    this.globalData.defs = null;
    var i, len = this.layers ? this.layers.length : 0;
    for (i = 0; i < len; i++) {
        if(this.elements[i]){
            this.elements[i].destroy();
        }
    }
    this.elements.length = 0;
    this.destroyed = true;
    this.animationItem = null;
};

SVGRenderer.prototype.updateContainerSize = function () {
};

SVGRenderer.prototype.buildItem  = function(pos){
    var elements = this.elements;
    if(elements[pos] || this.layers[pos].ty == 99){
        return;
    }
    elements[pos] = true;
    var element = this.createItem(this.layers[pos]);

    elements[pos] = element;
    if(expressionsPlugin){
        if(this.layers[pos].ty === 0){
            this.globalData.projectInterface.registerComposition(element);
        }
        element.initExpressions();
    }
    this.appendElementInPos(element,pos);
    if(this.layers[pos].tt){
        if(!this.elements[pos - 1] || this.elements[pos - 1] === true){
            this.buildItem(pos - 1);
            this.addPendingElement(element);
        } else {
            element.setMatte(elements[pos - 1].layerId);
        }
    }
};

SVGRenderer.prototype.checkPendingElements  = function(){
    while(this.pendingElements.length){
        var element = this.pendingElements.pop();
        element.checkParenting();
        if(element.data.tt){
            var i = 0, len = this.elements.length;
            while(i<len){
                if(this.elements[i] === element){
                    element.setMatte(this.elements[i - 1].layerId);
                    break;
                }
                i += 1;
            }
        }
    }
};

SVGRenderer.prototype.renderFrame = function(num){
    if(this.renderedFrame == num || this.destroyed){
        return;
    }
    if(num === null){
        num = this.renderedFrame;
    }else{
        this.renderedFrame = num;
    }
    //clearPoints();
    /*console.log('-------');
    console.log('FRAME ',num);*/
    this.globalData.frameNum = num;
    this.globalData.frameId += 1;
    this.globalData.projectInterface.currentFrame = num;
    var i, len = this.layers.length;
    if(!this.completeLayers){
        this.checkLayers(num);
    }
    for (i = len - 1; i >= 0; i--) {
        if(this.completeLayers || this.elements[i]){
            this.elements[i].prepareFrame(num - this.layers[i].st);
        }
    }
    for (i = len - 1; i >= 0; i--) {
        if(this.completeLayers || this.elements[i]){
            this.elements[i].renderFrame();
        }
    }
};

SVGRenderer.prototype.appendElementInPos = function(element, pos){
    var newElement = element.getBaseElement();
    if(!newElement){
        return;
    }
    var i = 0;
    var nextElement;
    while(i<pos){
        if(this.elements[i] && this.elements[i]!== true && this.elements[i].getBaseElement()){
            nextElement = this.elements[i].getBaseElement();
        }
        i += 1;
    }
    if(nextElement){
        this.layerElement.insertBefore(newElement, nextElement);
    } else {
        this.layerElement.appendChild(newElement);
    }
};

SVGRenderer.prototype.hide = function(){
    this.layerElement.style.display = 'none';
};

SVGRenderer.prototype.show = function(){
    this.layerElement.style.display = 'block';
};

SVGRenderer.prototype.searchExtraCompositions = function(assets){
    var i, len = assets.length;
    var floatingContainer = document.createElementNS(svgNS,'g');
    for(i=0;i<len;i+=1){
        if(assets[i].xt){
            var comp = this.createComp(assets[i],floatingContainer,this.globalData.comp,null);
            comp.initExpressions();
            //comp.compInterface = CompExpressionInterface(comp);
            //Expressions.addLayersInterface(comp.elements, this.globalData.projectInterface);
            this.globalData.projectInterface.registerComposition(comp);
        }
    }
};

function MaskElement(data,element,globalData) {
    this.dynamicProperties = [];
    this.data = data;
    this.element = element;
    this.globalData = globalData;
    this.paths = [];
    this.storedData = [];
    this.masksProperties = this.data.masksProperties;
    this.viewData = new Array(this.masksProperties.length);
    this.maskElement = null;
    this.firstFrame = true;
    var defs = this.globalData.defs;
    var i, len = this.masksProperties.length;


    var path, properties = this.masksProperties;
    var count = 0;
    var currentMasks = [];
    var j, jLen;
    var layerId = randomString(10);
    var rect, expansor, feMorph,x;
    var maskType = 'clipPath', maskRef = 'clip-path';
    for (i = 0; i < len; i++) {

        if((properties[i].mode !== 'a' && properties[i].mode !== 'n')|| properties[i].inv || properties[i].o.k !== 100){
            maskType = 'mask';
            maskRef = 'mask';
        }

        if((properties[i].mode == 's' || properties[i].mode == 'i') && count == 0){
            rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('fill', '#ffffff');
            rect.setAttribute('width', this.element.comp.data.w);
            rect.setAttribute('height', this.element.comp.data.h);
            currentMasks.push(rect);
        } else {
            rect = null;
        }

        path = document.createElementNS(svgNS, 'path');
        if(properties[i].mode == 'n') {
            this.viewData[i] = {
                op: PropertyFactory.getProp(this.element,properties[i].o,0,0.01,this.dynamicProperties),
                prop: ShapePropertyFactory.getShapeProp(this.element,properties[i],3,this.dynamicProperties,null),
                elem: path
            };
            defs.appendChild(path);
            continue;
        }
        count += 1;

        if(properties[i].mode == 's'){
            path.setAttribute('fill', '#000000');
        }else{
            path.setAttribute('fill', '#ffffff');
        }
        path.setAttribute('clip-rule','nonzero');

        if(properties[i].x.k !== 0){
            maskType = 'mask';
            maskRef = 'mask';
            x = PropertyFactory.getProp(this.element,properties[i].x,0,null,this.dynamicProperties);
            var filterID = 'fi_'+randomString(10);
            expansor = document.createElementNS(svgNS,'filter');
            expansor.setAttribute('id',filterID);
            feMorph = document.createElementNS(svgNS,'feMorphology');
            feMorph.setAttribute('operator','dilate');
            feMorph.setAttribute('in','SourceGraphic');
            feMorph.setAttribute('radius','0');
            expansor.appendChild(feMorph);
            defs.appendChild(expansor);
            if(properties[i].mode == 's'){
                path.setAttribute('stroke', '#000000');
            }else{
                path.setAttribute('stroke', '#ffffff');
            }
        }else{
            feMorph = null;
            x = null;
        }


        this.storedData[i] = {
             elem: path,
             x: x,
             expan: feMorph,
            lastPath: '',
            lastOperator:'',
            filterId:filterID,
            lastRadius:0
        };
        if(properties[i].mode == 'i'){
            jLen = currentMasks.length;
            var g = document.createElementNS(svgNS,'g');
            for(j=0;j<jLen;j+=1){
                g.appendChild(currentMasks[j]);
            }
            var mask = document.createElementNS(svgNS,'mask');
            mask.setAttribute('mask-type','alpha');
            mask.setAttribute('id',layerId+'_'+count);
            mask.appendChild(path);
            defs.appendChild(mask);
            g.setAttribute('mask','url(#'+layerId+'_'+count+')');

            currentMasks.length = 0;
            currentMasks.push(g);
        }else{
            currentMasks.push(path);
        }
        if(properties[i].inv && !this.solidPath){
            this.solidPath = this.createLayerSolidPath();
        }
        this.viewData[i] = {
            elem: path,
            lastPath: '',
            op: PropertyFactory.getProp(this.element,properties[i].o,0,0.01,this.dynamicProperties),
            prop:ShapePropertyFactory.getShapeProp(this.element,properties[i],3,this.dynamicProperties,null)
        };
        if(rect){
            this.viewData[i].invRect = rect;
        }
        if(!this.viewData[i].prop.k){
            this.drawPath(properties[i],this.viewData[i].prop.v,this.viewData[i]);
        }
    }

    this.maskElement = document.createElementNS(svgNS, maskType);

    len = currentMasks.length;
    for(i=0;i<len;i+=1){
        this.maskElement.appendChild(currentMasks[i]);
    }

    this.maskElement.setAttribute('id', layerId);
    if(count > 0){
        this.element.maskedElement.setAttribute(maskRef, "url(#" + layerId + ")");
    }

    defs.appendChild(this.maskElement);
};

MaskElement.prototype.getMaskProperty = function(pos){
    return this.viewData[pos].prop;
};

MaskElement.prototype.prepareFrame = function(){
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();

    }
};

MaskElement.prototype.renderFrame = function (finalMat) {
    var i, len = this.masksProperties.length;
    for (i = 0; i < len; i++) {
        if(this.viewData[i].prop.mdf || this.firstFrame){
            this.drawPath(this.masksProperties[i],this.viewData[i].prop.v,this.viewData[i]);
        }
        if(this.viewData[i].op.mdf || this.firstFrame){
            this.viewData[i].elem.setAttribute('fill-opacity',this.viewData[i].op.v);
        }
        if(this.masksProperties[i].mode !== 'n'){
            if(this.viewData[i].invRect && (this.element.finalTransform.mProp.mdf || this.firstFrame)){
                this.viewData[i].invRect.setAttribute('x', -finalMat.props[12]);
                this.viewData[i].invRect.setAttribute('y', -finalMat.props[13]);
            }
            if(this.storedData[i].x && (this.storedData[i].x.mdf || this.firstFrame)){
                var feMorph = this.storedData[i].expan;
                if(this.storedData[i].x.v < 0){
                    if(this.storedData[i].lastOperator !== 'erode'){
                        this.storedData[i].lastOperator = 'erode';
                        this.storedData[i].elem.setAttribute('filter','url(#'+this.storedData[i].filterId+')');
                    }
                    feMorph.setAttribute('radius',-this.storedData[i].x.v);
                }else{
                    if(this.storedData[i].lastOperator !== 'dilate'){
                        this.storedData[i].lastOperator = 'dilate';
                        this.storedData[i].elem.setAttribute('filter',null);
                    }
                    this.storedData[i].elem.setAttribute('stroke-width', this.storedData[i].x.v*2);

                }
            }
        }
    }
    this.firstFrame = false;
};

MaskElement.prototype.getMaskelement = function () {
    return this.maskElement;
};

MaskElement.prototype.createLayerSolidPath = function(){
    var path = 'M0,0 ';
    path += ' h' + this.globalData.compSize.w ;
    path += ' v' + this.globalData.compSize.h ;
    path += ' h-' + this.globalData.compSize.w ;
    path += ' v-' + this.globalData.compSize.h + ' ';
    return path;
};

MaskElement.prototype.drawPath = function(pathData,pathNodes,viewData){
    var pathString = " M"+pathNodes.v[0][0]+','+pathNodes.v[0][1];
    var i, len;
    len = pathNodes._length;
    for(i=1;i<len;i+=1){
        //pathString += " C"+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1] + " "+pathNodes.i[i][0]+','+pathNodes.i[i][1] + " "+pathNodes.v[i][0]+','+pathNodes.v[i][1];
        pathString += " C"+bm_rnd(pathNodes.o[i-1][0])+','+bm_rnd(pathNodes.o[i-1][1]) + " "+bm_rnd(pathNodes.i[i][0])+','+bm_rnd(pathNodes.i[i][1]) + " "+bm_rnd(pathNodes.v[i][0])+','+bm_rnd(pathNodes.v[i][1]);
    }
        //pathString += " C"+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1] + " "+pathNodes.i[0][0]+','+pathNodes.i[0][1] + " "+pathNodes.v[0][0]+','+pathNodes.v[0][1];
    if(pathNodes.c && len > 1){
        pathString += " C"+bm_rnd(pathNodes.o[i-1][0])+','+bm_rnd(pathNodes.o[i-1][1]) + " "+bm_rnd(pathNodes.i[0][0])+','+bm_rnd(pathNodes.i[0][1]) + " "+bm_rnd(pathNodes.v[0][0])+','+bm_rnd(pathNodes.v[0][1]);
    }
    //pathNodes.__renderedString = pathString;


    if(viewData.lastPath !== pathString){
        if(viewData.elem){
            if(!pathNodes.c){
                viewData.elem.setAttribute('d','');
            }else if(pathData.inv){
                viewData.elem.setAttribute('d',this.solidPath + pathString);
            }else{
                viewData.elem.setAttribute('d',pathString);
            }
        }
        viewData.lastPath = pathString;
    }
};

MaskElement.prototype.getMask = function(nm){
    var i = 0, len = this.masksProperties.length;
    while(i<len){
        if(this.masksProperties[i].nm === nm){
            return {
                maskPath: this.viewData[i].prop.pv
            }
        }
        i += 1;
    }
};

MaskElement.prototype.destroy = function(){
    this.element = null;
    this.globalData = null;
    this.maskElement = null;
    this.data = null;
    this.paths = null;
    this.masksProperties = null;
};
function BaseElement(){
};
BaseElement.prototype.checkMasks = function(){
    if(!this.data.hasMask){
        return false;
    }
    var i = 0, len = this.data.masksProperties.length;
    while(i<len) {
        if((this.data.masksProperties[i].mode !== 'n' && this.data.masksProperties[i].cl !== false)) {
            return true;
        }
        i += 1;
    }
    return false;
}

BaseElement.prototype.checkParenting = function(){
    if(this.data.parent !== undefined){
        this.comp.buildElementParenting(this, this.data.parent);
    }
}

BaseElement.prototype.prepareFrame = function(num){
    if(this.data.ip - this.data.st <= num && this.data.op - this.data.st > num)
    {
        if(this.isVisible !== true){
            this.elemMdf = true;
            this.globalData.mdf = true;
            this.isVisible = true;
            this.firstFrame = true;
            if(this.data.hasMask){
                this.maskManager.firstFrame = true;
            }
        }
    }else{
        if(this.isVisible !== false){
            this.elemMdf = true;
            this.globalData.mdf = true;
            this.isVisible = false;
        }
    }
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        if(this.isVisible || (this._isParent && this.dynamicProperties[i].type === 'transform')){
            this.dynamicProperties[i].getValue();
            if(this.dynamicProperties[i].mdf){
                this.elemMdf = true;
                this.globalData.mdf = true;
            }
        }
    }
    if(this.data.hasMask && this.isVisible){
        this.maskManager.prepareFrame(num*this.data.sr);
    }
    
    /* TODO check this
    if(this.data.sy){
        if(this.data.sy[0].renderedData[num]){
            if(this.data.sy[0].renderedData[num].c){
                this.feFlood.setAttribute('flood-color','rgb('+Math.round(this.data.sy[0].renderedData[num].c[0])+','+Math.round(this.data.sy[0].renderedData[num].c[1])+','+Math.round(this.data.sy[0].renderedData[num].c[2])+')');
            }
            if(this.data.sy[0].renderedData[num].s){
                this.feMorph.setAttribute('radius',this.data.sy[0].renderedData[num].s);
            }
        }
    }
    */


    this.currentFrameNum = num*this.data.sr;
    return this.isVisible;
};

BaseElement.prototype.globalToLocal = function(pt){
    var transforms = [];
    transforms.push(this.finalTransform);
    var flag = true;
    var comp = this.comp;
    while(flag){
        if(comp.finalTransform){
            if(comp.data.hasMask){
                transforms.splice(0,0,comp.finalTransform);
            }
            comp = comp.comp;
        } else {
            flag = false;
        }
    }
    var i, len = transforms.length,ptNew;
    for(i=0;i<len;i+=1){
        ptNew = transforms[i].mat.applyToPointArray(0,0,0);
        //ptNew = transforms[i].mat.applyToPointArray(pt[0],pt[1],pt[2]);
        pt = [pt[0] - ptNew[0],pt[1] - ptNew[1],0];
    }
    return pt;
};

BaseElement.prototype.initExpressions = function(){
    this.layerInterface = LayerExpressionInterface(this);
    //layers[i].layerInterface = LayerExpressionInterface(layers[i]);
    //layers[i].layerInterface = LayerExpressionInterface(layers[i]);
    if(this.data.hasMask){
        this.layerInterface.registerMaskInterface(this.maskManager);
    }
    var effectsInterface = EffectsExpressionInterface.createEffectsInterface(this,this.layerInterface);
    this.layerInterface.registerEffectsInterface(effectsInterface);

    if(this.data.ty === 0 || this.data.xt){
        this.compInterface = CompExpressionInterface(this);
    } else if(this.data.ty === 4){
        this.layerInterface.shapeInterface = ShapeExpressionInterface.createShapeInterface(this.shapesData,this.viewData,this.layerInterface);
    } else if(this.data.ty === 5){
        this.layerInterface.textInterface = TextExpressionInterface(this);
    }
}

BaseElement.prototype.setBlendMode = function(){
    var blendModeValue = '';
    switch(this.data.bm){
        case 1:
            blendModeValue = 'multiply';
            break;
        case 2:
            blendModeValue = 'screen';
            break;
        case 3:
            blendModeValue = 'overlay';
            break;
        case 4:
            blendModeValue = 'darken';
            break;
        case 5:
            blendModeValue = 'lighten';
            break;
        case 6:
            blendModeValue = 'color-dodge';
            break;
        case 7:
            blendModeValue = 'color-burn';
            break;
        case 8:
            blendModeValue = 'hard-light';
            break;
        case 9:
            blendModeValue = 'soft-light';
            break;
        case 10:
            blendModeValue = 'difference';
            break;
        case 11:
            blendModeValue = 'exclusion';
            break;
        case 12:
            blendModeValue = 'hue';
            break;
        case 13:
            blendModeValue = 'saturation';
            break;
        case 14:
            blendModeValue = 'color';
            break;
        case 15:
            blendModeValue = 'luminosity';
            break;
    }
    var elem = this.baseElement || this.layerElement;

    elem.style['mix-blend-mode'] = blendModeValue;
}

BaseElement.prototype.init = function(){
    if(!this.data.sr){
        this.data.sr = 1;
    }
    this.dynamicProperties = [];
    if(this.data.ef){
        this.effects = new EffectsManager(this.data,this,this.dynamicProperties);
        //this.effect = this.effectsManager.bind(this.effectsManager);
    }
    //this.elemInterface = buildLayerExpressionInterface(this);
    this.hidden = false;
    this.firstFrame = true;
    this.isVisible = false;
    this._isParent = false;
    this.currentFrameNum = -99999;
    this.lastNum = -99999;
    if(this.data.ks){
        this.finalTransform = {
            mProp: PropertyFactory.getProp(this,this.data.ks,2,null,this.dynamicProperties),
            matMdf: false,
            opMdf: false,
            mat: new Matrix(),
            opacity: 1
        };
        if(this.data.ao){
            this.finalTransform.mProp.autoOriented = true;
        }
        this.finalTransform.op = this.finalTransform.mProp.o;
        this.transform = this.finalTransform.mProp;
        if(this.data.ty !== 11){
            this.createElements();
        }
        if(this.data.hasMask){
            this.addMasks(this.data);
        }
    }
    this.elemMdf = false;
};
BaseElement.prototype.getType = function(){
    return this.type;
};

BaseElement.prototype.resetHierarchy = function(){
    if(!this.hierarchy){
        this.hierarchy = [];
    }else{
        this.hierarchy.length = 0;
    }
};

BaseElement.prototype.getHierarchy = function(){
    if(!this.hierarchy){
        this.hierarchy = [];
    }
    return this.hierarchy;
};

BaseElement.prototype.setHierarchy = function(hierarchy){
    this.hierarchy = hierarchy;
};

BaseElement.prototype.getLayerSize = function(){
    if(this.data.ty === 5){
        return {w:this.data.textData.width,h:this.data.textData.height};
    }else{
        return {w:this.data.width,h:this.data.height};
    }
};

BaseElement.prototype.hide = function(){

};

BaseElement.prototype.mHelper = new Matrix();
function SVGBaseElement(data,parentContainer,globalData,comp, placeholder){
    this.globalData = globalData;
    this.comp = comp;
    this.data = data;
    this.matteElement = null;
    this.transformedElement = null;
    this.parentContainer = parentContainer;
    this.layerId = placeholder ? placeholder.layerId : 'ly_'+randomString(10);
    this.placeholder = placeholder;
    this.init();
};

createElement(BaseElement, SVGBaseElement);

SVGBaseElement.prototype.createElements = function(){
    this.layerElement = document.createElementNS(svgNS,'g');
    this.transformedElement = this.layerElement;
    if(this.data.hasMask){
        this.maskedElement = this.layerElement;
    }
    var layerElementParent = null;
    if(this.data.td){
        if(this.data.td == 3 || this.data.td == 1){
            var masker = document.createElementNS(svgNS,'mask');
            masker.setAttribute('id',this.layerId);
            masker.setAttribute('mask-type',this.data.td == 3 ? 'luminance':'alpha');
            masker.appendChild(this.layerElement);
            layerElementParent = masker;
            this.globalData.defs.appendChild(masker);
            ////// This is only for IE and Edge when mask if of type alpha
            if(!featureSupport.maskType && this.data.td == 1){
                masker.setAttribute('mask-type','luminance');
                var filId = randomString(10);
                var fil = filtersFactory.createFilter(filId);
                this.globalData.defs.appendChild(fil);
                fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
                var gg = document.createElementNS(svgNS,'g');
                gg.appendChild(this.layerElement);
                layerElementParent = gg;
                masker.appendChild(gg);
                gg.setAttribute('filter','url(#'+filId+')');
            }
        }else if(this.data.td == 2){
            var maskGroup = document.createElementNS(svgNS,'mask');
            maskGroup.setAttribute('id',this.layerId);
            maskGroup.setAttribute('mask-type','alpha');
            var maskGrouper = document.createElementNS(svgNS,'g');
            maskGroup.appendChild(maskGrouper);
            var filId = randomString(10);
            var fil = filtersFactory.createFilter(filId);
            ////

            var feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
            feColorMatrix.setAttribute('type','matrix');
            feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
            feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 -1 1');
            fil.appendChild(feColorMatrix);

            ////
            /*var feCTr = document.createElementNS(svgNS,'feComponentTransfer');
            feCTr.setAttribute('in','SourceGraphic');
            fil.appendChild(feCTr);
            var feFunc = document.createElementNS(svgNS,'feFuncA');
            feFunc.setAttribute('type','table');
            feFunc.setAttribute('tableValues','1.0 0.0');
            feCTr.appendChild(feFunc);*/
            this.globalData.defs.appendChild(fil);
            var alphaRect = document.createElementNS(svgNS,'rect');
            alphaRect.setAttribute('width',this.comp.data.w);
            alphaRect.setAttribute('height',this.comp.data.h);
            alphaRect.setAttribute('x','0');
            alphaRect.setAttribute('y','0');
            alphaRect.setAttribute('fill','#ffffff');
            alphaRect.setAttribute('opacity','0');
            maskGrouper.setAttribute('filter','url(#'+filId+')');
            maskGrouper.appendChild(alphaRect);
            maskGrouper.appendChild(this.layerElement);
            layerElementParent = maskGrouper;
            if(!featureSupport.maskType){
                maskGroup.setAttribute('mask-type','luminance');
                fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
                var gg = document.createElementNS(svgNS,'g');
                maskGrouper.appendChild(alphaRect);
                gg.appendChild(this.layerElement);
                layerElementParent = gg;
                maskGrouper.appendChild(gg);
            }
            this.globalData.defs.appendChild(maskGroup);
        }
    }else if(this.data.hasMask || this.data.tt){
        if(this.data.tt){
            this.matteElement = document.createElementNS(svgNS,'g');
            this.matteElement.appendChild(this.layerElement);
            layerElementParent = this.matteElement;
            this.baseElement = this.matteElement;
        }else{
            this.baseElement = this.layerElement;
        }
    }else{
        this.baseElement = this.layerElement;
    }
    if((this.data.ln || this.data.cl) && (this.data.ty === 4 || this.data.ty === 0)){
        if(this.data.ln){
            this.layerElement.setAttribute('id',this.data.ln);
        }
        if(this.data.cl){
            this.layerElement.setAttribute('class',this.data.cl);
        }
    }
    if(this.data.ty === 0){
            var cp = document.createElementNS(svgNS, 'clipPath');
            var pt = document.createElementNS(svgNS,'path');
            pt.setAttribute('d','M0,0 L'+this.data.w+',0'+' L'+this.data.w+','+this.data.h+' L0,'+this.data.h+'z');
            var clipId = 'cp_'+randomString(8);
            cp.setAttribute('id',clipId);
            cp.appendChild(pt);
            this.globalData.defs.appendChild(cp);
        if(this.checkMasks()){
            var cpGroup = document.createElementNS(svgNS,'g');
            cpGroup.setAttribute('clip-path','url(#'+clipId+')');
            cpGroup.appendChild(this.layerElement);
            this.transformedElement = cpGroup;
            if(layerElementParent){
                layerElementParent.appendChild(this.transformedElement);
            } else {
                this.baseElement = this.transformedElement;
            }
        } else {
            this.layerElement.setAttribute('clip-path','url(#'+clipId+')');
        }
        
    }
    if(this.data.bm !== 0){
        this.setBlendMode();
    }
    if(this.layerElement !== this.parentContainer){
        this.placeholder = null;
    }
    /* Todo performance killer
    if(this.data.sy){
        var filterID = 'st_'+randomString(10);
        var c = this.data.sy[0].c.k;
        var r = this.data.sy[0].s.k;
        var expansor = document.createElementNS(svgNS,'filter');
        expansor.setAttribute('id',filterID);
        var feFlood = document.createElementNS(svgNS,'feFlood');
        this.feFlood = feFlood;
        if(!c[0].e){
            feFlood.setAttribute('flood-color','rgb('+c[0]+','+c[1]+','+c[2]+')');
        }
        feFlood.setAttribute('result','base');
        expansor.appendChild(feFlood);
        var feMorph = document.createElementNS(svgNS,'feMorphology');
        feMorph.setAttribute('operator','dilate');
        feMorph.setAttribute('in','SourceGraphic');
        feMorph.setAttribute('result','bigger');
        this.feMorph = feMorph;
        if(!r.length){
            feMorph.setAttribute('radius',this.data.sy[0].s.k);
        }
        expansor.appendChild(feMorph);
        var feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
        feColorMatrix.setAttribute('result','mask');
        feColorMatrix.setAttribute('in','bigger');
        feColorMatrix.setAttribute('type','matrix');
        feColorMatrix.setAttribute('values','0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0');
        expansor.appendChild(feColorMatrix);
        var feComposite = document.createElementNS(svgNS,'feComposite');
        feComposite.setAttribute('result','drop');
        feComposite.setAttribute('in','base');
        feComposite.setAttribute('in2','mask');
        feComposite.setAttribute('operator','in');
        expansor.appendChild(feComposite);
        var feBlend = document.createElementNS(svgNS,'feBlend');
        feBlend.setAttribute('in','SourceGraphic');
        feBlend.setAttribute('in2','drop');
        feBlend.setAttribute('mode','normal');
        expansor.appendChild(feBlend);
        this.globalData.defs.appendChild(expansor);
        var cont = document.createElementNS(svgNS,'g');
        if(this.layerElement === this.parentContainer){
            this.layerElement = cont;
        }else{
            cont.appendChild(this.layerElement);
        }
        cont.setAttribute('filter','url(#'+filterID+')');
        if(this.data.td){
            cont.setAttribute('data-td',this.data.td);
        }
        if(this.data.td == 3){
            this.globalData.defs.appendChild(cont);
        }else if(this.data.td == 2){
            maskGrouper.appendChild(cont);
        }else if(this.data.td == 1){
            masker.appendChild(cont);
        }else{
            if(this.data.hasMask && this.data.tt){
                this.matteElement.appendChild(cont);
            }else{
                this.appendNodeToParent(cont);
            }
        }
    }*/
    if(this.data.ef){
        this.effectsManager = new SVGEffects(this);
    }
    this.checkParenting();
};


SVGBaseElement.prototype.setBlendMode = BaseElement.prototype.setBlendMode;

SVGBaseElement.prototype.renderFrame = function(parentTransform){
    if(this.data.ty === 3 || this.data.hd || !this.isVisible){
        return false;
    }

    this.lastNum = this.currentFrameNum;
    this.finalTransform.opMdf = this.firstFrame || this.finalTransform.op.mdf;
    this.finalTransform.matMdf = this.firstFrame || this.finalTransform.mProp.mdf;
    this.finalTransform.opacity = this.finalTransform.op.v;

    var mat;
    var finalMat = this.finalTransform.mat;

    if(this.hierarchy){
        var i = 0, len = this.hierarchy.length;
        if(!this.finalTransform.matMdf) {
            while(i < len) {
                if(this.hierarchy[i].finalTransform.mProp.mdf) {
                    this.finalTransform.matMdf = true;
                    break;
                }
                i += 1;
            }
        }
        
        if(this.finalTransform.matMdf) {
            mat = this.finalTransform.mProp.v.props;
            finalMat.cloneFromProps(mat);
            for(i=0;i<len;i+=1){
                mat = this.hierarchy[i].finalTransform.mProp.v.props;
                finalMat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]);
            }
        }
        
    }else if(this.isVisible){
        finalMat = this.finalTransform.mProp.v;
    }
    if(this.finalTransform.matMdf && this.layerElement){
        this.transformedElement.setAttribute('transform',finalMat.to2dCSS());
    }
    if(this.finalTransform.opMdf && this.layerElement){
        this.transformedElement.setAttribute('opacity',this.finalTransform.op.v);
    }

    if(this.data.hasMask){
        this.maskManager.renderFrame(finalMat);
    }
    if(this.effectsManager){
        this.effectsManager.renderFrame(this.firstFrame);
    }
    return this.isVisible;
};

SVGBaseElement.prototype.destroy = function(){
    this.layerElement = null;
    this.parentContainer = null;
    if(this.matteElement) {
        this.matteElement = null;
    }
    if(this.maskManager) {
        this.maskManager.destroy();
    }
};

SVGBaseElement.prototype.getBaseElement = function(){
    return this.baseElement;
};
SVGBaseElement.prototype.addMasks = function(data){
    this.maskManager = new MaskElement(data,this,this.globalData);
};

SVGBaseElement.prototype.setMatte = function(id){
    if(!this.matteElement){
        return;
    }
    this.matteElement.setAttribute("mask", "url(#" + id + ")");
};

SVGBaseElement.prototype.setMatte = function(id){
    if(!this.matteElement){
        return;
    }
    this.matteElement.setAttribute("mask", "url(#" + id + ")");
};

SVGBaseElement.prototype.hide = function(){

};

function ITextElement(data, animationItem,parentContainer,globalData){
}
ITextElement.prototype.init = function(){
    this._parent.init.call(this);

    this.lettersChangedFlag = false;
    this.currentTextDocumentData = {};
    var data = this.data;
    this.viewData = {
        m:{
            a: PropertyFactory.getProp(this,data.t.m.a,1,0,this.dynamicProperties)
        }
    };
    var textData = this.data.t;
    if(textData.a.length){
        this.viewData.a = Array.apply(null,{length:textData.a.length});
        var i, len = textData.a.length, animatorData, animatorProps;
        for(i=0;i<len;i+=1){
            animatorProps = textData.a[i];
            animatorData = {
                a: {},
                s: {}
            };
            if('r' in animatorProps.a) {
                animatorData.a.r = PropertyFactory.getProp(this,animatorProps.a.r,0,degToRads,this.dynamicProperties);
            }
            if('rx' in animatorProps.a) {
                animatorData.a.rx = PropertyFactory.getProp(this,animatorProps.a.rx,0,degToRads,this.dynamicProperties);
            }
            if('ry' in animatorProps.a) {
                animatorData.a.ry = PropertyFactory.getProp(this,animatorProps.a.ry,0,degToRads,this.dynamicProperties);
            }
            if('sk' in animatorProps.a) {
                animatorData.a.sk = PropertyFactory.getProp(this,animatorProps.a.sk,0,degToRads,this.dynamicProperties);
            }
            if('sa' in animatorProps.a) {
                animatorData.a.sa = PropertyFactory.getProp(this,animatorProps.a.sa,0,degToRads,this.dynamicProperties);
            }
            if('s' in animatorProps.a) {
                animatorData.a.s = PropertyFactory.getProp(this,animatorProps.a.s,1,0.01,this.dynamicProperties);
            }
            if('a' in animatorProps.a) {
                animatorData.a.a = PropertyFactory.getProp(this,animatorProps.a.a,1,0,this.dynamicProperties);
            }
            if('o' in animatorProps.a) {
                animatorData.a.o = PropertyFactory.getProp(this,animatorProps.a.o,0,0.01,this.dynamicProperties);
            }
            if('p' in animatorProps.a) {
                animatorData.a.p = PropertyFactory.getProp(this,animatorProps.a.p,1,0,this.dynamicProperties);
            }
            if('sw' in animatorProps.a) {
                animatorData.a.sw = PropertyFactory.getProp(this,animatorProps.a.sw,0,0,this.dynamicProperties);
            }
            if('sc' in animatorProps.a) {
                animatorData.a.sc = PropertyFactory.getProp(this,animatorProps.a.sc,1,0,this.dynamicProperties);
            }
            if('fc' in animatorProps.a) {
                animatorData.a.fc = PropertyFactory.getProp(this,animatorProps.a.fc,1,0,this.dynamicProperties);
            }
            if('fh' in animatorProps.a) {
                animatorData.a.fh = PropertyFactory.getProp(this,animatorProps.a.fh,0,0,this.dynamicProperties);
            }
            if('fs' in animatorProps.a) {
                animatorData.a.fs = PropertyFactory.getProp(this,animatorProps.a.fs,0,0.01,this.dynamicProperties);
            }
            if('fb' in animatorProps.a) {
                animatorData.a.fb = PropertyFactory.getProp(this,animatorProps.a.fb,0,0.01,this.dynamicProperties);
            }
            if('t' in animatorProps.a) {
                animatorData.a.t = PropertyFactory.getProp(this,animatorProps.a.t,0,0,this.dynamicProperties);
            }
            animatorData.s = PropertyFactory.getTextSelectorProp(this,animatorProps.s,this.dynamicProperties);
            animatorData.s.t = animatorProps.s.t;
            this.viewData.a[i] = animatorData;
        }
    }else{
        this.viewData.a = [];
    }
    if(textData.p && 'm' in textData.p){
        this.viewData.p = {
            f: PropertyFactory.getProp(this,textData.p.f,0,0,this.dynamicProperties),
            l: PropertyFactory.getProp(this,textData.p.l,0,0,this.dynamicProperties),
            r: textData.p.r,
            m: this.maskManager.getMaskProperty(textData.p.m)
        };
        this.maskPath = true;
    } else {
        this.maskPath = false;
    }
};
ITextElement.prototype.prepareFrame = function(num) {
    var i = 0, len = this.data.t.d.k.length;
    var textDocumentData = this.data.t.d.k[i].s;
    i += 1;
    while(i<len){
        if(this.data.t.d.k[i].t > num){
            break;
        }
        textDocumentData = this.data.t.d.k[i].s;
        i += 1;
    }
    this.lettersChangedFlag = false;
    if(textDocumentData !== this.currentTextDocumentData){
        this.currentTextDocumentData = textDocumentData;
        this.lettersChangedFlag = true;
        this.buildNewText();
    }
    this._parent.prepareFrame.call(this, num);
}

ITextElement.prototype.createPathShape = function(matrixHelper, shapes) {
    var j,jLen = shapes.length;
    var k, kLen, pathNodes;
    var shapeStr = '';
    for(j=0;j<jLen;j+=1){
        kLen = shapes[j].ks.k.i.length;
        pathNodes = shapes[j].ks.k;
        for(k=1;k<kLen;k+=1){
            if(k==1){
                shapeStr += " M"+matrixHelper.applyToPointStringified(pathNodes.v[0][0],pathNodes.v[0][1]);
            }
            shapeStr += " C"+matrixHelper.applyToPointStringified(pathNodes.o[k-1][0],pathNodes.o[k-1][1]) + " "+matrixHelper.applyToPointStringified(pathNodes.i[k][0],pathNodes.i[k][1]) + " "+matrixHelper.applyToPointStringified(pathNodes.v[k][0],pathNodes.v[k][1]);
        }
        shapeStr += " C"+matrixHelper.applyToPointStringified(pathNodes.o[k-1][0],pathNodes.o[k-1][1]) + " "+matrixHelper.applyToPointStringified(pathNodes.i[0][0],pathNodes.i[0][1]) + " "+matrixHelper.applyToPointStringified(pathNodes.v[0][0],pathNodes.v[0][1]);
        shapeStr += 'z';
    }
    return shapeStr;
};

ITextElement.prototype.getMeasures = function(){

    var matrixHelper = this.mHelper;
    var renderType = this.renderType;
    var data = this.data;
    var xPos,yPos;
    var i, len;
    var documentData = this.currentTextDocumentData;
    var letters = documentData.l;
    if(this.maskPath) {
        var mask = this.viewData.p.m;
        if(!this.viewData.p.n || this.viewData.p.mdf){
            var paths = mask.v;
            if(this.viewData.p.r){
                paths = reversePath(paths);
            }
            var pathInfo = {
                tLength: 0,
                segments: []
            };
            len = paths.v.length - 1;
            var pathData;
            var totalLength = 0;
            for (i = 0; i < len; i += 1) {
                pathData = {
                    s: paths.v[i],
                    e: paths.v[i + 1],
                    to: [paths.o[i][0] - paths.v[i][0], paths.o[i][1] - paths.v[i][1]],
                    ti: [paths.i[i + 1][0] - paths.v[i + 1][0], paths.i[i + 1][1] - paths.v[i + 1][1]]
                };
                bez.buildBezierData(pathData);
                pathInfo.tLength += pathData.bezierData.segmentLength;
                pathInfo.segments.push(pathData);
                totalLength += pathData.bezierData.segmentLength;
            }
            i = len;
            if (mask.v.c) {
                pathData = {
                    s: paths.v[i],
                    e: paths.v[0],
                    to: [paths.o[i][0] - paths.v[i][0], paths.o[i][1] - paths.v[i][1]],
                    ti: [paths.i[0][0] - paths.v[0][0], paths.i[0][1] - paths.v[0][1]]
                };
                bez.buildBezierData(pathData);
                pathInfo.tLength += pathData.bezierData.segmentLength;
                pathInfo.segments.push(pathData);
                totalLength += pathData.bezierData.segmentLength;
            }
            this.viewData.p.pi = pathInfo;
        }
        var pathInfo = this.viewData.p.pi;

        var currentLength = this.viewData.p.f.v, segmentInd = 0, pointInd = 1, currentPoint, prevPoint, points;
        var segmentLength = 0, flag = true;
        var segments = pathInfo.segments;
        if (currentLength < 0 && mask.v.c) {
            if (pathInfo.tLength < Math.abs(currentLength)) {
                currentLength = -Math.abs(currentLength) % pathInfo.tLength;
            }
            segmentInd = segments.length - 1;
            points = segments[segmentInd].bezierData.points;
            pointInd = points.length - 1;
            while (currentLength < 0) {
                currentLength += points[pointInd].partialLength;
                pointInd -= 1;
                if (pointInd < 0) {
                    segmentInd -= 1;
                    points = segments[segmentInd].bezierData.points;
                    pointInd = points.length - 1;
                }
            }

        }
        points = segments[segmentInd].bezierData.points;
        prevPoint = points[pointInd - 1];
        currentPoint = points[pointInd];
        var partialLength = currentPoint.partialLength;
        var perc, tanAngle;
    }


    len = letters.length;
    xPos = 0;
    yPos = 0;
    var yOff = documentData.s*1.2*.714;
    var firstLine = true;
    var renderedData = this.viewData, animatorProps, animatorSelector;
    var j, jLen;
    var lettersValue = Array.apply(null,{length:len}), letterValue;

    jLen = renderedData.a.length;
    var lastLetter;

    var mult, ind = -1, offf, xPathPos, yPathPos;
    var initPathPos = currentLength,initSegmentInd = segmentInd, initPointInd = pointInd, currentLine = -1;
    var elemOpacity;
    var sc,sw,fc,k;
    var lineLength = 0;
    var letterSw,letterSc,letterFc,letterM,letterP,letterO;
    for( i = 0; i < len; i += 1) {
        matrixHelper.reset();
        elemOpacity = 1;
        if(letters[i].n) {
            xPos = 0;
            yPos += documentData.yOffset;
            yPos += firstLine ? 1 : 0;
            currentLength = initPathPos ;
            firstLine = false;
            lineLength = 0;
            if(this.maskPath) {
                segmentInd = initSegmentInd;
                pointInd = initPointInd;
                points = segments[segmentInd].bezierData.points;
                prevPoint = points[pointInd - 1];
                currentPoint = points[pointInd];
                partialLength = currentPoint.partialLength;
                segmentLength = 0;
            }
            lettersValue[i] = this.emptyProp;
        }else{
            if(this.maskPath) {
                if(currentLine !== letters[i].line){
                    switch(documentData.j){
                        case 1:
                            currentLength += totalLength - documentData.lineWidths[letters[i].line];
                            break;
                        case 2:
                            currentLength += (totalLength - documentData.lineWidths[letters[i].line])/2;
                            break;
                    }
                    currentLine = letters[i].line;
                }
                if (ind !== letters[i].ind) {
                    if (letters[ind]) {
                        currentLength += letters[ind].extra;
                    }
                    currentLength += letters[i].an / 2;
                    ind = letters[i].ind;
                }
                currentLength += renderedData.m.a.v[0] * letters[i].an / 200;
                var animatorOffset = 0;
                for (j = 0; j < jLen; j += 1) {
                    animatorProps = renderedData.a[j].a;
                    if ('p' in animatorProps) {
                        animatorSelector = renderedData.a[j].s;
                        mult = animatorSelector.getMult(letters[i].anIndexes[j],data.t.a[j].s.totalChars);
                        if(mult.length){
                            animatorOffset += animatorProps.p.v[0] * mult[0];
                        } else{
                            animatorOffset += animatorProps.p.v[0] * mult;
                        }

                    }
                }
                flag = true;
                while (flag) {
                    if (segmentLength + partialLength >= currentLength + animatorOffset || !points) {
                        perc = (currentLength + animatorOffset - segmentLength) / currentPoint.partialLength;
                        xPathPos = prevPoint.point[0] + (currentPoint.point[0] - prevPoint.point[0]) * perc;
                        yPathPos = prevPoint.point[1] + (currentPoint.point[1] - prevPoint.point[1]) * perc;
                        matrixHelper.translate(0, -(renderedData.m.a.v[1] * yOff / 100) + yPos);
                        flag = false;
                    } else if (points) {
                        segmentLength += currentPoint.partialLength;
                        pointInd += 1;
                        if (pointInd >= points.length) {
                            pointInd = 0;
                            segmentInd += 1;
                            if (!segments[segmentInd]) {
                                if (mask.v.c) {
                                    pointInd = 0;
                                    segmentInd = 0;
                                    points = segments[segmentInd].bezierData.points;
                                } else {
                                    segmentLength -= currentPoint.partialLength;
                                    points = null;
                                }
                            } else {
                                points = segments[segmentInd].bezierData.points;
                            }
                        }
                        if (points) {
                            prevPoint = currentPoint;
                            currentPoint = points[pointInd];
                            partialLength = currentPoint.partialLength;
                        }
                    }
                }
                offf = letters[i].an / 2 - letters[i].add;
                matrixHelper.translate(-offf, 0, 0);
            } else {
                offf = letters[i].an/2 - letters[i].add;
                matrixHelper.translate(-offf,0,0);

                // Grouping alignment
                matrixHelper.translate(-renderedData.m.a.v[0]*letters[i].an/200, -renderedData.m.a.v[1]*yOff/100, 0);
            }

            lineLength += letters[i].l/2;
            for(j=0;j<jLen;j+=1){
                animatorProps = renderedData.a[j].a;
                if ('t' in animatorProps) {
                    animatorSelector = renderedData.a[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],data.t.a[j].s.totalChars);
                    if(this.maskPath) {
                        if(mult.length) {
                            currentLength += animatorProps.t*mult[0];
                        } else {
                            currentLength += animatorProps.t*mult;
                        }
                    }else{
                        if(mult.length) {
                            xPos += animatorProps.t.v*mult[0];
                        } else {
                            xPos += animatorProps.t.v*mult;
                        }
                    }
                }
            }
            lineLength += letters[i].l/2;
            if(documentData.strokeWidthAnim) {
                sw = documentData.sw || 0;
            }
            if(documentData.strokeColorAnim) {
                if(documentData.sc){
                    sc = [documentData.sc[0], documentData.sc[1], documentData.sc[2]];
                }else{
                    sc = [0,0,0];
                }
            }
            if(documentData.fillColorAnim) {
                fc = [documentData.fc[0], documentData.fc[1], documentData.fc[2]];
            }
            for(j=0;j<jLen;j+=1){
                animatorProps = renderedData.a[j].a;
                if ('a' in animatorProps) {
                    animatorSelector = renderedData.a[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],data.t.a[j].s.totalChars);

                    if(mult.length){
                        matrixHelper.translate(-animatorProps.a.v[0]*mult[0], -animatorProps.a.v[1]*mult[1], animatorProps.a.v[2]*mult[2]);
                    } else {
                        matrixHelper.translate(-animatorProps.a.v[0]*mult, -animatorProps.a.v[1]*mult, animatorProps.a.v[2]*mult);
                    }
                }
            }
            for(j=0;j<jLen;j+=1){
                animatorProps = renderedData.a[j].a;
                if ('s' in animatorProps) {
                    animatorSelector = renderedData.a[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],data.t.a[j].s.totalChars);
                    if(mult.length){
                        matrixHelper.scale(1+((animatorProps.s.v[0]-1)*mult[0]),1+((animatorProps.s.v[1]-1)*mult[1]),1);
                    } else {
                        matrixHelper.scale(1+((animatorProps.s.v[0]-1)*mult),1+((animatorProps.s.v[1]-1)*mult),1);
                    }
                }
            }
            for(j=0;j<jLen;j+=1) {
                animatorProps = renderedData.a[j].a;
                animatorSelector = renderedData.a[j].s;
                mult = animatorSelector.getMult(letters[i].anIndexes[j],data.t.a[j].s.totalChars);
                if ('sk' in animatorProps) {
                    if(mult.length) {
                        matrixHelper.skewFromAxis(-animatorProps.sk.v * mult[0], animatorProps.sa.v * mult[1]);
                    } else {
                        matrixHelper.skewFromAxis(-animatorProps.sk.v * mult, animatorProps.sa.v * mult);
                    }
                }
                if ('r' in animatorProps) {
                    if(mult.length) {
                        matrixHelper.rotateZ(-animatorProps.r.v * mult[2]);
                    } else {
                        matrixHelper.rotateZ(-animatorProps.r.v * mult);
                    }
                }
                if ('ry' in animatorProps) {

                    if(mult.length) {
                        matrixHelper.rotateY(animatorProps.ry.v*mult[1]);
                    }else{
                        matrixHelper.rotateY(animatorProps.ry.v*mult);
                    }
                }
                if ('rx' in animatorProps) {
                    if(mult.length) {
                        matrixHelper.rotateX(animatorProps.rx.v*mult[0]);
                    } else {
                        matrixHelper.rotateX(animatorProps.rx.v*mult);
                    }
                }
                if ('o' in animatorProps) {
                    if(mult.length) {
                        elemOpacity += ((animatorProps.o.v)*mult[0] - elemOpacity)*mult[0];
                    } else {
                        elemOpacity += ((animatorProps.o.v)*mult - elemOpacity)*mult;
                    }
                }
                if (documentData.strokeWidthAnim && 'sw' in animatorProps) {
                    if(mult.length) {
                        sw += animatorProps.sw.v*mult[0];
                    } else {
                        sw += animatorProps.sw.v*mult;
                    }
                }
                if (documentData.strokeColorAnim && 'sc' in animatorProps) {
                    for(k=0;k<3;k+=1){
                        if(mult.length) {
                            sc[k] = Math.round(255*(sc[k] + (animatorProps.sc.v[k] - sc[k])*mult[0]));
                        } else {
                            sc[k] = Math.round(255*(sc[k] + (animatorProps.sc.v[k] - sc[k])*mult));
                        }
                    }
                }
                if (documentData.fillColorAnim) {
                    if('fc' in animatorProps){
                        for(k=0;k<3;k+=1){
                            if(mult.length) {
                                fc[k] = fc[k] + (animatorProps.fc.v[k] - fc[k])*mult[0];
                            } else {
                                fc[k] = fc[k] + (animatorProps.fc.v[k] - fc[k])*mult;
                                //console.log('mult',mult);
                                //console.log(Math.round(fc[k] + (animatorProps.fc.v[k] - fc[k])*mult));
                            }
                        }
                    }
                    if('fh' in animatorProps){
                        if(mult.length) {
                            fc = addHueToRGB(fc,animatorProps.fh.v*mult[0]);
                        } else {
                            fc = addHueToRGB(fc,animatorProps.fh.v*mult);
                        }
                    }
                    if('fs' in animatorProps){
                        if(mult.length) {
                            fc = addSaturationToRGB(fc,animatorProps.fs.v*mult[0]);
                        } else {
                            fc = addSaturationToRGB(fc,animatorProps.fs.v*mult);
                        }
                    }
                    if('fb' in animatorProps){
                        if(mult.length) {
                            fc = addBrightnessToRGB(fc,animatorProps.fb.v*mult[0]);
                        } else {
                            fc = addBrightnessToRGB(fc,animatorProps.fb.v*mult);
                        }
                    }
                }
            }

            for(j=0;j<jLen;j+=1){
                animatorProps = renderedData.a[j].a;

                if ('p' in animatorProps) {
                    animatorSelector = renderedData.a[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],data.t.a[j].s.totalChars);
                    if(this.maskPath) {
                        if(mult.length) {
                            matrixHelper.translate(0, animatorProps.p.v[1] * mult[0], -animatorProps.p.v[2] * mult[1]);
                        } else {
                            matrixHelper.translate(0, animatorProps.p.v[1] * mult, -animatorProps.p.v[2] * mult);
                        }
                    }else{

                        if(mult.length) {
                            matrixHelper.translate(animatorProps.p.v[0] * mult[0], animatorProps.p.v[1] * mult[1], -animatorProps.p.v[2] * mult[2]);
                        } else {
                            matrixHelper.translate(animatorProps.p.v[0] * mult, animatorProps.p.v[1] * mult, -animatorProps.p.v[2] * mult);
                        }
                    }
                }
            }
            if(documentData.strokeWidthAnim){
                letterSw = sw < 0 ? 0 : sw;
            }
            if(documentData.strokeColorAnim){
                letterSc = 'rgb('+Math.round(sc[0]*255)+','+Math.round(sc[1]*255)+','+Math.round(sc[2]*255)+')';
            }
            if(documentData.fillColorAnim){
                letterFc = 'rgb('+Math.round(fc[0]*255)+','+Math.round(fc[1]*255)+','+Math.round(fc[2]*255)+')';
            }

            if(this.maskPath) {
                if (data.t.p.p) {
                    tanAngle = (currentPoint.point[1] - prevPoint.point[1]) / (currentPoint.point[0] - prevPoint.point[0]);
                    var rot = Math.atan(tanAngle) * 180 / Math.PI;
                    if (currentPoint.point[0] < prevPoint.point[0]) {
                        rot += 180;
                    }
                    matrixHelper.rotate(-rot * Math.PI / 180);
                }
                matrixHelper.translate(xPathPos, yPathPos, 0);
                matrixHelper.translate(renderedData.m.a.v[0]*letters[i].an/200, renderedData.m.a.v[1]*yOff/100,0);
                currentLength -= renderedData.m.a.v[0]*letters[i].an/200;
                if(letters[i+1] && ind !== letters[i+1].ind){
                    currentLength += letters[i].an / 2;
                    currentLength += documentData.tr/1000*documentData.s;
                }
            }else{

                matrixHelper.translate(xPos,yPos,0);

                if(documentData.ps){
                    //matrixHelper.translate(documentData.ps[0],documentData.ps[1],0);
                    matrixHelper.translate(documentData.ps[0],documentData.ps[1] + documentData.ascent,0);
                }
                switch(documentData.j){
                    case 1:
                        matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[letters[i].line]),0,0);
                        break;
                    case 2:
                        matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[letters[i].line])/2,0,0);
                        break;
                }
                matrixHelper.translate(offf,0,0);
                matrixHelper.translate(renderedData.m.a.v[0]*letters[i].an/200,renderedData.m.a.v[1]*yOff/100,0);
                xPos += letters[i].l + documentData.tr/1000*documentData.s;
            }
            if(renderType === 'html'){
                letterM = matrixHelper.toCSS();
            }else if(renderType === 'svg'){
                letterM = matrixHelper.to2dCSS();
            }else{
                letterP = [matrixHelper.props[0],matrixHelper.props[1],matrixHelper.props[2],matrixHelper.props[3],matrixHelper.props[4],matrixHelper.props[5],matrixHelper.props[6],matrixHelper.props[7],matrixHelper.props[8],matrixHelper.props[9],matrixHelper.props[10],matrixHelper.props[11],matrixHelper.props[12],matrixHelper.props[13],matrixHelper.props[14],matrixHelper.props[15]];
            }
            letterO = elemOpacity;

            lastLetter = this.renderedLetters[i];
            if(lastLetter && (lastLetter.o !== letterO || lastLetter.sw !== letterSw || lastLetter.sc !== letterSc || lastLetter.fc !== letterFc)){
                this.lettersChangedFlag = true;
                letterValue = new LetterProps(letterO,letterSw,letterSc,letterFc,letterM,letterP);
            }else{
                if((renderType === 'svg' || renderType === 'html') && (!lastLetter || lastLetter.m !== letterM)){
                    this.lettersChangedFlag = true;
                    letterValue = new LetterProps(letterO,letterSw,letterSc,letterFc,letterM);
                }else if(renderType === 'canvas' && (!lastLetter || (lastLetter.props[0] !== letterP[0] || lastLetter.props[1] !== letterP[1] || lastLetter.props[4] !== letterP[4] || lastLetter.props[5] !== letterP[5] || lastLetter.props[12] !== letterP[12] || lastLetter.props[13] !== letterP[13]))){
                    this.lettersChangedFlag = true;
                    letterValue = new LetterProps(letterO,letterSw,letterSc,letterFc,null,letterP);
                } else {
                    letterValue = lastLetter;
                }
            }
            this.renderedLetters[i] = letterValue;
        }
    }
};

ITextElement.prototype.emptyProp = new LetterProps();

function SVGTextElement(data,parentContainer,globalData,comp, placeholder){
    this.textSpans = [];
    this.renderType = 'svg';
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(SVGBaseElement, SVGTextElement);

SVGTextElement.prototype.init = ITextElement.prototype.init;
SVGTextElement.prototype.createPathShape = ITextElement.prototype.createPathShape;
SVGTextElement.prototype.getMeasures = ITextElement.prototype.getMeasures;
SVGTextElement.prototype.prepareFrame = ITextElement.prototype.prepareFrame;

SVGTextElement.prototype.createElements = function(){

    this._parent.createElements.call(this);


    if(this.data.ln){
        this.layerElement.setAttribute('id',this.data.ln);
    }
    if(this.data.cl){
        this.layerElement.setAttribute('class',this.data.cl);
    }
};

SVGTextElement.prototype.buildNewText = function(){
    var i, len;

    var documentData = this.currentTextDocumentData;
    this.renderedLetters = Array.apply(null,{length:this.currentTextDocumentData.l ? this.currentTextDocumentData.l.length : 0});
    if(documentData.fc) {
        this.layerElement.setAttribute('fill', 'rgb(' + Math.round(documentData.fc[0]*255) + ',' + Math.round(documentData.fc[1]*255) + ',' + Math.round(documentData.fc[2]*255) + ')');
    }else{
        this.layerElement.setAttribute('fill', 'rgba(0,0,0,0)');
    }
    if(documentData.sc){
        this.layerElement.setAttribute('stroke', 'rgb(' + Math.round(documentData.sc[0]*255) + ',' + Math.round(documentData.sc[1]*255) + ',' + Math.round(documentData.sc[2]*255) + ')');
        this.layerElement.setAttribute('stroke-width', documentData.sw);
    }
    this.layerElement.setAttribute('font-size', documentData.s);
    var fontData = this.globalData.fontManager.getFontByName(documentData.f);
    if(fontData.fClass){
        this.layerElement.setAttribute('class',fontData.fClass);
    } else {
        this.layerElement.setAttribute('font-family', fontData.fFamily);
        var fWeight = documentData.fWeight, fStyle = documentData.fStyle;
        this.layerElement.setAttribute('font-style', fStyle);
        this.layerElement.setAttribute('font-weight', fWeight);
    }



    var letters = documentData.l || [];
    len = letters.length;
    if(!len){
        return;
    }
    var tSpan;
    var matrixHelper = this.mHelper;
    var shapes, shapeStr = '', singleShape = this.data.singleShape;
    if (singleShape) {
        var xPos = 0, yPos = 0, lineWidths = documentData.lineWidths, boxWidth = documentData.boxWidth, firstLine = true;
    }
    var cnt = 0;
    for (i = 0;i < len ;i += 1) {
        if(this.globalData.fontManager.chars){
            if(!singleShape || i === 0){
                tSpan = this.textSpans[cnt] ? this.textSpans[cnt] : document.createElementNS(svgNS,'path');
            }
        }else{
            tSpan = this.textSpans[cnt] ? this.textSpans[cnt] : document.createElementNS(svgNS,'text');
        }
        tSpan.style.display = 'inherit';
        tSpan.setAttribute('stroke-linecap', 'butt');
        tSpan.setAttribute('stroke-linejoin','round');
        tSpan.setAttribute('stroke-miterlimit','4');
        //tSpan.setAttribute('visibility', 'hidden');
        if(singleShape && letters[i].n) {
            xPos = 0;
            yPos += documentData.yOffset;
            yPos += firstLine ? 1 : 0;
            firstLine = false;
        }
        matrixHelper.reset();
        if(this.globalData.fontManager.chars) {
            matrixHelper.scale(documentData.s / 100, documentData.s / 100);
        }
        if (singleShape) {
            if(documentData.ps){
                matrixHelper.translate(documentData.ps[0],documentData.ps[1] + documentData.ascent,0);
            }
            switch(documentData.j){
                case 1:
                    matrixHelper.translate(documentData.justifyOffset + (boxWidth - lineWidths[letters[i].line]),0,0);
                    break;
                case 2:
                    matrixHelper.translate(documentData.justifyOffset + (boxWidth - lineWidths[letters[i].line])/2,0,0);
                    break;
            }
            matrixHelper.translate(xPos, yPos, 0);
        }
        if(this.globalData.fontManager.chars){
            var charData = this.globalData.fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
            var shapeData;
            if(charData){
                shapeData = charData.data;
            } else {
                shapeData = null;
            }
            if(shapeData && shapeData.shapes){
                shapes = shapeData.shapes[0].it;
                if(!singleShape){
                    shapeStr = '';
                }
                shapeStr += this.createPathShape(matrixHelper,shapes);
                if(!singleShape){

                    tSpan.setAttribute('d',shapeStr);
                }
            }
            if(!singleShape){
                this.layerElement.appendChild(tSpan);
            }
        }else{
            tSpan.textContent = letters[i].val;
            tSpan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve");
            this.layerElement.appendChild(tSpan);
            if(singleShape){
                tSpan.setAttribute('transform',matrixHelper.to2dCSS());
            }
        }
        if(singleShape) {
            xPos += letters[i].l;
            xPos += documentData.tr/1000*documentData.s;
        }
        //
        this.textSpans[cnt] = tSpan;
        cnt += 1;
    }
    if(!singleShape){
        while(cnt < this.textSpans.length){
            this.textSpans[cnt].style.display = 'none';
            cnt += 1;
        }
    }
    if(singleShape && this.globalData.fontManager.chars){
        tSpan.setAttribute('d',shapeStr);
        this.layerElement.appendChild(tSpan);
    }
}

SVGTextElement.prototype.hide = function(){
    if(!this.hidden){
        this.layerElement.style.display = 'none';
        this.hidden = true;
    }
};

SVGTextElement.prototype.renderFrame = function(parentMatrix){

    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    if(this.hidden){
        this.hidden = false;
        this.layerElement.style.display = 'block';
    }

    if(this.data.singleShape){
        return;
    }
    this.getMeasures();
    if(!this.lettersChangedFlag){
        return;
    }
    var  i,len;
    var renderedLetters = this.renderedLetters;

    var letters = this.currentTextDocumentData.l;

    len = letters.length;
    var renderedLetter;
    for(i=0;i<len;i+=1){
        if(letters[i].n){
            continue;
        }
        renderedLetter = renderedLetters[i];
        this.textSpans[i].setAttribute('transform',renderedLetter.m);
        this.textSpans[i].setAttribute('opacity',renderedLetter.o);
        if(renderedLetter.sw){
            this.textSpans[i].setAttribute('stroke-width',renderedLetter.sw);
        }
        if(renderedLetter.sc){
            this.textSpans[i].setAttribute('stroke',renderedLetter.sc);
        }
        if(renderedLetter.fc){
            this.textSpans[i].setAttribute('fill',renderedLetter.fc);
        }
    }
    if(this.firstFrame) {
        this.firstFrame = false;
    }
}


SVGTextElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
};
function SVGTintFilter(filter, filterManager){
    this.filterManager = filterManager;
    var feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','linearRGB');
    feColorMatrix.setAttribute('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result','f1');
    filter.appendChild(feColorMatrix);
    feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
    feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result','f2');
    filter.appendChild(feColorMatrix);
    this.matrixFilter = feColorMatrix;
    if(filterManager.effectElements[2].p.v !== 100 || filterManager.effectElements[2].p.k){
        var feMerge = document.createElementNS(svgNS,'feMerge');
        filter.appendChild(feMerge);
        var feMergeNode;
        feMergeNode = document.createElementNS(svgNS,'feMergeNode');
        feMergeNode.setAttribute('in','SourceGraphic');
        feMerge.appendChild(feMergeNode);
        feMergeNode = document.createElementNS(svgNS,'feMergeNode');
        feMergeNode.setAttribute('in','f2');
        feMerge.appendChild(feMergeNode);
    }
}

SVGTintFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var colorBlack = this.filterManager.effectElements[0].p.v;
        var colorWhite = this.filterManager.effectElements[1].p.v;
        var opacity = this.filterManager.effectElements[2].p.v/100;
        this.matrixFilter.setAttribute('values',(colorWhite[0]- colorBlack[0])+' 0 0 0 '+ colorBlack[0] +' '+ (colorWhite[1]- colorBlack[1]) +' 0 0 0 '+ colorBlack[1] +' '+ (colorWhite[2]- colorBlack[2]) +' 0 0 0 '+ colorBlack[2] +' 0 0 0 ' + opacity + ' 0');
    }
};
function SVGFillFilter(filter, filterManager){
    this.filterManager = filterManager;
    var feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
    feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    filter.appendChild(feColorMatrix);
    this.matrixFilter = feColorMatrix;
}
SVGFillFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var color = this.filterManager.effectElements[2].p.v;
        var opacity = this.filterManager.effectElements[6].p.v;
        this.matrixFilter.setAttribute('values','0 0 0 0 '+color[0]+' 0 0 0 0 '+color[1]+' 0 0 0 0 '+color[2]+' 0 0 0 '+opacity+' 0');
    }
};
function SVGStrokeEffect(elem, filterManager){
    this.initialized = false;
    this.filterManager = filterManager;
    this.elem = elem;
    this.paths = [];
}

SVGStrokeEffect.prototype.initialize = function(){

    var elemChildren = this.elem.layerElement.children || this.elem.layerElement.childNodes;
    var path,groupPath, i, len;
    if(this.filterManager.effectElements[1].p.v === 1){
        len = this.elem.maskManager.masksProperties.length;
        i = 0;
    } else {
        i = this.filterManager.effectElements[0].p.v - 1;
        len = i + 1;
    }
    groupPath = document.createElementNS(svgNS,'g'); 
    groupPath.setAttribute('fill','none');
    groupPath.setAttribute('stroke-linecap','round');
    groupPath.setAttribute('stroke-dashoffset',1);
    for(i;i<len;i+=1){
        path = document.createElementNS(svgNS,'path');
        groupPath.appendChild(path);
        this.paths.push({p:path,m:i});
    }
    if(this.filterManager.effectElements[10].p.v === 3){
        var mask = document.createElementNS(svgNS,'mask');
        var id = 'stms_' + randomString(10);
        mask.setAttribute('id',id);
        mask.setAttribute('mask-type','alpha');
        mask.appendChild(groupPath);
        this.elem.globalData.defs.appendChild(mask);
        var g = document.createElementNS(svgNS,'g');
        g.setAttribute('mask','url(#'+id+')');
        if(elemChildren[0]){
            g.appendChild(elemChildren[0]);
        }
        this.elem.layerElement.appendChild(g);
        this.masker = mask;
        groupPath.setAttribute('stroke','#fff');
    } else if(this.filterManager.effectElements[10].p.v === 1 || this.filterManager.effectElements[10].p.v === 2){
        if(this.filterManager.effectElements[10].p.v === 2){
            var elemChildren = this.elem.layerElement.children || this.elem.layerElement.childNodes;
            while(elemChildren.length){
                this.elem.layerElement.removeChild(elemChildren[0]);
            }
        }
        this.elem.layerElement.appendChild(groupPath);
        this.elem.layerElement.removeAttribute('mask');
        groupPath.setAttribute('stroke','#fff');
    }
    this.initialized = true;
    this.pathMasker = groupPath;
}

SVGStrokeEffect.prototype.renderFrame = function(forceRender){
    if(!this.initialized){
        this.initialize();
    }
    var i, len = this.paths.length;
    var mask, path;
    for(i=0;i<len;i+=1){
        mask = this.elem.maskManager.viewData[this.paths[i].m];
        path = this.paths[i].p;
        if(forceRender || this.filterManager.mdf || mask.prop.mdf){
            path.setAttribute('d',mask.lastPath);
        }
        if(forceRender || this.filterManager.effectElements[9].p.mdf || this.filterManager.effectElements[4].p.mdf || this.filterManager.effectElements[7].p.mdf || this.filterManager.effectElements[8].p.mdf || mask.prop.mdf){
            var dasharrayValue;
            if(this.filterManager.effectElements[7].p.v !== 0 || this.filterManager.effectElements[8].p.v !== 100){
                var s = Math.min(this.filterManager.effectElements[7].p.v,this.filterManager.effectElements[8].p.v)/100;
                var e = Math.max(this.filterManager.effectElements[7].p.v,this.filterManager.effectElements[8].p.v)/100;
                var l = path.getTotalLength();
                dasharrayValue = '0 0 0 ' + l*s + ' ';
                var lineLength = l*(e-s);
                var segment = 1+this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v/100;
                var units = Math.floor(lineLength/segment);
                var j;
                for(j=0;j<units;j+=1){
                    dasharrayValue += '1 ' + this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v/100 + ' ';
                }
                dasharrayValue += '0 ' + l*10 + ' 0 0';
            } else {
                dasharrayValue = '1 ' + this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v/100;
            }
            path.setAttribute('stroke-dasharray',dasharrayValue);
        }
    }
    if(forceRender || this.filterManager.effectElements[4].p.mdf){
        this.pathMasker.setAttribute('stroke-width',this.filterManager.effectElements[4].p.v*2);
    }
    
    if(forceRender || this.filterManager.effectElements[6].p.mdf){
        this.pathMasker.setAttribute('opacity',this.filterManager.effectElements[6].p.v);
    }
    if(this.filterManager.effectElements[10].p.v === 1 || this.filterManager.effectElements[10].p.v === 2){
        if(forceRender || this.filterManager.effectElements[3].p.mdf){
            var color = this.filterManager.effectElements[3].p.v;
            this.pathMasker.setAttribute('stroke','rgb('+bm_floor(color[0]*255)+','+bm_floor(color[1]*255)+','+bm_floor(color[2]*255)+')');
        }
    }
};
function SVGTritoneFilter(filter, filterManager){
    this.filterManager = filterManager;
    var feColorMatrix = document.createElementNS(svgNS,'feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','linearRGB');
    feColorMatrix.setAttribute('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result','f1');
    filter.appendChild(feColorMatrix);
    var feComponentTransfer = document.createElementNS(svgNS,'feComponentTransfer');
    feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');
    filter.appendChild(feComponentTransfer);
    this.matrixFilter = feComponentTransfer;
    var feFuncR = document.createElementNS(svgNS,'feFuncR');
    feFuncR.setAttribute('type','table');
    feComponentTransfer.appendChild(feFuncR);
    this.feFuncR = feFuncR;
    var feFuncG = document.createElementNS(svgNS,'feFuncG');
    feFuncG.setAttribute('type','table');
    feComponentTransfer.appendChild(feFuncG);
    this.feFuncG = feFuncG;
    var feFuncB = document.createElementNS(svgNS,'feFuncB');
    feFuncB.setAttribute('type','table');
    feComponentTransfer.appendChild(feFuncB);
    this.feFuncB = feFuncB;
}

SVGTritoneFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var color1 = this.filterManager.effectElements[0].p.v;
        var color2 = this.filterManager.effectElements[1].p.v;
        var color3 = this.filterManager.effectElements[2].p.v;
        var tableR = color3[0] + ' ' + color2[0] + ' ' + color1[0]
        var tableG = color3[1] + ' ' + color2[1] + ' ' + color1[1]
        var tableB = color3[2] + ' ' + color2[2] + ' ' + color1[2]
        this.feFuncR.setAttribute('tableValues', tableR);
        this.feFuncG.setAttribute('tableValues', tableG);
        this.feFuncB.setAttribute('tableValues', tableB);
        //var opacity = this.filterManager.effectElements[2].p.v/100;
        //this.matrixFilter.setAttribute('values',(colorWhite[0]- colorBlack[0])+' 0 0 0 '+ colorBlack[0] +' '+ (colorWhite[1]- colorBlack[1]) +' 0 0 0 '+ colorBlack[1] +' '+ (colorWhite[2]- colorBlack[2]) +' 0 0 0 '+ colorBlack[2] +' 0 0 0 ' + opacity + ' 0');
    }
};
function SVGProLevelsFilter(filter, filterManager){
    this.filterManager = filterManager;
    var effectElements = this.filterManager.effectElements;
    var feComponentTransfer = document.createElementNS(svgNS,'feComponentTransfer');
    var feFuncR, feFuncG, feFuncB;
    
    if(effectElements[9].p.k || effectElements[9].p.v !== 0 || effectElements[10].p.k || effectElements[10].p.v !== 1 || effectElements[11].p.k || effectElements[11].p.v !== 1 || effectElements[12].p.k || effectElements[12].p.v !== 0 || effectElements[13].p.k || effectElements[13].p.v !== 1){
        this.feFuncR = this.createFeFunc('feFuncR', feComponentTransfer);
    }
    if(effectElements[16].p.k || effectElements[16].p.v !== 0 || effectElements[17].p.k || effectElements[17].p.v !== 1 || effectElements[18].p.k || effectElements[18].p.v !== 1 || effectElements[19].p.k || effectElements[19].p.v !== 0 || effectElements[20].p.k || effectElements[20].p.v !== 1){
        this.feFuncG = this.createFeFunc('feFuncG', feComponentTransfer);
    }
    if(effectElements[23].p.k || effectElements[23].p.v !== 0 || effectElements[24].p.k || effectElements[24].p.v !== 1 || effectElements[25].p.k || effectElements[25].p.v !== 1 || effectElements[26].p.k || effectElements[26].p.v !== 0 || effectElements[27].p.k || effectElements[27].p.v !== 1){
        this.feFuncB = this.createFeFunc('feFuncB', feComponentTransfer);
    }
    if(effectElements[30].p.k || effectElements[30].p.v !== 0 || effectElements[31].p.k || effectElements[31].p.v !== 1 || effectElements[32].p.k || effectElements[32].p.v !== 1 || effectElements[33].p.k || effectElements[33].p.v !== 0 || effectElements[34].p.k || effectElements[34].p.v !== 1){
        this.feFuncA = this.createFeFunc('feFuncA', feComponentTransfer);
    }
    
    if(this.feFuncR || this.feFuncG || this.feFuncB || this.feFuncA){
        feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');
        filter.appendChild(feComponentTransfer);
        feComponentTransfer = document.createElementNS(svgNS,'feComponentTransfer');
    }

    if(effectElements[2].p.k || effectElements[2].p.v !== 0 || effectElements[3].p.k || effectElements[3].p.v !== 1 || effectElements[4].p.k || effectElements[4].p.v !== 1 || effectElements[5].p.k || effectElements[5].p.v !== 0 || effectElements[6].p.k || effectElements[6].p.v !== 1){

        feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');
        filter.appendChild(feComponentTransfer);
        this.feFuncRComposed = this.createFeFunc('feFuncR', feComponentTransfer);
        this.feFuncGComposed = this.createFeFunc('feFuncG', feComponentTransfer);
        this.feFuncBComposed = this.createFeFunc('feFuncB', feComponentTransfer);
    }
}

SVGProLevelsFilter.prototype.createFeFunc = function(type, feComponentTransfer) {
    var feFunc = document.createElementNS(svgNS,type);
    feFunc.setAttribute('type','table');
    feComponentTransfer.appendChild(feFunc);
    return feFunc;
};

SVGProLevelsFilter.prototype.getTableValue = function(inputBlack, inputWhite, gamma, outputBlack, outputWhite) {
    var cnt = 0;
    var segments = 256;
    var perc;
    var min = Math.min(inputBlack, inputWhite);
    var max = Math.max(inputBlack, inputWhite);
    var table = Array.call(null,{length:segments});
    var colorValue;
    var pos = 0;
    var outputDelta = outputWhite - outputBlack; 
    var inputDelta = inputWhite - inputBlack; 
    while(cnt <= 256) {
        perc = cnt/256;
        if(perc <= min){
            colorValue = inputDelta < 0 ? outputWhite : outputBlack;
        } else if(perc >= max){
            colorValue = inputDelta < 0 ? outputBlack : outputWhite;
        } else {
            colorValue = (outputBlack + outputDelta * Math.pow((perc - inputBlack) / inputDelta, 1 / gamma));
        }
        table[pos++] = colorValue;
        cnt += 256/(segments-1);
    }
    return table.join(' ');
};

SVGProLevelsFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var val, cnt, perc, bezier;
        var effectElements = this.filterManager.effectElements;
        if(this.feFuncRComposed && (forceRender || effectElements[2].p.mdf || effectElements[3].p.mdf || effectElements[4].p.mdf || effectElements[5].p.mdf || effectElements[6].p.mdf)){
            val = this.getTableValue(effectElements[2].p.v,effectElements[3].p.v,effectElements[4].p.v,effectElements[5].p.v,effectElements[6].p.v);
            this.feFuncRComposed.setAttribute('tableValues',val);
            this.feFuncGComposed.setAttribute('tableValues',val);
            this.feFuncBComposed.setAttribute('tableValues',val);
        }

        if(this.feFuncR && (forceRender || effectElements[9].p.mdf || effectElements[10].p.mdf || effectElements[11].p.mdf || effectElements[12].p.mdf || effectElements[13].p.mdf)){
            val = this.getTableValue(effectElements[9].p.v,effectElements[10].p.v,effectElements[11].p.v,effectElements[12].p.v,effectElements[13].p.v);
            this.feFuncR.setAttribute('tableValues',val);
        }

        if(this.feFuncG && (forceRender || effectElements[16].p.mdf || effectElements[17].p.mdf || effectElements[18].p.mdf || effectElements[19].p.mdf || effectElements[20].p.mdf)){
            val = this.getTableValue(effectElements[16].p.v,effectElements[17].p.v,effectElements[18].p.v,effectElements[19].p.v,effectElements[20].p.v);
            this.feFuncG.setAttribute('tableValues',val);
        }

        if(this.feFuncB && (forceRender || effectElements[23].p.mdf || effectElements[24].p.mdf || effectElements[25].p.mdf || effectElements[26].p.mdf || effectElements[27].p.mdf)){
            val = this.getTableValue(effectElements[23].p.v,effectElements[24].p.v,effectElements[25].p.v,effectElements[26].p.v,effectElements[27].p.v);
            this.feFuncB.setAttribute('tableValues',val);
        }

        if(this.feFuncA && (forceRender || effectElements[30].p.mdf || effectElements[31].p.mdf || effectElements[32].p.mdf || effectElements[33].p.mdf || effectElements[34].p.mdf)){
            val = this.getTableValue(effectElements[30].p.v,effectElements[31].p.v,effectElements[32].p.v,effectElements[33].p.v,effectElements[34].p.v);
            this.feFuncA.setAttribute('tableValues',val);
        }
        
    }
};
function SVGDropShadowEffect(filter, filterManager){
    /*<feGaussianBlur in="SourceAlpha" stdDeviation="3"/> <!-- stdDeviation is how much to blur -->
  <feOffset dx="2" dy="2" result="offsetblur"/> <!-- how much to offset -->
  <feMerge> 
    <feMergeNode/> <!-- this contains the offset blurred image -->
    <feMergeNode in="SourceGraphic"/> <!-- this contains the element that the filter is applied to -->
  </feMerge>*/
  /*<feFlood flood-color="#3D4574" flood-opacity="0.5" result="offsetColor"/>*/
    filter.setAttribute('x','-100%');
    filter.setAttribute('y','-100%');
    filter.setAttribute('width','400%');
    filter.setAttribute('height','400%');
    this.filterManager = filterManager;

    var feGaussianBlur = document.createElementNS(svgNS,'feGaussianBlur');
    feGaussianBlur.setAttribute('in','SourceAlpha');
    feGaussianBlur.setAttribute('result','drop_shadow_1');
    feGaussianBlur.setAttribute('stdDeviation','0');
    this.feGaussianBlur = feGaussianBlur;
    filter.appendChild(feGaussianBlur);

    var feOffset = document.createElementNS(svgNS,'feOffset');
    feOffset.setAttribute('dx','25');
    feOffset.setAttribute('dy','0');
    feOffset.setAttribute('in','drop_shadow_1');
    feOffset.setAttribute('result','drop_shadow_2');
    this.feOffset = feOffset;
    filter.appendChild(feOffset);
    var feFlood = document.createElementNS(svgNS,'feFlood');
    feFlood.setAttribute('flood-color','#00ff00');
    feFlood.setAttribute('flood-opacity','1');
    feFlood.setAttribute('result','drop_shadow_3');
    this.feFlood = feFlood;
    filter.appendChild(feFlood);

    var feComposite = document.createElementNS(svgNS,'feComposite');
    feComposite.setAttribute('in','drop_shadow_3');
    feComposite.setAttribute('in2','drop_shadow_2');
    feComposite.setAttribute('operator','in');
    feComposite.setAttribute('result','drop_shadow_4');
    filter.appendChild(feComposite);


    var feMerge = document.createElementNS(svgNS,'feMerge');
    filter.appendChild(feMerge);
    var feMergeNode;
    feMergeNode = document.createElementNS(svgNS,'feMergeNode');
    feMerge.appendChild(feMergeNode);
    feMergeNode = document.createElementNS(svgNS,'feMergeNode');
    feMergeNode.setAttribute('in','SourceGraphic');
    this.feMergeNode = feMergeNode;
    this.feMerge = feMerge;
    this.originalNodeAdded = false;
    feMerge.appendChild(feMergeNode);
}

SVGDropShadowEffect.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        if(forceRender || this.filterManager.effectElements[4].p.mdf){
            this.feGaussianBlur.setAttribute('stdDeviation', this.filterManager.effectElements[4].p.v / 4);
        }
        if(forceRender || this.filterManager.effectElements[0].p.mdf){
            var col = this.filterManager.effectElements[0].p.v;
            this.feFlood.setAttribute('flood-color',rgbToHex(Math.round(col[0]*255),Math.round(col[1]*255),Math.round(col[2]*255)));
        }
        if(forceRender || this.filterManager.effectElements[1].p.mdf){
            this.feFlood.setAttribute('flood-opacity',this.filterManager.effectElements[1].p.v/255);
        }
        if(forceRender || this.filterManager.effectElements[2].p.mdf || this.filterManager.effectElements[3].p.mdf){
            var distance = this.filterManager.effectElements[3].p.v
            var angle = (this.filterManager.effectElements[2].p.v - 90) * degToRads
            var x = distance * Math.cos(angle)
            var y = distance * Math.sin(angle)
            this.feOffset.setAttribute('dx', x);
            this.feOffset.setAttribute('dy', y);
        }
        /*if(forceRender || this.filterManager.effectElements[5].p.mdf){
            if(this.filterManager.effectElements[5].p.v === 1 && this.originalNodeAdded) {
                this.feMerge.removeChild(this.feMergeNode);
                this.originalNodeAdded = false;
            } else if(this.filterManager.effectElements[5].p.v === 0 && !this.originalNodeAdded) {
                this.feMerge.appendChild(this.feMergeNode);
                this.originalNodeAdded = true;
            }
        }*/
    }
};
function SVGEffects(elem){
    var i, len = elem.data.ef.length;
    var filId = randomString(10);
    var fil = filtersFactory.createFilter(filId);
    var count = 0;
    this.filters = [];
    var filterManager;
    for(i=0;i<len;i+=1){
        if(elem.data.ef[i].ty === 20){
            count += 1;
            filterManager = new SVGTintFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 21){
            count += 1;
            filterManager = new SVGFillFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 22){
            filterManager = new SVGStrokeEffect(elem, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 23){
            count += 1;
            filterManager = new SVGTritoneFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 24){
            count += 1;
            filterManager = new SVGProLevelsFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 25){
            count += 1;
            filterManager = new SVGDropShadowEffect(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }
    }
    if(count){
        elem.globalData.defs.appendChild(fil);
        elem.layerElement.setAttribute('filter','url(#'+filId+')');
    }
}

SVGEffects.prototype.renderFrame = function(firstFrame){
    var i, len = this.filters.length;
    for(i=0;i<len;i+=1){
        this.filters[i].renderFrame(firstFrame);
    }
};
function ICompElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
    this.layers = data.layers;
    this.supports3d = true;
    this.completeLayers = false;
    this.pendingElements = [];
    this.elements = this.layers ? Array.apply(null,{length:this.layers.length}) : [];
    if(this.data.tm){
        this.tm = PropertyFactory.getProp(this,this.data.tm,0,globalData.frameRate,this.dynamicProperties);
    }
    if(this.data.xt){
        this.layerElement = document.createElementNS(svgNS,'g');
        this.buildAllItems();
    } else if(!globalData.progressiveLoad){
        this.buildAllItems();
    }
}
createElement(SVGBaseElement, ICompElement);

ICompElement.prototype.hide = function(){
    if(!this.hidden){
        var i,len = this.elements.length;
        for( i = 0; i < len; i+=1 ){
            if(this.elements[i]){
                this.elements[i].hide();
            }
        }
        this.hidden = true;
    }
};

ICompElement.prototype.prepareFrame = function(num){
    this._parent.prepareFrame.call(this,num);
    if(this.isVisible===false && !this.data.xt){
        return;
    }

    if(this.tm){
        var timeRemapped = this.tm.v;
        if(timeRemapped === this.data.op){
            timeRemapped = this.data.op - 1;
        }
        this.renderedFrame = timeRemapped;
    } else {
        this.renderedFrame = num/this.data.sr;
    }
    var i,len = this.elements.length;
    if(!this.completeLayers){
        this.checkLayers(this.renderedFrame);
    }
    for( i = 0; i < len; i+=1 ){
        if(this.completeLayers || this.elements[i]){
            this.elements[i].prepareFrame(this.renderedFrame - this.layers[i].st);
        }
    }
};

ICompElement.prototype.renderFrame = function(parentMatrix){
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    var i,len = this.layers.length;
    if(renderParent===false){
        this.hide();
        return;
    }

    this.hidden = false;
    for( i = 0; i < len; i+=1 ){
        if(this.completeLayers || this.elements[i]){
            this.elements[i].renderFrame();
        }
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
};

ICompElement.prototype.setElements = function(elems){
    this.elements = elems;
};

ICompElement.prototype.getElements = function(){
    return this.elements;
};

ICompElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
    var i,len = this.layers.length;
    for( i = 0; i < len; i+=1 ){
        if(this.elements[i]){
            this.elements[i].destroy();
        }
    }
};

ICompElement.prototype.checkLayers = SVGRenderer.prototype.checkLayers;
ICompElement.prototype.buildItem = SVGRenderer.prototype.buildItem;
ICompElement.prototype.buildAllItems = SVGRenderer.prototype.buildAllItems;
ICompElement.prototype.buildElementParenting = SVGRenderer.prototype.buildElementParenting;
ICompElement.prototype.createItem = SVGRenderer.prototype.createItem;
ICompElement.prototype.createImage = SVGRenderer.prototype.createImage;
ICompElement.prototype.createComp = SVGRenderer.prototype.createComp;
ICompElement.prototype.createSolid = SVGRenderer.prototype.createSolid;
ICompElement.prototype.createShape = SVGRenderer.prototype.createShape;
ICompElement.prototype.createText = SVGRenderer.prototype.createText;
ICompElement.prototype.createBase = SVGRenderer.prototype.createBase;
ICompElement.prototype.appendElementInPos = SVGRenderer.prototype.appendElementInPos;
ICompElement.prototype.checkPendingElements = SVGRenderer.prototype.checkPendingElements;
ICompElement.prototype.addPendingElement = SVGRenderer.prototype.addPendingElement;
function IImageElement(data,parentContainer,globalData,comp,placeholder){
    this.assetData = globalData.getAssetData(data.refId);
    this._parent.constructor.call(this,data,parentContainer,globalData,comp,placeholder);
}
createElement(SVGBaseElement, IImageElement);

IImageElement.prototype.createElements = function(){

    var assetPath = this.globalData.getAssetsPath(this.assetData);

    this._parent.createElements.call(this);

    this.innerElem = document.createElementNS(svgNS,'image');
    this.innerElem.setAttribute('width',this.assetData.w+"px");
    this.innerElem.setAttribute('height',this.assetData.h+"px");
    this.innerElem.setAttribute('preserveAspectRatio','xMidYMid slice');
    this.innerElem.setAttributeNS('http://www.w3.org/1999/xlink','href',assetPath);
    this.maskedElement = this.innerElem;
    this.layerElement.appendChild(this.innerElem);
    if(this.data.ln){
        this.layerElement.setAttribute('id',this.data.ln);
    }
    if(this.data.cl){
        this.layerElement.setAttribute('class',this.data.cl);
    }

};

IImageElement.prototype.hide = function(){
    if(!this.hidden){
        this.layerElement.style.display = 'none';
        this.hidden = true;
    }
};

IImageElement.prototype.renderFrame = function(parentMatrix){
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    if(this.hidden){
        this.hidden = false;
        this.layerElement.style.display = 'block';
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
};

IImageElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
    this.innerElem =  null;
};
function IShapeElement(data,parentContainer,globalData,comp, placeholder){
    this.shapes = [];
    this.shapesData = data.shapes;
    this.stylesList = [];
    this.viewData = [];
    this.shapeModifiers = [];
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(SVGBaseElement, IShapeElement);

IShapeElement.prototype.lcEnum = {
    '1': 'butt',
    '2': 'round',
    '3': 'butt'
}

IShapeElement.prototype.ljEnum = {
    '1': 'miter',
    '2': 'round',
    '3': 'butt'
}

IShapeElement.prototype.buildExpressionInterface = function(){};

IShapeElement.prototype.createElements = function(){
    //TODO check if I can use symbol so i can set its viewBox
    this._parent.createElements.call(this);
    this.searchShapes(this.shapesData,this.viewData,this.layerElement,this.dynamicProperties, 0);
    if(!this.data.hd || this.data.td){
        styleUnselectableDiv(this.layerElement);
    }
    //this.elemInterface.registerShapeExpressionInterface(ShapeExpressionInterface.createShapeInterface(this.shapesData,this.viewData,this.elemInterface));
};

IShapeElement.prototype.setGradientData = function(pathElement,arr,data){

    var gradientId = 'gr_'+randomString(10);
    var gfill;
    if(arr.t === 1){
        gfill = document.createElementNS(svgNS,'linearGradient');
    } else {
        gfill = document.createElementNS(svgNS,'radialGradient');
    }
    gfill.setAttribute('id',gradientId);
    gfill.setAttribute('spreadMethod','pad');
    gfill.setAttribute('gradientUnits','userSpaceOnUse');
    var stops = [];
    var stop, j, jLen;
    jLen = arr.g.p*4;
    for(j=0;j<jLen;j+=4){
        stop = document.createElementNS(svgNS,'stop');
        gfill.appendChild(stop);
        stops.push(stop);
    }
    pathElement.setAttribute( arr.ty === 'gf' ? 'fill':'stroke','url(#'+gradientId+')');
    this.globalData.defs.appendChild(gfill);
    data.gf = gfill;
    data.cst = stops;
}

IShapeElement.prototype.setGradientOpacity = function(arr, data, styleOb){
    if((arr.g.k.k[0].s && arr.g.k.k[0].s.length > arr.g.p*4) || arr.g.k.k.length > arr.g.p*4){
        var opFill;
        var stop, j, jLen;
        var mask = document.createElementNS(svgNS,"mask");
        var maskElement = document.createElementNS(svgNS, 'path');
        mask.appendChild(maskElement);
        var opacityId = 'op_'+randomString(10);
        var maskId = 'mk_'+randomString(10);
        mask.setAttribute('id',maskId);
        if(arr.t === 1){
            opFill = document.createElementNS(svgNS,'linearGradient');
        } else {
            opFill = document.createElementNS(svgNS,'radialGradient');
        }
        opFill.setAttribute('id',opacityId);
        opFill.setAttribute('spreadMethod','pad');
        opFill.setAttribute('gradientUnits','userSpaceOnUse');
        jLen = arr.g.k.k[0].s ? arr.g.k.k[0].s.length : arr.g.k.k.length;
        var stops = [];
        for(j=arr.g.p*4;j<jLen;j+=2){
            stop = document.createElementNS(svgNS,'stop');
            stop.setAttribute('stop-color','rgb(255,255,255)');
            //stop.setAttribute('offset',Math.round(arr.y[j][0]*100)+'%');
            //stop.setAttribute('style','stop-color:rgb(255,255,255);stop-opacity:'+arr.y[j][1]);
            opFill.appendChild(stop);
            stops.push(stop);
        }
        maskElement.setAttribute( arr.ty === 'gf' ? 'fill':'stroke','url(#'+opacityId+')');
        this.globalData.defs.appendChild(opFill);
        this.globalData.defs.appendChild(mask);
        data.of = opFill;
        data.ost = stops;
        styleOb.msElem = maskElement;
        return maskId;
    }
};

IShapeElement.prototype.searchShapes = function(arr,data,container,dynamicProperties, level, transformers){
    transformers = transformers || [];
    var ownTransformers = [].concat(transformers);
    var i, len = arr.length - 1;
    var j, jLen;
    var ownArrays = [], ownModifiers = [], styleOb, currentTransform;
    for(i=len;i>=0;i-=1){
        if(arr[i].ty == 'fl' || arr[i].ty == 'st' || arr[i].ty == 'gf' || arr[i].ty == 'gs'){
            data[i] = {};
            styleOb = {
                type: arr[i].ty,
                d: '',
                ld: '',
                lvl: level,
                mdf: false
            };
            var pathElement = document.createElementNS(svgNS, "path");
            data[i].o = PropertyFactory.getProp(this,arr[i].o,0,0.01,dynamicProperties);
            if(arr[i].ty == 'st' || arr[i].ty == 'gs') {
                pathElement.setAttribute('stroke-linecap', this.lcEnum[arr[i].lc] || 'round');
                ////pathElement.style.strokeLinecap = this.lcEnum[arr[i].lc] || 'round';
                pathElement.setAttribute('stroke-linejoin',this.ljEnum[arr[i].lj] || 'round');
                ////pathElement.style.strokeLinejoin = this.ljEnum[arr[i].lj] || 'round';
                pathElement.setAttribute('fill-opacity','0');
                ////pathElement.style.fillOpacity = 0;
                if(arr[i].lj == 1) {
                    pathElement.setAttribute('stroke-miterlimit',arr[i].ml);
                    ////pathElement.style.strokeMiterlimit = arr[i].ml;
                }

                data[i].w = PropertyFactory.getProp(this,arr[i].w,0,null,dynamicProperties);
                if(arr[i].d){
                    var d = PropertyFactory.getDashProp(this,arr[i].d,'svg',dynamicProperties);
                    if(!d.k){
                        pathElement.setAttribute('stroke-dasharray', d.dasharray);
                        ////pathElement.style.strokeDasharray = d.dasharray;
                        pathElement.setAttribute('stroke-dashoffset', d.dashoffset);
                        ////pathElement.style.strokeDashoffset = d.dashoffset;
                    }
                    data[i].d = d;
                }

            }
            if(arr[i].ty == 'fl' || arr[i].ty == 'st'){
                data[i].c = PropertyFactory.getProp(this,arr[i].c,1,255,dynamicProperties);
                container.appendChild(pathElement);
            } else {
                data[i].g = PropertyFactory.getGradientProp(this,arr[i].g,dynamicProperties);
                if(arr[i].t == 2){
                    data[i].h = PropertyFactory.getProp(this,arr[i].h,1,0.01,dynamicProperties);
                    data[i].a = PropertyFactory.getProp(this,arr[i].a,1,degToRads,dynamicProperties);
                }
                data[i].s = PropertyFactory.getProp(this,arr[i].s,1,null,dynamicProperties);
                data[i].e = PropertyFactory.getProp(this,arr[i].e,1,null,dynamicProperties);
                this.setGradientData(pathElement,arr[i],data[i], styleOb);
                var maskId = this.setGradientOpacity(arr[i],data[i], styleOb);
                if(maskId){
                    pathElement.setAttribute('mask','url(#'+maskId+')');
                }
                data[i].elem = pathElement;
                container.appendChild(pathElement);
            }
            if(arr[i].r === 2) {
                pathElement.setAttribute('fill-rule', 'evenodd');
            }

            if(arr[i].ln){
                pathElement.setAttribute('id',arr[i].ln);
            }
            if(arr[i].cl){
                pathElement.setAttribute('class',arr[i].cl);
            }
            styleOb.pElem = pathElement;
            this.stylesList.push(styleOb);
            data[i].style = styleOb;
            ownArrays.push(styleOb);
        }else if(arr[i].ty == 'gr'){
            data[i] = {
                it: []
            };
            var g = document.createElementNS(svgNS,'g');
            container.appendChild(g);
            data[i].gr = g;
            this.searchShapes(arr[i].it,data[i].it,g,dynamicProperties, level + 1, ownTransformers);
        }else if(arr[i].ty == 'tr'){
            data[i] = {
                transform : {
                    op: PropertyFactory.getProp(this,arr[i].o,0,0.01,dynamicProperties),
                    mProps: PropertyFactory.getProp(this,arr[i],2,null,dynamicProperties)
                },
                elements: []
            };
            currentTransform = data[i].transform;
            ownTransformers.push(currentTransform);
        }else if(arr[i].ty == 'sh' || arr[i].ty == 'rc' || arr[i].ty == 'el' || arr[i].ty == 'sr'){
            data[i] = {
                elements : [],
                caches:[],
                styles : [],
                transformers: ownTransformers,
                lStr: ''
            };
            var ty = 4;
            if(arr[i].ty == 'rc'){
                ty = 5;
            }else if(arr[i].ty == 'el'){
                ty = 6;
            }else if(arr[i].ty == 'sr'){
                ty = 7;
            }
            data[i].sh = ShapePropertyFactory.getShapeProp(this,arr[i],ty,dynamicProperties);
            data[i].lvl = level;
            this.shapes.push(data[i].sh);
            this.addShapeToModifiers(data[i]);
            jLen = this.stylesList.length;
            for(j=0;j<jLen;j+=1){
                if(!this.stylesList[j].closed){
                    data[i].elements.push({
                        ty:this.stylesList[j].type,
                        st: this.stylesList[j]
                    });
                }
            }
        }else if(arr[i].ty == 'tm' || arr[i].ty == 'rd' || arr[i].ty == 'ms' || arr[i].ty == 'rp'){
            var modifier = ShapeModifiers.getModifier(arr[i].ty);
            modifier.init(this,arr[i],dynamicProperties);
            this.shapeModifiers.push(modifier);
            ownModifiers.push(modifier);
            data[i] = modifier;
        }
    }
    len = ownArrays.length;
    for(i=0;i<len;i+=1){
        ownArrays[i].closed = true;
    }
    len = ownModifiers.length;
    for(i=0;i<len;i+=1){
        ownModifiers[i].closed = true;
    }
};

IShapeElement.prototype.addShapeToModifiers = function(data) {
    var i, len = this.shapeModifiers.length;
    for(i=0;i<len;i+=1){
        this.shapeModifiers[i].addShape(data);
    }
};

IShapeElement.prototype.renderModifiers = function() {
    if(!this.shapeModifiers.length){
        return;
    }
    var i, len = this.shapes.length;
    for(i=0;i<len;i+=1){
        this.shapes[i].reset();
    }


    len = this.shapeModifiers.length;

    for(i=len-1;i>=0;i-=1){
        this.shapeModifiers[i].processShapes(this.firstFrame);
    }
};

IShapeElement.prototype.renderFrame = function(parentMatrix){
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    this.globalToLocal([0,0,0]);
    if(this.hidden){
        this.layerElement.style.display = 'block';
        this.hidden = false;
    }
    this.renderModifiers();
    this.renderShape(null,null,true, null);
};

IShapeElement.prototype.hide = function(){
    if(!this.hidden){
        this.layerElement.style.display = 'none';
        var i, len = this.stylesList.length;
        for(i=len-1;i>=0;i-=1){
            if(this.stylesList[i].ld !== '0'){
                this.stylesList[i].ld = '0';
                this.stylesList[i].pElem.style.display = 'none';
                if(this.stylesList[i].pElem.parentNode){
                    this.stylesList[i].parent = this.stylesList[i].pElem.parentNode;
                    //this.stylesList[i].pElem.parentNode.removeChild(this.stylesList[i].pElem);
                }
            }
        }
        this.hidden = true;
    }
};

IShapeElement.prototype.renderShape = function(items,data,isMain, container){
    var i, len;
    if(!items){
        items = this.shapesData;
        len = this.stylesList.length;
        for(i=0;i<len;i+=1){
            this.stylesList[i].d = '';
            this.stylesList[i].mdf = false;
        }
    }
    if(!data){
        data = this.viewData;
    }
    ///
    ///
    len = items.length - 1;
    var ty;
    for(i=len;i>=0;i-=1){
        ty = items[i].ty;
        if(ty == 'tr'){
            if(this.firstFrame || data[i].transform.op.mdf && container){
                container.setAttribute('opacity',data[i].transform.op.v);
            }
            if(this.firstFrame || data[i].transform.mProps.mdf && container){
                container.setAttribute('transform',data[i].transform.mProps.v.to2dCSS());
            }
        }else if(ty == 'sh' || ty == 'el' || ty == 'rc' || ty == 'sr'){
            this.renderPath(items[i],data[i]);
        }else if(ty == 'fl'){
            this.renderFill(items[i],data[i]);
        }else if(ty == 'gf'){
            this.renderGradient(items[i],data[i]);
        }else if(ty == 'gs'){
            this.renderGradient(items[i],data[i]);
            this.renderStroke(items[i],data[i]);
        }else if(ty == 'st'){
            this.renderStroke(items[i],data[i]);
        }else if(ty == 'gr'){
            this.renderShape(items[i].it,data[i].it,false, data[i].gr);
        }else if(ty == 'tm'){
            //
        }
    }
    if(isMain) {
        len = this.stylesList.length;
        for (i = 0; i < len; i += 1) {
            if (this.stylesList[i].ld === '0') {
                this.stylesList[i].ld = '1';
                this.stylesList[i].pElem.style.display = 'block';
                //this.stylesList[i].parent.appendChild(this.stylesList[i].pElem);
            }
            if (this.stylesList[i].mdf || this.firstFrame) {
                this.stylesList[i].pElem.setAttribute('d', this.stylesList[i].d);
                if(this.stylesList[i].msElem){
                    this.stylesList[i].msElem.setAttribute('d', this.stylesList[i].d);
                }
            }
        }
        if (this.firstFrame) {
            this.firstFrame = false;
        }
    }

};

IShapeElement.prototype.renderPath = function(pathData,viewData){
    var len, i, j, jLen,pathStringTransformed,redraw,pathNodes,l, lLen = viewData.elements.length;
    var lvl = viewData.lvl;
    for(l=0;l<lLen;l+=1){
        redraw = viewData.sh.mdf || this.firstFrame;
        pathStringTransformed = 'M0 0';
        var paths = viewData.sh.paths;
        jLen = paths._length;
        if(viewData.elements[l].st.lvl < lvl){
            var mat = this.mHelper.reset(), props;
            var iterations = lvl - viewData.elements[l].st.lvl;
            var k = viewData.transformers.length-1;
            while(iterations > 0) {
                redraw = viewData.transformers[k].mProps.mdf || redraw;
                props = viewData.transformers[k].mProps.v.props;
                mat.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
                iterations --;
                k --;
            }
            if(redraw){
                for(j=0;j<jLen;j+=1){
                    pathNodes = paths.shapes[j];
                    if(pathNodes && pathNodes._length){
                        len = pathNodes._length;
                        for (i = 1; i < len; i += 1) {
                            if (i == 1) {
                                pathStringTransformed += " M" + mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
                            }
                            pathStringTransformed += " C" + mat.applyToPointStringified(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1]) + " " + mat.applyToPointStringified(pathNodes.i[i][0], pathNodes.i[i][1]) + " " + mat.applyToPointStringified(pathNodes.v[i][0], pathNodes.v[i][1]);
                        }
                        if (len == 1) {
                            pathStringTransformed += " M" + mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
                        }
                        if (pathNodes.c) {
                            pathStringTransformed += " C" + mat.applyToPointStringified(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1]) + " " + mat.applyToPointStringified(pathNodes.i[0][0], pathNodes.i[0][1]) + " " + mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
                            pathStringTransformed += 'z';
                        }
                    }
                }
                viewData.caches[l] = pathStringTransformed;
            } else {
                pathStringTransformed = viewData.caches[l];
            }
        } else {
            if(redraw){
                for(j=0;j<jLen;j+=1){
                    pathNodes = paths.shapes[j];
                    if(pathNodes && pathNodes._length){
                        len = pathNodes._length;
                        for (i = 1; i < len; i += 1) {
                            if (i == 1) {
                                //pathStringTransformed += " M" + groupTransform.mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
                                pathStringTransformed += " M" + pathNodes.v[0].join(',');
                            }
                            //pathStringTransformed += " C" + groupTransform.mat.applyToPointStringified(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1]) + " " + groupTransform.mat.applyToPointStringified(pathNodes.i[i][0], pathNodes.i[i][1]) + " " + groupTransform.mat.applyToPointStringified(pathNodes.v[i][0], pathNodes.v[i][1]);
                            pathStringTransformed += " C" + pathNodes.o[i - 1].join(',') + " " + pathNodes.i[i].join(',') + " " + pathNodes.v[i].join(',');
                        }
                        if (len == 1) {
                            //pathStringTransformed += " M" + groupTransform.mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
                            pathStringTransformed += " M" + pathNodes.v[0].join(',');
                        }
                        if (pathNodes.c && len) {
                            //pathStringTransformed += " C" + groupTransform.mat.applyToPointStringified(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1]) + " " + groupTransform.mat.applyToPointStringified(pathNodes.i[0][0], pathNodes.i[0][1]) + " " + groupTransform.mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
                            pathStringTransformed += " C" + pathNodes.o[i - 1].join(',') + " " + pathNodes.i[0].join(',') + " " + pathNodes.v[0].join(',');
                            pathStringTransformed += 'z';
                        }
                    }
                }
                viewData.caches[l] = pathStringTransformed;
            } else {
                pathStringTransformed = viewData.caches[l];
            }
        }
        viewData.elements[l].st.d += pathStringTransformed;
        viewData.elements[l].st.mdf = redraw || viewData.elements[l].st.mdf;
    }

};

IShapeElement.prototype.renderFill = function(styleData,viewData){
    var styleElem = viewData.style;

    if(viewData.c.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('fill','rgb('+bm_floor(viewData.c.v[0])+','+bm_floor(viewData.c.v[1])+','+bm_floor(viewData.c.v[2])+')');
        ////styleElem.pElem.style.fill = 'rgb('+bm_floor(viewData.c.v[0])+','+bm_floor(viewData.c.v[1])+','+bm_floor(viewData.c.v[2])+')';
    }
    if(viewData.o.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('fill-opacity',viewData.o.v);
    }
};

IShapeElement.prototype.renderGradient = function(styleData,viewData){
    var gfill = viewData.gf;
    var opFill = viewData.of;
    var pt1 = viewData.s.v,pt2 = viewData.e.v;

    if(viewData.o.mdf || this.firstFrame){
        var attr = styleData.ty === 'gf' ? 'fill-opacity':'stroke-opacity';
        viewData.elem.setAttribute(attr,viewData.o.v);
    }
    //clippedElement.setAttribute('transform','matrix(1,0,0,1,-100,0)');
    if(viewData.s.mdf || this.firstFrame){
        var attr1 = styleData.t === 1 ? 'x1':'cx';
        var attr2 = attr1 === 'x1' ? 'y1':'cy';
        gfill.setAttribute(attr1,pt1[0]);
        gfill.setAttribute(attr2,pt1[1]);
        if(opFill){
            opFill.setAttribute(attr1,pt1[0]);
            opFill.setAttribute(attr2,pt1[1]);
        }
    }
    var stops, i, len, stop;
    if(viewData.g.cmdf || this.firstFrame){
        stops = viewData.cst;
        var cValues = viewData.g.c;
        len = stops.length;
        for(i=0;i<len;i+=1){
            stop = stops[i];
            stop.setAttribute('offset',cValues[i*4]+'%');
            stop.setAttribute('stop-color','rgb('+cValues[i*4+1]+','+cValues[i*4+2]+','+cValues[i*4+3]+')');
        }
    }
    if(opFill && (viewData.g.omdf || this.firstFrame)){
        stops = viewData.ost;
        var oValues = viewData.g.o;
        len = stops.length;
        for(i=0;i<len;i+=1){
            stop = stops[i];
            stop.setAttribute('offset',oValues[i*2]+'%');
            stop.setAttribute('stop-opacity',oValues[i*2+1]);
        }
    }
    if(styleData.t === 1){
        if(viewData.e.mdf  || this.firstFrame){
            gfill.setAttribute('x2',pt2[0]);
            gfill.setAttribute('y2',pt2[1]);
            if(opFill){
                opFill.setAttribute('x2',pt2[0]);
                opFill.setAttribute('y2',pt2[1]);
            }
        }
    } else {
        var rad;
        if(viewData.s.mdf || viewData.e.mdf || this.firstFrame){
            rad = Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));
            gfill.setAttribute('r',rad);
            if(opFill){
                opFill.setAttribute('r',rad);
            }
        }
        if(viewData.e.mdf || viewData.h.mdf || viewData.a.mdf || this.firstFrame){
            if(!rad){
                rad = Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));
            }
            var ang = Math.atan2(pt2[1]-pt1[1], pt2[0]-pt1[0]);

            var percent = viewData.h.v >= 1 ? 0.99 : viewData.h.v <= -1 ? -0.99:viewData.h.v;
            var dist = rad*percent;
            var x = Math.cos(ang + viewData.a.v)*dist + pt1[0];
            var y = Math.sin(ang + viewData.a.v)*dist + pt1[1];
            gfill.setAttribute('fx',x);
            gfill.setAttribute('fy',y);
            if(opFill){
                opFill.setAttribute('fx',x);
                opFill.setAttribute('fy',y);
            }
        }
        //gfill.setAttribute('fy','200');
    }
};

IShapeElement.prototype.renderStroke = function(styleData,viewData){
    var styleElem = viewData.style;
    //TODO fix dashes
    var d = viewData.d;
    var dasharray,dashoffset;
    if(d && d.k && (d.mdf || this.firstFrame)){
        styleElem.pElem.setAttribute('stroke-dasharray', d.dasharray);
        ////styleElem.pElem.style.strokeDasharray = d.dasharray;
        styleElem.pElem.setAttribute('stroke-dashoffset', d.dashoffset);
        ////styleElem.pElem.style.strokeDashoffset = d.dashoffset;
    }
    if(viewData.c && (viewData.c.mdf || this.firstFrame)){
        styleElem.pElem.setAttribute('stroke','rgb('+bm_floor(viewData.c.v[0])+','+bm_floor(viewData.c.v[1])+','+bm_floor(viewData.c.v[2])+')');
        ////styleElem.pElem.style.stroke = 'rgb('+bm_floor(viewData.c.v[0])+','+bm_floor(viewData.c.v[1])+','+bm_floor(viewData.c.v[2])+')';
    }
    if(viewData.o.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('stroke-opacity',viewData.o.v);
    }
    if(viewData.w.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('stroke-width',viewData.w.v);
        if(styleElem.msElem){
            styleElem.msElem.setAttribute('stroke-width',viewData.w.v);
        }
        ////styleElem.pElem.style.strokeWidth = viewData.w.v;
    }
};

IShapeElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
    this.shapeData = null;
    this.viewData = null;
    this.parentContainer = null;
    this.placeholder = null;
};

function ISolidElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(SVGBaseElement, ISolidElement);

ISolidElement.prototype.createElements = function(){
    this._parent.createElements.call(this);

    var rect = document.createElementNS(svgNS,'rect');
    ////rect.style.width = this.data.sw;
    ////rect.style.height = this.data.sh;
    ////rect.style.fill = this.data.sc;
    rect.setAttribute('width',this.data.sw);
    rect.setAttribute('height',this.data.sh);
    rect.setAttribute('fill',this.data.sc);
    this.layerElement.appendChild(rect);
    this.innerElem = rect;
    if(this.data.ln){
        this.layerElement.setAttribute('id',this.data.ln);
    }
    if(this.data.cl){
        this.layerElement.setAttribute('class',this.data.cl);
    }
};

ISolidElement.prototype.hide = IImageElement.prototype.hide;
ISolidElement.prototype.renderFrame = IImageElement.prototype.renderFrame;
ISolidElement.prototype.destroy = IImageElement.prototype.destroy;

var animationManager = (function(){
    var moduleOb = {};
    var registeredAnimations = [];
    var initTime = 0;
    var len = 0;
    var idled = true;
    var playingAnimationsNum = 0;

    function removeElement(ev){
        var i = 0;
        var animItem = ev.target;
        while(i<len) {
            if (registeredAnimations[i].animation === animItem) {
                registeredAnimations.splice(i, 1);
                i -= 1;
                len -= 1;
                if(!animItem.isPaused){
                    subtractPlayingCount();   
                }
            }
            i += 1;
        }
    }

    function registerAnimation(element, animationData){
        if(!element){
            return null;
        }
        var i=0;
        while(i<len){
            if(registeredAnimations[i].elem == element && registeredAnimations[i].elem !== null ){
                return registeredAnimations[i].animation;
            }
            i+=1;
        }
        var animItem = new AnimationItem();
        setupAnimation(animItem, element);
        animItem.setData(element, animationData);
        return animItem;
    }

    function addPlayingCount(){
        playingAnimationsNum += 1;
        activate();
    }

    function subtractPlayingCount(){
        playingAnimationsNum -= 1;
        if(playingAnimationsNum === 0){
            idled = true;
        }
    }

    function setupAnimation(animItem, element){
        animItem.addEventListener('destroy',removeElement);
        animItem.addEventListener('_active',addPlayingCount);
        animItem.addEventListener('_idle',subtractPlayingCount);
        registeredAnimations.push({elem: element,animation:animItem});
        len += 1;
    }

    function loadAnimation(params){
        var animItem = new AnimationItem();
        setupAnimation(animItem, null);
        animItem.setParams(params);
        return animItem;
    }


    function setSpeed(val,animation){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.setSpeed(val, animation);
        }
    }

    function setDirection(val, animation){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.setDirection(val, animation);
        }
    }

    function play(animation){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.play(animation);
        }
    }

    function moveFrame (value, animation) {
        initTime = Date.now();
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.moveFrame(value,animation);
        }
    }

    function resume(nowTime) {

        var elapsedTime = nowTime - initTime;
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.advanceTime(elapsedTime);
        }
        initTime = nowTime;
        if(!idled) {
            requestAnimationFrame(resume);
        }
    }

    function first(nowTime){
        initTime = nowTime;
        requestAnimationFrame(resume);
    }

    function pause(animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.pause(animation);
        }
    }

    function goToAndStop(value,isFrame,animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.goToAndStop(value,isFrame,animation);
        }
    }

    function stop(animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.stop(animation);
        }
    }

    function togglePause(animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.togglePause(animation);
        }
    }

    function destroy(animation) {
        var i;
        for(i=(len-1);i>=0;i-=1){
            registeredAnimations[i].animation.destroy(animation);
        }
    }

    function searchAnimations(animationData, standalone, renderer){
        var animElements = document.getElementsByClassName('bodymovin');
        var i, len = animElements.length;
        for(i=0;i<len;i+=1){
            if(renderer){
                animElements[i].setAttribute('data-bm-type',renderer);
            }
            registerAnimation(animElements[i], animationData);
        }
        if(standalone && len === 0){
            if(!renderer){
                renderer = 'svg';
            }
            var body = document.getElementsByTagName('body')[0];
            body.innerHTML = '';
            var div = document.createElement('div');
            div.style.width = '100%';
            div.style.height = '100%';
            div.setAttribute('data-bm-type',renderer);
            body.appendChild(div);
            registerAnimation(div, animationData);
        }
    }

    function resize(){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.resize();
        }
    }

    function start(){
        requestAnimationFrame(first);
    }

    function activate(){
        if(idled){
            idled = false;
            requestAnimationFrame(first);
        }
    }

    //start();

    setTimeout(start,0);

    moduleOb.registerAnimation = registerAnimation;
    moduleOb.loadAnimation = loadAnimation;
    moduleOb.setSpeed = setSpeed;
    moduleOb.setDirection = setDirection;
    moduleOb.play = play;
    moduleOb.moveFrame = moveFrame;
    moduleOb.pause = pause;
    moduleOb.stop = stop;
    moduleOb.togglePause = togglePause;
    moduleOb.searchAnimations = searchAnimations;
    moduleOb.resize = resize;
    moduleOb.start = start;
    moduleOb.goToAndStop = goToAndStop;
    moduleOb.destroy = destroy;
    return moduleOb;
}());
var AnimationItem = function () {
    this._cbs = [];
    this.name = '';
    this.path = '';
    this.isLoaded = false;
    this.currentFrame = 0;
    this.currentRawFrame = 0;
    this.totalFrames = 0;
    this.frameRate = 0;
    this.frameMult = 0;
    this.playSpeed = 1;
    this.playDirection = 1;
    this.pendingElements = 0;
    this.playCount = 0;
    this.prerenderFramesFlag = true;
    this.animationData = {};
    this.layers = [];
    this.assets = [];
    this.isPaused = true;
    this.autoplay = false;
    this.loop = true;
    this.renderer = null;
    this.animationID = randomString(10);
    this.scaleMode = 'fit';
    this.assetsPath = '';
    this.timeCompleted = 0;
    this.segmentPos = 0;
    this.subframeEnabled = subframeEnabled;
    this.segments = [];
    this.pendingSegment = false;
    this._idle = true;
    this.projectInterface = ProjectInterface();
};

AnimationItem.prototype.setParams = function(params) {
    var self = this;
    if(params.context){
        this.context = params.context;
    }
    if(params.wrapper || params.container){
        this.wrapper = params.wrapper || params.container;
    }
    var animType = params.animType ? params.animType : params.renderer ? params.renderer : 'svg';
    switch(animType){
        case 'canvas':
            this.renderer = new CanvasRenderer(this, params.rendererSettings);
            break;
        case 'svg':
            this.renderer = new SVGRenderer(this, params.rendererSettings);
            break;
        case 'hybrid':
        case 'html':
        default:
            this.renderer = new HybridRenderer(this, params.rendererSettings);
            break;
    }
    this.renderer.setProjectInterface(this.projectInterface);
    this.animType = animType;

    if(params.loop === '' || params.loop === null){
    }else if(params.loop === false){
        this.loop = false;
    }else if(params.loop === true){
        this.loop = true;
    }else{
        this.loop = parseInt(params.loop);
    }
    this.autoplay = 'autoplay' in params ? params.autoplay : true;
    this.name = params.name ? params.name :  '';
    this.prerenderFramesFlag = 'prerender' in params ? params.prerender : true;
    this.autoloadSegments = params.hasOwnProperty('autoloadSegments') ? params.autoloadSegments :  true;
    if(params.animationData){
        self.configAnimation(params.animationData);
    }else if(params.path){
        if(params.path.substr(-4) != 'json'){
            if (params.path.substr(-1, 1) != '/') {
                params.path += '/';
            }
            params.path += 'data.json';
        }

        var xhr = new XMLHttpRequest();
        if(params.path.lastIndexOf('\\') != -1){
            this.path = params.path.substr(0,params.path.lastIndexOf('\\')+1);
        }else{
            this.path = params.path.substr(0,params.path.lastIndexOf('/')+1);
        }
        this.assetsPath = params.assetsPath;
        this.fileName = params.path.substr(params.path.lastIndexOf('/')+1);
        this.fileName = this.fileName.substr(0,this.fileName.lastIndexOf('.json'));
        xhr.open('GET', params.path, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if(xhr.status == 200){
                    self.configAnimation(JSON.parse(xhr.responseText));
                }else{
                    try{
                        var response = JSON.parse(xhr.responseText);
                        self.configAnimation(response);
                    }catch(err){
                    }
                }
            }
        };
    }
};

AnimationItem.prototype.setData = function (wrapper, animationData) {
    var params = {
        wrapper: wrapper,
        animationData: animationData ? (typeof animationData  === "object") ? animationData : JSON.parse(animationData) : null
    };
    var wrapperAttributes = wrapper.attributes;

    params.path = wrapperAttributes.getNamedItem('data-animation-path') ? wrapperAttributes.getNamedItem('data-animation-path').value : wrapperAttributes.getNamedItem('data-bm-path') ? wrapperAttributes.getNamedItem('data-bm-path').value :  wrapperAttributes.getNamedItem('bm-path') ? wrapperAttributes.getNamedItem('bm-path').value : '';
    params.animType = wrapperAttributes.getNamedItem('data-anim-type') ? wrapperAttributes.getNamedItem('data-anim-type').value : wrapperAttributes.getNamedItem('data-bm-type') ? wrapperAttributes.getNamedItem('data-bm-type').value : wrapperAttributes.getNamedItem('bm-type') ? wrapperAttributes.getNamedItem('bm-type').value :  wrapperAttributes.getNamedItem('data-bm-renderer') ? wrapperAttributes.getNamedItem('data-bm-renderer').value : wrapperAttributes.getNamedItem('bm-renderer') ? wrapperAttributes.getNamedItem('bm-renderer').value : 'canvas';

    var loop = wrapperAttributes.getNamedItem('data-anim-loop') ? wrapperAttributes.getNamedItem('data-anim-loop').value :  wrapperAttributes.getNamedItem('data-bm-loop') ? wrapperAttributes.getNamedItem('data-bm-loop').value :  wrapperAttributes.getNamedItem('bm-loop') ? wrapperAttributes.getNamedItem('bm-loop').value : '';
    if(loop === ''){
    }else if(loop === 'false'){
        params.loop = false;
    }else if(loop === 'true'){
        params.loop = true;
    }else{
        params.loop = parseInt(loop);
    }
    var autoplay = wrapperAttributes.getNamedItem('data-anim-autoplay') ? wrapperAttributes.getNamedItem('data-anim-autoplay').value :  wrapperAttributes.getNamedItem('data-bm-autoplay') ? wrapperAttributes.getNamedItem('data-bm-autoplay').value :  wrapperAttributes.getNamedItem('bm-autoplay') ? wrapperAttributes.getNamedItem('bm-autoplay').value : true;
    params.autoplay = autoplay !== "false";

    params.name = wrapperAttributes.getNamedItem('data-name') ? wrapperAttributes.getNamedItem('data-name').value :  wrapperAttributes.getNamedItem('data-bm-name') ? wrapperAttributes.getNamedItem('data-bm-name').value : wrapperAttributes.getNamedItem('bm-name') ? wrapperAttributes.getNamedItem('bm-name').value :  '';
    var prerender = wrapperAttributes.getNamedItem('data-anim-prerender') ? wrapperAttributes.getNamedItem('data-anim-prerender').value :  wrapperAttributes.getNamedItem('data-bm-prerender') ? wrapperAttributes.getNamedItem('data-bm-prerender').value :  wrapperAttributes.getNamedItem('bm-prerender') ? wrapperAttributes.getNamedItem('bm-prerender').value : '';

    if(prerender === 'false'){
        params.prerender = false;
    }
    this.setParams(params);
};

AnimationItem.prototype.includeLayers = function(data) {
    if(data.op > this.animationData.op){
        this.animationData.op = data.op;
        this.totalFrames = Math.floor(data.op - this.animationData.ip);
        this.animationData.tf = this.totalFrames;
    }
    var layers = this.animationData.layers;
    var i, len = layers.length;
    var newLayers = data.layers;
    var j, jLen = newLayers.length;
    for(j=0;j<jLen;j+=1){
        i = 0;
        while(i<len){
            if(layers[i].id == newLayers[j].id){
                layers[i] = newLayers[j];
                break;
            }
            i += 1;
        }
    }
    if(data.chars || data.fonts){
        this.renderer.globalData.fontManager.addChars(data.chars);
        this.renderer.globalData.fontManager.addFonts(data.fonts, this.renderer.globalData.defs);
    }
    if(data.assets){
        len = data.assets.length;
        for(i = 0; i < len; i += 1){
            this.animationData.assets.push(data.assets[i]);
        }
    }
    //this.totalFrames = 50;
    //this.animationData.tf = 50;
    this.animationData.__complete = false;
    dataManager.completeData(this.animationData,this.renderer.globalData.fontManager);
    this.renderer.includeLayers(data.layers);
    if(expressionsPlugin){
        expressionsPlugin.initExpressions(this);
    }
    this.renderer.renderFrame(null);
    this.loadNextSegment();
};

AnimationItem.prototype.loadNextSegment = function() {
    var segments = this.animationData.segments;
    if(!segments || segments.length === 0 || !this.autoloadSegments){
        this.trigger('data_ready');
        this.timeCompleted = this.animationData.tf;
        return;
    }
    var segment = segments.shift();
    this.timeCompleted = segment.time * this.frameRate;
    var xhr = new XMLHttpRequest();
    var self = this;
    var segmentPath = this.path+this.fileName+'_' + this.segmentPos + '.json';
    this.segmentPos += 1;
    xhr.open('GET', segmentPath, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if(xhr.status == 200){
                self.includeLayers(JSON.parse(xhr.responseText));
            }else{
                try{
                    var response = JSON.parse(xhr.responseText);
                    self.includeLayers(response);
                }catch(err){
                }
            }
        }
    };
};

AnimationItem.prototype.loadSegments = function() {
    var segments = this.animationData.segments;
    if(!segments) {
        this.timeCompleted = this.animationData.tf;
    }
    this.loadNextSegment();
};

AnimationItem.prototype.configAnimation = function (animData) {
    if(this.renderer && this.renderer.destroyed){
        return;
    }
    //console.log(JSON.parse(JSON.stringify(animData)));
    //animData.w = Math.round(animData.w/blitter);
    //animData.h = Math.round(animData.h/blitter);
    this.animationData = animData;
    this.totalFrames = Math.floor(this.animationData.op - this.animationData.ip);
    this.animationData.tf = this.totalFrames;
    this.renderer.configAnimation(animData);
    if(!animData.assets){
        animData.assets = [];
    }
    if(animData.comps) {
        animData.assets = animData.assets.concat(animData.comps);
        animData.comps = null;
    }
    this.renderer.searchExtraCompositions(animData.assets);

    this.layers = this.animationData.layers;
    this.assets = this.animationData.assets;
    this.frameRate = this.animationData.fr;
    this.firstFrame = Math.round(this.animationData.ip);
    this.frameMult = this.animationData.fr / 1000;
    this.trigger('config_ready');
    this.imagePreloader = new ImagePreloader();
    this.imagePreloader.setAssetsPath(this.assetsPath);
    this.imagePreloader.setPath(this.path);
    this.imagePreloader.loadAssets(animData.assets);
    this.loadSegments();
    this.updaFrameModifier();
    if(this.renderer.globalData.fontManager){
        this.waitForFontsLoaded();
    }else{
        dataManager.completeData(this.animationData,this.renderer.globalData.fontManager);
        this.checkLoaded();
    }
};

AnimationItem.prototype.waitForFontsLoaded = (function(){
    function checkFontsLoaded(){
        if(this.renderer.globalData.fontManager.loaded){
            dataManager.completeData(this.animationData,this.renderer.globalData.fontManager);
            //this.renderer.buildItems(this.animationData.layers);
            this.checkLoaded();
        }else{
            setTimeout(checkFontsLoaded.bind(this),20);
        }
    }

    return function(){
        checkFontsLoaded.bind(this)();
    }
}());

AnimationItem.prototype.addPendingElement = function () {
    this.pendingElements += 1;
}

AnimationItem.prototype.elementLoaded = function () {
    this.pendingElements--;
    this.checkLoaded();
};

AnimationItem.prototype.checkLoaded = function () {
    if (this.pendingElements === 0) {
        if(expressionsPlugin){
            expressionsPlugin.initExpressions(this);
        }
        this.renderer.initItems();
        setTimeout(function(){
            this.trigger('DOMLoaded');
        }.bind(this),0);
        this.isLoaded = true;
        this.gotoFrame();
        if(this.autoplay){
            this.play();
        }
    }
};

AnimationItem.prototype.resize = function () {
    this.renderer.updateContainerSize();
};

AnimationItem.prototype.setSubframe = function(flag){
    this.subframeEnabled = flag ? true : false;
}

AnimationItem.prototype.gotoFrame = function () {
    if(this.subframeEnabled){
        this.currentFrame = this.currentRawFrame;
    }else{
        this.currentFrame = Math.floor(this.currentRawFrame);
    }

    if(this.timeCompleted !== this.totalFrames && this.currentFrame > this.timeCompleted){
        this.currentFrame = this.timeCompleted;
    }
    this.trigger('enterFrame');
    this.renderFrame();
};

AnimationItem.prototype.renderFrame = function () {
    if(this.isLoaded === false){
        return;
    }
    //console.log('this.currentFrame:',this.currentFrame + this.firstFrame);
    this.renderer.renderFrame(this.currentFrame + this.firstFrame);
};

AnimationItem.prototype.play = function (name) {
    if(name && this.name != name){
        return;
    }
    if(this.isPaused === true){
        this.isPaused = false;
        if(this._idle){
            this._idle = false;
            this.trigger('_active');
        }
    }
};

AnimationItem.prototype.pause = function (name) {
    if(name && this.name != name){
        return;
    }
    if(this.isPaused === false){
        this.isPaused = true;
        if(!this.pendingSegment){
            this._idle = true;
            this.trigger('_idle');
        }
    }
};

AnimationItem.prototype.togglePause = function (name) {
    if(name && this.name != name){
        return;
    }
    if(this.isPaused === true){
        this.play();
    }else{
        this.pause();
    }
};

AnimationItem.prototype.stop = function (name) {
    if(name && this.name != name){
        return;
    }
    this.pause();
    this.currentFrame = this.currentRawFrame = 0;
    this.playCount = 0;
    this.gotoFrame();
};

AnimationItem.prototype.goToAndStop = function (value, isFrame, name) {
    if(name && this.name != name){
        return;
    }
    if(isFrame){
        this.setCurrentRawFrameValue(value);
    }else{
        this.setCurrentRawFrameValue(value * this.frameModifier);
    }
    this.pause();
};

AnimationItem.prototype.goToAndPlay = function (value, isFrame, name) {
    this.goToAndStop(value, isFrame, name);
    this.play();
};

AnimationItem.prototype.advanceTime = function (value) {
    if(this.pendingSegment){
        this.pendingSegment = false;
        this.adjustSegment(this.segments.shift());
        if(this.isPaused){
            this.play();
        }
        return;
    }
    if (this.isPaused === true || this.isLoaded === false) {
        return;
    }
    this.setCurrentRawFrameValue(this.currentRawFrame + value * this.frameModifier);
};

AnimationItem.prototype.updateAnimation = function (perc) {
    this.setCurrentRawFrameValue(this.totalFrames * perc);
};

AnimationItem.prototype.moveFrame = function (value, name) {
    if(name && this.name != name){
        return;
    }
    this.setCurrentRawFrameValue(this.currentRawFrame+value);
};

AnimationItem.prototype.adjustSegment = function(arr){
    this.playCount = 0;
    if(arr[1] < arr[0]){
        if(this.frameModifier > 0){
            if(this.playSpeed < 0){
                this.setSpeed(-this.playSpeed);
            } else {
                this.setDirection(-1);
            }
        }
        this.totalFrames = arr[0] - arr[1];
        this.firstFrame = arr[1];
        this.setCurrentRawFrameValue(this.totalFrames - 0.01);
    } else if(arr[1] > arr[0]){
        if(this.frameModifier < 0){
            if(this.playSpeed < 0){
                this.setSpeed(-this.playSpeed);
            } else {
                this.setDirection(1);
            }
        }
        this.totalFrames = arr[1] - arr[0];
        this.firstFrame = arr[0];
        this.setCurrentRawFrameValue(0);
    }
    this.trigger('segmentStart');
};
AnimationItem.prototype.setSegment = function (init,end) {
    var pendingFrame = -1;
    if(this.isPaused) {
        if (this.currentRawFrame + this.firstFrame < init) {
            pendingFrame = init;
        } else if (this.currentRawFrame + this.firstFrame > end) {
            pendingFrame = end - init - 0.01;
        }
    }

    this.firstFrame = init;
    this.totalFrames = end - init;
    if(pendingFrame !== -1) {
        this.goToAndStop(pendingFrame,true);
    }
}

AnimationItem.prototype.playSegments = function (arr,forceFlag) {
    if(typeof arr[0] === 'object'){
        var i, len = arr.length;
        for(i=0;i<len;i+=1){
            this.segments.push(arr[i]);
        }
    }else{
        this.segments.push(arr);
    }
    if(forceFlag){
        this.adjustSegment(this.segments.shift());
    }
    if(this.isPaused){
        this.play();
    }
};

AnimationItem.prototype.resetSegments = function (forceFlag) {
    this.segments.length = 0;
    this.segments.push([this.animationData.ip*this.frameRate,Math.floor(this.animationData.op - this.animationData.ip+this.animationData.ip*this.frameRate)]);
    if(forceFlag){
        this.adjustSegment(this.segments.shift());
    }
};
AnimationItem.prototype.checkSegments = function(){
    if(this.segments.length){
        this.pendingSegment = true;
    }
}

AnimationItem.prototype.remove = function (name) {
    if(name && this.name != name){
        return;
    }
    this.renderer.destroy();
};

AnimationItem.prototype.destroy = function (name) {
    if((name && this.name != name) || (this.renderer && this.renderer.destroyed)){
        return;
    }
    this.renderer.destroy();
    this.trigger('destroy');
    this._cbs = null;
    this.onEnterFrame = this.onLoopComplete = this.onComplete = this.onSegmentStart = this.onDestroy = null;
};

AnimationItem.prototype.setCurrentRawFrameValue = function(value){
    this.currentRawFrame = value;
    //console.log(this.totalFrames);
    if (this.currentRawFrame >= this.totalFrames) {
        this.checkSegments();
        if(this.loop === false){
            this.currentRawFrame = this.totalFrames - 0.01;
            this.gotoFrame();
            this.pause();
            this.trigger('complete');
            return;
        }else{
            this.trigger('loopComplete');
            this.playCount += 1;
            if((this.loop !== true && this.playCount == this.loop) || this.pendingSegment){
                this.currentRawFrame = this.totalFrames - 0.01;
                this.gotoFrame();
                this.pause();
                this.trigger('complete');
                return;
            } else {
                this.currentRawFrame = this.currentRawFrame % this.totalFrames;
            }
        }
    } else if (this.currentRawFrame < 0) {
        this.checkSegments();
        this.playCount -= 1;
        if(this.playCount < 0){
            this.playCount = 0;
        }
        if(this.loop === false  || this.pendingSegment){
            this.currentRawFrame = 0;
            this.gotoFrame();
            this.pause();
            this.trigger('complete');
            return;
        }else{
            this.trigger('loopComplete');
            this.currentRawFrame = (this.totalFrames + this.currentRawFrame) % this.totalFrames;
            this.gotoFrame();
            return;
        }
    }

    this.gotoFrame();
};

AnimationItem.prototype.setSpeed = function (val) {
    this.playSpeed = val;
    this.updaFrameModifier();
};

AnimationItem.prototype.setDirection = function (val) {
    this.playDirection = val < 0 ? -1 : 1;
    this.updaFrameModifier();
};

AnimationItem.prototype.updaFrameModifier = function () {
    this.frameModifier = this.frameMult * this.playSpeed * this.playDirection;
};

AnimationItem.prototype.getPath = function () {
    return this.path;
};

AnimationItem.prototype.getAssetsPath = function (assetData) {
    var path = '';
    if(this.assetsPath){
        var imagePath = assetData.p;
        if(imagePath.indexOf('images/') !== -1){
            imagePath = imagePath.split('/')[1];
        }
        path = this.assetsPath + imagePath;
    } else {
        path = this.path;
        path += assetData.u ? assetData.u : '';
        path += assetData.p;
    }
    return path;
};

AnimationItem.prototype.getAssetData = function (id) {
    var i = 0, len = this.assets.length;
    while (i < len) {
        if(id == this.assets[i].id){
            return this.assets[i];
        }
        i += 1;
    }
};

AnimationItem.prototype.hide = function () {
    this.renderer.hide();
};

AnimationItem.prototype.show = function () {
    this.renderer.show();
};

AnimationItem.prototype.getAssets = function () {
    return this.assets;
};

AnimationItem.prototype.trigger = function(name){
    if(this._cbs && this._cbs[name]){
        switch(name){
            case 'enterFrame':
                this.triggerEvent(name,new BMEnterFrameEvent(name,this.currentFrame,this.totalFrames,this.frameMult));
                break;
            case 'loopComplete':
                this.triggerEvent(name,new BMCompleteLoopEvent(name,this.loop,this.playCount,this.frameMult));
                break;
            case 'complete':
                this.triggerEvent(name,new BMCompleteEvent(name,this.frameMult));
                break;
            case 'segmentStart':
                this.triggerEvent(name,new BMSegmentStartEvent(name,this.firstFrame,this.totalFrames));
                break;
            case 'destroy':
                this.triggerEvent(name,new BMDestroyEvent(name,this));
                break;
            default:
                this.triggerEvent(name);
        }
    }
    if(name === 'enterFrame' && this.onEnterFrame){
        this.onEnterFrame.call(this,new BMEnterFrameEvent(name,this.currentFrame,this.totalFrames,this.frameMult));
    }
    if(name === 'loopComplete' && this.onLoopComplete){
        this.onLoopComplete.call(this,new BMCompleteLoopEvent(name,this.loop,this.playCount,this.frameMult));
    }
    if(name === 'complete' && this.onComplete){
        this.onComplete.call(this,new BMCompleteEvent(name,this.frameMult));
    }
    if(name === 'segmentStart' && this.onSegmentStart){
        this.onSegmentStart.call(this,new BMSegmentStartEvent(name,this.firstFrame,this.totalFrames));
    }
    if(name === 'destroy' && this.onDestroy){
        this.onDestroy.call(this,new BMDestroyEvent(name,this));
    }
};

AnimationItem.prototype.addEventListener = _addEventListener;
AnimationItem.prototype.removeEventListener = _removeEventListener;
AnimationItem.prototype.triggerEvent = _triggerEvent;
var bodymovinjs = {}; function play(animation){ animationManager.play(animation); } function pause(animation){ animationManager.pause(animation); } function togglePause(animation){ animationManager.togglePause(animation); } function setSpeed(value,animation){ animationManager.setSpeed(value, animation); } function setDirection(value,animation){ animationManager.setDirection(value, animation); } function stop(animation){ animationManager.stop(animation); } function moveFrame(value){ animationManager.moveFrame(value); } function searchAnimations(){ if(standalone === true){ animationManager.searchAnimations(animationData,standalone, renderer); }else{ animationManager.searchAnimations(); } } function registerAnimation(elem){ return animationManager.registerAnimation(elem); } function resize(){ animationManager.resize(); } function start(){ animationManager.start(); } function goToAndStop(val,isFrame, animation){ animationManager.goToAndStop(val,isFrame, animation); } function setSubframeRendering(flag){ subframeEnabled = flag; } function loadAnimation(params){ if(standalone === true){ params.animationData = JSON.parse(animationData); } return animationManager.loadAnimation(params); } function destroy(animation){ return animationManager.destroy(animation); } function setQuality(value){ if(typeof value === 'string'){ switch(value){ case 'high': defaultCurveSegments = 200; break; case 'medium': defaultCurveSegments = 50; break; case 'low': defaultCurveSegments = 10; break; } }else if(!isNaN(value) && value > 1){ defaultCurveSegments = value; } if(defaultCurveSegments >= 50){ roundValues(false); }else{ roundValues(true); } } function installPlugin(type,plugin){ if(type==='expressions'){ expressionsPlugin = plugin; } } function getFactory(name){ switch(name){ case "propertyFactory": return PropertyFactory;case "shapePropertyFactory": return ShapePropertyFactory; case "matrix": return Matrix; } } bodymovinjs.play = play; bodymovinjs.pause = pause; bodymovinjs.togglePause = togglePause; bodymovinjs.setSpeed = setSpeed; bodymovinjs.setDirection = setDirection; bodymovinjs.stop = stop; bodymovinjs.moveFrame = moveFrame; bodymovinjs.searchAnimations = searchAnimations; bodymovinjs.registerAnimation = registerAnimation; bodymovinjs.loadAnimation = loadAnimation; bodymovinjs.setSubframeRendering = setSubframeRendering; bodymovinjs.resize = resize; bodymovinjs.start = start; bodymovinjs.goToAndStop = goToAndStop; bodymovinjs.destroy = destroy; bodymovinjs.setQuality = setQuality; bodymovinjs.installPlugin = installPlugin; bodymovinjs.__getFactory = getFactory; bodymovinjs.version = '4.6.3'; function checkReady(){ if (document.readyState === "complete") { clearInterval(readyStateCheckInterval); searchAnimations(); } } function getQueryVariable(variable) { var vars = queryString.split('&'); for (var i = 0; i < vars.length; i++) { var pair = vars[i].split('='); if (decodeURIComponent(pair[0]) == variable) { return decodeURIComponent(pair[1]); } } } var standalone = '__[STANDALONE]__'; var animationData = '__[ANIMATIONDATA]__'; var renderer = ''; if(standalone) { var scripts = document.getElementsByTagName('script'); var index = scripts.length - 1; var myScript = scripts[index]; var queryString = myScript.src.replace(/^[^\?]+\??/,''); renderer = getQueryVariable('renderer'); } var readyStateCheckInterval = setInterval(checkReady, 100); return bodymovinjs; }));  

// This is animation
var icon = {
  404: {"v":"4.5.9","fr":24,"ip":0,"op":81,"w":1628,"h":948,"ddd":0,"assets":[{"id":"comp_120","layers":[{"ddd":0,"ind":0,"ty":0,"nm":"Circles 10","refId":"comp_121","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":-51.824},"p":{"a":0,"k":[1005,443.25,0]},"a":{"a":0,"k":[102.5,78.5,0]},"s":{"a":0,"k":[20,20,100]}},"ao":0,"w":205,"h":157,"ip":44,"op":55.2112112112112,"st":44,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":0,"nm":"Circles 09","refId":"comp_121","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":-42.323},"p":{"a":0,"k":[844.25,464.75,0]},"a":{"a":0,"k":[102.5,78.5,0]},"s":{"a":0,"k":[20,20,100]}},"ao":0,"w":205,"h":157,"ip":15,"op":26.2112112112112,"st":15,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":0,"nm":"Bolt","refId":"comp_122","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":-99.549},"p":{"a":0,"k":[952.5,715,0]},"a":{"a":0,"k":[19,26,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":38,"h":52,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":0,"nm":"Bolt","refId":"comp_122","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":100.402},"p":{"a":0,"k":[1162.75,720.5,0]},"a":{"a":0,"k":[19,26,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":38,"h":52,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":4,"ty":0,"nm":"Bolt","refId":"comp_122","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1144,721.5,0]},"a":{"a":0,"k":[19,26,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":38,"h":52,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":5,"ty":4,"nm":"cap","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[787,713.39,0]},"a":{"a":0,"k":[124,12.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[-1.129,0],[0,0],[0,1.129],[0,0]],"o":[[0,0],[0,1.129],[0,0],[1.129,0],[0,0],[0,0]],"v":[[-112.371,-2.015],[-112.371,-0.029],[-110.327,2.015],[110.327,2.015],[112.371,-0.029],[112.371,-2.015]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.8,0.824,0.839,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[112.517,21.606],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.129,0],[0,0],[0,1.129],[0,0],[-1.129,0],[0,0],[0,-1.129],[0,0]],"o":[[0,0],[-1.129,0],[0,0],[0,-1.129],[0,0],[1.129,0],[0,0],[0,1.129]],"v":[[110.327,6.705],[-110.327,6.705],[-112.371,4.661],[-112.371,-4.661],[-110.327,-6.705],[110.327,-6.705],[112.371,-4.661],[112.371,4.661]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.91,0.933,0.937,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[112.517,16.916],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.155,0],[0,0],[0,1.155],[0,0],[-1.155,0],[0,0],[0,-1.156],[0,0]],"o":[[0,0],[-1.155,0],[0,0],[0,-1.156],[0,0],[1.155,0],[0,0],[0,1.155]],"v":[[115.556,6.705],[-115.557,6.705],[-117.648,4.613],[-117.648,-4.613],[-115.557,-6.705],[115.556,-6.705],[117.648,-4.613],[117.648,4.613]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[128.857,16.916],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":6,"ty":0,"nm":"Tube","refId":"comp_123","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1368,572,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":7,"ty":4,"nm":"tube","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1181,452.39,0]},"a":{"a":0,"k":[19,32.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[-0.231,1.031],[0,0],[1.031,0.232],[0,0]],"o":[[0,0],[1.031,0.232],[0,0],[0.232,-1.031],[0,0],[0,0]],"v":[[-3.456,7.537],[-1.742,7.921],[0.543,6.473],[3.224,-5.483],[1.776,-7.769],[0.063,-8.153]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.42,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[33.798,25.48],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.031,0.231],[0,0],[-0.232,1.031],[0,0],[-1.03,-0.231],[0,0],[0.231,-1.031],[0,0]],"o":[[0,0],[-1.031,-0.231],[0,0],[0.231,-1.031],[0,0],[1.031,0.231],[0,0],[-0.231,1.031]],"v":[[0.791,8.417],[-4.309,7.273],[-5.757,4.988],[-3.076,-6.968],[-0.791,-8.417],[4.31,-7.273],[5.758,-4.988],[3.076,6.969]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[31.266,24.984],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.458,0],[0,0],[-1.499,6.682],[0,0],[2.115,2.642],[3.384,0],[0,-1.458],[0,0],[1.183,-5.277],[0,0],[5.564,0],[0,0],[0,0]],"o":[[0,0],[6.849,0],[0,0],[0.74,-3.302],[-2.114,-2.641],[-1.458,0],[0,0],[5.408,0],[0,0],[-1.218,5.429],[0,0],[0,0],[0,1.458]],"v":[[-10.584,30.551],[-9.822,30.551],[4.356,19.201],[12.484,-17.043],[10.321,-26.395],[1.669,-30.551],[-0.971,-27.911],[1.669,-27.911],[9.908,-17.621],[1.78,18.623],[-9.822,27.911],[-10.584,27.911],[-13.224,27.911]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,0.855,0.243,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[23.761,31.731],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.849,0],[0,0],[0,1.458],[-1.458,0],[0,0],[-0.954,4.254],[0,0],[1.107,1.383],[1.772,0],[0,1.458],[-1.458,0],[-2.114,-2.641],[0.74,-3.301],[0,0]],"o":[[0,0],[-1.458,0],[0,-1.458],[0,0],[4.36,0],[0,0],[0.388,-1.729],[-1.107,-1.383],[-1.458,0],[0,-1.458],[3.384,0],[2.115,2.642],[0,0],[-1.499,6.684]],"v":[[-9.822,30.551],[-10.584,30.551],[-13.224,27.911],[-10.584,25.271],[-9.822,25.271],[-0.797,18.045],[7.331,-18.198],[6.199,-23.095],[1.669,-25.271],[-0.971,-27.911],[1.669,-30.551],[10.321,-26.395],[12.484,-17.043],[4.356,19.2]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,0.984,0.38,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[23.761,31.731],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,2.083],[2.083,0],[0,0],[0,-2.083],[-2.083,0],[0,0]],"o":[[0,-2.083],[0,0],[-2.083,0],[0,2.083],[0,0],[2.083,0]],"v":[[3.977,0],[0.204,-3.772],[-0.205,-3.772],[-3.977,0],[-0.205,3.772],[0.204,3.772]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.388,0.439,0.467,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.973,59.642],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.395,0],[0,0],[-0.652,1.126]],"o":[[0.652,1.126],[0,0],[1.395,0],[0,0]],"v":[[-7.633,-0.946],[-4.381,0.946],[4.381,0.946],[7.633,-0.946]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.416,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[8.797,62.467],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.083,0],[0,0],[0,2.083],[-2.082,0],[0,0],[0,-2.082]],"o":[[0,0],[-2.082,0],[0,-2.082],[0,0],[2.083,0],[0,2.083]],"v":[[4.381,3.771],[-4.382,3.771],[-8.152,0],[-4.382,-3.771],[4.381,-3.771],[8.152,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[8.797,59.642],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,2.083],[2.083,0],[0,0],[0,-2.083],[-2.083,0],[0,0]],"o":[[0,-2.083],[0,0],[-2.083,0],[0,2.083],[0,0],[2.083,0]],"v":[[3.977,0],[0.204,-3.772],[-0.205,-3.772],[-3.977,0],[-0.205,3.772],[0.204,3.772]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.388,0.439,0.467,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[25.226,3.82],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.395,0],[0,0],[-0.652,1.126]],"o":[[0.652,1.126],[0,0],[1.395,0],[0,0]],"v":[[-7.633,-0.946],[-4.381,0.946],[4.381,0.946],[7.633,-0.946]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.416,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.05,6.646],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.083,0],[0,0],[0,2.083],[-2.082,0],[0,0],[0,-2.082]],"o":[[0,0],[-2.082,0],[0,-2.082],[0,0],[2.083,0],[0,2.083]],"v":[[4.381,3.771],[-4.382,3.771],[-8.152,0],[-4.382,-3.771],[4.381,-3.771],[8.152,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.05,3.82],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":8,"ty":0,"nm":"Bolt","refId":"comp_122","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[671.75,713,0]},"a":{"a":0,"k":[19,26,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":38,"h":52,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":9,"ty":0,"nm":"Numbers","refId":"comp_124","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":10,"ty":0,"nm":"Liq","refId":"comp_127","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":11,"ty":0,"nm":"4","refId":"comp_129","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":12,"ty":0,"nm":"Cooler","refId":"comp_130","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":13,"ty":4,"nm":"wire 2","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[871.5,476.89,0]},"a":{"a":0,"k":[34.5,21,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,3.296],[3.296,0],[0,0],[6.609,6.714],[0,0],[-10.028,0],[0,0],[0,-2],[-4.582,0],[0,0]],"o":[[0,0],[-3.296,0],[0,-3.296],[0,0],[-9.508,0],[0,0],[7.033,7.144],[0,0],[1.999,0],[0,4.582],[0,0],[0,0]],"v":[[27.465,10.069],[13.581,10.069],[7.613,4.101],[1.645,-1.867],[-0.62,-1.867],[-25.797,-12.411],[-27.465,-10.768],[-0.62,0.474],[1.645,0.474],[5.271,4.101],[13.581,12.411],[27.465,12.411]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,0.855,0.243,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[40.565,28.222],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,4.582],[1.999,0],[0,0],[7.033,7.145],[0,0],[-8.781,0],[0,0],[0,-4.582],[-1.999,0],[0,0]],"o":[[0,0],[-4.582,0],[0,-1.999],[0,0],[-10.028,0],[0,0],[6.158,6.257],[0,0],[4.582,0],[0,2],[0,0],[0,0]],"v":[[27.465,13.232],[13.581,13.232],[5.271,4.923],[1.645,1.297],[-0.62,1.297],[-27.465,-9.946],[-24.128,-13.232],[-0.62,-3.387],[1.645,-3.387],[9.955,4.923],[13.581,8.549],[27.465,8.549]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,0.984,0.38,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[40.565,27.4],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.237,0],[0.183,0.186],[0.677,0.822],[0,0],[-0.4,0.33],[-0.33,-0.399],[0,0],[-0.708,-0.719],[0.369,-0.363]],"o":[[-0.242,0],[-0.747,-0.759],[0,0],[-0.328,-0.399],[0.399,-0.328],[0,0],[0.642,0.779],[0.363,0.369],[-0.182,0.18]],"v":[[2.334,3.705],[1.667,3.426],[-0.479,1.045],[-3.036,-2.058],[-2.908,-3.377],[-1.589,-3.249],[0.967,-0.146],[3.001,2.111],[2.991,3.437]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.839,0.839,0.839,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.434,13.042],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":14,"ty":4,"nm":"wire","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1018.5,447.39,0]},"a":{"a":0,"k":[22.5,18.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,4.393],[0,0],[-4.393,0],[0,0],[0.069,0.719]],"o":[[-4.393,0],[0,0],[0,4.394],[0,0],[-0.045,-0.726],[0,0]],"v":[[-7.055,2.9],[-15.022,-5.067],[-15.022,-2.901],[-7.055,5.067],[15.022,5.067],[14.848,2.9]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.827,0.38,0.075,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[29.175,30.817],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,1.811],[0,0],[0,0],[0,0],[-4.393,0],[0,0],[0.204,1.546],[0,0]],"o":[[0,0],[0,0],[0,0],[0,4.393],[0,0],[-0.099,-1.576],[0,0],[-1.811,0]],"v":[[-10.339,-2.718],[-10.339,-5.249],[-15.023,-5.249],[-15.023,-2.718],[-7.055,5.249],[15.023,5.249],[14.563,0.567],[-7.055,0.567]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.937,0.451,0.125,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[29.174,30.634],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.306,0.774],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[-0.278,-0.788]],"v":[[8.289,-1.171],[-9.164,-1.171],[-9.164,1.171],[9.164,1.171]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.827,0.38,0.075,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[31.283,16.28],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0.673,1.534],[0,0]],"o":[[0,0],[-0.561,-1.589],[0,0],[0,0]],"v":[[-9.164,2.342],[9.164,2.342],[7.313,-2.342],[-9.164,-2.342]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.937,0.451,0.125,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[31.284,15.109],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.517,0],[0,0],[0,0.518],[-0.517,0],[0,0],[0,-0.517]],"o":[[0,0],[-0.517,0],[0,-0.517],[0,0],[0.517,0],[0,0.518]],"v":[[0.712,0.936],[-0.713,0.936],[-1.649,0],[-0.713,-0.936],[0.712,-0.936],[1.649,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.839,0.839,0.839,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.499,15.109],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.517,0],[0,0.518],[0,0],[2.585,0],[0,0.518],[-0.518,0],[0,-3.619],[0,0]],"o":[[-0.517,0],[0,0],[0,-2.586],[-0.518,0],[0,-0.517],[3.618,0],[0,0],[0,0.518]],"v":[[2.813,6.074],[1.876,5.137],[1.876,0.488],[-2.812,-4.201],[-3.749,-5.138],[-2.812,-6.074],[3.749,0.488],[3.749,5.137]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.839,0.839,0.839,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[13.681,20.247],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":15,"ty":0,"nm":"Trnz","refId":"comp_132","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,433.25,0]},"a":{"a":0,"k":[19.5,9,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":39,"h":18,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":16,"ty":0,"nm":"Trnz","refId":"comp_132","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,421,0]},"a":{"a":0,"k":[19.5,9,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":39,"h":18,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":17,"ty":0,"nm":"Trnz","refId":"comp_132","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,408.25,0]},"a":{"a":0,"k":[19.5,9,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":39,"h":18,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":18,"ty":0,"nm":"Tranz2","refId":"comp_133","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[975,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":19,"ty":0,"nm":"Tranz2","refId":"comp_133","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[967.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":20,"ty":0,"nm":"Tranz2","refId":"comp_133","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[952.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":21,"ty":0,"nm":"Tranz2","refId":"comp_133","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":22,"ty":0,"nm":"Chip","refId":"comp_134","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":90},"p":{"a":0,"k":[1021,520,0]},"a":{"a":0,"k":[20,13,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":40,"h":26,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":23,"ty":0,"nm":"Chip","refId":"comp_134","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[886,623,0]},"a":{"a":0,"k":[20,13,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":40,"h":26,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":24,"ty":0,"nm":"Chip","refId":"comp_134","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[886,602,0]},"a":{"a":0,"k":[20,13,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":40,"h":26,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":25,"ty":0,"nm":"Chip","refId":"comp_134","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[886,581,0]},"a":{"a":0,"k":[20,13,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":40,"h":26,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":26,"ty":4,"nm":"0 - Group 1","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[952.322,546.947,0]},"a":{"a":0,"k":[95.322,153.057,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,11.6],[0,0],[-11.6,0],[0,0],[0,-11.6],[0,0],[11.599,0]],"o":[[-11.6,0],[0,0],[0,-11.6],[0,0],[11.599,0],[0,0],[0,11.6],[0,0]],"v":[[-19.465,98.879],[-40.502,77.842],[-40.502,-77.842],[-19.465,-98.88],[19.467,-98.88],[40.503,-77.842],[40.503,77.842],[19.467,98.879]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[41.548,0],[0,0],[0,-41.548],[0,0],[-41.548,0],[0,0],[0,41.548],[0,0]],"o":[[0,0],[-41.548,0],[0,0],[0,41.548],[0,0],[41.548,0],[0,0],[0,-41.548]],"v":[[19.467,-153.193],[-19.465,-153.193],[-94.815,-77.842],[-94.815,77.842],[-19.465,153.193],[19.467,153.193],[94.815,77.842],[94.815,-77.842]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[-15.343,0],[0,0],[0,15.343],[0,0],[15.343,0],[0,0],[0,-15.343],[0,0]],"o":[[0,0],[15.343,0],[0,0],[0,-15.343],[0,0],[-15.343,0],[0,0],[0,15.343]],"v":[[-19.465,105.668],[19.467,105.668],[47.291,77.842],[47.291,-77.842],[19.467,-105.669],[-19.465,-105.669],[-47.291,-77.842],[-47.291,77.842]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,-37.805],[0,0],[37.804,0],[0,0],[0,37.805],[0,0],[-37.804,0]],"o":[[37.804,0],[0,0],[0,37.805],[0,0],[-37.804,0],[0,0],[0,-37.805],[0,0]],"v":[[19.467,-146.404],[88.026,-77.842],[88.026,77.842],[19.467,146.404],[-19.465,146.404],[-88.026,77.842],[-88.026,-77.842],[-19.465,-146.404]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-468.682,228.498],[491.318,228.498],[491.318,-284.502],[-468.682,-284.502]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-468.682,-284.502],[491.318,-284.502],[491.318,228.498],[-468.682,228.498]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[95.322,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":8,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":27,"ty":0,"nm":"hole","refId":"comp_135","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960.875,552.875,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,-100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":28,"ty":0,"nm":"hole","refId":"comp_135","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[944.25,553,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[-100,-100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":29,"ty":0,"nm":"hole","refId":"comp_135","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[944.25,539.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[-100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":30,"ty":0,"nm":"hole","refId":"comp_135","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":31,"ty":4,"nm":"0","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[962.479,546.947,0]},"a":{"a":0,"k":[962.479,546.947,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-2.472,-2.472],[-2.472,2.472],[0,0],[0.29,0.29],[0,0],[0.29,-0.29],[0,0]],"o":[[2.472,2.472],[0,0],[0.29,-0.29],[0,0],[-0.29,-0.29],[0,0],[-2.472,2.472]],"v":[[-5.431,5.431],[3.52,5.431],[7.613,1.338],[7.613,0.287],[-0.287,-7.613],[-1.338,-7.613],[-5.431,-3.52]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[161.662,28.173],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 16","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1018.935,421.791],"ix":2},"a":{"a":0,"k":[161.935,27.901],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 16","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0.29,-0.29],[0,0],[-0.29,-0.291],[0,0],[-2.472,2.471],[2.472,2.472]],"o":[[-0.29,-0.29],[0,0],[-0.29,0.291],[0,0],[2.472,2.471],[2.472,-2.472],[0,0]],"v":[[1.338,-7.613],[0.287,-7.613],[-7.613,0.286],[-7.613,1.339],[-3.52,5.431],[5.431,5.431],[5.431,-3.52]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[32.846,28.173],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 17","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[889.573,421.791],"ix":2},"a":{"a":0,"k":[32.573,27.901],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 17","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-39.676],[0,0],[-39.676,0],[0,0],[0,39.676],[0,0],[-39.676,0],[0,0]],"o":[[0,0],[0,39.677],[0,0],[-39.675,-0.002],[0,0],[0,-39.676],[0,0],[-39.676,0]],"v":[[-39.763,-77.843],[-39.763,77.842],[32.191,149.798],[39.762,149.798],[-32.191,77.842],[-32.191,-77.843],[39.763,-149.798],[32.191,-149.798]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[43.664,153.058],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 18","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[900.664,546.948],"ix":2},"a":{"a":0,"k":[43.664,153.058],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 18","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[14.922,0],[0,0],[4.969,-7.62],[-7.749,0],[0,0],[0,-13.472],[0,0],[13.471,0],[0,0],[4.479,5.645],[-9.755,0],[0,0],[-0.659,14.762],[0,0.402],[0,0.019],[0,0],[0.021,0.416]],"o":[[0,0],[-9.756,0],[4.479,-5.645],[0,0],[13.471,0],[0,0],[0,13.472],[0,0],[-7.749,0],[4.97,7.62],[0,0],[14.922,0],[0.02,-0.397],[0,-0.019],[0,0],[0,-0.421],[-0.659,-14.762]],"v":[[17.212,-105.669],[-21.72,-105.669],[-45.038,-92.997],[-25.897,-102.273],[13.035,-102.273],[37.466,-77.842],[37.466,77.842],[13.035,102.274],[-25.897,102.274],[-45.038,92.999],[-21.72,105.669],[17.212,105.669],[45.006,79.098],[45.036,77.899],[45.038,77.842],[45.038,-77.842],[45.006,-79.098]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[101.753,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 19","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[958.753,546.947],"ix":2},"a":{"a":0,"k":[101.753,153.057],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 19","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,1.8],[-1.801,0],[0,0],[0,1.801],[1.801,0],[0,0],[0,1.801],[-1.8,0],[0,0],[0,1.8],[1.801,0],[0,0],[0,-2.278],[0,0]],"o":[[1.801,0],[0,-1.801],[0,0],[1.801,0],[0,-1.801],[0,0],[-1.8,0],[0,-1.8],[0,0],[1.801,0],[0,-1.801],[0,0],[-0.218,2.221],[0,0],[0,0]],"v":[[-9.848,13.041],[-6.589,9.781],[-3.327,6.52],[12.755,6.52],[16.014,3.26],[12.755,0],[6.625,0],[3.365,-3.261],[6.625,-6.521],[12.755,-6.521],[16.014,-9.781],[12.755,-13.041],[-15.678,-13.041],[-16.014,-6.291],[-16.014,13.041]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.098,0.098,0.098,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[23.31,81.505],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 26","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[880.31,475.395],"ix":2},"a":{"a":0,"k":[23.31,81.505],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 26","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.035,0],[-0.325,0.558],[0,0],[0,0.517],[0.518,0],[0,0],[0.692,0],[0,-1.034]],"o":[[0.692,0],[0,0],[0.518,0],[0,-0.517],[0,0],[-0.325,-0.558],[-1.035,0],[0,1.035]],"v":[[-1.698,1.873],[-0.084,0.936],[2.634,0.936],[3.571,0.001],[2.634,-0.937],[-0.084,-0.937],[-1.698,-1.874],[-3.571,-0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[181.054,208.483],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 27","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1038.054,602.373],"ix":2},"a":{"a":0,"k":[181.054,208.483],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 27","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.146,0],[0,-1.034],[-0.557,-0.325],[0,0],[-0.175,-0.176],[0,0],[-0.248,0],[0,0],[0,0.517],[0,0],[0.518,0],[0,-0.517],[0,0],[0,0],[0,0],[0,0],[0,0.692],[0.05,0.17],[0,0],[-0.117,0],[0,1.035],[0.575,0.32],[0,0],[0.517,0],[0,-0.518],[0,0],[0,-0.679],[-0.065,-0.191],[0,0]],"o":[[-1.035,0],[0,0.692],[0,0],[0,0.248],[0,0],[0.176,0.175],[0,0],[0.518,0],[0,0],[0,-0.517],[-0.517,0],[0,0],[0,0],[0,0],[0,0],[0.558,-0.324],[0,-0.185],[0,0],[0.11,0.02],[1.034,0],[0,-0.705],[0,0],[0,-0.518],[-0.518,0],[0,0],[-0.54,0.329],[0,0.212],[0,0],[-0.137,-0.031]],"v":[[-21.446,-44.335],[-23.319,-42.462],[-22.383,-40.848],[-22.383,31.319],[-22.109,31.982],[2.951,57.041],[3.613,57.315],[22.382,57.315],[23.319,56.378],[23.319,41.645],[22.382,40.709],[21.445,41.645],[21.445,55.441],[4.002,55.441],[-20.51,30.931],[-20.51,-40.848],[-19.573,-42.462],[-19.658,-42.992],[-16.841,-45.567],[-16.501,-45.533],[-14.628,-47.406],[-15.597,-49.037],[-15.597,-56.378],[-16.533,-57.315],[-17.47,-56.378],[-17.47,-49.003],[-18.375,-47.406],[-18.267,-46.802],[-21.022,-44.283]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[61.47,214.629],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 29","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[918.469,608.519],"ix":2},"a":{"a":0,"k":[61.47,214.629],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 29","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0.692],[1.034,0],[0,-1.035],[-0.558,-0.325],[0,0],[0,-0.692],[-1.035,0],[0,1.035],[0.558,0.324],[0,0]],"o":[[0,-1.035],[-1.035,0],[0,0.692],[0,0],[-0.558,0.325],[0,1.035],[1.034,0],[0,-0.692],[0,0],[0.558,-0.325]],"v":[[1.874,-11.988],[0,-13.861],[-1.874,-11.988],[-0.937,-10.374],[-0.937,10.373],[-1.874,11.987],[0,13.861],[1.874,11.987],[0.936,10.374],[0.936,-10.374]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[164.548,100.736],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 30","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1021.548,494.626],"ix":2},"a":{"a":0,"k":[164.548,100.736],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 30","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.692,0],[0,-1.034],[-0.558,-0.324],[0,0],[-0.517,0],[0,0.517],[0,0],[-0.164,0.281],[0,0],[0,0.518],[0.518,0],[0,0]],"o":[[-1.035,0],[0,0.692],[0,0],[0,0.517],[0.517,0],[0,0],[0.281,-0.164],[0,0],[0.518,0],[0,-0.517],[0,0],[-0.325,-0.558]],"v":[[-18.48,-32.816],[-20.353,-30.943],[-19.416,-29.329],[-19.416,31.88],[-18.48,32.816],[-17.543,31.88],[-17.543,-29.329],[-16.866,-30.006],[19.416,-30.006],[20.353,-30.943],[19.416,-31.879],[-16.866,-31.879]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[168.599,106.198],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 31","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1025.599,500.088],"ix":2},"a":{"a":0,"k":[168.599,106.198],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 31","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.517,0],[0,0],[0.692,0],[0,-1.035],[-0.558,-0.324],[0,0],[-0.517,0],[0,0.517],[0,0],[-0.163,0.281],[0,0],[0,0.517]],"o":[[0,0],[-0.324,-0.558],[-1.034,0],[0,0.691],[0,0],[0,0.517],[0.518,0],[0,0],[0.281,-0.163],[0,0],[0.517,0],[0,-0.518]],"v":[[4.707,-25.414],[-2.156,-25.414],[-3.771,-26.35],[-5.643,-24.477],[-4.706,-22.863],[-4.706,25.414],[-3.771,26.35],[-2.833,25.414],[-2.833,-22.863],[-2.156,-23.54],[4.707,-23.54],[5.643,-24.477]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[183.309,115.099],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 32","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1040.309,508.989],"ix":2},"a":{"a":0,"k":[183.309,115.099],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 32","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.035,0],[-0.325,0.558],[0,0],[-0.692,0],[0,1.034],[0.038,0.148],[0,0],[0.366,0.366],[0.366,-0.365],[0,0],[0.174,0],[0.325,-0.558],[0,0],[0.692,0],[0,-1.035]],"o":[[0.692,0],[0,0],[0.325,0.558],[1.035,0],[0,-0.159],[0,0],[0.366,-0.366],[-0.366,-0.365],[0,0],[-0.16,-0.044],[-0.692,0],[0,0],[-0.325,-0.558],[-1.035,0],[0,1.034]],"v":[[-10.48,5.724],[-8.867,4.787],[1.136,4.787],[2.751,5.724],[4.623,3.851],[4.561,3.392],[11.988,-4.034],[11.988,-5.359],[10.662,-5.359],[3.251,2.053],[2.751,1.977],[1.136,2.914],[-8.867,2.914],[-10.48,1.977],[-12.354,3.851]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[118.291,10.414],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 34","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[975.245,404.35],"ix":2},"a":{"a":0,"k":[118.245,10.46],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 34","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.035,0],[-0.325,0.558],[0,0],[-0.691,0],[0,1.035],[0.048,0.165],[0,0],[0.365,0.366],[0.367,-0.366],[0,0],[0.153,0],[0.324,-0.558],[0,0],[0.692,0],[0,-1.034]],"o":[[0.692,0],[0,0],[0.324,0.558],[1.035,0],[0,-0.18],[0,0],[0.365,-0.366],[-0.367,-0.366],[0,0],[-0.142,-0.035],[-0.692,0],[0,0],[-0.325,-0.558],[-1.035,0],[0,1.035]],"v":[[-17.846,11.021],[-16.232,10.085],[-2.013,10.085],[-0.4,11.021],[1.474,9.148],[1.392,8.631],[19.354,-9.331],[19.354,-10.655],[18.028,-10.655],[0.041,7.333],[-0.4,7.275],[-2.013,8.212],[-16.232,8.212],[-17.846,7.275],[-19.719,9.148]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[125.657,17.904],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 35","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[982.611,411.839],"ix":2},"a":{"a":0,"k":[125.611,17.949],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 35","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.196,0],[0.325,-0.558],[0,0],[0.013,0.02],[0.875,-0.552],[-0.553,-0.875],[-0.875,0.552],[-0.147,0.254],[0,0],[-0.692,0],[0,1.034],[0.028,0.129],[0,0],[0.366,0.366],[0.366,-0.366],[0,0]],"o":[[-0.692,0],[0,0],[-0.012,-0.021],[-0.552,-0.875],[-0.875,0.552],[0.552,0.875],[0.265,-0.168],[0,0],[0.325,0.558],[1.035,0],[0,-0.138],[0,0],[0.366,-0.366],[-0.366,-0.366],[0,0],[-0.177,-0.055]],"v":[[0.08,9.235],[-1.534,10.172],[-20.785,10.172],[-20.817,10.109],[-23.401,9.524],[-23.985,12.108],[-21.401,12.693],[-20.788,12.045],[-1.534,12.045],[0.08,12.982],[1.953,11.109],[1.909,10.709],[24.172,-11.554],[24.172,-12.879],[22.847,-12.879],[0.639,9.329]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[130.212,28.73],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 36","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[987.298,422.534],"ix":2},"a":{"a":0,"k":[130.298,28.644],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 36","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0.691],[0.05,0.169],[0,0],[-0.116,0],[0,1.035],[0.575,0.32],[0,0],[0.517,0],[0,-0.517],[0,0],[0,-0.679],[-0.065,-0.191],[0,0],[0.146,0],[0,-1.035],[-0.558,-0.324],[0,0],[-0.175,-0.176],[0,0],[-0.249,0],[0,0],[0,0.517],[0,0],[0.517,0],[0,-0.517],[0,0],[0,0]],"o":[[0,0],[0.558,-0.324],[0,-0.186],[0,0],[0.111,0.02],[1.035,0],[0,-0.705],[0,0],[0,-0.517],[-0.518,0],[0,0],[-0.541,0.328],[0,0.213],[0,0],[-0.136,-0.032],[-1.035,0],[0,0.691],[0,0],[0,0.249],[0,0],[0.176,0.175],[0,0],[0.517,0],[0,0],[0,-0.517],[-0.518,0],[0,0],[0,0],[0,0]],"v":[[-24.993,28.361],[-24.993,-43.418],[-24.057,-45.031],[-24.141,-45.561],[-21.325,-48.137],[-20.985,-48.103],[-19.111,-49.976],[-20.08,-51.607],[-20.08,-58.948],[-21.016,-59.885],[-21.954,-58.948],[-21.954,-51.572],[-22.859,-49.976],[-22.751,-49.372],[-25.506,-46.852],[-25.929,-46.905],[-27.804,-45.031],[-26.867,-43.418],[-26.867,28.749],[-26.593,29.412],[3.606,59.611],[4.27,59.885],[26.868,59.885],[27.804,58.948],[27.804,39.075],[26.868,38.139],[25.93,39.075],[25.93,58.012],[4.657,58.012]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[60.792,217.199],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 37","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[917.792,611.089],"ix":2},"a":{"a":0,"k":[60.792,217.199],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 37","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.517,0],[0,0],[0.777,0],[0.284,-0.674],[0,0],[0.777,0],[0.283,-0.674],[0,0],[0.777,0],[0.284,-0.674],[0,0],[0,-0.518],[-0.518,0],[0,0],[-0.6,0],[-0.343,0.44],[0,0],[-0.601,0],[-0.342,0.44],[0,0],[-0.601,0],[-0.343,0.44],[0,0],[0,0],[0,0],[0,0],[0,0],[0.517,0],[0,-0.517],[0,0],[0,0],[0,0],[0.517,0],[0,-0.518],[0,0],[0,0],[0,0],[0,0],[0,0.691],[0.05,0.169],[0,0],[-0.116,0],[0,1.035],[0.575,0.32],[0,0],[0.517,0],[0,-0.517],[0,0],[0,-0.679],[-0.065,-0.191],[0,0],[0.146,0],[0,-1.035],[-0.558,-0.324],[0,0],[-0.175,-0.175],[0,0],[-0.248,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0.691],[0.05,0.169],[0,0],[-0.117,0],[0,1.035],[0.575,0.32],[0,0],[0.517,0],[0,-0.517],[0,0],[0,-0.679],[-0.065,-0.191],[0,0],[0.146,0],[0,-1.035],[-0.558,-0.324],[0,0],[-0.175,-0.176],[0,0],[-0.249,0],[0,0],[0,0.517],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0.691],[0.051,0.169],[0,0],[-0.117,0],[0,1.035],[0.575,0.32],[0,0],[0.517,0],[0,-0.517],[0,0],[0,-0.679],[-0.065,-0.191],[0,0],[0.147,0],[0,-1.035],[-0.558,-0.324],[0,0],[-0.175,-0.175],[0,0],[-0.249,0],[0,0],[0,0.517],[0,0],[0,0],[-0.176,0.176],[0,0],[0,0.249],[0,0]],"o":[[0,0],[-0.284,-0.674],[-0.777,0],[0,0],[-0.284,-0.674],[-0.777,0],[0,0],[-0.284,-0.674],[-0.777,0],[0,0],[-0.518,0],[0,0.517],[0,0],[0.343,0.44],[0.6,0],[0,0],[0.343,0.44],[0.6,0],[0,0],[0.343,0.44],[0.6,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,-0.517],[-0.517,0],[0,0],[0,0],[0,0],[0,-0.518],[-0.517,0],[0,0],[0,0],[0,0],[0,0],[0.558,-0.324],[0,-0.186],[0,0],[0.111,0.02],[1.035,0],[0,-0.705],[0,0],[0,-0.517],[-0.517,0],[0,0],[-0.54,0.329],[0,0.213],[0,0],[-0.137,-0.032],[-1.035,0],[0,0.691],[0,0],[0,0.249],[0,0],[0.176,0.176],[0,0],[0,0],[0,0],[0,0],[0,0],[0.557,-0.324],[0,-0.186],[0,0],[0.111,0.02],[1.034,0],[0,-0.705],[0,0],[0,-0.517],[-0.517,0],[0,0],[-0.54,0.328],[0,0.212],[0,0],[-0.137,-0.032],[-1.035,0],[0,0.691],[0,0],[0,0.249],[0,0],[0.176,0.176],[0,0],[0.517,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.558,-0.324],[0,-0.186],[0,0],[0.11,0.02],[1.035,0],[0,-0.705],[0,0],[0,-0.517],[-0.517,0],[0,0],[-0.541,0.328],[0,0.212],[0,0],[-0.137,-0.032],[-1.034,0],[0,0.691],[0,0],[0,0.249],[0,0],[0.175,0.175],[0,0],[0.517,0],[0,0],[0,0],[0.249,0],[0,0],[0.176,-0.176],[0,0],[0,-0.518]],"v":[[77.915,-55.607],[76.312,-55.607],[74.585,-56.754],[72.858,-55.607],[69.063,-55.607],[67.336,-56.754],[65.609,-55.607],[61.668,-55.607],[59.941,-56.754],[58.214,-55.607],[44.931,-55.607],[43.994,-54.67],[44.931,-53.734],[58.469,-53.734],[59.941,-53.007],[61.413,-53.734],[65.864,-53.734],[67.336,-53.007],[68.807,-53.734],[73.113,-53.734],[74.585,-53.007],[76.057,-53.734],[76.978,-53.734],[76.978,26.464],[48.289,55.153],[1.607,55.153],[1.607,33.795],[0.671,32.859],[-0.266,33.795],[-0.266,55.153],[-2.023,55.153],[-2.023,33.913],[-2.959,32.976],[-3.896,33.913],[-3.896,55.153],[-32.358,55.153],[-65.719,21.793],[-65.719,-49.986],[-64.782,-51.599],[-64.867,-52.129],[-62.051,-54.705],[-61.711,-54.671],[-59.837,-56.544],[-60.806,-58.175],[-60.806,-65.516],[-61.742,-66.453],[-62.679,-65.516],[-62.679,-58.141],[-63.584,-56.544],[-63.476,-55.94],[-66.231,-53.42],[-66.655,-53.473],[-68.529,-51.599],[-67.592,-49.986],[-67.592,22.181],[-67.318,22.843],[-33.409,56.752],[-32.747,57.026],[-3.896,57.026],[-3.896,59.736],[-32.726,59.736],[-70.88,21.581],[-70.88,-49.986],[-69.944,-51.599],[-70.029,-52.129],[-67.213,-54.705],[-66.872,-54.671],[-64.999,-56.544],[-65.968,-58.175],[-65.968,-65.516],[-66.904,-66.453],[-67.841,-65.516],[-67.841,-58.14],[-68.746,-56.544],[-68.638,-55.94],[-71.393,-53.42],[-71.817,-53.473],[-73.69,-51.599],[-72.753,-49.986],[-72.753,21.969],[-72.48,22.632],[-33.777,61.334],[-33.114,61.609],[-2.959,61.609],[-2.023,60.672],[-2.023,57.026],[-0.266,57.026],[-0.266,64.58],[-33.044,64.58],[-76.042,21.581],[-76.042,-49.986],[-75.105,-51.599],[-75.191,-52.129],[-72.374,-54.705],[-72.034,-54.671],[-70.161,-56.544],[-71.129,-58.175],[-71.129,-65.516],[-72.066,-66.453],[-73.002,-65.516],[-73.002,-58.14],[-73.908,-56.544],[-73.799,-55.94],[-76.555,-53.42],[-76.979,-53.473],[-78.852,-51.599],[-77.915,-49.986],[-77.915,21.969],[-77.641,22.631],[-34.094,66.179],[-33.432,66.453],[0.671,66.453],[1.607,65.516],[1.607,57.026],[48.677,57.026],[49.34,56.752],[78.577,27.515],[78.852,26.852],[78.852,-54.67]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[96.355,223.767],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 38","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[953.355,617.657],"ix":2},"a":{"a":0,"k":[96.355,223.767],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 38","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[-0.691,0],[0,1.035],[0.558,0.324],[0,0],[0,0.692],[0.558,0.324],[0,0],[0,0],[-0.281,-0.164],[0,0],[0.163,-0.281],[0,0]],"o":[[0,0],[0.324,0.558],[1.035,0],[0,-0.691],[0,0],[0.558,-0.325],[0,-0.691],[0,0],[0,0],[0.163,0.281],[0,0],[-0.282,0.163],[0,0],[0,0]],"v":[[-37.689,62.387],[-8.582,62.387],[-6.969,63.324],[-5.094,61.45],[-6.031,59.837],[-6.031,46.263],[-5.094,44.649],[-6.031,43.036],[-6.031,40.434],[-3.419,40.434],[-2.742,41.111],[-2.742,64.989],[-3.419,65.666],[-37.689,65.666]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-13.065,43.713],[-37.689,43.713],[-37.689,40.434],[-13.065,40.434]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0]],"o":[[0,0]],"v":[[-13.065,40.434]],"c":false}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0.164,-0.281],[0,0],[0,0],[0,0]],"o":[[-0.282,0.163],[0,0],[0,0],[0,0],[0,0]],"v":[[-13.065,47.251],[-13.743,47.928],[-37.689,47.928],[-37.689,45.586],[-13.065,45.586]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ind":4,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[-0.692,0],[0,1.035],[1.034,0],[0.324,-0.558],[0,0],[0,0],[0,0],[-0.282,-0.164],[0,0],[0.164,-0.282]],"o":[[0,0],[0,0],[0.324,0.558],[1.034,0],[0,-1.035],[-0.692,0],[0,0],[0,0],[0,0],[0.164,0.281],[0,0],[-0.282,0.164],[0,0]],"v":[[-37.689,56.299],[-37.689,53.986],[-19.358,53.986],[-17.745,54.923],[-15.871,53.05],[-17.745,51.176],[-19.358,52.113],[-37.689,52.113],[-37.689,49.801],[-13.743,49.801],[-13.065,50.478],[-13.065,55.621],[-13.743,56.299]],"c":true}},"nm":"Path 5","mn":"ADBE Vector Shape - Group"},{"ind":5,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[-0.692,0],[0,1.035],[0.557,0.324],[0,0],[0,0.692],[0.557,0.324],[0,0],[0,0],[-0.281,-0.164],[0,0],[0.163,-0.281]],"o":[[0,0],[0,0],[0.325,0.557],[1.034,0],[0,-0.692],[0,0],[0.557,-0.325],[0,-0.691],[0,0],[0,0],[0.164,0.281],[0,0],[-0.281,0.163],[0,0]],"v":[[-37.689,60.514],[-37.689,58.172],[-13.743,58.172],[-12.129,59.109],[-10.257,57.235],[-11.193,55.622],[-11.193,50.478],[-10.257,48.864],[-11.193,47.251],[-11.193,45.586],[-8.582,45.586],[-7.905,46.263],[-7.905,59.837],[-8.582,60.514]],"c":true}},"nm":"Path 6","mn":"ADBE Vector Shape - Group"},{"ind":6,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0.163,-0.282],[0,0],[0,0]],"o":[[0,0],[-0.281,0.164],[0,0],[0,0],[0,0]],"v":[[-7.905,40.434],[-7.905,43.035],[-8.582,43.713],[-11.193,43.713],[-11.193,40.434]],"c":true}},"nm":"Path 7","mn":"ADBE Vector Shape - Group"},{"ind":7,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.692,0],[0,1.035],[0.557,0.324],[0,0],[0,0.692],[0.557,0.324],[0,0],[0.19,0.177],[0,0],[0,0],[0,0.692],[0.04,0.153],[0,0],[-0.232,0],[-0.325,0.558],[0,0],[-0.691,0],[-0.325,0.558],[0,0],[0,0.517],[0.517,0],[0,0],[0.281,0.163],[0,0],[-0.164,0.281],[0,0],[0,0.517],[0.517,0],[0,0],[0.281,0.164],[0,0],[-0.164,0.282],[0,0],[0,0.517],[0.518,0],[0,0],[0.692,0],[0.324,-0.558],[0,0],[0.692,0],[0.154,-0.041],[0,0],[0.366,-0.365],[-0.366,-0.366],[0,0],[0,-0.167],[-1.035,0],[-0.325,0.558],[0,0],[-0.281,-0.163],[0,0],[0,0],[0.692,0],[0.045,-0.995],[0,0],[0.273,0],[0.238,-0.761],[0,0],[0,-0.518],[-0.517,0],[0,0],[-0.521,0],[0,1.035],[0.005,0.051],[0,0],[-0.337,0],[-0.325,0.558],[0,0],[0,0],[0.163,-0.281],[0,0],[0.692,0],[0,-1.035],[-0.041,-0.154],[0,0],[0.233,0],[0.324,-0.557],[0,0],[0,-0.518],[-0.517,0],[0,0],[-0.691,0],[0,1.034],[0.014,0.093],[0,0],[-0.167,0],[-0.325,0.558],[0,0],[-0.281,-0.163],[0,0],[0,0],[0.692,0],[0.044,-0.995],[0,0],[0.273,0],[0.238,-0.761],[0,0],[0,-0.517],[-0.517,0],[0,0],[-0.521,0],[0,1.035],[0.005,0.051],[0,0],[-0.337,0],[-0.325,0.558],[0,0],[0,0],[0.163,-0.282],[0,0],[0.692,0],[0,-1.034],[-0.014,-0.094],[0,0],[0.168,0],[0.324,-0.558],[0,0],[0,-0.518],[-0.517,0],[0,0],[-0.281,-0.163],[0,0],[-0.19,-0.178],[0,0],[0,0],[0.164,-0.282],[0,0],[0,0],[0.176,0.176],[0,0],[0,0],[0.517,0],[0,0],[0,-0.517],[-0.518,0],[0,0],[0,0],[-0.175,-0.175],[0,0],[0,0],[0,0],[0,0],[0.176,0.175],[0,0],[0,0],[0.517,0],[0,0],[0,-0.517],[-0.517,0],[0,0],[0,0],[-0.176,-0.176],[0,0],[0,0],[0,0],[0,-0.517],[0,0],[0,0],[0,0],[0,0],[0,0],[-0.517,0],[0,0]],"o":[[1.035,0],[0,-0.691],[0,0],[0.557,-0.325],[0,-0.692],[0,0],[0,-0.259],[0,0],[0,0],[0.558,-0.325],[0,-0.165],[0,0],[0.205,0.077],[0.692,0],[0,0],[0.324,0.558],[0.692,0],[0,0],[0.517,0],[0,-0.517],[0,0],[-0.164,-0.281],[0,0],[0.281,-0.163],[0,0],[0.517,0],[0,-0.517],[0,0],[-0.164,-0.281],[0,0],[0.281,-0.163],[0,0],[0.518,0],[0,-0.517],[0,0],[-0.325,-0.558],[-0.692,0],[0,0],[-0.325,-0.558],[-0.167,0],[0,0],[-0.366,-0.365],[-0.366,0.367],[0,0],[-0.041,0.154],[0,1.034],[0.692,0],[0,0],[0.163,0.282],[0,0],[0,0],[-0.325,-0.557],[-1.006,0],[0,0],[-0.234,-0.105],[-0.839,0],[0,0],[-0.517,0],[0,0.517],[0,0],[0.34,0.343],[1.035,0],[0,-0.052],[0,0],[0.273,0.155],[0.692,0],[0,0],[0,0],[-0.282,0.164],[0,0],[-0.325,-0.558],[-1.035,0],[0,0.167],[0,0],[-0.206,-0.078],[-0.692,0],[0,0],[-0.517,0],[0,0.518],[0,0],[0.324,0.558],[1.035,0],[0,-0.097],[0,0],[0.154,0.04],[0.692,0],[0,0],[0.163,0.282],[0,0],[0,0],[-0.325,-0.557],[-1.006,0],[0,0],[-0.234,-0.104],[-0.839,0],[0,0],[-0.517,0],[0,0.518],[0,0],[0.34,0.343],[1.035,0],[0,-0.052],[0,0],[0.273,0.155],[0.692,0],[0,0],[0,0],[-0.282,0.163],[0,0],[-0.325,-0.558],[-1.035,0],[0,0.099],[0,0],[-0.154,-0.041],[-0.692,0],[0,0],[-0.517,0],[0,0.517],[0,0],[0.163,0.281],[0,0],[0,0.26],[0,0],[0,0],[-0.282,0.163],[0,0],[0,0],[0,-0.249],[0,0],[0,0],[0,-0.517],[0,0],[-0.518,0],[0,0.517],[0,0],[0,0],[0,0.248],[0,0],[0,0],[0,0],[0,0],[0,-0.248],[0,0],[0,0],[0,-0.517],[0,0],[-0.517,0],[0,0.517],[0,0],[0,0],[0,0.249],[0,0],[0,0],[0,0],[-0.517,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0.517],[0,0],[0.324,0.558]],"v":[[-1.806,68.476],[0.068,66.602],[-0.87,64.989],[-0.87,41.111],[0.068,39.497],[-0.87,37.884],[-0.87,10.22],[-1.168,9.536],[-12.023,-0.604],[-12.023,-16.106],[-11.086,-17.721],[-11.155,-18.196],[4.259,-33.61],[4.915,-33.485],[6.53,-34.423],[21.161,-34.423],[22.775,-33.485],[24.388,-34.423],[38.626,-34.423],[39.563,-35.36],[38.626,-36.295],[24.388,-36.295],[23.712,-36.972],[23.712,-47.347],[24.388,-48.024],[38.626,-48.024],[39.563,-48.959],[38.626,-49.896],[24.388,-49.896],[23.712,-50.574],[23.712,-59.574],[24.388,-60.251],[37.482,-60.251],[38.419,-61.187],[37.482,-62.123],[24.388,-62.123],[22.775,-63.061],[21.161,-62.123],[6.53,-62.123],[4.915,-63.061],[4.436,-62.99],[-0.682,-68.11],[-2.008,-68.11],[-2.008,-66.786],[3.112,-61.666],[3.042,-61.187],[4.915,-59.313],[6.53,-60.251],[21.161,-60.251],[21.839,-59.574],[21.839,-56.045],[6.53,-56.045],[4.915,-56.981],[3.051,-55.192],[-12.197,-39.945],[-12.961,-40.11],[-14.741,-38.794],[-34.254,-38.794],[-35.19,-37.856],[-34.254,-36.92],[-14.292,-36.92],[-12.961,-36.364],[-11.086,-38.238],[-11.103,-38.39],[3.995,-53.486],[4.915,-53.235],[6.53,-54.173],[21.839,-54.173],[21.839,-50.574],[21.161,-49.896],[6.53,-49.896],[4.915,-50.834],[3.042,-48.959],[3.112,-48.48],[-12.301,-33.068],[-12.961,-33.195],[-14.573,-32.257],[-35.815,-32.257],[-36.753,-31.321],[-35.815,-30.385],[-14.573,-30.385],[-12.961,-29.447],[-11.086,-31.321],[-11.116,-31.604],[4.436,-47.156],[4.915,-47.087],[6.53,-48.024],[21.161,-48.024],[21.839,-47.347],[21.839,-43.049],[6.53,-43.049],[4.915,-43.985],[3.051,-42.196],[-12.197,-26.949],[-12.961,-27.114],[-14.741,-25.796],[-34.254,-25.796],[-35.19,-24.86],[-34.254,-23.924],[-14.292,-23.924],[-12.961,-23.368],[-11.086,-25.24],[-11.103,-25.394],[3.995,-40.489],[4.915,-40.239],[6.53,-41.175],[21.839,-41.175],[21.839,-36.972],[21.161,-36.295],[6.53,-36.295],[4.915,-37.232],[3.042,-35.36],[3.07,-35.072],[-12.478,-19.524],[-12.961,-19.593],[-14.573,-18.657],[-35.815,-18.657],[-36.753,-17.719],[-35.815,-16.783],[-14.573,-16.783],[-13.896,-16.106],[-13.896,-0.196],[-13.599,0.489],[-2.742,10.627],[-2.742,37.884],[-3.421,38.561],[-6.031,38.561],[-6.031,14.167],[-6.306,13.504],[-18.163,1.648],[-18.163,-12.062],[-19.099,-12.998],[-36.977,-12.998],[-37.914,-12.062],[-36.977,-11.124],[-20.035,-11.124],[-20.035,2.036],[-19.762,2.698],[-7.905,14.555],[-7.905,38.561],[-11.193,38.561],[-11.193,17.044],[-11.467,16.382],[-23.471,4.378],[-23.471,-5.972],[-24.408,-6.91],[-36.977,-6.91],[-37.914,-5.972],[-36.977,-5.036],[-25.345,-5.036],[-25.345,4.766],[-25.069,5.429],[-13.065,17.432],[-13.065,38.561],[-38.626,38.561],[-39.563,39.497],[-39.563,44.649],[-39.563,48.865],[-39.563,57.235],[-39.563,61.45],[-39.563,66.602],[-38.626,67.539],[-3.419,67.539]],"c":true}},"nm":"Path 8","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-420.103,306.104],[539.897,306.104],[539.897,-206.896],[-420.103,-206.896]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-420.103,-206.896],[539.897,-206.896],[539.897,306.104],[-420.103,306.104]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[46.743,75.451],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 40","np":12,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[903.743,469.387],"ix":2},"a":{"a":0,"k":[46.743,75.497],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 40","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.517,0],[0,0],[-0.176,0.175],[0,0],[0,0.248],[0,0],[0.517,0],[0,0],[0,-0.517],[-0.517,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[-0.518,0],[0,0],[-0.176,0.176],[0,0],[0,0.249],[0,0],[0.517,0],[0,0],[0,-0.517],[0,0],[-0.517,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.517,0],[0,-0.517],[0,0],[-0.517,0],[0,0],[-0.175,0.175],[0,0],[0,0.249],[0,0],[0.518,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.517,0],[0,0],[0,-0.517],[0,0]],"o":[[0,0],[0.249,0],[0,0],[0.176,-0.176],[0,0],[0,-0.517],[0,0],[-0.517,0],[0,0.518],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0.517],[0,0],[0.249,0],[0,0],[0.176,-0.176],[0,0],[0,-0.517],[0,0],[-0.517,0],[0,0],[0,0.518],[0,0],[0,0],[0,0],[0,0],[0,0],[0,-0.517],[-0.517,0],[0,0],[0,0.517],[0,0],[0.248,0],[0,0],[0.175,-0.176],[0,0],[0,-0.517],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,-0.517],[0,0],[-0.517,0],[0,0],[0,0.518]],"v":[[-33.315,51.069],[6.934,51.069],[7.597,50.795],[33.978,24.413],[34.252,23.751],[34.252,-50.133],[33.316,-51.069],[8.651,-51.069],[7.714,-50.133],[8.651,-49.196],[32.379,-49.196],[32.379,23.362],[6.546,49.196],[-32.378,49.196],[-32.378,33.506],[-27.647,33.506],[-27.647,44.044],[-26.71,44.981],[3.539,44.981],[4.202,44.706],[26.691,22.217],[26.965,21.554],[26.965,-42.987],[26.029,-43.923],[8.651,-43.923],[7.714,-42.987],[7.714,-32.789],[8.651,-31.852],[18.523,-31.852],[18.523,16.725],[-0.006,35.255],[-11.723,35.255],[-11.723,32.101],[-12.66,31.164],[-13.596,32.101],[-13.596,36.191],[-12.66,37.128],[0.382,37.128],[1.044,36.854],[20.122,17.776],[20.396,17.113],[20.396,-32.789],[19.459,-33.725],[9.587,-33.725],[9.587,-42.05],[25.092,-42.05],[25.092,21.166],[3.151,43.108],[-25.773,43.108],[-25.773,32.569],[-26.71,31.632],[-33.315,31.632],[-34.252,32.569],[-34.252,50.132]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[135.68,224.174],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 41","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[992.68,618.064],"ix":2},"a":{"a":0,"k":[135.68,224.174],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 41","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.517,0],[0,0],[0,0],[0,0],[0,0.517],[0,0],[0.517,0],[0,0],[0,0],[0,0.655],[1.034,0],[0,-1.035],[-0.607,-0.31],[0,0],[-0.517,0],[0,0],[0,0],[0,0],[0,-0.517],[0,0],[-0.518,0],[0,0],[0,0.517]],"o":[[0,0],[0,0],[0,0],[0.517,0],[0,0],[0,-0.518],[0,0],[0,0],[0.51,-0.335],[0,-1.035],[-1.035,0],[0,0.729],[0,0],[0,0.517],[0,0],[0,0],[0,0],[-0.518,0],[0,0],[0,0.517],[0,0],[0.517,0],[0,-0.518]],"v":[[4.304,35.146],[-2.43,35.146],[-2.43,11.495],[4.162,11.495],[5.099,10.558],[5.099,-1.268],[4.162,-2.205],[-2.341,-2.205],[-2.341,-33.581],[-1.494,-35.146],[-3.367,-37.02],[-5.24,-35.146],[-4.214,-33.483],[-4.214,-1.268],[-3.276,-0.332],[3.226,-0.332],[3.226,9.622],[-3.367,9.622],[-4.304,10.558],[-4.304,36.084],[-3.367,37.02],[4.304,37.02],[5.24,36.084]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.145,0.537,0.388,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[181.852,204.033],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 42","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1038.852,597.923],"ix":2},"a":{"a":0,"k":[181.852,204.033],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 42","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-3.363,0],[0,0],[0,0],[0,0],[0,0],[0,0],[-1.141,1.142],[0,0],[0,1.615],[0,0],[0,0],[0,0],[0,0],[-1.615,0],[0,0],[0,0],[0,0],[0,0],[1.614,0],[0,0],[1.142,-1.142],[0,0],[0,0],[0,0],[0,0],[0,0],[0,-1.615],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[1.615,0],[0,0],[1.142,-1.142],[0,0],[0,0],[0,0],[0,0],[1.141,1.142],[0,0],[0,0],[0,0],[0,0],[-1.142,-1.142],[0,0],[-1.614,0],[0,0],[0,0],[0,0],[0,0],[0,0],[-1.142,1.142],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,3.363]],"v":[[-86.679,3.165],[-43.393,3.165],[-43.393,-9.012],[-80.59,-9.012],[-80.59,-47.565],[-74.461,-47.565],[-70.156,-49.349],[-53.27,-66.235],[-51.486,-70.541],[-51.486,-88.027],[-17.552,-121.96],[35.669,-121.96],[58.161,-99.468],[62.466,-97.685],[88.427,-97.685],[88.427,-109.862],[64.989,-109.862],[42.496,-132.355],[38.191,-134.138],[-20.074,-134.138],[-24.379,-132.355],[-40.007,-116.726],[-59.374,-136.093],[-67.984,-127.483],[-48.617,-108.116],[-61.879,-94.854],[-63.662,-90.549],[-63.662,-73.063],[-76.983,-59.743],[-86.679,-59.743],[-86.679,-53.654],[-92.767,-53.654],[-92.767,-2.924]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[1.615,0],[0,0],[0,0],[0,0],[-1.142,1.142],[0,0],[0,0],[0,0],[0,0],[0,-3.363],[0,0],[-3.363,0],[0,0],[0,0],[0,0],[0,0],[0,0],[2.378,2.377]],"o":[[-1.142,-1.142],[0,0],[0,0],[0,0],[1.615,0],[0,0],[0,0],[0,0],[0,0],[-3.363,0],[0,0],[0,3.363],[0,0],[0,0],[0,0],[0,0],[0,0],[2.378,-2.377],[0,0]],"v":[[-56.681,84.802],[-60.986,83.018],[-80.59,83.018],[-80.59,67.54],[-63.173,67.54],[-58.867,65.756],[-38.244,45.133],[-46.855,36.522],[-65.695,55.362],[-86.679,55.362],[-92.768,61.451],[-92.768,89.107],[-86.679,95.196],[-63.508,95.196],[-48.073,110.631],[-64.924,127.482],[-56.313,136.093],[-35.158,114.936],[-35.158,106.326]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[-3.362,0],[0,0],[0,3.363],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,3.363],[0,0],[3.363,0],[0,0],[0,0],[0,0]],"v":[[27.549,119.181],[-7.523,119.181],[-7.523,100.674],[-19.701,100.674],[-19.701,125.269],[-13.612,131.358],[33.638,131.358],[39.727,125.269],[39.727,97.027],[27.549,97.027]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,-3.362],[0,0],[-1.142,-1.142],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[-3.362,0],[0,0],[0,1.615],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[92.768,68.63],[92.768,56.453],[59.679,56.453],[53.591,62.541],[53.591,99.125],[55.373,103.431],[74.729,122.785],[83.339,114.175],[65.768,96.603],[65.768,68.63]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ind":4,"ty":"sh","ks":{"a":0,"k":{"i":[[3.363,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,-3.362],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[3.363,0],[0,0],[0,3.363]],"v":[[82.286,49.451],[48.638,49.451],[48.638,37.273],[76.197,37.273],[76.197,6.152],[48.638,6.152],[48.638,-6.025],[82.286,-6.025],[88.375,0.063],[88.375,43.362]],"c":true}},"nm":"Path 5","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-467.335,226.897],[492.665,226.897],[492.665,-286.103],[-467.335,-286.103]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-467.335,-286.103],[492.665,-286.103],[492.665,226.897],[-467.335,226.897]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.455,0.714,0.373,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[93.975,154.658],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 44","np":9,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[950.975,548.548],"ix":2},"a":{"a":0,"k":[93.975,154.658],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 44","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,-13.471],[0,0],[-13.471,0],[0,0],[0,13.472],[0,0],[13.472,0]],"o":[[-13.471,0],[0,0],[0,13.472],[0,0],[13.472,0],[0,0],[0,-13.471],[0,0]],"v":[[-19.466,-102.274],[-43.897,-77.843],[-43.897,77.842],[-19.466,102.274],[19.465,102.274],[43.897,77.842],[43.897,-77.843],[19.465,-102.274]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,39.677],[0,0],[-39.676,0],[0,0],[0,-39.676],[0,0],[39.677,0]],"o":[[-39.676,0],[0,0],[0,-39.676],[0,0],[39.677,0],[0,0],[0,39.677],[0,0]],"v":[[-19.466,149.798],[-91.421,77.842],[-91.421,-77.843],[-19.466,-149.798],[19.465,-149.798],[91.421,-77.843],[91.421,77.842],[19.465,149.798]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.22,0.62,0.475,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[95.322,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 45","np":4,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[952.322,546.947],"ix":2},"a":{"a":0,"k":[95.322,153.057],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 45","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[41.548,0],[0,0],[0,-41.548],[0,0],[41.548,0],[0,0],[0,41.548],[0,0]],"o":[[0,0],[41.548,0],[0,0],[0,41.548],[0,0],[41.548,0],[0,0],[0,-41.548]],"v":[[-34.28,-153.193],[-41.069,-153.193],[34.28,-77.842],[34.28,77.842],[-41.069,153.193],[-34.28,153.193],[41.069,77.842],[41.069,-77.842]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[168.682,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 46","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[1025.682,546.947],"ix":2},"a":{"a":0,"k":[168.682,153.057],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 46","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,11.6],[0,0],[-11.6,0],[0,0],[0,-11.6],[0,0],[-11.6,0],[0,0]],"o":[[0,0],[0,-11.6],[0,0],[-11.6,0],[0,0],[0,11.6],[0,0],[-11.6,0]],"v":[[-7.124,77.842],[-7.124,-77.842],[13.913,-98.879],[7.124,-98.879],[-13.913,-77.842],[-13.913,77.842],[7.124,98.88],[13.913,98.88]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[81.557,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 47","np":2,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[938.557,546.947],"ix":2},"a":{"a":0,"k":[81.557,153.057],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 47","np":1,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,-11.6],[0,0],[-11.6,0],[0,0],[0,11.6],[0,0],[11.599,0]],"o":[[-11.6,0],[0,0],[0,11.6],[0,0],[11.599,0],[0,0],[0,-11.6],[0,0]],"v":[[-19.465,-98.88],[-40.503,-77.842],[-40.503,77.842],[-19.465,98.88],[19.466,98.88],[40.503,77.842],[40.503,-77.842],[19.466,-98.88]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[41.548,0],[0,0],[0,41.548],[0,0],[-41.548,0],[0,0],[0,-41.548],[0,0]],"o":[[0,0],[-41.548,0],[0,0],[0,-41.548],[0,0],[41.548,0],[0,0],[0,41.548]],"v":[[19.466,153.192],[-19.465,153.192],[-94.815,77.842],[-94.815,-77.842],[-19.465,-153.192],[19.466,-153.192],[94.815,-77.842],[94.815,77.842]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[114.935,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 48","np":4,"mn":"ADBE Vector Group"},{"ty":"tr","p":{"a":0,"k":[971.935,546.947],"ix":2},"a":{"a":0,"k":[114.935,153.057],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"0 - Group 48","np":1,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":32,"ty":0,"nm":"sm","refId":"comp_136","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[984.875,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":33,"ty":0,"nm":"sm","refId":"comp_136","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[979.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":34,"ty":0,"nm":"sm","refId":"comp_136","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[974.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":35,"ty":0,"nm":"sm","refId":"comp_136","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[969.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":36,"ty":0,"nm":"sm","refId":"comp_136","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[964.625,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":37,"ty":0,"nm":"sm","refId":"comp_136","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":38,"ty":0,"nm":"Lamps","refId":"comp_137","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":39,"ty":0,"nm":"Slider","refId":"comp_147","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":41,"ty":4,"nm":"on\\off","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[783,579.89,0]},"a":{"a":0,"k":[11,12,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.833,0],[0,0.833],[0,0],[-0.833,0],[0,-0.833],[0,0]],"o":[[-0.833,0],[0,0],[0,-0.833],[0.833,0],[0,0],[0,0.833]],"v":[[0,7.363],[-1.509,5.854],[-1.509,-5.854],[0,-7.363],[1.509,-5.854],[1.509,5.854]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.463,0.753,0.867,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[10.603,8.152],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[5.753,0],[0,5.753],[-2.88,1.945],[-0.467,-0.69],[0.691,-0.467],[0,-2.468],[-4.089,0],[0,4.089],[2.107,1.377],[-0.456,0.697],[-0.698,-0.456],[0,-3.535]],"o":[[-5.753,0],[0,-3.472],[0.692,-0.467],[0.467,0.69],[-2.048,1.383],[0,4.089],[4.09,0],[0,-2.513],[-0.697,-0.456],[0.457,-0.698],[2.962,1.936],[0,5.753]],"v":[[0,9.814],[-10.435,-0.62],[-5.836,-9.271],[-3.741,-8.866],[-4.147,-6.771],[-7.418,-0.62],[0,6.796],[7.417,-0.62],[4.052,-6.833],[3.616,-8.921],[5.704,-9.358],[10.435,-0.62]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.463,0.753,0.867,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[10.604,13.18],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":42,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[810,578.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":42,"op":61,"st":21,"bm":0,"sr":1},{"ddd":0,"ind":43,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[810,578.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":21,"st":-21,"bm":0,"sr":1},{"ddd":0,"ind":44,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[810,578.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":45,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[810,578.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":21,"op":42,"st":21,"bm":0,"sr":1},{"ddd":0,"ind":46,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[810,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":47,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[760,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":42,"op":61,"st":21,"bm":0,"sr":1},{"ddd":0,"ind":48,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[760,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":21,"st":-21,"bm":0,"sr":1},{"ddd":0,"ind":49,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[760,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":50,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[760,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":21,"op":42,"st":21,"bm":0,"sr":1},{"ddd":0,"ind":51,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[750,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":52,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[740,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":53,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[730,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":42,"op":61,"st":21,"bm":0,"sr":1},{"ddd":0,"ind":54,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[730,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":21,"st":-21,"bm":0,"sr":1},{"ddd":0,"ind":55,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[730,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":56,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[730,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":21,"op":42,"st":21,"bm":0,"sr":1},{"ddd":0,"ind":57,"ty":0,"nm":"lamp","refId":"comp_148","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[720,568.5,0]},"a":{"a":0,"k":[6.5,6,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":13,"h":12,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":59,"ty":0,"nm":"4","refId":"comp_129","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[545,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":61,"ty":4,"nm":"sh","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960.5,713.89,0]},"a":{"a":0,"k":[310.5,19,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.933,0],[0,0],[0,1.933],[-1.933,0],[0,0],[0,-1.933]],"o":[[0,0],[-1.933,0],[0,-1.933],[0,0],[1.933,0],[0,1.933]],"v":[[4.753,3.5],[-4.753,3.5],[-8.253,0],[-4.753,-3.5],[4.753,-3.5],[8.253,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[493.764,33.053],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.933,0],[0,0],[0,1.933],[-1.934,0],[0,0],[0,-1.933]],"o":[[0,0],[-1.934,0],[0,-1.933],[0,0],[1.933,0],[0,1.933]],"v":[[7.792,3.5],[-7.792,3.5],[-11.292,0],[-7.792,-3.5],[7.792,-3.5],[11.292,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[513.449,27.943],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.933,0],[0,0],[0,1.933],[-1.934,0],[0,0],[0,-1.933]],"o":[[0,0],[-1.934,0],[0,-1.933],[0,0],[1.933,0],[0,1.933]],"v":[[7.792,3.5],[-7.792,3.5],[-11.292,0],[-7.792,-3.5],[7.792,-3.5],[11.292,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[302.246,23.251],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.777,0],[0,0],[0,2.777],[-2.777,0],[0,0],[0,-2.777]],"o":[[0,0],[-2.777,0],[0,-2.777],[0,0],[2.777,0],[0,2.777]],"v":[[126.902,5.028],[-126.901,5.028],[-131.929,0],[-126.901,-5.028],[126.902,-5.028],[131.929,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[132.603,29.62],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.777,0],[0,0],[0,2.777],[-2.777,0],[0,0],[0,-2.777]],"o":[[0,0],[-2.777,0],[0,-2.777],[0,0],[2.777,0],[0,2.777]],"v":[[8.187,5.028],[-8.187,5.028],[-13.215,0],[-8.187,-5.028],[8.187,-5.028],[13.215,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.359,5.075],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.777,0],[0,0],[0,2.777],[-2.777,0],[0,0],[0,-2.777]],"o":[[0,0],[-2.777,0],[0,-2.777],[0,0],[2.777,0],[0,2.777]],"v":[[159.663,5.028],[-159.662,5.028],[-164.69,0],[-159.662,-5.028],[159.663,-5.028],[164.69,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[205.24,5.075],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.777,0],[0,0],[0,2.777],[-2.777,0],[0,0],[0,-2.777]],"o":[[0,0],[-2.777,0],[0,-2.777],[0,0],[2.777,0],[0,2.777]],"v":[[4.863,5.028],[-4.863,5.028],[-9.891,0],[-4.863,-5.028],[4.863,-5.028],[9.891,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[388.798,5.075],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.777,0],[0,0],[0,2.777],[-2.777,0],[0,0],[0,-2.777]],"o":[[0,0],[-2.777,0],[0,-2.777],[0,0],[2.777,0],[0,2.777]],"v":[[88.803,5.028],[-88.803,5.028],[-93.83,0],[-88.803,-5.028],[88.803,-5.028],[93.83,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[503.981,5.075],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.777,0],[0,0],[0,2.777],[-2.777,0],[0,0],[0,-2.777]],"o":[[0,0],[-2.777,0],[0,-2.777],[0,0],[2.777,0],[0,2.777]],"v":[[3.447,5.028],[-3.447,5.028],[-8.475,0],[-3.447,-5.028],[3.447,-5.028],[8.475,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.188,0.498,0.529,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[611.285,5.075],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":62,"ty":4,"nm":"Floor","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[964,710.89,0]},"a":{"a":0,"k":[364,30,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,1.777],[0,0],[1.777,0],[0,0],[0,1.777],[1.777,0],[0,0],[0,-1.778],[1.778,0],[0,0],[0,-1.777],[-1.777,0],[0,0],[0,-1.777],[1.777,0],[0,0],[0,-1.777],[-1.777,0],[0,0],[0,-1.777],[0,0],[-1.777,0],[0,0],[0,-1.778],[1.778,0],[0,0],[0,-1.778],[-1.777,0],[0,0],[0,-1.777],[-1.777,0],[0,0],[0,-1.777],[-1.777,0],[0,0],[0,1.777],[-1.777,0],[0,0],[0,1.777],[-1.777,0],[0,0],[0,1.777],[1.777,0],[0,0],[0,1.777],[-1.777,0],[0,0],[0,1.777],[0,0],[-1.777,0],[0,0],[0,1.778],[1.777,0],[0,0],[0,1.777],[-1.778,0],[0,0]],"o":[[0,0],[0,-1.777],[0,0],[-1.777,0],[0,-1.778],[0,0],[-1.777,0],[0,1.777],[0,0],[-1.777,0],[0,1.777],[0,0],[1.777,0],[0,1.777],[0,0],[-1.777,0],[0,1.778],[0,0],[1.778,0],[0,0],[0,1.777],[0,0],[1.778,0],[0,1.777],[0,0],[-1.777,0],[0,1.777],[0,0],[1.777,0],[0,1.777],[0,0],[1.778,0],[0,1.777],[0,0],[1.777,0],[0,-1.777],[0,0],[1.777,0],[0,-1.777],[0,0],[1.777,0],[0,-1.778],[0,0],[-1.777,0],[0,-1.778],[0,0],[1.777,0],[0,0],[0,-1.777],[0,0],[1.777,0],[0,-1.777],[0,0],[-1.778,0],[0,-1.777],[0,0],[1.777,0]],"v":[[362.886,-19.309],[362.886,-19.309],[359.668,-22.526],[347.777,-22.526],[344.559,-25.744],[341.341,-28.962],[-341.341,-28.962],[-344.559,-25.744],[-347.777,-22.526],[-359.668,-22.526],[-362.886,-19.309],[-359.668,-16.09],[-333.203,-16.09],[-329.986,-12.872],[-333.203,-9.654],[-351.94,-9.654],[-355.157,-6.436],[-351.94,-3.218],[-339.828,-3.218],[-336.61,0],[-336.61,0.001],[-333.392,3.219],[-324.644,3.219],[-321.426,6.437],[-324.644,9.654],[-342.067,9.654],[-345.285,12.872],[-342.067,16.09],[-332.021,16.09],[-328.803,19.309],[-325.585,22.527],[-317.995,22.527],[-314.777,25.745],[-311.559,28.962],[311.559,28.962],[314.777,25.745],[317.995,22.527],[325.585,22.527],[328.803,19.309],[332.021,16.09],[342.067,16.09],[345.285,12.872],[342.067,9.654],[324.644,9.654],[321.426,6.437],[324.644,3.219],[333.392,3.219],[336.61,0.001],[336.61,0],[339.828,-3.218],[351.94,-3.218],[355.158,-6.436],[351.94,-9.654],[333.204,-9.654],[329.986,-12.872],[333.204,-16.09],[359.668,-16.09]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.31,0.616,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[363.64,29.595],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":81,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":63,"ty":0,"nm":"BG","refId":"comp_149","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1}]},{"id":"comp_121","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Explosion","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[107.9,103,0]},"a":{"a":0,"k":[5.455,17,0]},"s":{"a":0,"k":[325.626,325.626,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[0.455,11.75],[-11.818,0.5]],"c":false}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"st","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"w":{"a":0,"k":3},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[10.909,11.5],[20.682,0.25]],"c":false}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"st","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"w":{"a":0,"k":3},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[15.455,16.5],[28.636,16.5]],"c":false}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"st","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"w":{"a":0,"k":3},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[5.227,6.25],[5.227,-7.25]],"c":false}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"st","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"w":{"a":0,"k":3},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[-5,16.5],[-21.591,16.5]],"c":false}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"st","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"w":{"a":0,"k":3},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 1","np":2,"mn":"ADBE Vector Group"},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"n":["0p667_1_0p167_0p167"],"t":0,"s":[0],"e":[100]},{"i":{"x":[0.667],"y":[0.667]},"o":{"x":[0.333],"y":[0.333]},"n":["0p667_0p667_0p333_0p333"],"t":3.203,"s":[100],"e":[100]},{"t":14.4144144144144}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"n":["0p667_1_0p167_0p167"],"t":0,"s":[0],"e":[100]},{"t":10.4104104104104}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":6,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim"}],"ip":0,"op":11.2112112112112,"st":-1.6016016016016,"bm":0,"sr":1}]},{"id":"comp_122","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Bolt 3","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[19.5,25.89,0]},"a":{"a":0,"k":[5.5,9,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-2.229,-2.122],[-2.223,2.13],[2.229,2.122],[2.222,-2.13]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.259,0.294,0.298,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.743,14.923],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0.097],[0,0],[-0.202,0],[0,0],[0,-0.202],[0,0],[0.068,-0.069],[0,0],[0.097,0],[0,0],[0.069,0.068],[0,0]],"o":[[0,0],[-0.001,-0.202],[0,0],[0.202,-0.001],[0,0],[0,0.097],[0,0],[-0.069,0.068],[0,0],[-0.097,0],[0,0],[-0.069,-0.069]],"v":[[-4.749,0.8],[-4.753,-1.751],[-4.388,-2.118],[4.383,-2.132],[4.749,-1.767],[4.754,0.784],[4.647,1.043],[3.68,2.014],[3.421,2.121],[-3.412,2.133],[-3.671,2.026],[-4.641,1.059]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.298,0.329,0.337,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.742,14.923],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[2.492,0.484],[-2.492,0.493],[-1.515,-0.488],[1.511,-0.493]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.369,0.4,0.408,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.721,0.8],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.127,0.036],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[1.127,-0.036]],"v":[[0.393,-0.579],[2.492,-0.582],[2.493,0.574],[-2.491,0.582],[-2.493,-0.486]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.224,0.259,0.267,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.739,12.547],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-0.855,-5.917],[0.835,-5.921],[0.855,5.917],[-0.836,5.921]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.224,0.259,0.267,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[6.377,7.205],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.382,0.383],[0,0],[-0.383,-0.381],[0,0],[0,0],[0,0]],"o":[[0,0],[0.383,0.382],[0,0],[0,0],[0,0],[0.381,-0.383]],"v":[[-1.525,-6.407],[1.501,-6.412],[2.482,-5.435],[2.502,6.403],[-2.483,6.412],[-2.502,-5.426]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.298,0.329,0.337,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.731,6.719],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 11","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_123","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"tube blue","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[764,447.39,0]},"a":{"a":0,"k":[19,32.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[-0.231,1.031],[0,0],[1.031,0.232],[0,0]],"o":[[0,0],[1.031,0.232],[0,0],[0.231,-1.031],[0,0],[0,0]],"v":[[-3.456,7.537],[-1.742,7.921],[0.543,6.473],[3.225,-5.483],[1.776,-7.769],[0.063,-8.153]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.42,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[29.207,44.008],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.031,0.231],[0,0],[-0.232,1.031],[0,0],[-1.03,-0.231],[0,0],[0.231,-1.031],[0,0]],"o":[[0,0],[-1.031,-0.231],[0,0],[0.231,-1.031],[0,0],[1.031,0.231],[0,0],[-0.231,1.031]],"v":[[0.791,8.417],[-4.309,7.273],[-5.757,4.988],[-3.076,-6.968],[-0.791,-8.417],[4.309,-7.273],[5.757,-4.988],[3.075,6.969]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[26.675,43.512],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.458,0],[0,0],[-1.499,6.682],[0,0],[2.115,2.642],[3.384,0],[0,-1.458],[0,0],[1.183,-5.277],[0,0],[5.564,0],[0,0],[0,0]],"o":[[0,0],[6.849,0],[0,0],[0.74,-3.302],[-2.114,-2.641],[-1.458,0],[0,0],[5.408,0],[0,0],[-1.218,5.429],[0,0],[0,0],[0,1.458]],"v":[[-10.584,30.551],[-9.822,30.551],[4.356,19.201],[12.484,-17.043],[10.321,-26.395],[1.669,-30.551],[-0.971,-27.911],[1.669,-27.911],[9.908,-17.621],[1.78,18.623],[-9.822,27.911],[-10.584,27.911],[-13.224,27.911]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.318,0.694,0.808,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[23.217,32.289],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.849,0],[0,0],[0,1.458],[-1.458,0],[0,0],[-0.954,4.255],[0,0],[1.107,1.383],[1.772,0],[0,1.458],[-1.458,0],[-2.115,-2.641],[0.741,-3.302],[0,0]],"o":[[0,0],[-1.458,0],[0,-1.458],[0,0],[4.36,0],[0,0],[0.388,-1.729],[-1.107,-1.382],[-1.458,0],[0,-1.458],[3.383,0],[2.115,2.642],[0,0],[-1.499,6.684]],"v":[[-9.822,30.551],[-10.585,30.551],[-13.225,27.911],[-10.585,25.271],[-9.822,25.271],[-0.797,18.045],[7.331,-18.198],[6.199,-23.095],[1.669,-25.271],[-0.971,-27.911],[1.669,-30.551],[10.321,-26.395],[12.484,-17.043],[4.355,19.2]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.463,0.753,0.867,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[23.217,32.289],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,2.083],[2.083,0],[0,0],[0,-2.083],[-2.083,0],[0,0]],"o":[[0,-2.083],[0,0],[-2.083,0],[0,2.083],[0,0],[2.083,0]],"v":[[3.977,0],[0.204,-3.772],[-0.205,-3.772],[-3.977,0],[-0.205,3.772],[0.204,3.772]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.388,0.439,0.467,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[24.682,4.378],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,2.083],[2.083,0],[0,0],[0,-2.083],[-2.083,0],[0,0]],"o":[[0,-2.083],[0,0],[-2.083,0],[0,2.083],[0,0],[2.083,0]],"v":[[3.977,0],[0.204,-3.772],[-0.205,-3.772],[-3.977,0],[-0.205,3.772],[0.204,3.772]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.388,0.439,0.467,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.428,60.2],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.395,0],[0,0],[-0.652,1.126]],"o":[[0.652,1.126],[0,0],[1.395,0],[0,0]],"v":[[-7.633,-0.946],[-4.381,0.946],[4.381,0.946],[7.633,-0.946]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.416,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.506,7.203],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.395,0],[0,0],[-0.652,1.126]],"o":[[0.652,1.126],[0,0],[1.395,0],[0,0]],"v":[[-7.633,-0.946],[-4.381,0.946],[4.381,0.946],[7.633,-0.946]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.416,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[8.252,63.025],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.083,0],[0,0],[0,2.083],[-2.083,0],[0,0],[0,-2.082]],"o":[[0,0],[-2.083,0],[0,-2.082],[0,0],[2.083,0],[0,2.083]],"v":[[4.381,3.771],[-4.381,3.771],[-8.153,0],[-4.381,-3.771],[4.381,-3.771],[8.153,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[8.252,60.2],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.083,0],[0,0],[0,2.083],[-2.082,0],[0,0],[0,-2.082]],"o":[[0,0],[-2.082,0],[0,-2.082],[0,0],[2.083,0],[0,2.083]],"v":[[4.381,3.771],[-4.382,3.771],[-8.152,0],[-4.382,-3.771],[4.381,-3.771],[8.152,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.506,4.378],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_124","layers":[{"ddd":0,"ind":0,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1026.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":80,"op":160,"st":80,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1026.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":80,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1019,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":82,"op":102,"st":62,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1019,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":40,"op":60,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":4,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1019,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":-1,"op":20,"st":-20,"bm":0,"sr":1},{"ddd":0,"ind":5,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1019,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":6,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1019,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":20,"op":40,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":7,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1011.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":80,"op":160,"st":80,"bm":0,"sr":1},{"ddd":0,"ind":8,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1011.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":80,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":9,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1004,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":40,"op":60,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":10,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1004,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":-1,"op":20,"st":-20,"bm":0,"sr":1},{"ddd":0,"ind":11,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1004,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":12,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1004,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":20,"op":40,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":13,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[996.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":80,"op":160,"st":80,"bm":0,"sr":1},{"ddd":0,"ind":14,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[996.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":80,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":15,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[989,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":40,"op":60,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":16,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[989,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":-1,"op":20,"st":-20,"bm":0,"sr":1},{"ddd":0,"ind":17,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[989,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":18,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[989,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":20,"op":40,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":19,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[981.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":80,"op":160,"st":80,"bm":0,"sr":1},{"ddd":0,"ind":20,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[981.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":80,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":21,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[974,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":40,"op":60,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":22,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[974,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":-1,"op":20,"st":-20,"bm":0,"sr":1},{"ddd":0,"ind":23,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[974,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":24,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[974,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":20,"op":40,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":25,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":80,"op":160,"st":80,"bm":0,"sr":1},{"ddd":0,"ind":26,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":80,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":27,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[959,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":40,"op":60,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":28,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[959,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":-1,"op":20,"st":-20,"bm":0,"sr":1},{"ddd":0,"ind":29,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[959,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":60,"op":81,"st":60,"bm":0,"sr":1},{"ddd":0,"ind":30,"ty":0,"nm":"01","refId":"comp_125","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[959,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":20,"op":40,"st":20,"bm":0,"sr":1},{"ddd":0,"ind":31,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1138.938,590,0]},"a":{"a":0,"k":[1137.75,571.731,0]},"s":{"a":0,"k":[157,75,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":32,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1148.375,590,0]},"a":{"a":0,"k":[1137.75,571.731,0]},"s":{"a":0,"k":[157,75,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":33,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[972.5,552.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":34,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[972.5,546.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":35,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[972.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":36,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.375,552.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":37,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.375,546.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":38,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.375,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":39,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,552.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":40,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,546.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":41,"ty":0,"nm":"Key","refId":"comp_126","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":42,"ty":4,"nm":"numbers - Group 33","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1195.809,580.392,0]},"a":{"a":0,"k":[63.809,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.815,0],[0,0],[0,-0.815],[0,0],[-0.815,0],[0,0],[0,0.815],[0,0]],"o":[[0,0],[-0.815,0],[0,0],[0,0.815],[0,0],[0.815,0],[0,0],[0,-0.815]],"v":[[37.516,-9.77],[-37.516,-9.77],[-38.992,-8.294],[-38.992,8.295],[-37.516,9.77],[37.516,9.77],[38.992,8.295],[38.992,-8.294]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.255,0.263,0.267,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[63.809,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 33","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":43,"ty":4,"nm":"numbers - Group 34","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1185.077,580.392,0]},"a":{"a":0,"k":[53.077,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.15,0],[0,0],[0,-1.15],[0,0],[-1.15,0],[0,0],[0,1.15],[0,0]],"o":[[0,0],[-1.15,0],[0,0],[0,1.15],[0,0],[1.15,0],[0,0],[0,-1.15]],"v":[[50.14,-14.519],[-50.14,-14.519],[-52.222,-12.437],[-52.222,12.437],[-50.14,14.519],[50.14,14.519],[52.222,12.437],[52.222,-12.437]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[53.077,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 34","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":44,"ty":4,"nm":"numbers - Group 35","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1186.046,580.392,0]},"a":{"a":0,"k":[54.046,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.15,0],[0,0],[0,-1.15],[0,0],[-1.15,0],[0,0],[0,1.15],[0,0]],"o":[[0,0],[-1.15,0],[0,0],[0,1.15],[0,0],[1.15,0],[0,0],[0,-1.15]],"v":[[50.14,-14.519],[-50.14,-14.519],[-52.222,-12.437],[-52.222,12.437],[-50.14,14.519],[50.14,14.519],[52.222,12.437],[52.222,-12.437]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.729,0.773,0.8,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[54.046,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 35","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_125","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"1","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1162.925,580.393,0]},"a":{"a":0,"k":[37.987,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[0.11,4.551],[0.799,3.932],[2.892,3.932],[3.443,4.551],[2.74,5.172],[0.606,5.172]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[1.253,-0.614],[0.551,0.007],[1.102,0.626],[0.702,3.822],[0.014,4.442],[-0.537,3.822],[-0.138,0.626],[0.551,0.007],[0.014,-0.614],[0.399,-3.809],[1.79,-5.048]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[0.303,-3.932],[-0.62,-3.932],[-1.157,-4.553],[-0.468,-5.172],[1.694,-5.172]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-0.813,5.172],[-2.947,5.172],[-3.443,4.551],[-2.755,3.932],[-0.661,3.932],[-0.11,4.551]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-686.347,195.052],[273.653,195.052],[273.653,-317.948],[-686.347,-317.948]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-686.347,-317.948],[273.653,-317.948],[273.653,195.052],[-686.347,195.052]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.357,0.776,0.22,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[37.987,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":8,"mn":"ADBE Vector Group"}],"ip":60,"op":81,"st":40,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":4,"nm":"0","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1163.273,580.392,0]},"a":{"a":0,"k":[31.273,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[1.688,0.626],[2.376,0.007],[1.825,-0.586],[2.225,-3.809],[2.926,-4.428],[3.463,-3.809],[3.079,-0.613],[2.376,0.007],[2.926,0.626],[2.527,3.822],[1.84,4.441],[1.288,3.822]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-1.012,-5.172],[2.28,-5.172],[2.83,-4.552],[2.129,-3.932],[-1.163,-3.932],[-1.7,-4.552]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[1.191,-3.753],[2.059,-3.753],[1.936,-2.762],[-1.178,3.767],[-2.045,3.767],[-1.934,2.775]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-2.127,3.932],[1.165,3.932],[1.715,4.551],[1.012,5.172],[-2.293,5.172],[-2.816,4.551]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ind":4,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-3.064,0.626],[-2.376,0.007],[-2.913,-0.613],[-2.527,-3.809],[-1.824,-4.428],[-1.288,-3.809],[-1.673,-0.613],[-2.376,0.007],[-1.824,0.626],[-2.223,3.822],[-2.913,4.441],[-3.463,3.822]],"c":true}},"nm":"Path 5","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-679.633,195.053],[280.367,195.053],[280.367,-317.947],[-679.633,-317.947]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-679.633,-317.947],[280.367,-317.947],[280.367,195.053],[-679.633,195.053]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.357,0.776,0.22,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[31.273,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":9,"mn":"ADBE Vector Group"}],"ip":40,"op":60,"st":40,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":4,"nm":"1","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1162.925,580.393,0]},"a":{"a":0,"k":[37.987,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[0.11,4.551],[0.799,3.932],[2.892,3.932],[3.443,4.551],[2.74,5.172],[0.606,5.172]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[1.253,-0.614],[0.551,0.007],[1.102,0.626],[0.702,3.822],[0.014,4.442],[-0.537,3.822],[-0.138,0.626],[0.551,0.007],[0.014,-0.614],[0.399,-3.809],[1.79,-5.048]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[0.303,-3.932],[-0.62,-3.932],[-1.157,-4.553],[-0.468,-5.172],[1.694,-5.172]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-0.813,5.172],[-2.947,5.172],[-3.443,4.551],[-2.755,3.932],[-0.661,3.932],[-0.11,4.551]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-686.347,195.052],[273.653,195.052],[273.653,-317.948],[-686.347,-317.948]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-686.347,-317.948],[273.653,-317.948],[273.653,195.052],[-686.347,195.052]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.357,0.776,0.22,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[37.987,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":8,"mn":"ADBE Vector Group"}],"ip":20,"op":40,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":4,"nm":"0","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1163.273,580.392,0]},"a":{"a":0,"k":[31.273,14.502,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[1.688,0.626],[2.376,0.007],[1.825,-0.586],[2.225,-3.809],[2.926,-4.428],[3.463,-3.809],[3.079,-0.613],[2.376,0.007],[2.926,0.626],[2.527,3.822],[1.84,4.441],[1.288,3.822]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-1.012,-5.172],[2.28,-5.172],[2.83,-4.552],[2.129,-3.932],[-1.163,-3.932],[-1.7,-4.552]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[1.191,-3.753],[2.059,-3.753],[1.936,-2.762],[-1.178,3.767],[-2.045,3.767],[-1.934,2.775]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-2.127,3.932],[1.165,3.932],[1.715,4.551],[1.012,5.172],[-2.293,5.172],[-2.816,4.551]],"c":true}},"nm":"Path 4","mn":"ADBE Vector Shape - Group"},{"ind":4,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-3.064,0.626],[-2.376,0.007],[-2.913,-0.613],[-2.527,-3.809],[-1.824,-4.428],[-1.288,-3.809],[-1.673,-0.613],[-2.376,0.007],[-1.824,0.626],[-2.223,3.822],[-2.913,4.441],[-3.463,3.822]],"c":true}},"nm":"Path 5","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-679.633,195.053],[280.367,195.053],[280.367,-317.947],[-679.633,-317.947]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-679.633,-317.947],[280.367,-317.947],[280.367,195.053],[-679.633,195.053]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.357,0.776,0.22,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[31.273,14.502],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":9,"mn":"ADBE Vector Group"}],"ip":0,"op":20,"st":0,"bm":0,"sr":1}]},{"id":"comp_126","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"numbers - Group 23","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1137.646,571.59,0]},"a":{"a":0,"k":[5.646,5.7,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.383,0],[0,0],[0,0.383],[0,0],[-0.384,0],[0,0],[0,-0.384],[0,0]],"o":[[0,0],[-0.384,0],[0,0],[0,-0.384],[0,0],[0.383,0],[0,0],[0,0.383]],"v":[[1.735,2.428],[-1.735,2.428],[-2.428,1.735],[-2.428,-1.734],[-1.735,-2.428],[1.735,-2.428],[2.428,-1.734],[2.428,1.735]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[5.646,5.7],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 23","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":4,"nm":"numbers - Group 32","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1138.34,571.59,0]},"a":{"a":0,"k":[6.34,5.7,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.383,0],[0,0],[0,0.383],[0,0],[-0.384,0],[0,0],[0,-0.384],[0,0]],"o":[[0,0],[-0.384,0],[0,0],[0,-0.384],[0,0],[0.383,0],[0,0],[0,0.383]],"v":[[1.735,2.428],[-1.735,2.428],[-2.428,1.735],[-2.428,-1.734],[-1.735,-2.428],[1.735,-2.428],[2.428,-1.734],[2.428,1.735]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.753,0.784,0.808,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[6.34,5.7],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 32","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_127","layers":[{"ddd":0,"ind":0,"ty":0,"nm":"Impact 30","refId":"comp_128","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":13.376},"p":{"a":0,"k":[1115.75,543.5,0]},"a":{"a":0,"k":[257.5,1997,0]},"s":{"a":0,"k":[5,5,100]}},"ao":0,"w":515,"h":3994,"ip":40,"op":79,"st":-1,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":0,"nm":"Impact 29","refId":"comp_128","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":13.376},"p":{"a":0,"k":[1115.75,543.5,0]},"a":{"a":0,"k":[257.5,1997,0]},"s":{"a":0,"k":[5,5,100]}},"ao":0,"w":515,"h":3994,"ip":0,"op":40,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":0,"nm":"Impact 28","refId":"comp_128","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":13.376},"p":{"a":0,"k":[1115.75,543.5,0]},"a":{"a":0,"k":[257.5,1997,0]},"s":{"a":0,"k":[5,5,100]}},"ao":0,"w":515,"h":3994,"ip":0,"op":40,"st":-40,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":0,"nm":"Impact 27","refId":"comp_128","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":13.376},"p":{"a":0,"k":[1115.75,543.5,0]},"a":{"a":0,"k":[257.5,1997,0]},"s":{"a":0,"k":[5,5,100]}},"ao":0,"w":515,"h":3994,"ip":40,"op":81,"st":40,"bm":0,"sr":1},{"ddd":0,"ind":4,"ty":4,"nm":"liquid","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1129,480.89,0]},"a":{"a":0,"k":[33,73,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[-7.69,-1.807],[-1.083,0],[-1.548,6.588],[0,0]],"o":[[0,0],[-1.806,7.69],[1.1,0.259],[6.487,0],[0,0],[0,0]],"v":[[-5.723,-42.206],[-21.554,25.177],[-10.902,42.371],[-7.619,42.753],[6.29,31.72],[23.986,-42.307]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.325,0.663,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[27.568,98.565],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.487,0],[1.101,0.258],[-1.807,7.689],[0,0],[-7.689,-1.805],[1.807,-7.69],[0,0]],"o":[[-1.084,0],[-7.689,-1.807],[0,0],[1.808,-7.689],[7.689,1.807],[0,0],[-1.548,6.589]],"v":[[-12.648,68.904],[-15.933,68.522],[-26.584,51.328],[-1.262,-56.448],[15.932,-67.099],[26.583,-49.905],[1.261,57.87]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[32.598,72.415],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.839,0],[1.203,-5.118],[0,0],[-5.971,-1.403],[-0.855,0],[-1.187,5.054],[0,0],[5.971,1.404]],"o":[[-5.046,0],[0,0],[-1.403,5.971],[0.841,0.197],[5.181,0],[0,0],[1.402,-5.97],[-0.851,-0.199]],"v":[[12.663,-64.144],[1.832,-55.564],[-23.49,52.212],[-15.206,65.584],[-12.649,65.881],[-1.833,57.299],[23.49,-50.475],[15.205,-63.849]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[8.146,0],[1.318,0.309],[-2.204,9.382],[0,0],[-9.382,-2.202],[2.205,-9.383],[0,0]],"o":[[-1.343,0],[-9.384,-2.206],[0,0],[2.206,-9.38],[9.384,2.206],[0,0],[-1.866,7.94]],"v":[[-12.649,72.238],[-16.659,71.772],[-29.678,50.757],[-4.356,-57.018],[16.658,-70.036],[29.677,-49.021],[4.355,58.753]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.792,0.824,0.847,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[32.598,72.258],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.487,0],[1.101,0.258],[-1.807,7.689],[0,0],[-7.689,-1.805],[1.807,-7.69],[0,0]],"o":[[-1.084,0],[-7.689,-1.807],[0,0],[1.808,-7.689],[7.689,1.807],[0,0],[-1.548,6.589]],"v":[[-12.648,68.904],[-15.933,68.522],[-26.584,51.328],[-1.262,-56.448],[15.932,-67.099],[26.583,-49.905],[1.261,57.87]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.792,0.824,0.847,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[32.598,72.415],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 11","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_128","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"rect 5","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":1,"k":[{"i":{"x":0.078,"y":1},"o":{"x":0.333,"y":0},"n":"0p078_1_0p333_0","t":4.004,"s":[279.886,1438.813,0],"e":[359.886,731.063,0],"to":[17.375,-49.8125,0],"ti":[-13.125,40.4375,0]},{"t":48.0480480480481}]},"a":{"a":0,"k":[-30.375,24.063,0]},"s":{"a":1,"k":[{"i":{"x":[0.49,0.49,0.667],"y":[1,1,0.667]},"o":{"x":[0.009,0.009,0.333],"y":[0.639,0.639,0.333]},"n":["0p49_1_0p009_0p639","0p49_1_0p009_0p639","0p667_0p667_0p333_0p333"],"t":4.004,"s":[0,0,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[0.833,0.833,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,0.167]},"n":["0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167"],"t":26.426,"s":[100,100,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0.167]},"n":["0p833_1_0p167_0","0p833_1_0p167_0","0p833_0p833_0p167_0p167"],"t":44.044,"s":[100,100,100],"e":[0,0,100]},{"t":48.0480480480481}]}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[102,102]},"p":{"a":0,"k":[0,0]},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse"},{"ty":"st","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"w":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"n":["0p667_1_0p167_0p167"],"t":28.028,"s":[108],"e":[0]},{"t":35.2352352352352}]},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[-104.545,-63],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[59,59],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"mn":"ADBE Vector Group"}],"ip":3.2032032032032,"op":60.8608608608609,"st":4.004004004004,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":4,"nm":"rect 4","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":1,"k":[{"i":{"x":0.078,"y":1},"o":{"x":0.333,"y":0},"n":"0p078_1_0p333_0","t":7.207,"s":[159.886,1490.813,0],"e":[239.886,891.063,0],"to":[17.375,-49.8125,0],"ti":[-13.125,40.4375,0]},{"t":51.2512512512512}]},"a":{"a":0,"k":[-30.375,24.063,0]},"s":{"a":1,"k":[{"i":{"x":[0.49,0.49,0.667],"y":[1,1,0.667]},"o":{"x":[0.009,0.009,0.333],"y":[0.73,0.73,0.333]},"n":["0p49_1_0p009_0p73","0p49_1_0p009_0p73","0p667_0p667_0p333_0p333"],"t":7.207,"s":[0,0,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[0.833,0.833,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,0.167]},"n":["0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167"],"t":32.833,"s":[100,100,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0.167]},"n":["0p833_1_0p167_0","0p833_1_0p167_0","0p833_0p833_0p167_0p167"],"t":47.247,"s":[100,100,100],"e":[0,0,100]},{"t":51.2512512512512}]}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[102,102]},"p":{"a":0,"k":[0,0]},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse"},{"ty":"st","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"w":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"n":["0p667_1_0p167_0p167"],"t":31.231,"s":[108],"e":[0]},{"t":38.4384384384384}]},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[-104.545,-63],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[59,59],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"mn":"ADBE Vector Group"}],"ip":6.40640640640641,"op":64.0640640640641,"st":7.20720720720721,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":4,"nm":"rect 2","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":1,"k":[{"i":{"x":0.078,"y":1},"o":{"x":0.333,"y":0},"n":"0p078_1_0p333_0","t":24.024,"s":[271.705,2053.813,0],"e":[351.705,1597.563,0],"to":[-16.125,-38.8125,0],"ti":[7.5,177.04167175293,0]},{"t":68.0680680680681}]},"a":{"a":0,"k":[-30.375,24.063,0]},"s":{"a":1,"k":[{"i":{"x":[0.49,0.49,0.667],"y":[1,1,0.667]},"o":{"x":[0.009,0.009,0.333],"y":[0.73,0.73,0.333]},"n":["0p49_1_0p009_0p73","0p49_1_0p009_0p73","0p667_0p667_0p333_0p333"],"t":24.024,"s":[0,0,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[0.833,0.833,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,0.167]},"n":["0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167"],"t":49.65,"s":[100,100,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0.167]},"n":["0p833_1_0p167_0","0p833_1_0p167_0","0p833_0p833_0p167_0p167"],"t":64.064,"s":[100,100,100],"e":[0,0,100]},{"t":68.0680680680681}]}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[102,102]},"p":{"a":0,"k":[0,0]},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse"},{"ty":"st","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"w":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"n":["0p667_1_0p167_0p167"],"t":53.654,"s":[108],"e":[0]},{"t":60.8608608608609}]},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[-190.545,27],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[66,66],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"mn":"ADBE Vector Group"}],"ip":23.2232232232232,"op":80.8808808808809,"st":23.2232232232232,"bm":0,"sr":1},{"ddd":0,"ind":4,"ty":4,"nm":"rect","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":1,"k":[{"i":{"x":0.124,"y":1},"o":{"x":0.414,"y":0},"n":"0p124_1_0p414_0","t":14.414,"s":[253.523,2063.813,0],"e":[253.523,1656.063,0],"to":[-17.125,-33.8125,0],"ti":[8.5,17.8186626434326,0]},{"t":58.4584584584585}]},"a":{"a":0,"k":[-30.375,24.063,0]},"s":{"a":1,"k":[{"i":{"x":[0.49,0.49,0.667],"y":[1,1,0.667]},"o":{"x":[0.009,0.009,0.333],"y":[0.73,0.73,0.333]},"n":["0p49_1_0p009_0p73","0p49_1_0p009_0p73","0p667_0p667_0p333_0p333"],"t":14.414,"s":[0,0,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[0.833,0.833,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,0.167]},"n":["0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167","0p833_0p833_0p167_0p167"],"t":40.04,"s":[100,100,100],"e":[100,100,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,0.833]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0.167]},"n":["0p833_1_0p167_0","0p833_1_0p167_0","0p833_0p833_0p167_0p167"],"t":54.454,"s":[100,100,100],"e":[0,0,100]},{"t":58.4584584584585}]}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[102,102]},"p":{"a":0,"k":[0,0]},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse"},{"ty":"st","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"w":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"n":["0p667_1_0p167_0p167"],"t":39.239,"s":[108],"e":[0]},{"t":46.4464464464464}]},"lc":1,"lj":1,"ml":4,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke"},{"ty":"tr","p":{"a":0,"k":[59.455,-63],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[61,61],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":3,"mn":"ADBE Vector Group"}],"ip":13.6136136136136,"op":71.2712712712713,"st":13.6136136136136,"bm":0,"sr":1}]},{"id":"comp_129","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"4 right","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1169.5,547.89,0]},"a":{"a":0,"k":[97.5,154,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[3.699,0],[0,0],[0,3.699],[0,0]],"o":[[0,0],[0,3.699],[0,0],[3.699,0],[0,0],[0,0]],"v":[[2.264,-7.284],[2.264,0.574],[-4.445,7.283],[-2.263,7.283],[4.445,0.574],[4.445,-7.284]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.286,0.545,0.557,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[178.064,225.357],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[3.7,0],[0,0],[0,1.17],[-1.17,0],[0,0],[0,1.363],[-1.17,0],[0,-1.17]],"o":[[0,0],[-1.17,0],[0,-1.17],[0,0],[1.363,0],[0,-1.17],[1.17,0],[0,3.699]],"v":[[2.661,4.414],[-7.252,4.414],[-9.37,2.295],[-7.252,0.177],[2.661,0.177],[5.133,-2.295],[7.252,-4.414],[9.37,-2.295]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.435,0.675,0.698,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[173.139,228.226],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,1.898],[1.897,0],[0,0],[0,-1.898],[-1.897,0],[0,0]],"o":[[0,-1.898],[0,0],[-1.897,0],[0,1.898],[0,0],[1.897,0]],"v":[[3.623,0],[0.187,-3.436],[-0.187,-3.436],[-3.623,0],[-0.187,3.436],[0.187,3.436]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.388,0.439,0.467,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[165.634,230.521],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.271,0],[0,0],[-0.594,1.026]],"o":[[0.594,1.026],[0,0],[1.271,0],[0,0]],"v":[[-6.954,-0.862],[-3.992,0.862],[3.991,0.862],[6.954,-0.862]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.416,0.463,0.486,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[161.829,233.095],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.898,0],[0,0],[0,1.897],[-1.898,0],[0,0],[0,-1.898]],"o":[[0,0],[-1.898,0],[0,-1.898],[0,0],[1.898,0],[0,1.897]],"v":[[3.992,3.436],[-3.992,3.436],[-7.427,0.001],[-3.992,-3.436],[3.992,-3.436],[7.427,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[161.829,230.521],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.367,1.575],[0,0],[-1.022,0.29],[0.05,0.012],[0.379,-1.621],[0,0],[-1.621,-0.378],[-0.227,0],[-0.264,0.075]],"o":[[0,0],[0.258,-1.107],[-0.049,-0.013],[-1.621,-0.376],[0,0],[-0.378,1.622],[0.23,0.054],[0.282,0],[-1.54,-0.435]],"v":[[-3.4,13.843],[3.296,-14.913],[5.418,-17.118],[5.275,-17.166],[1.655,-14.913],[-5.04,13.843],[-2.788,17.463],[-2.1,17.542],[-1.28,17.418]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[42.06,186.353],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.367,1.575],[0,0],[-1.022,0.29],[0.05,0.012],[0.378,-1.621],[0,0],[-1.621,-0.378],[-0.227,0],[-0.264,0.075]],"o":[[0,0],[0.258,-1.108],[-0.048,-0.014],[-1.622,-0.376],[0,0],[-0.378,1.622],[0.23,0.054],[0.282,0],[-1.54,-0.435]],"v":[[-3.4,13.843],[3.295,-14.913],[5.417,-17.118],[5.276,-17.166],[1.656,-14.913],[-5.039,13.843],[-2.787,17.463],[-2.1,17.542],[-1.28,17.418]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.699,186.353],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.367,1.575],[0,0],[-1.021,0.29],[0.05,0.012],[0.378,-1.621],[0,0],[-1.621,-0.378],[-0.227,0],[-0.264,0.075]],"o":[[0,0],[0.258,-1.107],[-0.048,-0.013],[-1.622,-0.376],[0,0],[-0.378,1.622],[0.23,0.054],[0.282,0],[-1.54,-0.435]],"v":[[-3.4,13.843],[3.295,-14.913],[5.417,-17.118],[5.276,-17.166],[1.656,-14.913],[-5.039,13.843],[-2.787,17.463],[-2.1,17.542],[-1.28,17.418]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[31.879,186.353],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.324,1.391],[0,0],[1.621,0.377],[0.378,-1.621],[0,0],[-1.622,-0.378],[-0.226,0]],"o":[[0,0],[0.377,-1.622],[-1.621,-0.376],[0,0],[-0.377,1.622],[0.23,0.053],[1.37,0]],"v":[[9.769,15.21],[16.465,-13.546],[14.212,-17.166],[10.592,-14.914],[3.895,13.842],[6.148,17.463],[6.835,17.542]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.324,1.391],[0,0],[1.621,0.377],[0.379,-1.621],[0,0],[-1.621,-0.378],[-0.226,0]],"o":[[0,0],[0.378,-1.622],[-1.622,-0.376],[0,0],[-0.377,1.622],[0.23,0.053],[1.37,0]],"v":[[-0.412,15.21],[6.283,-13.546],[4.031,-17.166],[0.41,-14.914],[-6.285,13.842],[-4.032,17.463],[-3.345,17.542]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[1.369,0],[0.23,0.053],[-0.377,1.622],[0,0],[-1.623,-0.376],[0.378,-1.622],[0,0]],"o":[[-0.227,0],[-1.621,-0.378],[0,0],[0.377,-1.621],[1.621,0.377],[0,0],[-0.324,1.391]],"v":[[-13.525,17.542],[-14.212,17.463],[-16.465,13.842],[-9.769,-14.914],[-6.149,-17.166],[-3.897,-13.546],[-10.592,15.21]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[33.124,186.354],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":5,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[8.237,0],[0,0],[2.13,-9.147],[0,0],[-7.89,0],[0,0],[0,0],[-6.944,0],[0,0],[0,6.943],[0,0],[0,0],[0,6.351],[0,0],[6.767,0],[0,0],[0,0],[6.943,0],[0,0],[0,-6.943],[0,0],[0,0],[0,0]],"o":[[0,0],[-9.392,0],[0,0],[-1.789,7.684],[0,0],[0,0],[0,6.943],[0,0],[6.943,0],[0,0],[0,0],[6.351,0],[0,0],[0,-6.767],[0,0],[0,0],[0,-6.943],[0,0],[-6.944,0],[0,0],[0,0],[0,0],[1.868,-8.023]],"v":[[0.574,-153.193],[-23.04,-153.193],[-42.715,-137.572],[-85.368,45.627],[-73.434,60.66],[10.715,60.66],[10.715,140.62],[23.288,153.193],[52.456,153.193],[65.028,140.62],[65.028,60.66],[75.658,60.66],[87.157,49.16],[87.157,18.6],[74.904,6.346],[65.028,6.346],[65.028,-7.736],[52.456,-20.308],[23.288,-20.308],[10.715,-7.736],[10.715,6.346],[-20.457,6.346],[13.034,-137.499]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.69,-2.652],[0.566,-2.43],[0,0],[0,0],[-1.017,0],[0,0],[0,0],[0,0],[0,0.609],[0,0],[0,0],[-4.861,0],[0,0],[0,-4.86],[0,0],[0,0],[-0.61,0],[0,0],[0,0],[0,-4.684],[0,0],[4.268,0],[0,0],[0,0],[0,-0.609],[0,0],[0,0],[4.86,0],[0,0],[0,4.86],[0,0],[0,0],[0.61,0],[0,0],[0,0],[1.626,1.574],[-0.676,2.905],[0,0],[-7.639,0]],"o":[[3.088,0],[1.341,2.104],[0,0],[0,0],[-0.231,0.99],[0,0],[0,0],[0,0],[0.61,0],[0,0],[0,0],[0,-4.86],[0,0],[4.86,0],[0,0],[0,0],[0,0.609],[0,0],[0,0],[4.684,0],[0,0],[0,4.268],[0,0],[0,0],[-0.61,0],[0,0],[0,0],[0,4.86],[0,0],[-4.861,0],[0,0],[0,0],[0,-0.609],[0,0],[0,0],[-2.263,0],[-2.196,-2.124],[0,0],[1.733,-7.44],[0,0]],"v":[[0.574,-149.421],[8.2,-145.221],[9.299,-138.09],[-24.13,5.491],[-24.756,8.18],[-23.218,10.117],[-20.457,10.117],[10.715,10.117],[13.383,10.117],[14.487,9.014],[14.487,6.346],[14.487,-7.736],[23.288,-16.536],[52.456,-16.536],[61.256,-7.736],[61.256,6.346],[61.256,9.014],[62.36,10.117],[65.028,10.117],[74.904,10.117],[83.385,18.6],[83.385,49.16],[75.658,56.887],[65.028,56.887],[62.36,56.887],[61.256,57.99],[61.256,60.66],[61.256,140.62],[52.456,149.421],[23.288,149.421],[14.487,140.62],[14.487,60.66],[14.487,57.99],[13.383,56.887],[10.715,56.887],[-73.174,56.887],[-79.302,54.533],[-81.695,46.483],[-39.042,-136.716],[-23.04,-149.421]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[87.572,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 11","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.417,0],[0,0],[0.599,0.6],[0,0],[0.445,0],[0,0],[0,0.417],[-0.416,0],[0,0],[-0.599,-0.6],[0,0],[-0.445,0],[0,0],[0,-0.417]],"o":[[0,0],[-0.848,0],[0,0],[-0.316,-0.315],[0,0],[-0.416,0],[0,-0.416],[0,0],[0.848,0],[0,0],[0.315,0.315],[0,0],[0.417,0],[0,0.416]],"v":[[12.573,3.949],[2.44,3.949],[0.195,3.018],[-4.777,-1.952],[-5.956,-2.441],[-12.573,-2.441],[-13.327,-3.195],[-12.573,-3.949],[-5.956,-3.949],[-3.711,-3.018],[1.261,1.952],[2.44,2.441],[12.573,2.441],[13.327,3.195]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[113.011,165.615],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 12","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.848,0],[0,0],[0,0.416],[-0.417,0],[0,0],[-0.315,0.315],[0,0],[-0.836,0],[0,0],[0,-0.416],[0.416,0],[0,0],[0.31,-0.31],[0,0]],"o":[[0,0],[-0.417,0],[0,-0.417],[0,0],[0.445,0],[0,0],[0.592,-0.592],[0,0],[0.416,0],[0,0.417],[0,0],[-0.439,0],[0,0],[-0.6,0.6]],"v":[[-2.439,3.949],[-12.573,3.949],[-13.327,3.195],[-12.573,2.441],[-2.439,2.441],[-1.261,1.952],[3.71,-3.018],[5.957,-3.949],[12.573,-3.949],[13.327,-3.195],[12.573,-2.441],[5.957,-2.441],[4.777,-1.952],[-0.194,3.018]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[138.157,165.615],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 13","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.417,0],[0,0],[0.599,0.6],[0,0],[0.446,0],[0,0],[0,0.416],[-0.416,0],[0,0],[-0.6,-0.6],[0,0],[-0.439,0],[0,0],[0,-0.417]],"o":[[0,0],[-0.848,0],[0,0],[-0.315,-0.314],[0,0],[-0.416,0],[0,-0.417],[0,0],[0.849,0],[0,0],[0.311,0.31],[0,0],[0.417,0],[0,0.416]],"v":[[12.573,3.949],[5.956,3.949],[3.711,3.019],[-1.26,-1.953],[-2.44,-2.441],[-12.573,-2.441],[-13.327,-3.195],[-12.573,-3.949],[-2.44,-3.949],[-0.194,-3.019],[4.777,1.952],[5.956,2.44],[12.573,2.44],[13.327,3.195]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[138.157,207.551],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 14","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.848,0],[0,0],[0,0.416],[-0.416,0],[0,0],[-0.315,0.315],[0,0],[-0.849,0],[0,0],[0,-0.417],[0.416,0],[0,0],[0.315,-0.314],[0,0]],"o":[[0,0],[-0.416,0],[0,-0.417],[0,0],[0.445,0],[0,0],[0.6,-0.6],[0,0],[0.416,0],[0,0.416],[0,0],[-0.446,0],[0,0],[-0.599,0.6]],"v":[[-5.956,3.949],[-12.573,3.949],[-13.327,3.195],[-12.573,2.44],[-5.956,2.44],[-4.777,1.952],[0.194,-3.019],[2.44,-3.949],[12.573,-3.949],[13.327,-3.195],[12.573,-2.441],[2.44,-2.441],[1.261,-1.953],[-3.711,3.019]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[113.012,207.551],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 15","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.417,0],[0,0],[0.599,0.6],[0,0],[0.446,0],[0,0],[0,0.416],[-0.416,0],[0,0],[-0.6,-0.6],[0,0],[-0.439,0],[0,0],[0,-0.417]],"o":[[0,0],[-0.848,0],[0,0],[-0.315,-0.314],[0,0],[-0.416,0],[0,-0.417],[0,0],[0.849,0],[0,0],[0.311,0.31],[0,0],[0.417,0],[0,0.416]],"v":[[12.573,3.949],[5.956,3.949],[3.711,3.019],[-1.26,-1.953],[-2.44,-2.441],[-12.573,-2.441],[-13.327,-3.195],[-12.573,-3.949],[-2.44,-3.949],[-0.194,-3.019],[4.777,1.952],[5.956,2.44],[12.573,2.44],[13.327,3.195]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[138.157,246.96],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 16","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.848,0],[0,0],[0,0.416],[-0.416,0],[0,0],[-0.315,0.315],[0,0],[-0.849,0],[0,0],[0,-0.417],[0.416,0],[0,0],[0.315,-0.314],[0,0]],"o":[[0,0],[-0.416,0],[0,-0.417],[0,0],[0.445,0],[0,0],[0.6,-0.6],[0,0],[0.416,0],[0,0.416],[0,0],[-0.446,0],[0,0],[-0.599,0.6]],"v":[[-5.956,3.949],[-12.573,3.949],[-13.327,3.195],[-12.573,2.44],[-5.956,2.44],[-4.777,1.952],[0.194,-3.019],[2.44,-3.949],[12.573,-3.949],[13.327,-3.195],[12.573,-2.441],[2.44,-2.441],[1.261,-1.953],[-3.711,3.019]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[113.012,246.96],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 17","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.767,0],[0,0],[0,0],[6.943,0],[0,0],[0,-6.944],[0,0],[0,0],[0,0],[8.237,0],[0,0],[2.13,-9.148],[0,0],[-7.89,0],[0,0],[0,0],[-6.944,0],[0,0],[0,6.944],[0,0],[0,0],[0,6.351],[0,0]],"o":[[0,0],[0,0],[0,-6.944],[0,0],[-6.944,0],[0,0],[0,0],[0,0],[1.868,-8.022],[0,0],[-9.392,0],[0,0],[-1.789,7.684],[0,0],[0,0],[0,6.944],[0,0],[6.943,0],[0,0],[0,0],[6.351,0],[0,0],[0,-6.767]],"v":[[74.904,6.346],[65.028,6.346],[65.028,-7.735],[52.456,-20.308],[23.288,-20.308],[10.715,-7.735],[10.715,6.346],[-20.456,6.346],[13.034,-137.499],[0.574,-153.193],[-23.04,-153.193],[-42.715,-137.572],[-85.368,45.628],[-73.434,60.659],[10.715,60.659],[10.715,140.62],[23.288,153.193],[52.456,153.193],[65.028,140.62],[65.028,60.659],[75.658,60.659],[87.157,49.16],[87.157,18.599]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[87.644,153.13],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 18","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[6.944,0],[0,0],[0,6.944],[0,0],[0,0]],"o":[[0,6.944],[0,0],[6.943,0],[0,0],[0,0],[0,0]],"v":[[2.84,33.694],[-9.733,46.267],[-2.839,46.267],[9.733,33.694],[9.733,-46.267],[2.84,-46.267]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[162.48,259.983],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 19","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.767,0],[0,0],[0,-6.767],[0,0],[6.351,0],[0,0],[0,6.35],[0,0]],"o":[[0,0],[6.767,0],[0,0],[0,6.35],[0,0],[6.351,0],[0,0],[0,-6.767]],"v":[[-2.68,-27.156],[-9.573,-27.156],[2.68,-14.903],[2.68,15.659],[-8.819,27.157],[-1.926,27.157],[9.573,15.659],[9.573,-14.903]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[184.77,186.56],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 20","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.868,-8.023],[0,0],[0,0],[0,0],[8.238,0],[0,0]],"o":[[0,0],[0,0],[0,0],[1.868,-8.023],[0,0],[8.237,0]],"v":[[12.365,-64.075],[-21.126,79.769],[-14.233,79.769],[19.257,-64.075],[6.798,-79.769],[-0.095,-79.769]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[100.962,79.634],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 21","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-6.944],[0,0],[0,0],[0,0],[6.943,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,-6.944],[0,0],[6.944,0]],"v":[[2.84,-0.754],[2.84,13.327],[9.733,13.327],[9.733,-0.754],[-2.839,-13.327],[-9.733,-13.327]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.588,0.647,0.667,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[162.48,146.076],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 22","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[6.767,0],[0,0],[0,0],[6.943,0],[0,0],[0,-6.944],[0,0],[0,0],[0,0],[8.237,0],[0,0],[2.13,-9.148],[0,0],[-7.89,0],[0,0],[0,0],[-6.944,0],[0,0],[0,6.944],[0,0],[0,0],[0,6.351],[0,0]],"o":[[0,0],[0,0],[0,-6.944],[0,0],[-6.944,0],[0,0],[0,0],[0,0],[1.868,-8.022],[0,0],[-9.392,0],[0,0],[-1.789,7.684],[0,0],[0,0],[0,6.944],[0,0],[6.943,0],[0,0],[0,0],[6.351,0],[0,0],[0,-6.767]],"v":[[74.904,6.346],[65.028,6.346],[65.028,-7.735],[52.456,-20.308],[23.288,-20.308],[10.715,-7.735],[10.715,6.346],[-20.456,6.346],[13.034,-137.499],[0.574,-153.193],[-23.04,-153.193],[-42.715,-137.572],[-85.368,45.628],[-73.434,60.659],[10.715,60.659],[10.715,140.62],[23.288,153.193],[52.456,153.193],[65.028,140.62],[65.028,60.659],[75.658,60.659],[87.157,49.16],[87.157,18.599]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[107.186,153.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 23","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.598,0],[0,0],[0,0],[0,0],[0,0.599],[0,0]],"o":[[0,0],[0,0],[0,0],[0.598,0],[0,0],[0,-0.598]],"v":[[0.254,-4.679],[-1.337,-4.679],[-1.337,4.679],[0.254,4.679],[1.337,3.595],[1.337,-3.596]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.388,0.427,0.447,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[182.055,213.395],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 24","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.598,0],[0,0],[0,-0.598],[0,0],[-0.599,0],[0,0],[0,0.599],[0,0]],"o":[[0,0],[-0.599,0],[0,0],[0,0.599],[0,0],[0.598,0],[0,0],[0,-0.598]],"v":[[2.075,-4.679],[-2.074,-4.679],[-3.158,-3.596],[-3.158,3.595],[-2.074,4.679],[2.075,4.679],[3.158,3.595],[3.158,-3.596]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[180.234,213.395],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 25","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.17,0],[0,1.17],[0,0],[-1.17,0],[0,-1.17],[0,0]],"o":[[-1.17,0],[0,0],[0,-1.17],[1.17,0],[0,0],[0,1.17]],"v":[[0,8.695],[-2.119,6.577],[-2.119,-6.576],[0,-8.695],[2.119,-6.576],[2.119,6.577]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.435,0.675,0.698,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[180.391,219.354],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 26","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_130","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"cooler","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[952.5,664.39,0]},"a":{"a":0,"k":[21.5,26.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-0.913,0.527],[0,1.055],[0.913,0.527],[0.913,-0.527],[0,-1.055],[-0.913,-0.527]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.314,0.357,0.376,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[6.163,20.161],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-0.913,0.527],[0,1.055],[0.913,0.527],[0.913,-0.527],[0,-1.055],[-0.913,-0.527]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.314,0.357,0.376,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[6.163,49.041],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-0.913,0.527],[0,1.055],[0.913,0.527],[0.913,-0.527],[0,-1.055],[-0.913,-0.527]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.314,0.357,0.376,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[34.77,20.161],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-0.913,0.527],[0,1.055],[0.913,0.527],[0.913,-0.527],[0,-1.055],[-0.913,-0.527]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.314,0.357,0.376,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[34.77,49.041],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.643,0],[0,-2.643],[-2.643,0],[0,2.644]],"o":[[-2.643,0],[0,2.644],[2.643,0],[0,-2.643]],"v":[[0,-4.786],[-4.786,-0.001],[0,4.786],[4.786,-0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.937,0.937,0.937,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.466,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[3.463,0],[0,-3.463],[-3.463,0],[0,3.463]],"o":[[-3.463,0],[0,3.463],[3.463,0],[0,-3.463]],"v":[[0,-6.271],[-6.271,0],[0,6.271],[6.271,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.753,0.776,0.8,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.466,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.001,0.053],[1.685,1.684],[-0.196,0.545],[-0.944,1.198],[-0.642,-0.643],[0,0],[-0.039,0.037],[0,2.382],[0,0],[-0.522,0.246],[-1.639,0.169],[0,-0.804],[0,0],[-0.053,-0.002],[-1.685,1.684],[-0.544,-0.197],[-1.198,-0.944],[0.642,-0.643],[0,0],[-0.037,-0.039],[-2.382,0],[0,0],[-0.246,-0.523],[-0.185,-1.561],[0.911,0],[0,0],[0.001,-0.054],[-1.685,-1.685],[0.197,-0.545],[0.944,-1.199],[0.642,0.643],[0,0],[0.039,-0.037],[0,-2.383],[0,0],[0.523,-0.246],[1.639,-0.169],[0,0.803],[0,0],[0.053,0.001],[1.685,-1.684],[0.545,0.197],[1.199,0.944],[-0.642,0.643],[0,0],[0.037,0.038],[2.383,0],[0,0],[0.246,0.522],[0.169,1.639],[-0.803,0],[0,0]],"o":[[-2.319,-0.389],[-0.41,-0.41],[0.529,-1.462],[0.562,-0.714],[0,0],[0.038,-0.037],[-1.365,-1.915],[0,0],[0,-0.578],[1.429,-0.671],[0.8,-0.082],[0,0],[0.054,0],[0.389,-2.32],[0.409,-0.41],[1.462,0.528],[0.714,0.562],[0,0],[0.038,0.038],[1.915,-1.365],[0,0],[0.578,0],[0.643,1.367],[0.107,0.904],[0,0],[0,0.053],[2.319,0.389],[0.409,0.41],[-0.528,1.462],[-0.562,0.714],[0,0],[-0.038,0.038],[1.365,1.915],[0,0],[0,0.578],[-1.429,0.672],[-0.799,0.082],[0,0],[-0.053,0],[-0.39,2.319],[-0.409,0.41],[-1.462,-0.528],[-0.713,-0.563],[0,0],[-0.038,-0.037],[-1.915,1.364],[0,0],[-0.577,0],[-0.672,-1.429],[-0.082,-0.799],[0,0],[0,-0.054]],"v":[[-7.019,-0.16],[-13.182,-3.332],[-13.542,-4.897],[-11.312,-8.91],[-9.051,-9.05],[-4.966,-4.966],[-4.85,-5.076],[-6.965,-11.677],[-6.965,-11.679],[-6.117,-13.038],[-1.492,-14.323],[-0.001,-12.962],[-0.001,-7.023],[0.159,-7.018],[3.332,-13.181],[4.896,-13.541],[8.909,-11.312],[9.05,-9.05],[4.965,-4.966],[5.075,-4.85],[11.676,-6.965],[11.678,-6.965],[13.037,-6.116],[14.299,-1.704],[12.8,0],[7.022,0],[7.018,0.16],[13.181,3.332],[13.54,4.897],[11.311,8.91],[9.05,9.05],[4.965,4.965],[4.849,5.076],[6.964,11.677],[6.964,11.679],[6.115,13.037],[1.49,14.323],[-0.001,12.962],[-0.001,7.022],[-0.16,7.018],[-3.333,13.181],[-4.898,13.541],[-8.911,11.312],[-9.051,9.05],[-4.966,4.965],[-5.077,4.85],[-11.678,6.964],[-11.68,6.964],[-13.038,6.116],[-14.324,1.491],[-12.963,0],[-7.023,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.467,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"n":["0p667_1_0p333_0"],"t":0,"s":[0],"e":[1800]},{"t":80}],"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.803,0],[0,0],[0,-0.803],[0,0],[-0.803,0],[0,0],[0,0.803],[0,0]],"o":[[0,0],[-0.803,0],[0,0],[0,0.803],[0,0],[0.803,0],[0,0],[0,-0.803]],"v":[[15.396,-16.85],[-15.396,-16.85],[-16.85,-15.396],[-16.85,15.396],[-15.396,16.85],[15.396,16.85],[16.85,15.396],[16.85,-15.396]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,-0.41],[0,0],[0.409,0],[0,0],[0,0.409],[0,0],[-0.409,0]],"o":[[0.409,0],[0,0],[0,0.409],[0,0],[-0.409,0],[0,0],[0,-0.41],[0,0]],"v":[[15.396,-16.139],[16.138,-15.396],[16.138,15.396],[15.396,16.138],[-15.396,16.138],[-16.138,15.396],[-16.138,-15.396],[-15.396,-16.139]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.353,0.384,0.4,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.467,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-8.836],[0,0],[-8.836,0],[0,8.836],[8.836,0]],"o":[[0,0],[0,8.836],[8.836,0],[0,-8.836],[-8.836,0]],"v":[[-15.999,0],[-15.999,0],[0,15.999],[15.999,0],[0,-15.999]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.376,0.424,0.447,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.467,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-0.803],[0,0],[-0.803,0],[0,0],[0,0.803],[0,0],[0.803,0],[0,0]],"o":[[0,0],[0,0.803],[0,0],[0.803,0],[0,0],[0,-0.803],[0,0],[-0.803,0]],"v":[[-16.85,-15.396],[-16.85,15.396],[-15.396,16.85],[15.396,16.85],[16.85,15.396],[16.85,-15.396],[15.396,-16.85],[-15.396,-16.85]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.475,0.514,0.537,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.467,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-0.803],[0,0],[-0.803,0],[0,0],[0,0.803],[0,0],[0.803,0],[0,0]],"o":[[0,0],[0,0.803],[0,0],[0.803,0],[0,0],[0,-0.803],[0,0],[-0.803,0]],"v":[[-16.85,-15.396],[-16.85,15.396],[-15.396,16.85],[15.396,16.85],[16.85,15.396],[16.85,-15.396],[15.396,-16.85],[-15.396,-16.85]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.353,0.384,0.4,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.726,34.601],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 11","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,608.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,611,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,613.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":4,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,616,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":5,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,618.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":6,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,621,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":7,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,623.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":8,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,626,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":9,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,628.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":10,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,631,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":11,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,633.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":12,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,636,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":13,"ty":0,"nm":"Line","refId":"comp_131","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930.25,638.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1}]},{"id":"comp_131","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Shape Layer 1","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[0,0,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-0.384],[0,0],[-0.384,0],[0,0],[0,0.384],[0.384,0],[0,0]],"o":[[0,0],[0,0.384],[0,0],[0.384,0],[0,-0.384],[0,0],[-0.384,0]],"v":[[-20.403,0],[-20.403,0],[-19.708,0.695],[19.708,0.695],[20.403,0],[19.708,-0.695],[-19.708,-0.695]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.592,0.624,0.647,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.096,49.204],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 63","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_132","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Tranz 3","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[20,9.39,0]},"a":{"a":0,"k":[15,5.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.331,0],[0,0],[0,0.331],[0,0],[-0.331,0],[0,0],[0,-0.331],[0,0]],"o":[[0,0],[-0.331,0],[0,0],[0,-0.331],[0,0],[0.331,0],[0,0],[0,0.331]],"v":[[2.898,1.532],[-2.898,1.532],[-3.498,0.932],[-3.498,-0.932],[-2.898,-1.532],[2.898,-1.532],[3.498,-0.932],[3.498,0.932]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,0.729,0.333,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[8.267,3.986],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-0.427,0],[0,0],[-0.112,0.391]],"o":[[0.113,0.391],[0,0],[0.427,0],[0,0]],"v":[[-4.515,-0.342],[-3.63,0.342],[3.63,0.342],[4.515,-0.342]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.714,0.745,0.757,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[24.264,5.86],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.517,0],[0,0],[0,0.518],[-0.517,0],[0,0],[0,-0.517]],"o":[[0,0],[-0.517,0],[0,-0.517],[0,0],[0.517,0],[0,0.518]],"v":[[3.63,0.936],[-3.63,0.936],[-4.566,0],[-3.63,-0.936],[3.63,-0.936],[4.566,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.894,0.91,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[24.265,5.265],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,2.5],[2.5,0],[0,0],[0,-2.5],[-2.5,0],[0,0]],"o":[[0,-2.5],[0,0],[-2.5,0],[0,2.5],[0,0],[2.5,0]],"v":[[4.564,0],[0.037,-4.527],[-0.037,-4.527],[-4.564,0],[-0.037,4.527],[0.037,4.527]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.8,0.369,0.082,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.364,5.265],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.907,0],[0,0],[-0.667,1.668]],"o":[[0.668,1.668],[0,0],[1.906,0],[0,0]],"v":[[-12.081,-1.425],[-7.883,1.425],[7.884,1.425],[12.081,-1.425]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.867,0.408,0.098,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.516,8.367],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.031,0],[0.048,0.483],[0,0.152],[-1.731,0.694],[-0.192,-0.479],[0.481,-0.192],[0,-1.083],[-0.009,-0.087],[0.514,-0.051]],"o":[[-0.476,0],[-0.015,-0.148],[0,-1.852],[0.481,-0.192],[0.193,0.48],[-1.016,0.408],[0,0.089],[0.051,0.515],[-0.032,0.003]],"v":[[-1.177,2.839],[-2.108,1.995],[-2.13,1.545],[0.719,-2.648],[1.937,-2.127],[1.416,-0.91],[-0.257,1.545],[-0.244,1.809],[-1.083,2.835]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,0.839,0.753,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[2.235,3.721],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.5,0],[0,0],[0,2.5],[-2.5,0],[0,0],[0,-2.501]],"o":[[0,0],[-2.5,0],[0,-2.501],[0,0],[2.5,0],[0,2.5]],"v":[[7.884,4.527],[-7.884,4.527],[-12.411,0.001],[-7.884,-4.527],[7.884,-4.527],[12.411,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.937,0.451,0.125,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.516,5.264],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_133","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Tranzs","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[1021.5,552.89,0]},"a":{"a":0,"k":[15.5,12,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.337,0],[0,0],[0,0],[0,0],[0,0.336],[0,0]],"o":[[0,0],[0,0],[0,0],[0.337,0],[0,0],[0,-0.337]],"v":[[0.609,-2.361],[-1.219,-2.361],[-1.219,2.361],[0.609,2.361],[1.219,1.752],[1.219,-1.751]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.318,0.694,0.808,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[13.032,17.694],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 22","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.337,0],[0,0],[0,0.337],[0,0],[-0.336,0],[0,0],[0,-0.336],[0,0]],"o":[[0,0],[-0.336,0],[0,0],[0,-0.336],[0,0],[0.337,0],[0,0],[0,0.337]],"v":[[2.488,2.361],[-2.488,2.361],[-3.098,1.751],[-3.098,-1.752],[-2.488,-2.361],[2.488,-2.361],[3.098,-1.752],[3.098,1.751]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[11.154,17.695],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 23","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.337,0],[0,0],[0,0],[0,0],[0,0.336],[0,0]],"o":[[0,0],[0,0],[0,0],[0.337,0],[0,0],[0,-0.337]],"v":[[0.609,-2.361],[-1.219,-2.361],[-1.219,2.361],[0.609,2.361],[1.219,1.752],[1.219,-1.751]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.318,0.694,0.808,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[13.032,5.593],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 24","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.337,0],[0,0],[0,0.337],[0,0],[-0.336,0],[0,0],[0,-0.336],[0,0]],"o":[[0,0],[-0.336,0],[0,0],[0,-0.336],[0,0],[0.337,0],[0,0],[0,0.337]],"v":[[2.488,2.361],[-2.488,2.361],[-3.098,1.751],[-3.098,-1.752],[-2.488,-2.361],[2.488,-2.361],[3.098,-1.752],[3.098,1.751]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.478,0.796,0.867,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[11.154,5.594],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 25","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.323,0],[0,0],[0,0.323],[0,0],[-0.323,0],[0,0],[0,-0.323],[0,0]],"o":[[0,0],[-0.323,0],[0,0],[0,-0.323],[0,0],[0.323,0],[0,0],[0,0.323]],"v":[[0.329,7.363],[-0.33,7.363],[-0.914,6.778],[-0.914,-6.778],[-0.33,-7.363],[0.329,-7.363],[0.914,-6.778],[0.914,6.778]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.231,0.612,0.698,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.728,12.017],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 26","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.533,0],[0,0],[0,0.533],[0,0],[-0.533,0],[0,0],[0,-0.533],[0,0]],"o":[[0,0],[-0.533,0],[0,0],[0,-0.533],[0,0],[0.533,0],[0,0],[0,0.533]],"v":[[1.523,7.363],[-1.524,7.363],[-2.488,6.398],[-2.488,-6.398],[-1.524,-7.363],[1.523,-7.363],[2.488,-6.398],[2.488,6.398]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.318,0.694,0.808,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[11.154,12.017],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 27","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.449,0],[0,0],[0,1.083],[0,0],[-1.084,0],[0,0],[0,-0.449],[0.449,0],[0,0],[0,-0.188],[0,0],[-0.188,0],[0,0],[0,-0.449]],"o":[[0,0],[-1.084,0],[0,0],[0,-1.084],[0,0],[0.449,0],[0,0.448],[0,0],[-0.188,0],[0,0],[0,0.187],[0,0],[0.449,0],[0,0.448]],"v":[[1.769,11.055],[-0.615,11.055],[-2.581,9.09],[-2.581,-9.089],[-0.615,-11.055],[1.769,-11.055],[2.581,-10.242],[1.769,-9.43],[-0.615,-9.43],[-0.956,-9.089],[-0.956,9.09],[-0.615,9.43],[1.769,9.43],[2.581,10.243]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.894,0.91,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[12.922,11.644],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 28","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_134","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Chips","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[20,36.39,0]},"a":{"a":0,"k":[15,32.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.107,0],[0,0],[0,0.107],[0,0],[-0.107,0],[0,0],[0,-0.107],[0,0]],"o":[[0,0],[-0.107,0],[0,0],[0,-0.107],[0,0],[0.107,0],[0,0],[0,0.107]],"v":[[3.826,0.649],[-3.827,0.649],[-4.02,0.455],[-4.02,-0.455],[-3.827,-0.649],[3.826,-0.649],[4.02,-0.455],[4.02,0.455]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.729,0.761,0.776,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[7.098,9.809],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 51","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.194,0],[0,0],[0,0.194],[0,0],[-0.194,0],[0,0],[0,-0.194],[0,0]],"o":[[0,0],[-0.194,0],[0,0],[0,-0.194],[0,0],[0.194,0],[0,0],[0,0.194]],"v":[[4.762,1.678],[-4.761,1.678],[-5.113,1.327],[-5.113,-1.326],[-4.761,-1.678],[4.762,-1.678],[5.113,-1.326],[5.113,1.327]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.729,0.761,0.776,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[8.19,6.945],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 52","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,-1.057],[0,0],[0,0],[0,2.26],[0,0]],"o":[[-1.056,0],[0,0],[0,0],[2.26,0],[0,0],[0,0]],"v":[[-9.552,-3.581],[-11.465,-1.668],[-11.465,3.581],[7.374,3.581],[11.465,-0.511],[11.465,-3.581]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.38,0.392,0.4,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[11.983,7.473],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 53","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.056,0],[0,0],[0,1.056],[0,0],[-1.057,0],[0,0],[0,-1.056],[0,0]],"o":[[0,0],[-1.057,0],[0,0],[0,-1.056],[0,0],[1.056,0],[0,0],[0,1.056]],"v":[[11.495,5.327],[-11.493,5.327],[-13.406,3.416],[-13.406,-3.415],[-11.493,-5.327],[11.495,-5.327],[13.406,-3.415],[13.406,3.416]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.329,0.345,0.357,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[13.924,9.219],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 54","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.056,0],[0,0],[0,1.056],[0,0],[-1.057,0],[0,0],[0,-1.056],[0,0]],"o":[[0,0],[-1.057,0],[0,0],[0,-1.056],[0,0],[1.056,0],[0,0],[0,1.056]],"v":[[11.495,5.327],[-11.493,5.327],[-13.406,3.416],[-13.406,-3.415],[-11.493,-5.327],[11.495,-5.327],[13.406,-3.415],[13.406,3.416]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.2,0.216,0.227,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[15.797,9.219],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 55","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.965],[0,-4.372],[1.405,-2.965],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[24.931,14.02],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 56","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[25.477,16.986],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 57","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.965],[0,-4.372],[1.405,-2.965],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[19.769,14.02],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 58","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.315,16.986],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 59","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.965],[0,-4.372],[1.405,-2.965],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[14.607,14.02],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 60","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[15.154,16.986],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 61","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.965],[0,-4.372],[1.405,-2.965],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[9.446,14.02],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 62","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[9.992,16.986],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 63","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.965],[0,-4.372],[1.405,-2.965],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.284,14.02],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 64","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.83,16.986],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 65","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.967],[0,-4.372],[1.405,-2.967],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[24.931,4.419],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 66","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[25.477,1.452],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 67","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.967],[0,-4.372],[1.405,-2.967],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[19.769,4.419],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 68","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[20.315,1.452],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 69","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.967],[0,-4.372],[1.405,-2.967],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[14.607,4.419],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 70","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[15.154,1.452],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 71","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.967],[0,-4.372],[1.405,-2.967],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[9.446,4.419],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 72","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[9.992,1.452],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 73","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0.776],[0,0],[-0.776,0],[0,-0.776],[0,0]],"o":[[-0.776,0],[0,0],[0,-0.776],[0.776,0],[0,0],[0,0.776]],"v":[[0,4.372],[-1.405,2.967],[-1.405,-2.967],[0,-4.372],[1.405,-2.967],[1.405,2.967]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.867,0.878,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.284,4.419],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 74","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.776,0],[0,0],[0,0.776],[-0.776,0],[0,0],[0,-0.776]],"o":[[0,0],[-0.776,0],[0,-0.776],[0,0],[0.776,0],[0,0.776]],"v":[[0.547,1.406],[-0.547,1.406],[-1.952,0.001],[-0.547,-1.406],[0.547,-1.406],[1.952,0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.671,0.706,0.718,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.83,1.452],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 75","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_135","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"hole","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[889.908,422.783,0]},"a":{"a":0,"k":[32.908,28.893,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.586,0.142],[0.458,-0.458],[-1.326,-1.326],[-0.586,-0.142],[-0.458,0.458],[1.326,1.326]],"o":[[-0.586,0.142],[-1.326,1.326],[0.458,0.458],[0.586,-0.142],[1.326,-1.326],[-0.458,-0.458]],"v":[[0,-3.289],[-1.603,-2.401],[-1.603,2.401],[0,3.289],[1.603,2.401],[1.603,-2.401]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.612,0.655,0.686,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[32.908,28.893],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 11","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.326,1.326],[-1.326,1.326],[-1.326,-1.326],[1.326,-1.326]],"o":[[-1.326,-1.326],[1.326,-1.326],[1.326,1.326],[-1.326,1.326]],"v":[[-2.4,2.4],[-2.4,-2.401],[2.401,-2.401],[2.401,2.4]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[32.11,28.893],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 12","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[2.472,2.472],[0,0],[-0.29,0.29],[0,0],[-0.291,-0.29],[0,0],[2.471,-2.472]],"o":[[0,0],[-0.29,-0.29],[0,0],[0.291,-0.29],[0,0],[2.471,2.472],[-2.472,2.472]],"v":[[-3.519,5.431],[-7.613,1.338],[-7.613,0.287],[0.287,-7.613],[1.338,-7.613],[5.432,-3.52],[5.432,5.431]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,1,1,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[30.914,27.697],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 13","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_136","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"0 - Group 20","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[876.376,547.181,0]},"a":{"a":0,"k":[19.376,153.291,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.486,0],[0,0.485],[-0.486,0],[0,-0.486]],"o":[[-0.486,0],[0,-0.486],[0.486,0],[0,0.485]],"v":[[0.001,5.673],[-0.88,4.792],[0.001,3.911],[0.882,4.792]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0.774,0.207],[0,0],[0,0],[0,0.252],[0,0],[0.252,0],[0,0],[0,-0.253],[0,0],[-0.253,0],[0,0],[0,0],[0,-0.839],[-1,0],[0,1]],"o":[[0,0],[0,0],[0.252,0],[0,0],[0,-0.253],[0,0],[-0.253,0],[0,0],[0,0.252],[0,0],[0,0],[-0.774,0.207],[0,1],[1,0],[0,-0.838]],"v":[[0.466,3.046],[0.466,-0.87],[0.684,-0.87],[1.141,-1.327],[1.141,-6.15],[0.684,-6.607],[-0.682,-6.607],[-1.139,-6.15],[-1.139,-1.327],[-0.682,-0.87],[-0.465,-0.87],[-0.465,3.046],[-1.814,4.792],[0.001,6.607],[1.814,4.792]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.796,0.898,0.424,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[19.376,153.291],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 20","np":4,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_137","layers":[{"ddd":0,"ind":0,"ty":0,"nm":"Lamps pre-comp","refId":"comp_138","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"tm":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":61,"s":[0.833],"e":[0]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":81,"s":[0],"e":[10]},{"t":301}]},"w":1920,"h":1080,"ip":61,"op":81,"st":61,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":0,"nm":"Lamps pre-comp","refId":"comp_138","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":20,"op":61,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":0,"nm":"Lamps pre-comp","refId":"comp_138","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":20,"st":0,"bm":0,"sr":1}]},{"id":"comp_138","layers":[{"ddd":0,"ind":0,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[923.625,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[922.375,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":2,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[921,545.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":3,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[919.75,551.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":4,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[930,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":5,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[928.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":6,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[942.5,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":7,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[941.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":8,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[948.75,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":9,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[947.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":10,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[946.125,545.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":11,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[955,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":12,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":13,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[952.375,545.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":14,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[951.125,551.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":15,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[961.25,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":16,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":17,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[922.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":18,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[928.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":19,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[935,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":20,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[941.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":21,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[941.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":22,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[947.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":23,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":24,"ty":0,"nm":"1 row","refId":"comp_140","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":25,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[947.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":26,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":27,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[928.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":28,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[935,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":29,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":30,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[941.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":31,"ty":0,"nm":"2 row","refId":"comp_141","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":32,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[928.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":33,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[934.875,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":6,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":34,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[947.375,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":6,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":35,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[941.125,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":6,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":36,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[947.375,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":3,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":37,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":38,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":39,"ty":0,"nm":"3 row","refId":"comp_142","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":6,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":40,"ty":0,"nm":"6 row","refId":"comp_143","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":16,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":41,"ty":0,"nm":"4 row","refId":"comp_144","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":42,"ty":0,"nm":"4 row","refId":"comp_144","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[985.125,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":43,"ty":0,"nm":"4 row","refId":"comp_144","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[972.5,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":44,"ty":0,"nm":"4 row","refId":"comp_144","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":45,"ty":0,"nm":"4 row","refId":"comp_144","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":46,"ty":0,"nm":"5 row","refId":"comp_145","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[985,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":13,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":47,"ty":0,"nm":"5 row","refId":"comp_145","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[966.25,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":13,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":48,"ty":0,"nm":"5 row","refId":"comp_145","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.75,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":13,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":49,"ty":0,"nm":"5 row","refId":"comp_145","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":10,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":50,"ty":0,"nm":"7 row","refId":"comp_146","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[960,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":18,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":51,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[927.25,545.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":52,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[926,551.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":53,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[939.75,545.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":54,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[938.5,551.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":55,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[936.25,533.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":56,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[935,540,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":57,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[933.625,545.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":58,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[932.375,551.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":59,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[918.5,558,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":60,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[917.125,563.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":61,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[915.875,569.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":62,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[926,551.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":63,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[924.75,558,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":64,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[923.375,563.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":65,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[922.125,569.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":66,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[932.25,551.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":67,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[931,558,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":68,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[929.625,563.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":69,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[928.375,569.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":70,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[938.5,551.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":71,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[937.25,558,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":72,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[935.875,563.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":73,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[934.625,569.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":74,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[944.75,551.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":75,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[943.5,558,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":76,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[942.125,563.125,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":77,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[940.875,569.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":78,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[958.5,546.25,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":79,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[957.25,552.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":80,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[955.875,557.625,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":81,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[954.625,563.875,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":82,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[949.625,558.375,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":83,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[948.25,563.5,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":84,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[947,569.75,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":85,"ty":0,"nm":"grey lamp","refId":"comp_139","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[953.25,570,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":240,"st":0,"bm":0,"sr":1}]},{"id":"comp_139","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamps 2 - Group 1","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[747.132,417.424,0]},"a":{"a":0,"k":[48.132,8.534,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.13,0.273],[0.009,0.002],[0.024,0.005],[0.118,0.003],[0.235,-1.002],[-1.151,-0.268],[-0.164,0],[-0.394,0.558],[-0.066,0.278]],"o":[[-0.009,-0.002],[-0.024,-0.005],[-0.12,-0.024],[-0.995,-0.028],[-0.268,1.152],[0.164,0.036],[0.696,0],[0.157,-0.22],[0.26,-1.136]],"v":[[0.514,-2.055],[0.488,-2.063],[0.416,-2.072],[0.059,-2.119],[-2.077,-0.473],[-0.481,2.092],[0.006,2.146],[1.739,1.243],[2.084,0.495]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[48.129,8.521],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_140","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamp","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[740.139,447.387,0]},"a":{"a":0,"k":[41.139,38.497,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.13,0.273],[0.009,0.002],[0.024,0.005],[0.118,0.003],[0.235,-1.002],[-1.151,-0.268],[-0.164,0],[-0.394,0.558],[-0.065,0.278]],"o":[[-0.009,-0.002],[-0.024,-0.005],[-0.12,-0.024],[-0.995,-0.028],[-0.268,1.152],[0.164,0.036],[0.696,0],[0.157,-0.22],[0.261,-1.136]],"v":[[0.514,-2.055],[0.488,-2.063],[0.416,-2.072],[0.059,-2.119],[-2.077,-0.473],[-0.481,2.092],[0.006,2.146],[1.739,1.243],[2.083,0.495]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.102,0.627,0.102,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[41.136,38.483],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_141","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamp","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[735.199,441.394,0]},"a":{"a":0,"k":[36.199,32.504,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.13,0.273],[0.009,0.002],[0.024,0.005],[0.119,0.003],[0.235,-1.002],[-1.151,-0.268],[-0.164,0],[-0.394,0.558],[-0.065,0.278]],"o":[[-0.009,-0.002],[-0.024,-0.005],[-0.12,-0.024],[-0.994,-0.028],[-0.268,1.152],[0.164,0.036],[0.696,0],[0.157,-0.22],[0.26,-1.136]],"v":[[0.514,-2.055],[0.489,-2.063],[0.417,-2.072],[0.059,-2.119],[-2.076,-0.473],[-0.48,2.092],[0.007,2.146],[1.74,1.243],[2.084,0.495]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.251,0.69,0.129,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[36.196,32.491],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_142","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamp","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[736.598,435.401,0]},"a":{"a":0,"k":[37.598,26.511,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.068,0.29],[1.108,0.29],[0.021,0.006],[0.269,-1.137],[0.002,-0.005],[0.004,-0.142],[-1.002,-0.234],[-0.159,0],[-0.395,0.542]],"o":[[0.257,-1.124],[-0.021,-0.005],[-1.14,-0.266],[-0.001,0.004],[-0.033,0.143],[-0.028,0.994],[0.165,0.037],[0.684,0],[0.167,-0.227]],"v":[[1.991,0.587],[0.456,-1.951],[0.395,-1.972],[-2.16,-0.395],[-2.165,-0.381],[-2.219,0.048],[-0.574,2.183],[-0.087,2.238],[1.626,1.361]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.396,0.753,0.157,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[37.686,26.407],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 12","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_143","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"6 row","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[721.778,417.424,0]},"a":{"a":0,"k":[22.778,8.534,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-1.151,-0.268],[-0.165,0],[-0.394,0.558],[-0.066,0.278],[1.13,0.273],[0.009,0.002],[0.024,0.005],[0.118,0.003],[0.235,-1.002]],"o":[[0.164,0.037],[0.695,0],[0.157,-0.22],[0.26,-1.136],[-0.009,-0.002],[-0.024,-0.005],[-0.119,-0.024],[-0.995,-0.028],[-0.268,1.152]],"v":[[-0.48,2.091],[0.008,2.146],[1.74,1.242],[2.085,0.495],[0.514,-2.055],[0.489,-2.064],[0.417,-2.072],[0.06,-2.119],[-2.077,-0.473]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.835,0.937,0.235,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[22.776,8.521],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 29","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_144","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamp","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[718.981,429.409,0]},"a":{"a":0,"k":[19.981,20.519,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.009,0.002],[0.024,0.004],[0.118,0.003],[0.235,-1.002],[-1.151,-0.268],[-0.165,0],[-0.393,0.558],[-0.066,0.278],[1.13,0.273]],"o":[[-0.024,-0.006],[-0.119,-0.024],[-0.995,-0.028],[-0.268,1.151],[0.165,0.036],[0.695,0],[0.157,-0.22],[0.26,-1.136],[-0.009,-0.003]],"v":[[0.489,-2.064],[0.417,-2.072],[0.06,-2.119],[-2.076,-0.473],[-0.48,2.092],[0.008,2.146],[1.74,1.243],[2.085,0.494],[0.514,-2.055]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.545,0.816,0.184,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[19.978,20.506],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 30","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_145","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamps 2 - Group 34","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[720.38,423.417,0]},"a":{"a":0,"k":[21.38,14.527,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.231,0.981],[1.145,0.261],[0.268,-1.145],[-1.145,-0.268],[-0.159,0]],"o":[[0.262,-1.145],[-1.145,-0.268],[-0.268,1.146],[0.165,0.043],[0.968,0]],"v":[[2.081,0.587],[0.484,-1.97],[-2.075,-0.382],[-0.484,2.178],[0.003,2.238]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.69,0.875,0.208,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[21.378,14.421],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 34","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_146","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"Last row","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[723.177,411.432,0]},"a":{"a":0,"k":[24.177,2.542,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.226,-0.104],[-0.015,-0.006],[-0.067,-0.022],[-0.07,-0.016],[-0.159,0],[-0.231,0.981],[1.145,0.262],[0.298,-0.064],[0.015,-0.003],[0.089,-0.034],[0.22,-0.218],[0,-0.56],[-0.396,-0.396]],"o":[[0.015,0.007],[0.064,0.028],[0.066,0.022],[0.165,0.043],[0.968,0],[0.262,-1.145],[-0.317,-0.074],[-0.015,0.003],[-0.094,0.022],[-0.288,0.099],[-0.396,0.396],[0,0.567],[0.18,0.177]],"v":[[-1.014,1.922],[-0.971,1.944],[-0.772,2.013],[-0.574,2.081],[-0.086,2.142],[1.992,0.491],[0.396,-2.068],[-0.535,-2.07],[-0.578,-2.058],[-0.855,-1.981],[-1.632,-1.511],[-2.254,-0.007],[-1.632,1.504]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[1,1,0.361,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[24.281,2.531],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 35","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_147","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"slider","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":1,"k":[{"i":{"x":0.667,"y":1},"o":{"x":0.333,"y":0},"n":"0p667_1_0p333_0","t":0,"s":[721.793,487.764,0],"e":[727.543,464.139,0],"to":[0.95833331346512,-3.9375,0],"ti":[-0.95833331346512,3.9375,0]},{"i":{"x":0.667,"y":0.667},"o":{"x":0.333,"y":0.333},"n":"0p667_0p667_0p333_0p333","t":20,"s":[727.543,464.139,0],"e":[727.543,464.139,0],"to":[0,0,0],"ti":[0,0,0]},{"i":{"x":0.667,"y":1},"o":{"x":0.167,"y":0},"n":"0p667_1_0p167_0","t":60,"s":[727.543,464.139,0],"e":[721.793,487.764,0],"to":[-0.95833331346512,3.9375,0],"ti":[0.95833331346512,-3.9375,0]},{"t":80}]},"a":{"a":0,"k":[10.543,9.249,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.278,1.195],[-0.073,0.326],[0.918,0],[0,0],[0.278,-1.194],[0.072,-0.326],[-0.919,0],[0,0]],"o":[[0,0],[0.201,-0.897],[0,0],[-1.226,0],[0,0],[-0.201,0.897],[0,0],[1.226,0]],"v":[[7.618,0.138],[7.745,-0.428],[6.346,-2.178],[-5.05,-2.178],[-7.618,-0.138],[-7.745,0.428],[-6.345,2.178],[5.049,2.178]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.875,0.898,0.918,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[9.83,7.275],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.268,-1.152],[0,0],[-0.927,0],[0,0],[-0.268,1.152],[0,0],[0.927,0],[0,0]],"o":[[0,0],[-0.21,0.903],[0,0],[1.183,0],[0,0],[0.21,-0.904],[0,0],[-1.183,0]],"v":[[-8.337,-0.864],[-8.786,1.064],[-7.383,2.831],[5.859,2.831],[8.337,0.864],[8.786,-1.064],[7.383,-2.831],[-5.859,-2.831]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.682,0.714,0.729,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[10.543,7.929],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.268,-1.152],[0,0],[-0.927,0],[0,0],[-0.268,1.152],[0,0],[0.927,0],[0,0]],"o":[[0,0],[-0.21,0.903],[0,0],[1.183,0],[0,0],[0.21,-0.904],[0,0],[-1.183,0]],"v":[[-8.337,-0.864],[-8.786,1.064],[-7.383,2.831],[5.859,2.831],[8.337,0.864],[8.786,-1.064],[7.383,-2.831],[-5.859,-2.831]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.349,0.337,0.318,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[10.543,9.249],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1},{"ddd":0,"ind":1,"ty":4,"nm":"slider - Group 4","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[723.96,478.014,0]},"a":{"a":0,"k":[6.96,23.124,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.923,0],[0.155,0.036],[-0.254,1.093],[0,0],[-1.092,-0.252],[0.255,-1.093],[0,0]],"o":[[-0.153,0],[-1.093,-0.255],[0,0],[0.255,-1.092],[1.093,0.255],[0,0],[-0.218,0.937]],"v":[[-4.704,22.343],[-5.167,22.291],[-6.685,19.851],[2.726,-20.574],[5.166,-22.092],[6.684,-19.652],[-2.727,20.773]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.329,0.345,0.357,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[6.96,23.025],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_148","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"lamps","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[72,10.89,0]},"a":{"a":0,"k":[69,8,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.424,0.103],[0.004,0.001],[0.009,0.002],[0.045,0.001],[0.088,-0.376],[-0.432,-0.101],[-0.062,0],[-0.148,0.21],[-0.025,0.105]],"o":[[-0.003,-0.001],[-0.009,-0.002],[-0.045,-0.009],[-0.373,-0.011],[-0.101,0.433],[0.062,0.014],[0.261,0],[0.059,-0.083],[0.098,-0.427]],"v":[[0.193,-0.772],[0.183,-0.775],[0.157,-0.779],[0.022,-0.796],[-0.78,-0.178],[-0.181,0.786],[0.003,0.807],[0.654,0.467],[0.783,0.186]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.918,1,0.89,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[1.83,1.8],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 33","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.13,0.273],[0.009,0.002],[0.024,0.005],[0.119,0.003],[0.235,-1.002],[-1.151,-0.268],[-0.164,0],[-0.394,0.558],[-0.065,0.278]],"o":[[-0.009,-0.002],[-0.024,-0.005],[-0.12,-0.024],[-0.994,-0.028],[-0.268,1.152],[0.164,0.036],[0.696,0],[0.157,-0.22],[0.26,-1.137]],"v":[[0.514,-2.055],[0.489,-2.063],[0.417,-2.072],[0.059,-2.118],[-2.076,-0.473],[-0.48,2.092],[0.007,2.146],[1.74,1.243],[2.084,0.495]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":20,"s":[0.251,0.69,0.129,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":21,"s":[0.776,0.22,0.246,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":40,"s":[0.776,0.22,0.246,1],"e":[0.251,0.69,0.129,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":41,"s":[0.251,0.69,0.129,1],"e":[0.251,0.69,0.129,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":60,"s":[0.251,0.69,0.129,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":61,"s":[0.776,0.22,0.246,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":80,"s":[0.776,0.22,0.246,1],"e":[0.251,0.69,0.129,1]},{"t":81}]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[2.63,2.593],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 34","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.178,0],[0,0],[0,0],[0,0],[0,-1.177]],"o":[[0,0],[0,0],[0,0],[1.178,0],[0,1.178]],"v":[[-0.709,2.133],[-1.424,2.133],[-1.424,-2.133],[-0.709,-2.133],[1.424,-0.001]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":20,"s":[0.251,0.69,0.129,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":21,"s":[0.776,0.22,0.246,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":40,"s":[0.776,0.22,0.246,1],"e":[0.251,0.69,0.129,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":41,"s":[0.251,0.69,0.129,1],"e":[0.251,0.69,0.129,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":60,"s":[0.251,0.69,0.129,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":61,"s":[0.776,0.22,0.246,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":80,"s":[0.776,0.22,0.246,1],"e":[0.251,0.69,0.129,1]},{"t":81}]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[4.114,2.607],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 35","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[1.425,0.345],[0.011,0.003],[0.03,0.006],[0.15,0.004],[0.296,-1.264],[-1.453,-0.338],[-0.208,0],[-0.497,0.704],[-0.083,0.351]],"o":[[-0.011,-0.003],[-0.03,-0.007],[-0.151,-0.03],[-1.254,-0.035],[-0.338,1.453],[0.207,0.046],[0.877,0],[0.198,-0.277],[0.328,-1.433]],"v":[[0.648,-2.593],[0.616,-2.604],[0.526,-2.616],[0.074,-2.674],[-2.62,-0.598],[-0.606,2.639],[0.009,2.709],[2.195,1.568],[2.63,0.625]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":20,"s":[0.357,0.776,0.22,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":21,"s":[0.776,0.22,0.246,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":40,"s":[0.776,0.22,0.246,1],"e":[0.357,0.776,0.22,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":41,"s":[0.357,0.776,0.22,1],"e":[0.357,0.776,0.22,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":60,"s":[0.357,0.776,0.22,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":61,"s":[0.776,0.22,0.246,1],"e":[0.776,0.22,0.246,1]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"n":["0p833_0p833_0p167_0p167"],"t":80,"s":[0.776,0.22,0.246,1],"e":[0.357,0.776,0.22,1]},{"t":81}]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[3.398,2.589],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 36","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]},{"id":"comp_149","layers":[{"ddd":0,"ind":0,"ty":4,"nm":"BG","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[964,519.39,0]},"a":{"a":0,"k":[481,257.5,0]},"s":{"a":0,"k":[100,100,100]}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-1.282,1.282],[0,0],[0,1.813],[0,0],[3.776,0],[0,0],[3.058,-4.64],[0,0],[0,0],[0,0],[0,0],[1.007,-4.592]],"o":[[1.813,0],[0,0],[1.282,-1.282],[0,0],[0,-3.776],[0,0],[-3.282,4.473],[0,0],[0,0],[0,0],[0,0],[-1.197,4.519],[0,0]],"v":[[59.285,61.982],[64.119,59.981],[103.863,20.236],[105.865,15.403],[105.865,-55.146],[99.029,-61.982],[-49.769,-61.982],[-59.28,-48.311],[92.193,-48.311],[92.193,12.572],[56.453,48.311],[-102.569,48.311],[-105.865,61.982]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[264.386,253.517],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-3.775,0],[0,-3.775],[3.775,0],[0,3.775]],"o":[[3.775,0],[0,3.775],[-3.775,0],[0,-3.775]],"v":[[54.977,-6.836],[61.813,0],[54.977,6.836],[48.141,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[-7.171,0],[0,9.599],[9.599,0],[2.655,-6.199],[0,0],[1.976,-4.611],[0,0]],"o":[[9.599,0],[0,-9.599],[-7.171,0],[0,0],[-2.178,4.5],[0,0],[2.655,6.199]],"v":[[54.977,17.38],[72.357,0],[54.977,-17.38],[38.997,-6.836],[-66.131,-6.836],[-72.357,6.836],[38.997,6.836]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[249.723,249.858],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[3.775,0],[0,3.775],[-3.775,0],[0,-3.775]],"o":[[-3.775,0],[0,-3.775],[3.775,0],[0,3.775]],"v":[[158.136,-93.775],[151.3,-100.611],[158.136,-107.447],[164.972,-100.611]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[3.775,0],[0,3.775],[-3.776,0],[0,-3.775]],"o":[[-3.776,0],[0,-3.775],[3.775,0],[0,3.775]],"v":[[59.089,-93.775],[52.253,-100.611],[59.089,-107.447],[65.925,-100.611]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ind":2,"ty":"sh","ks":{"a":0,"k":{"i":[[3.775,0],[0,3.776],[-3.775,0],[0,-3.775]],"o":[[-3.775,0],[0,-3.775],[3.775,0],[0,3.776]],"v":[[-44.611,-49.65],[-51.447,-56.486],[-44.611,-63.322],[-37.775,-56.486]],"c":true}},"nm":"Path 3","mn":"ADBE Vector Shape - Group"},{"ind":3,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[1.282,1.282],[0,0],[0,2.292],[9.599,0],[2.559,-6.41],[0,0],[7.323,0],[0,-9.599],[-0.71,-1.897],[0,0],[0,0],[6.951,0],[0,-9.598],[-6.155,-2.675],[0,0],[0,-7.139],[-1.034,-2.224],[0,0],[2.693,0],[2.656,-6.2],[0,0],[0.008,-2.949],[-0.019,-1.617],[0,0],[-7.172,0],[0,9.599],[0.544,1.685],[0,0],[-1.949,0],[0,9.599],[6.243,2.636],[0,0],[-1.701,4.386],[0,0],[-1.282,1.282],[0,0],[-2.424,0],[-2.747,5.981],[0,0],[-7.013,0],[-1.994,0.796],[0,0],[0,0],[-1.282,-1.282],[0,0],[0,0]],"o":[[0,0],[0,-1.813],[0,0],[0.807,-2.004],[0,-9.599],[-7.323,0],[0,0],[-2.559,-6.41],[-9.599,0],[0,2.145],[0,0],[0,0],[-2.78,-5.895],[-9.599,0],[0,7.14],[0,0],[-6.155,2.675],[0,2.614],[0,0],[-2.275,-1.094],[-7.171,0],[0,0],[-0.085,2.93],[-0.004,1.622],[0,0],[2.656,6.199],[9.599,0],[0,-1.867],[0,0],[1.749,0.592],[9.599,0],[0,-7.203],[0,0],[4.323,-1.824],[0,0],[1.813,0],[0,0],[2.095,0.896],[7.013,0],[0,0],[2.747,5.981],[2.277,0],[0,0],[0,0],[0,1.813],[0,0],[0,0],[0,0]],"v":[[228.805,37.652],[228.805,-36.751],[226.803,-41.585],[174.255,-94.132],[175.516,-100.611],[158.136,-117.991],[142.001,-107.046],[75.224,-107.046],[59.089,-117.991],[41.709,-100.611],[42.826,-94.523],[12.184,-63.881],[-28.9,-63.881],[-44.611,-73.866],[-61.991,-56.486],[-51.528,-40.544],[-51.528,-4.038],[-61.991,11.903],[-60.364,19.211],[-104.937,63.784],[-112.446,62.059],[-128.427,72.604],[-308.996,72.604],[-309.139,81.421],[-309.1,86.276],[-128.427,86.276],[-112.446,96.82],[-95.066,79.44],[-95.912,74.094],[-50.176,28.357],[-44.611,29.284],[-27.231,11.903],[-37.856,-4.115],[-37.856,-40.468],[-28.418,-50.209],[15.015,-50.209],[19.849,-52.211],[52.264,-84.625],[59.089,-83.231],[74.876,-93.374],[142.349,-93.374],[158.136,-83.231],[164.576,-84.477],[215.133,-33.92],[215.133,40.483],[217.135,45.317],[289.808,117.99],[309.143,117.99]],"c":true}},"nm":"Path 6","mn":"ADBE Vector Shape - Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-459.375,209.679],[500.625,209.679],[500.625,-303.321],[-459.375,-303.321]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-459.375,-303.321],[500.625,-303.321],[500.625,209.679],[-459.375,209.679]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"mn":"ADBE Vector Group"},{"ty":"mm","mm":4,"nm":"Merge Paths 2","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[460.015,303.876],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 3","np":7,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[-3.776,0],[0,0],[0,3.775],[0,0],[0,0],[0,0],[8.828,4.148],[0,0],[1.282,-1.282],[0,0],[0,-1.813],[0,0],[0,0],[0,0],[1.282,1.282],[0,0],[1.813,0],[0,0],[4.681,-4.703]],"o":[[0,0],[0,0],[0,3.775],[0,0],[3.776,0],[0,0],[0,0],[0,0],[-8.267,-4.961],[0,0],[-1.813,0],[0,0],[-1.283,1.282],[0,0],[0,0],[0,0],[0,-1.812],[0,0],[-1.282,-1.282],[0,0],[-4.955,4.416],[0,0]],"v":[[-83.767,-17.726],[-51.572,14.469],[-51.572,35.408],[-44.736,42.243],[-0.929,42.243],[5.907,35.408],[5.907,4.466],[38.946,-28.572],[212.523,-28.572],[186.866,-42.243],[36.115,-42.243],[31.281,-40.242],[-5.762,-3.199],[-7.765,1.635],[-7.765,28.572],[-37.9,28.572],[-37.9,11.637],[-39.903,6.805],[-76.102,-29.396],[-80.936,-31.398],[-198.059,-31.398],[-212.524,-17.726]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[459.562,171.37],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 4","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-3.775,0],[0,-3.775],[3.775,0],[0,3.775]],"o":[[3.775,0],[0,3.775],[-3.775,0],[0,-3.775]],"v":[[67.384,-6.836],[74.22,0],[67.384,6.836],[60.548,0]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[-7.171,0],[0,9.599],[9.599,0],[2.655,-6.199],[0,0],[0.462,-4.587]],"o":[[2.655,6.199],[9.599,0],[0,-9.599],[-7.171,0],[0,0],[-0.649,4.53],[0,0]],"v":[[51.404,6.836],[67.384,17.38],[84.764,0],[67.384,-17.38],[51.404,-6.836],[-83.085,-6.836],[-84.764,6.836]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[237.316,346.057],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 5","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[3.775,0],[0,3.775],[-3.775,0],[0,-3.775]],"o":[[-3.775,0],[0,-3.775],[3.775,0],[0,3.775]],"v":[[0,40.518],[-6.836,33.682],[0,26.846],[6.836,33.682]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[4.528,-0.738],[0,0],[0,-7.171],[-9.599,0],[0,9.599],[6.199,2.655],[0,0]],"o":[[0,0],[-6.199,2.655],[0,9.599],[9.599,0],[0,-7.171],[0,0],[-4.587,0.551]],"v":[[-6.836,-49.129],[-6.836,17.703],[-17.38,33.682],[0,51.063],[17.38,33.682],[6.836,17.703],[6.836,-51.063]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[434.278,109.818],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 6","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[1.282,1.282],[0,0],[1.813,0],[0,0],[0,-3.776],[0,0],[0,0],[0,-3.776],[0,0],[0,0],[0.325,-0.675],[0,0],[0,0],[0,1.813],[0,0],[0,0],[0,3.775],[0,0],[0,0],[0,0],[0,0],[-1.282,-1.282],[0,0],[0,0]],"o":[[0,0],[0,-1.812],[0,0],[-1.282,-1.282],[0,0],[-3.776,0],[0,0],[0,0],[-3.776,0],[0,0],[0,0],[-0.56,0.56],[0,0],[0,0],[1.282,-1.282],[0,0],[0,0],[3.775,0],[0,0],[0,0],[0,0],[0,0],[0,1.813],[0,0],[0,0],[0,0]],"v":[[94.586,13.302],[94.586,-45.836],[92.584,-50.669],[54.32,-88.933],[49.486,-90.935],[-19.743,-90.935],[-26.579,-84.099],[-26.579,-37.225],[-95.709,-37.225],[-102.545,-30.389],[-102.545,20.71],[-170.9,89.064],[-172.22,90.935],[-153.436,90.935],[-90.876,28.375],[-88.873,23.541],[-88.873,-23.553],[-19.743,-23.553],[-12.907,-30.389],[-12.907,-77.263],[46.655,-77.263],[80.914,-43.004],[80.914,16.133],[82.916,20.967],[152.884,90.935],[172.219,90.935]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[552.417,330.931],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 7","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[3.775,0],[0,3.775],[-3.775,0],[0,-3.775]],"o":[[-3.775,0],[0,-3.775],[3.775,0],[0,3.775]],"v":[[13.975,26.136],[7.139,19.3],[13.975,12.464],[20.811,19.3]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ind":1,"ty":"sh","ks":{"a":0,"k":{"i":[[3.776,0],[0,0],[0,-3.776],[0,0],[0,0],[0,0],[0,0],[0,0],[0,-7.326],[-9.599,0],[0,9.599],[5.977,2.749],[0,0]],"o":[[0,0],[-3.775,0],[0,0],[0,0],[0,0],[0,0],[0,0],[-6.414,2.557],[0,9.599],[9.599,0],[0,-7.009],[0,0],[0,-3.776]],"v":[[14.384,-64.08],[-24.52,-64.08],[-31.355,-57.244],[-31.355,64.08],[-17.684,64.08],[-17.684,-50.408],[7.548,-50.408],[7.548,3.162],[-3.405,19.3],[13.975,36.68],[31.355,19.3],[21.22,3.517],[21.22,-57.244]],"c":true}},"nm":"Path 2","mn":"ADBE Vector Shape - Group"},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[589.645,357.787],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 8","np":4,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[3.776,0],[0,0],[0,-3.776],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,-3.776],[0,0],[-3.775,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[28.294,41.214],[28.294,-34.378],[21.457,-41.214],[-21.457,-41.214],[-28.293,-34.378],[-28.293,41.214],[-14.621,41.214],[-14.621,-27.542],[14.621,-27.542],[14.621,41.214]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[512.073,380.652],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 9","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,0],[0,0],[9.428,7.108],[0,0],[0,0],[-1.282,-1.282],[0,0],[-0.069,1.631],[-0.009,4.55]],"o":[[0,0],[-8.422,-8.151],[0,0],[0,0],[0,1.813],[0,0],[0.398,-1.519],[0.192,-4.505],[0,0]],"v":[[-29.812,17.963],[-29.812,-99.778],[-56.606,-122.694],[-43.484,-99.498],[-43.484,20.794],[-41.482,25.628],[55.584,122.694],[56.309,117.966],[56.605,104.38]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.498,0.725,0.749,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[753.792,282.424],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 10","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.472,-1.109],[1.619,-0.688],[0.472,1.108],[-1.619,0.689]],"o":[[0.472,1.108],[-1.619,0.689],[-0.471,-1.109],[1.619,-0.689]],"v":[[2.931,-1.247],[0.854,2.007],[-2.932,1.248],[-0.854,-2.007]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[253.512,45.551],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 11","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.858,-2.016],[2.945,-1.253],[0.858,2.016],[-2.945,1.253]],"o":[[0.858,2.017],[-2.945,1.253],[-0.858,-2.017],[2.945,-1.253]],"v":[[5.333,-2.269],[1.554,3.651],[-5.332,2.269],[-1.553,-3.651]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[221.558,65.438],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 12","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-2.207,-5.188],[8.309,-3.535],[2.207,5.188],[-8.309,3.535]],"o":[[2.207,5.188],[-8.309,3.535],[-2.208,-5.188],[8.309,-3.536]],"v":[[15.045,-6.401],[3.997,9.394],[-15.043,6.401],[-3.996,-9.393]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[253.511,69.737],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 13","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0,-1.099],[2.167,0],[0,1.099],[-2.167,0]],"o":[[0,1.099],[-2.167,0],[0,-1.099],[2.167,0]],"v":[[3.924,0],[0,1.991],[-3.924,0],[0,-1.991]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[632.127,81.415],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 14","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[-0.211,-1.943],[5.249,-0.57],[0.211,1.943],[-5.249,0.57]],"o":[[0.211,1.943],[-5.25,0.57],[-0.211,-1.944],[5.249,-0.569]],"v":[[9.505,-1.032],[0.383,3.518],[-9.505,1.032],[-0.382,-3.519]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[678.098,79.425],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 15","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[0.85,-2.364],[3.192,1.147],[-0.85,2.364],[-3.192,-1.148]],"o":[[-0.85,2.364],[-3.192,-1.147],[0.85,-2.365],[3.192,1.147]],"v":[[5.78,2.077],[-1.539,4.281],[-5.779,-2.077],[1.539,-4.28]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[646.995,102.305],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 16","np":2,"mn":"ADBE Vector Group"},{"ty":"gr","it":[{"ind":0,"ty":"sh","ks":{"a":0,"k":{"i":[[50.654,0],[0.202,0],[-5.318,0.685],[-14.41,0],[-30.374,-9.227],[4.43,2.186],[52.449,-0.062],[0.453,-181.306],[-0.183,-4.653],[-12.615,0],[0,0],[-0.511,12.023],[0,4.774],[0.018,1.442],[107.236,42.269]],"o":[[-0.202,0],[-5.362,0.009],[13.922,-1.792],[33.388,0],[4.727,1.436],[-44.046,-21.728],[-181.307,0.212],[-0.012,4.701],[0.496,12.605],[0,0],[12.034,0],[0.201,-4.726],[0,-1.446],[-1.484,-115.256],[-44.432,-17.513]],"v":[[5.388,-144.41],[4.781,-144.41],[4.227,-152.906],[46.753,-155.624],[142.744,-141.434],[145.703,-148.865],[-0.39,-182.715],[-329.758,146.207],[-329.5,160.239],[-305.953,182.776],[306.952,182.776],[329.467,161.3],[329.77,147.049],[329.742,142.718],[148.881,-117.276]],"c":true}},"nm":"Path 1","mn":"ADBE Vector Shape - Group"},{"ty":"fl","c":{"a":0,"k":[0.565,0.784,0.82,1]},"o":{"a":0,"k":100},"r":1,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill"},{"ty":"tr","p":{"a":0,"k":[480.635,239.09],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 17","np":2,"mn":"ADBE Vector Group"}],"ip":0,"op":240.24024024024,"st":0,"bm":0,"sr":1}]}],"layers":[{"ddd":0,"ind":0,"ty":0,"nm":"404 EDIT","refId":"comp_120","ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[808,484,0]},"a":{"a":0,"k":[960,540,0]},"s":{"a":0,"k":[200,200,100]}},"ao":0,"w":1920,"h":1080,"ip":0,"op":81,"st":0,"bm":0,"sr":1}]}
};

//This is animation activation
var allIcons = ['404'];
for(var i = 0; i < allIcons.length; i++){
var animation = {
autoplay:true,
loop:true,
container: document.getElementById(allIcons[i]),
animationData:icon[allIcons[i]],
renderer:'svg'
};
bodymovin.loadAnimation(animation);
}