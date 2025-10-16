/**
 * Insight Generator Service
 * Generates personalized numerology insights based on user data and concern
 */

import type { NumerologyProfile } from '../types';

interface NumberInterpretation {
  [key: string]: string;
}

/**
 * Generate personalized insight from numerology profile
 */
export function generatePersonalInsight(
  profile: NumerologyProfile,
  concern: string | null,
  userName: string,
): string {
  const lifePathInterpretation = getLifePathInterpretation(profile.lifePathNumber);
  const destinyInterpretation = getDestinyInterpretation(profile.destinyNumber);
  const soulUrgeInterpretation = getSoulUrgeInterpretation(profile.soulUrgeNumber);

  // Personalize based on user's concern if provided
  const concernContext = concern ? generateConcernContext(concern, profile) : '';

  const insight = `
${userName}, dựa trên ngày sinh của bạn:

**Số Đường Sống (${profile.lifePathNumber})**: ${lifePathInterpretation}

**Số Số Mệnh (${profile.destinyNumber})**: ${destinyInterpretation}

**Số Linh Hồn (${profile.soulUrgeNumber})**: ${soulUrgeInterpretation}

${concernContext}

Năm cá nhân của bạn là năm ${profile.currentPersonalYear} - đây là thời kỳ ${getYearMeaning(
    profile.currentPersonalYear,
  )}.
`.trim();

  return insight;
}

/**
 * Get life path number interpretation
 */
function getLifePathInterpretation(number: number): string {
  const interpretations: NumberInterpretation = {
    '1': 'Bạn là một người độc lập, sáng tạo và có tinh thần lãnh đạo. Bạn có khả năng khởi xướng các dự án mới và đạt được thành công thông qua sự kiên định.',
    '2': 'Bạn có bản chất hòa bình, cân bằng và nhạy cảm. Bạn giỏi trong công việc đòi hỏi hợp tác và bạn có khả năng làm hòa giữa các xung đột.',
    '3': 'Bạn là một người sáng tạo, vui vẻ và có khả năng giao tiếp tốt. Bạn có tài năng trong nghệ thuật, viết lách hoặc các lĩnh vực biểu đạt sáng tạo.',
    '4': 'Bạn là một người thực tế, đáng tin cậy và có kỹ năng tổ chức. Bạn xây dựng sự ổn định thông qua công việc chăm chỉ và kỷ luật.',
    '5': 'Bạn là một người tự do, linh hoạt và thích mạo hiểm. Bạn thích học hỏi, trải nghiệm những điều mới và có khả năng thích nghi cao.',
    '6': 'Bạn có bản chất chăm sóc, trách nhiệm và mong muốn giúp đỡ người khác. Bạn là một người đáng tin cậy và ngoài mục đích trong gia đình và cộng đồng.',
    '7': 'Bạn là một người tư tưởng, hướng nội và tìm kiếm sự thật. Bạn có khả năng phân tích sâu sắc và thường là người hiểu biết và khôn ngoan.',
    '8': 'Bạn có khả năng lãnh đạo, quản lý tài chính và thực hiện kế hoạch quy mô lớn. Bạn tập trung vào thành công vật chất và quyền lực.',
    '9': 'Bạn là một người có tầm nhìn rộng, từ bi và hướng tới bệnh nhân. Bạn quan tâm đến phúc lợi của nhân loại và có khả năng hoàn thành vòng tròn.',
    '11': 'Bạn là một người trực giác, tinh thần và có tác động mạnh mẽ. Bạn có khả năng giác ngộ và thường hành động như một người hướng dẫn hoặc giáo viên.',
    '22': 'Bạn là một người tham vọng, quản lý và xây dựng các kế hoạch tầm cỡ lớn. Bạn có khả năng biến những ý tưởng khồng lồ thành hiện thực.',
  };

  return interpretations[number.toString()] || 'Bạn là một cá nhân độc đáo với những tính cách đặc biệt.';
}

/**
 * Get destiny number interpretation
 */
function getDestinyInterpretation(number: number): string {
  const interpretations: NumberInterpretation = {
    '1': 'Số mệnh của bạn hướng bạn đến sự độc lập, lãnh đạo và chinh phục. Bạn được gọi để khởi xướng các dự án mới.',
    '2': 'Số mệnh của bạn dẫn bạn đến hợp tác, tôn trọng và cân bằng. Bạn có khả năng làm cầu nối giữa các người.',
    '3': 'Số mệnh của bạn kêu gọi sáng tạo, giao tiếp và tự biểu đạt. Bạn được gọi để chia sẻ tài năng và niềm vui của bạn.',
    '4': 'Số mệnh của bạn yêu cầu xây dựng nền tảng vững chắc và ổn định. Bạn được gọi để tạo ra sự bền vững và trật tự.',
    '5': 'Số mệnh của bạn khuyến khích tự do, phiêu lưu và thay đổi. Bạn được gọi để khám phá và chia sẻ những trải nghiệm mới.',
    '6': 'Số mệnh của bạn yêu cầu phục vụ, chăm sóc và hòa hợp. Bạn được gọi để xây dựng cộng đồng và hỗ trợ các gia đình.',
    '7': 'Số mệnh của bạn tìm kiếm sự thật, hiểu biết và kỹ năng tâm linh. Bạn được gọi để tìm hiểu những bí ẩn của cuộc sống.',
    '8': 'Số mệnh của bạn tập trung vào quyền lực, thành công và quản lý. Bạn được gọi để đạt được thành tựu và thịnh vượng vật chất.',
    '9': 'Số mệnh của bạn hướng tới phục vụ nhân loại và vẻ đẹp tâm linh. Bạn được gọi để hoàn thành một chu kỳ và bắt đầu một chu kỳ mới.',
  };

  return interpretations[number.toString()] || 'Số mệnh của bạn đem lại một sứ mệnh độc đáo cho bạn.';
}

/**
 * Get soul urge number interpretation
 */
function getSoulUrgeInterpretation(number: number): string {
  const interpretations: NumberInterpretation = {
    '1': 'Linh hồn của bạn khao khát lãnh đạo, độc lập và thành công cá nhân.',
    '2': 'Linh hồn của bạn khao khát bình yên, sự kết nối và mối quan hệ có ý nghĩa.',
    '3': 'Linh hồn của bạn khao khát sáng tạo, vui vẻ và tự biểu đạt.',
    '4': 'Linh hồn của bạn khao khát ổn định, trật tự và nền tảng vững chắc.',
    '5': 'Linh hồn của bạn khao khát tự do, phiêu lưu và đa dạng trải nghiệm.',
    '6': 'Linh hồn của bạn khao khát yêu thương, bảo vệ và phục vụ gia đình.',
    '7': 'Linh hồn của bạn khao khát hiểu biết sâu sắc và kết nối tâm linh.',
    '8': 'Linh hồn của bạn khao khát thành công vật chất và quyền lực.',
    '9': 'Linh hồn của bạn khao khát sự hoàn thành, bác ái toàn cầu và cải tạo.',
  };

  return interpretations[number.toString()] || 'Linh hồn của bạn có những mong muốn độc đáo.';
}

/**
 * Generate concern-specific context
 */
function generateConcernContext(concern: string, profile: NumerologyProfile): string {
  const concern_lower = concern.toLowerCase();

  // Detect keywords and provide relevant insights
  if (
    concern_lower.includes('công việc') ||
    concern_lower.includes('sự nghiệp') ||
    concern_lower.includes('tài')
  ) {
    return `\n**Về sự nghiệp của bạn**: Số ${profile.lifePathNumber} chỉ ra rằng bạn nên tìm kiếm công việc phù hợp với năng lực lãnh đạo và tính sáng tạo của bạn.`;
  }

  if (
    concern_lower.includes('tình yêu') ||
    concern_lower.includes('mối quan hệ') ||
    concern_lower.includes('gia đình')
  ) {
    return `\n**Về mối quan hệ của bạn**: Số ${profile.soulUrgeNumber} cho thấy rằng bạn cần tìm kiếm sự kết nối sâu sắc và hiểu biết trong mối quan hệ.`;
  }

  if (concern_lower.includes('sức khỏe') || concern_lower.includes('phát triển')) {
    return `\n**Về sự phát triển cá nhân**: Năm ${profile.currentPersonalYear} là năm tốt để tập trung vào tự chăm sóc và phát triển kỹ năng mới.`;
  }

  return '';
}

/**
 * Get personal year meaning
 */
function getYearMeaning(year: number): string {
  const meanings: NumberInterpretation = {
    '1': 'bắt đầu mới, khởi xướng và sáng tạo',
    '2': 'hợp tác, chờ đợi và xây dựng nền tảng',
    '3': 'sáng tạo, tăng trưởng và biểu đạt',
    '4': 'xây dựng, tổ chức và sự ổn định',
    '5': 'thay đổi, phiêu lưu và linh hoạt',
    '6': 'trách nhiệm, chăm sóc và hòa hợp',
    '7': 'tìm kiếm, tư tưởng và tâm linh',
    '8': 'quyền lực, thành công và thịnh vượng',
    '9': 'kết thúc, hoàn thành và khởi đầu mới',
  };

  return meanings[year.toString()] || 'biến đổi và phát triển';
}

/**
 * Generate brief insight for quick display
 */
export function generateBriefInsight(profile: NumerologyProfile, userName: string): string {
  const lifePathMeaning = getLifePathBriefMeaning(profile.lifePathNumber);
  return `${userName}, số đường sống của bạn là ${profile.lifePathNumber}: ${lifePathMeaning}`;
}

/**
 * Get brief life path meaning
 */
function getLifePathBriefMeaning(number: number): string {
  const briefMeanings: NumberInterpretation = {
    '1': 'Lãnh đạo độc lập',
    '2': 'Hợp tác cân bằng',
    '3': 'Sáng tạo biểu đạt',
    '4': 'Xây dựng ổn định',
    '5': 'Linh hoạt phiêu lưu',
    '6': 'Chăm sóc trách nhiệm',
    '7': 'Tìm kiếm trí tuệ',
    '8': 'Quyền lực thành công',
    '9': 'Bác ái toàn cầu',
    '11': 'Trực giác tâm linh',
    '22': 'Xây dựng quy mô lớn',
  };

  return briefMeanings[number.toString()] || 'Cá nhân độc đáo';
}
