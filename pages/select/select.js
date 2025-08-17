// pages/selectLocation/selectLocation.js
// 你的后端服务器地址 (请确保使用局域网IP或公网域名)
const API_BASE_URL = "http://192.168.0.86:5000"; 

Page({
  data: {
    longitude: 116.397428,
    latitude: 39.90923,
    scale: 16,
    currentAddress: '正在获取地址...',
    isRegionChanging: false,

    // --- 新增数据 ---
    searchKeyword: '', // 搜索框的输入值
    searchResults: [], // 搜索结果列表
  },

  // 用于搜索的防抖计时器
  searchDebounceTimer: null,

  onLoad(options) {
    // 1. 获取用户当前定位 (这个逻辑已经满足你的第一个需求)
    this.getLocation();
    this.mapCtx = tt.createMapContext('myMap');
  },

  // 获取用户当前地理位置 (此函数无需修改)
  getLocation() {
    console.log("1. 开始尝试获取地理位置...");
    tt.getLocation({
      type: 'gcj02',
      success: (res) => {
        console.log("2. 获取地理位置成功！", res);
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude,
        });
        // 成功获取到真实坐标后，再去请求地址
        this.getAddressByLocation(res.longitude, res.latitude);
      },
      fail: () => {
        tt.showToast({ title: '您拒绝了位置授权', icon: 'none' });
        this.getAddressByLocation(this.data.longitude, this.data.latitude);
      }
    });
  },

  // 监听地图视野变化
  onRegionChange(e) {
    // 当用户开始拖动地图时，清空搜索结果，避免UI混乱
    if (e.type === 'begin') {
        this.setData({ searchResults: [] });
    }
    
    if (e.type === 'end') {
      if (this.data.isRegionChanging) return;
      this.setData({ isRegionChanging: true });

      setTimeout(() => {
        this.mapCtx.getCenterLocation({
          success: (res) => {
            this.getAddressByLocation(res.longitude, res.latitude);
            this.setData({
              longitude: res.longitude,
              latitude: res.latitude
            });
          }
        });
        this.setData({ isRegionChanging: false });
      }, 500);
    }
  },

  // 根据经纬度获取地址 (此函数无需修改)
  getAddressByLocation(longitude, latitude) {
    // ... (此函数内容保持不变) ...
    this.setData({ currentAddress: '正在解析地址...' });
    tt.request({
      url: `${API_BASE_URL}/api/location/reverse_geocoding`,
      method: 'GET',
      data: { longitude, latitude },
      success: (res) => {
        if (res.statusCode === 200 && res.data.address) {
          this.setData({ currentAddress: res.data.address });
        } else {
          this.setData({ currentAddress: '地址解析失败' });
        }
      },
      fail: (err) => {
        console.error(err);
        this.setData({ currentAddress: '网络请求失败' });
      }
    });
  },
  
  // --- 以下是新增的函数 ---

  /**
   * 1. 处理搜索框输入事件
   */
  handleSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });

    // 使用防抖优化，停止输入500ms后才真正执行搜索，避免频繁请求API
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.executeSearch();
    }, 500);
  },

  /**
   * 2. 执行搜索，调用后端API
   */
  executeSearch() {
    if (!this.data.searchKeyword.trim()) {
      this.setData({ searchResults: [] }); // 如果输入为空，清空结果
      return;
    }

    tt.request({
      url: `${API_BASE_URL}/api/location/search`,
      data: {
        keywords: this.data.searchKeyword,
        // city: '北京' // 可以加上城市来提高搜索精度，城市可以从定位信息中获取
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.results) {
          this.setData({ searchResults: res.data.results });
        }
      },
      fail: (err) => {
        tt.showToast({ title: '搜索请求失败', icon: 'none' });
      }
    });
  },
  
  /**
   * 3. 用户点击某一个搜索结果
   */
  selectSearchResult(e) {
    const selectedItem = e.currentTarget.dataset.item;
    const { address, location, name } = selectedItem;

    // 高德返回的 location 是 "经度,纬度" 格式的字符串
    const [longitude, latitude] = location.split(',');

    // 更新地图中心点到所选位置
    this.setData({
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      // 同时更新底部面板的地址
      currentAddress: `${name} (${address})`,
      // 清空搜索结果，并把所选的名字填入搜索框
      searchResults: [],
      searchKeyword: name,
    });
  },

  // 确认位置 (此函数无需修改)
  confirmLocation() {
    console.log('“选定此位置”按钮被点击！');

    // 1. 准备要传递的数据
    const selectedLocation = {
      longitude: this.data.longitude,
      latitude: this.data.latitude,
      address: this.data.currentAddress
    };

    // 2. 获取当前所有打开的页面栈
    const pages = getCurrentPages();
    
    // 3. 安全地获取上一页的实例
    //    pages.length - 2 是因为数组索引从0开始，-1是当前页，-2是上一页
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2];

      // 4. 检查上一页是否有我们定义的接收函数，然后直接调用它！
      if (prevPage && typeof prevPage.addStartPoint === 'function') {
        prevPage.addStartPoint(selectedLocation);
      } else {
        console.error('未能找到上一页或上一页没有 addStartPoint 方法');
      }
    } else {
      console.error('页面栈深度不足，无法找到上一页');
    }

    // 5. 数据传递完成后，返回上一页
    tt.navigateBack();
  }

});