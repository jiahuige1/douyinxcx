Page({
  data: {
    // 1. 初始化一个空数组，用来存放所有选择的出发点
    startPoints: [],
    minDistance: null,
    maxDistance: null,
    centerPoint: null,  // 存储计算结果
    mapMarkers: [],     // 地图标记点
  },

  onLoad: function () {
    console.log('Index page loaded.');
  },


  addStartPoint: function(newPoint) {
    console.log('addStartPoint 函数被成功调用，接收到数据:', newPoint);
    if (newPoint) {
      const currentPoints = this.data.startPoints;
      currentPoints.push(newPoint);
      this.setData({
        startPoints: currentPoints
      });
    }
  },
  /**
   * 跳转到选择位置的页面
   */
  goToSelectLocation() {
    console.log("即将通过 navigateTo 跳转到 select 页面...");
    tt.navigateTo({
      url: '/pages/select/select' // 保持简单，不需要其他参数
    });
  },


  
  // 绑定距离输入框
  onMinDistanceInput(e) { this.setData({ minDistance: parseFloat(e.detail.value) || null }); },
  onMaxDistanceInput(e) { this.setData({ maxDistance: parseFloat(e.detail.value) || null }); },

  /**
   * --- 新增的核心函数 ---
   * 调用后端API进行计算
   */
  findMeetingCenter() {
    // 输入校验
    if (!this.data.minDistance || !this.data.maxDistance || this.data.minDistance >= this.data.maxDistance) {
      return tt.showToast({ title: '请输入有效的距离区间', icon: 'none' });
    }
    
    // 准备发送给后端的数据
    const requestData = {
      starting_points: this.data.startPoints.map(p => ({
        lat: p.latitude,
        lon: p.longitude
      })),
      min_distance: this.data.minDistance,
      max_distance: this.data.maxDistance,
    };

    tt.showLoading({ title: '正在计算...' });

    tt.request({
      url: 'http://192.168.0.86:5000/api/location/find_center', // <-- 修改为你的JS后端地址
      method: 'POST',
      data: requestData,
      success: (res) => {
        tt.hideLoading();
        if (res.statusCode === 200 && res.data.status === 'success') {
          const center = res.data.center;
          this.setData({
            centerPoint: center,
            mapMarkers: this.createMarkers(this.data.startPoints, center)
          });
        } else {
          tt.showModal({
            title: '提示',
            content: res.data.message || '计算失败，请尝试扩大距离范围',
            showCancel: false
          });
        }
      },
      fail: (err) => {
        tt.hideLoading();
        tt.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },
  
  // 辅助函数：创建地图标记
  createMarkers(points, center) {
    const markers = points.map((p, index) => ({
      id: index,
      latitude: p.latitude,
      longitude: p.longitude,
      title: `出发点${index + 1}`
    }));
    markers.push({
      id: points.length,
      latitude: center.lat,
      longitude: center.lon,
      title: '碰面中心',
      iconPath: '/images/center_marker.png', // 你可以准备一个特殊图标
      width: 35,
      height: 35
    });
    return markers;
  }
  
  

});