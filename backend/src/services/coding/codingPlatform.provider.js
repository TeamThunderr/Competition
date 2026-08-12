class CodingPlatformProvider {
  constructor(platform) {
    this.platform = platform;
  }

  getSourceType() {
    return 'PUBLIC_PROFILE';
  }
}

module.exports = CodingPlatformProvider;
