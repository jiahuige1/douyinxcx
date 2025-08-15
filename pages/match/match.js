// pages/match/match.js
Page({
  data: {
    groupCode: '',  // 存储小组编号
    // !!! 重要: 这里的 IP 地址需要换成你电脑的局域网IP !!!
    serverUrl: 'http://192.168.1.224:3000/api/send-location',
    isSending: false // 防止重复发送
  },

  // 发送当前位置信息
  sendLocation: function () {
    if (this.data.isSending) return;
    this.setData({ isSending: true });

    let that = this;

    tt.showLoading({
      title: '正在定位...',
    });

    tt.getLocation({
      type: 'wgs84', // 获取 GPS 坐标
      success(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;

        tt.showLoading({
          title: '发送位置中...',
        });

        // 请求我们自己的本地后端服务
        tt.request({
          url: that.data.serverUrl,
          method: 'POST',
          data: {
            groupCode: that.data.groupCode,
            latitude: latitude,
            longitude: longitude
          },
          success: (res) => {
          tt.hideLoading();
            // 根据后端返回的 status 字段进行判断
            if (res.data.status === 'complete') {
              // --- 情况一：计算完成 ---
              const midpoint = res.data.midpoint;
              tt.showToast({
                title: '中点计算成功！',
                icon: 'success'
              });
              // 跳转到 direct 页面并传递中点坐标
              tt.navigateTo({
                url: `/pages/direct/direct?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}&name=${encodeURIComponent(midpoint.name)}`
              });
            } else if (res.data.status === 'waiting') {
              // --- 情况二：等待对方 ---
              tt.showModal({
                title: '提示',
                content: '您的位置已发送，请等待另一位成员发送位置。',
                showCancel: false, // 只显示确定按钮
                confirmText: '我知道了'
              });
            } else {
              // --- 其他错误情况 ---
              tt.showToast({
                title: res.data.message || '发生未知错误',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            tt.hideLoading();
            console.error("位置发送失败", err);
            tt.showToast({
              title: '无法连接服务器',
              icon: 'none'
            });
          },
          complete: () => {
            that.setData({ isSending: false }); // 恢复按钮
          }
        });
      },
      fail(err) {
        tt.hideLoading();
        that.setData({ isSending: false });
        console.error("获取位置信息失败", err);
        tt.showToast({
          title: '获取您的位置失败',
          icon: 'none'
        });
      }
    });
  },

  // onLoad 生命周期函数 (保持不变)
  onLoad(options){
    if (options.groupCode) {
      this.setData({
        groupCode: options.groupCode
      });
    }
  },

  // ... 其他生命周期函数保持不变 ...
  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
})