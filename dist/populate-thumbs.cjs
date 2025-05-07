"use strict";
// scripts/populate-thumbs.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var node_fetch_1 = require("node-fetch");
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
var screenshotApiKey = process.env.SCREENSHOTONE_API_KEY;
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function generateThumbs() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, resources, error, _i, resources_1, resource, screenshotUrl, response, buffer, fileName, uploadError, publicUrl, updateError, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🔎 Fetching resources...');
                    return [4 /*yield*/, supabase
                            .from('resources')
                            .select('id, url')
                            .is('thumbnail_url', null)];
                case 1:
                    _a = _b.sent(), resources = _a.data, error = _a.error;
                    if (error) {
                        console.error('❌ Error fetching resources:', error);
                        return [2 /*return*/];
                    }
                    if (!resources || resources.length === 0) {
                        console.log('✅ No missing thumbnails.');
                        return [2 /*return*/];
                    }
                    _i = 0, resources_1 = resources;
                    _b.label = 2;
                case 2:
                    if (!(_i < resources_1.length)) return [3 /*break*/, 10];
                    resource = resources_1[_i];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 8, , 9]);
                    screenshotUrl = "https://api.screenshotone.com/take?access_key=".concat(screenshotApiKey, "&url=").concat(encodeURIComponent(resource.url), "&format=webp&block_ads=true&block_cookie_banners=true&block_trackers=true&delay=0&timeout=60&response_type=by_format&image_quality=80");
                    return [4 /*yield*/, (0, node_fetch_1.default)(screenshotUrl)];
                case 4:
                    response = _b.sent();
                    if (!response.ok) {
                        console.error("\u274C Failed to fetch screenshot for ".concat(resource.url));
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, response.buffer()];
                case 5:
                    buffer = _b.sent();
                    fileName = "".concat(resource.id, ".webp");
                    return [4 /*yield*/, supabase.storage
                            .from('resource-thumbs')
                            .upload(fileName, buffer, {
                            cacheControl: '3600',
                            upsert: true,
                            contentType: 'image/webp',
                        })];
                case 6:
                    uploadError = (_b.sent()).error;
                    if (uploadError) {
                        console.error("\u274C Failed to upload for ".concat(resource.url), uploadError);
                        return [3 /*break*/, 9];
                    }
                    publicUrl = "".concat(supabaseUrl, "/storage/v1/object/public/resource-thumbs/").concat(fileName);
                    return [4 /*yield*/, supabase
                            .from('resources')
                            .update({ thumbnail_url: publicUrl })
                            .eq('id', resource.id)];
                case 7:
                    updateError = (_b.sent()).error;
                    if (updateError) {
                        console.error("\u274C Failed to update DB for ".concat(resource.url), updateError);
                        return [3 /*break*/, 9];
                    }
                    console.log("\u2705 ".concat(resource.url));
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _b.sent();
                    console.error("\u274C Error processing ".concat(resource.url, ":"), err_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 2];
                case 10:
                    console.log('🎉 All done.');
                    return [2 /*return*/];
            }
        });
    });
}
generateThumbs();
