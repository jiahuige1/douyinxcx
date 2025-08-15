const app = getApp()
// pages/index/index.js
Page({
  // 生成8位随机字符串（包含大小写字母和数字）
  generateRandomString() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // 创建小组
  createGroup() {
    const randomString = this.generateRandomString();
    const serverUrl = 'http://192.168.1.224:3000/api/create-group'; // 本地后端地址
    console.log('--- “创建小组”按钮被点击，函数已执行 ---'); // <--- 添加这行代码
    tt.request({
      url: serverUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        action: "create",
        groupCode: randomString
      },
      success: (res) => {
        if (res.statusCode === 200) {
          tt.showToast({
            title: '小组创建成功',
            icon: 'success',
            duration: 2000
          });
          tt.navigateTo({
            url: `/pages/create/create?randomString=${randomString}`
          });
        } else {
          tt.showToast({
            title: `创建失败: ${res.data.message || '未知错误'}`,
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        tt.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        });
        console.error('请求失败:', err);
      }
    });
  },
  joinGroup() {
    tt.navigateTo({
    url: '/pages/entry/entry'
    });
    },
});

