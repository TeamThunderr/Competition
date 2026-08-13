const CodingPlatformProvider = require('./codingPlatform.provider');

class CodeChefProvider extends CodingPlatformProvider {
  constructor() {
    super('CODECHEF');
  }

  async getPublicProfile(username) {
    const profileUrl = `https://www.codechef.com/users/${encodeURIComponent(username)}`;
    const res = await fetch(profileUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (res.status === 404) return { exists: false, status: 'NOT_FOUND', sourceType: this.getSourceType(), profileUrl };
    if (!res.ok) return { exists: false, status: 'UNAVAILABLE', sourceType: this.getSourceType(), profileUrl };
    const html = await res.text();
    return {
      exists: true,
      status: 'VALID',
      sourceType: this.getSourceType(),
      profileUrl,
      raw: html
    };
  }

  async getCurrentStats(username) {
    const profile = await this.getPublicProfile(username);
    if (!profile.exists) return profile;
    const html = profile.raw || '';
    const rating = html.match(/CodeChef Rating.*?([0-9]{3,4})/i)?.[1] || null;
    const highestRating = html.match(/Highest Rating\s+([0-9]{3,4})/i)?.[1] || null;
    const totalSolved = html.match(/Total Problems Solved:\s*(\d+)/i)?.[1] || null;
    return {
      ...profile,
      currentRating: rating ? Number(rating) : null,
      highestRating: highestRating ? Number(highestRating) : null,
      stars: null,
      globalRank: null,
      countryRank: null,
      institutionRank: null,
      contestParticipationCount: null,
      totalSolved: totalSolved ? Number(totalSolved) : null,
      badgeCount: null,
      activitySummary: {}
    };
  }
}

module.exports = CodeChefProvider;
