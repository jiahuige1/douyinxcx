// pages/create/create.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    randomString: ''
  },

  onLoad(options) {
    if (options.randomString) {
      this.setData({
        randomString: options.randomString
      });
    }
  },
  copyToClipboard() {
    const { randomString } = this.data;
    tt.setClipboardData({
      data: randomString,
      success() {
        tt.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 2000
        });
      },
      fail() {
        tt.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})