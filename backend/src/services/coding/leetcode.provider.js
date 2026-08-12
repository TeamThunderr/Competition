const CodingPlatformProvider = require('./codingPlatform.provider');

class LeetCodeProvider extends CodingPlatformProvider {
  constructor() {
    super('LEETCODE');
  }

  async getPublicProfile(username) {
    const profileUrl = `https://leetcode.com/u/${encodeURIComponent(username)}/`;
    const res = await fetch(profileUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.status === 404) return { exists: false, status: 'NOT_FOUND', sourceType: this.getSourceType(), profileUrl };
    if (!res.ok) return { exists: false, status: 'UNAVAILABLE', sourceType: this.getSourceType(), profileUrl };
    const html = await res.text();
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    const usernameMatch = title.match(/^(.+?)\s+-\s+LeetCode Profile/i);
    return {
      exists: true,
      status: 'VALID',
      sourceType: this.getSourceType(),
      profileUrl,
      username: usernameMatch?.[1] || username,
      raw: html
    };
  }

  async getCurrentStats(username) {
    const profile = await this.getPublicProfile(username);
    if (!profile.exists) return profile;
    const html = profile.raw || '';
    const totalSolved = html.match(/(\d[\d,]*)\s+problems solved/i)?.[1]?.replace(/,/g, '');
    const reputation = html.match(/Reputation<\/.*?>\s*([\d.]+[KM]?)/i)?.[1] || null;
    return {
      ...profile,
      totalSolved: totalSolved ? Number(totalSolved) : null,
      easySolved: null,
      mediumSolved: null,
      hardSolved: null,
      ranking: null,
      reputation: reputation ? String(reputation) : null,
      contestRating: null,
      contestParticipationCount: null,
      badgeCount: null,
      activitySummary: {}
    };
  }
}

module.exports = LeetCodeProvider;
