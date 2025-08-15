// pages/entry/entry.js
Page({

  data: {
    groupCode: '', // 用于存储输入的小组编号
    // !!! 重要: 这里的 IP 地址需要换成你电脑的局域网IP !!!
    // 这个 URL 指向我们刚刚在后端创建的“查询小组”接口
    serverUrl: 'http://192.168.1.224:3000/api/check-group',
    isChecking: false // 防止重复提交
  },

  // 输入框绑定的事件，每次输入时更新 groupCode (保持不变)
  onInput(e) {
    this.setData({
      groupCode: e.detail.value
    });
  },

  // 提交按钮点击时的处理逻辑 (修改后的逻辑)
  submitGroupCode() {
    // 防止重复点击
    if (this.data.isChecking) return;

    const { groupCode } = this.data;
    // 前端简单校验
    if (!groupCode || groupCode.trim().length !== 8) {
      tt.showToast({
        title: '请输入8位小组编号',
        icon: 'none'
      });
      return;
    }

    this.setData({ isChecking: true });
    tt.showLoading({
      title: '正在加入...',
    });

    // 请求我们自己的本地后端服务
    tt.request({
      url: this.data.serverUrl,
      method: 'POST',
      data: {
        action:"join",
        groupCode: groupCode.trim()
      },
      success: (res) => {
        // 根据后端返回的 exists 字段来判断
        if (res.data && res.data.exists) {
          tt.showToast({
            title: '加入成功！',
            icon: 'success',
            duration: 1500
          });
          // 成功后跳转到 match 页面
          setTimeout(() => {
            tt.navigateTo({
              url: `/pages/match/match?groupCode=${groupCode}`
            });
          }, 1500);

        } else {
          // 如果 exists 为 false 或请求有其他问题
          tt.showToast({
            title: res.data.message || '小组不存在', // 优先显示后端返回的消息
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error("请求失败：", err);
        tt.showToast({
          title: '无法连接服务，请稍后重试',
          icon: 'none'
        });
      },
      complete: () => {
        // 无论成功失败，都隐藏 loading 并恢复按钮状态
        tt.hideLoading();
        this.setData({ isChecking: false });
      }
    });
  },

  // 其他生命周期函数 (保持不变)
  onLoad(options) {},
  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {}
})