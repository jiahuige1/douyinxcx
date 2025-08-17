// server.js

// 1. 导入依赖库
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 2. 初始化Express应用
const app = express();
const PORT = 5000; // 您可以指定和之前一样的端口

// 3. 配置高德API和应用中间件
// 在这里替换为你自己的高德Web服务API Key
const AMAP_KEY = "cab64b3805d73cc68ab8e63bbd81eaa7";

// 高德API的URL
const REVERSE_GEOCODING_URL = "https://restapi.amap.com/v3/geocode/regeo";
const SEARCH_URL = "https://restapi.amap.com/v3/place/text";

// 使用cors中间件，允许所有来源的跨域请求 (为了方便开发)
app.use(cors());
/**
 * 使用Haversine公式计算两个经纬度点之间的距离（单位：公里）
 * @param {{lat: number, lon: number}} point1
 * @param {{lat: number, lon: number}} point2
 * @returns {number} 距离（公里）
 */
function calculate_distance(point1, point2) {
    const R = 6371; // 地球平均半径，单位为公里
    const toRad = (deg) => deg * Math.PI / 180;

    const lat1 = toRad(point1.lat);
    const lon1 = toRad(point1.lon);
    const lat2 = toRad(point2.lat);
    const lon2 = toRad(point2.lon);

    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;

    const a = Math.sin(dlat / 2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * 根据起点、方位角和距离计算终点
 * @param {{lat: number, lon: number}} start_point
 * @param {number} bearing_deg 方位角 (0=北, 90=东)
 * @param {number} distance_km 距离 (公里)
 * @returns {{lat: number, lon: number}} 终点坐标
 */
function find_destination_point(start_point, bearing_deg, distance_km) {
    const R = 6371;
    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;

    const lat1 = toRad(start_point.lat);
    const lon1 = toRad(start_point.lon);
    const bearing = toRad(bearing_deg);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance_km / R) +
                     Math.cos(lat1) * Math.sin(distance_km / R) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distance_km / R) * Math.cos(lat1),
                             Math.cos(distance_km / R) - Math.sin(lat1) * Math.sin(lat2));

    return { lat: toDeg(lat2), lon: toDeg(lon2) };
}

// --- 4. 定义API路由 ---

/**
 * 根据经纬度获取地址信息
 * 例如: /api/location/reverse_geocoding?longitude=116.397428&latitude=39.90923
 */
app.get('/api/location/reverse_geocoding', async (req, res) => {
    // 从请求的查询参数中获取经纬度 (等同于 request.args.get)
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
        // 等同于 return jsonify({...}), 400
        return res.status(400).json({ error: "缺少经纬度参数" });
    }

    const params = {
        key: AMAP_KEY,
        location: `${longitude},${latitude}`,
        output: "json"
    };

    try {
        // 使用 axios 发起GET请求 (等同于 requests.get)
        const response = await axios.get(REVERSE_GEOCODING_URL, { params });
        const data = response.data;

        if (data.status === "1") {
            // 成功，返回数据 (等同于 return jsonify({...}))
            const formatted_address = data.regeocode?.formatted_address; // 使用可选链?.防止错误
            res.json({ address: formatted_address, details: data });
        } else {
            // 高德API返回错误 (等同于 return jsonify({...}), 500)
            res.status(500).json({ error: "无法解析地址", details: data });
        }
    } catch (error) {
        // 网络请求级别的错误 (等同于 except requests.exceptions.RequestException)
        console.error("RequestException:", error.message);
        res.status(500).json({ error: "请求高德API时发生网络错误", details: error.message });
    }
});


/**
 * 根据关键词搜索地点
 * 例如: /api/location/search?keywords=北京大学&city=北京
 */
app.get('/api/location/search', async (req, res) => {
    const { keywords, city } = req.query;

    if (!keywords) {
        return res.status(400).json({ error: "缺少关键词参数" });
    }

    const params = {
        key: AMAP_KEY,
        keywords, // JS速记法，等同于 'keywords': keywords
        city,
        output: "json"
    };

    try {
        const response = await axios.get(SEARCH_URL, { params });
        const data = response.data;

        console.log("Response from Amap:", data); // 保留调试打印

        if (data.status === "1") {
            // 使用Array.map来处理数据，非常简洁
            const results = data.pois.map(poi => ({
                name: poi.name,
                address: poi.address,
                location: poi.location
            }));
            res.json({ results });
        } else {
            res.status(500).json({ error: "高德API返回错误", details: data });
        }
    } catch (error) {
        // 捕获所有可能的错误
        console.error("An unexpected error occurred:", error.message);
        res.status(500).json({ error: "服务器发生未知错误", details: error.message });
    }
});

app.post('/api/location/find_center', express.json(), async(req, res) => {
    const { starting_points, min_distance, max_distance } = req.body;

    // 1. 输入验证
    if (!starting_points || starting_points.length === 0 || min_distance == null || max_distance == null) {
        return res.status(400).json({ error: "缺少必要参数: starting_points, min_distance, max_distance" });
    }

    // 2. 确定搜索的边界框 (Bounding Box)
    const all_boundary_points = [];
    for (const sp of starting_points) {
        all_boundary_points.push(find_destination_point(sp, 0, max_distance));   // North
        all_boundary_points.push(find_destination_point(sp, 90, max_distance));  // East
        all_boundary_points.push(find_destination_point(sp, 180, max_distance)); // South
        all_boundary_points.push(find_destination_point(sp, 270, max_distance)); // West
    }
    const min_lat = Math.min(...all_boundary_points.map(p => p.lat));
    const max_lat = Math.max(...all_boundary_points.map(p => p.lat));
    const min_lon = Math.min(...all_boundary_points.map(p => p.lon));
    const max_lon = Math.max(...all_boundary_points.map(p => p.lon));

    // 3. 网格采样
    const valid_centers = [];
    const GRID_DENSITY = 50; // 网格密度，越大越准但越慢
    const lat_step = (max_lat - min_lat) / GRID_DENSITY;
    const lon_step = (max_lon - min_lon) / GRID_DENSITY;

    for (let i = 0; i <= GRID_DENSITY; i++) {
        for (let j = 0; j <= GRID_DENSITY; j++) {
            const candidate_point = { lat: min_lat + i * lat_step, lon: min_lon + j * lon_step };
            let is_valid = true;
            for (const sp of starting_points) {
                const dist = calculate_distance(candidate_point, sp);
                if (!(dist >= min_distance && dist <= max_distance)) {
                    is_valid = false;
                    break;
                }
            }
            if (is_valid) {
                valid_centers.push(candidate_point);
            }
        }
    }

    // 4. 计算结果
    if (valid_centers.length === 0) {
        return res.json({ status: "not_found", message: "在指定距离内未找到合适的公共区域" });
    }

    const center_lat = valid_centers.reduce((sum, p) => sum + p.lat, 0) / valid_centers.length;
    const center_lon = valid_centers.reduce((sum, p) => sum + p.lon, 0) / valid_centers.length;

    try {
        const geoParams = {
            key: AMAP_KEY,
            location: `${center_lon},${center_lat}`,
            output: "json"
        };
        const geoResponse = await axios.get(REVERSE_GEOCODING_URL, { params: geoParams });
        const geoData = geoResponse.data;

        let address = "地址解析失败"; // 默认值
        if (geoData.status === "1" && geoData.regeocode) {
            address = geoData.regeocode.formatted_address;
        }
        
        // 将坐标和地址一起返回
        res.json({
            status: 'success',
            center: { 
                lat: center_lat, 
                lon: center_lon,
                address: address // <-- 新增的地址字段
            } 
        });

    } catch (error) {
        console.error("逆地理编码失败:", error.message);
        // 即使地址解析失败，也应该返回计算出的坐标
        res.json({
            status: 'success',
            center: { 
                lat: center_lat, 
                lon: center_lon,
                address: "地址解析失败"
            } 
        });
    }

});



// --- 5. 启动服务器 ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`JavaScript backend server is running on http://0.0.0.0:${PORT}`);
});