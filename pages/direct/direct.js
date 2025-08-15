// pages/direct/direct.js
Page({

  data: {
    latitude: 0,
    longitude: 0,
    meetingName: '',  // 存储地点名称
    markers: []  // 存储地图标记
  },

  onLoad: function (options) {
    const latitude = parseFloat(options.latitude);
    const longitude = parseFloat(options.longitude);
    const meetingName = options.name || '未知地点';

    this.setData({
      latitude: latitude,
      longitude: longitude,
      meetingName: decodeURIComponent(meetingName),  // 解码地点名称
      markers: [{
        id: 1,
        latitude: latitude,
        longitude: longitude,
        title: meetingName
      }]
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