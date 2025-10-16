"""
Vietnamese interpretations for numerology numbers.
Provides Pythagorean numerology meanings for Life Path, Destiny, Soul Urge, and Personality numbers.
"""

from typing import Dict

# Vietnamese interpretations for each number type and value
INTERPRETATIONS: Dict[str, Dict[int, str]] = {
    "life_path": {
        1: "Lãnh đạo, độc lập, sáng tạo. Bạn là người tiên phong, có khả năng đưa ra quyết định và khởi tạo dự án mới. Sức mạnh trong tính tự chủ và quyết tâm.",
        2: "Hòa hợp, hợp tác, nhạy cảm. Bạn là người hòa nhập tập thể, giỏi lắng nghe và đưa ra sự cân bằng. Sức mạnh trong sự đồng cảm và ngoại giao.",
        3: "Sáng tạo, biểu hiện, giao tiếp. Bạn có khiếu nghệ thuật và thích chia sẻ ý tưởng. Sức mạnh trong sự vui vẻ và khả năng giao tiếp.",
        4: "Thực tế, ổn định, cần cù. Bạn là người xây dựng nền tảng vững chắc. Sức mạnh trong kỷ luật và tính đáng tin cậy.",
        5: "Tự do, phiêu lưu, thích nghi. Bạn yêu thích thay đổi và khám phá. Sức mạnh trong tính linh hoạt và sự trí tuệ.",
        6: "Tình yêu thương, trách nhiệm, hòa bình. Bạn là người chăm sóc và muốn tạo hòa bình. Sức mạnh trong sự cần mẫn và lòng trắc ẩn.",
        7: "Tâm linh, tư duy sâu sắc, tìm tòi. Bạn là người suy ngẫm và tìm hiểu chân lý. Sức mạnh trong trí tuệ và tính tâm linh.",
        8: "Sức mạnh, thành công, thế lực. Bạn có khả năng thành lập sự nghiệp lớn. Sức mạnh trong khả năng quản lý và tài chính.",
        9: "Nhân ái, hoàn thành, đạo đức. Bạn có lòng từ bi và muốn giúp đỡ nhân loại. Sức mạnh trong sự tổng quát và nhìn xa.",
        11: "Nhạy cảm siêu phàm, trực giác, lãnh tụ tinh thần. Bạn có sứ mệnh phát triển nhân loại. Sức mạnh trong tầm nhìn cao cả và khả năng truyền cảm hứng.",
        22: "Xây dựng chương trình, hoạch định lớn, lãnh tụ thiên bẩm. Bạn có khả năng thực hiện những dự án lớn lao. Sức mạnh trong tầm nhìn toàn cầu và khả năng lãnh đạo.",
        33: "Thầy tế, tình yêu vô điều kiện, tâm linh cao. Bạn có sứ mệnh giảng dạy và yêu thương. Sức mạnh trong khả năng chữa lành và giác ngộ.",
    },
    "destiny": {
        1: "Khác biệt và độc lập. Định mệnh của bạn là trở thành lãnh đạo độc lập, thiết lập con đường riêng, và thể hiện tính cá nhân mạnh mẽ.",
        2: "Hợp tác và sự cân bằng. Định mệnh của bạn là tạo hòa hợp, nỗ lực hòa hợp các khác biệt, và phát triển các mối quan hệ ý nghĩa.",
        3: "Biểu hiện sáng tạo. Định mệnh của bạn là chia sẻ tài năng sáng tạo, giao tiếp với các ý tưởng mới, và mang lại niềm vui cho người khác.",
        4: "Xây dựng nền tảng vững. Định mệnh của bạn là tạo ra sự ổn định, xây dựng các cơ sở vững chắc, và thực hiện công việc kỹ lưỡng.",
        5: "Phiêu lưu và thay đổi. Định mệnh của bạn là khám phá thế giới, chào đón thay đổi, và giải phóng tiềm năng của bạn.",
        6: "Phục vụ và trách nhiệm. Định mệnh của bạn là chăm sóc gia đình và cộng đồng, và tạo môi trường hòa bình.",
        7: "Khám phá và hiểu biết. Định mệnh của bạn là tìm kiếm chân lý, phát triển trí tuệ, và nâng cao nhận thức tâm linh.",
        8: "Thành công vật chất. Định mệnh của bạn là phát triển sự giàu có, thực hiện những mục tiêu lớn, và quản lý nguồn lực hiệu quả.",
        9: "Phục vụ nhân loại. Định mệnh của bạn là làm việc vì lợi ích chung, giảng dạy và giúp đỡ, cũng như hoàn thành chu kỳ.",
        11: "Sứ mệnh tinh thần cao. Định mệnh của bạn là mang tới ánh sáng, truyền cảm hứng cho những người khác, và phát triển ý thức mới.",
        22: "Xây dựng các công trình toàn cầu. Định mệnh của bạn là hiện thực hóa những kế hoạch lớn lao, tạo ra di sản lâu dài cho nhân loại.",
        33: "Dạy dỗ chữa lành. Định mệnh của bạn là yêu thương vô điều kiện, dạy bảo những người khác, và nâng cao con người.",
    },
    "soul_urge": {
        1: "Mong muốn độc lập và lãnh đạo. Bộ mặt nội tâm của bạn hướng tới sự tự chủ, khám phá những điều mới lạ, và thể hiện tính cá nhân.",
        2: "Mong muốn hòa hợp và quan hệ gắn bó. Bộ mặt nội tâm của bạn tìm kiếm kết nối sâu sắc, an toàn trong nhóm, và cảm giác bình an.",
        3: "Mong muốn sáng tạo và biểu hiện. Bộ mặt nội tâm của bạn muốn chia sẻ tài năng, được nghe tiếng nói, và mang lại niềm vui.",
        4: "Mong muốn ổn định và trật tự. Bộ mặt nội tâm của bạn tìm kiếm hệ thống, công nhân cần cù, và đắc lực thực tế.",
        5: "Mong muốn tự do và khám phá. Bộ mặt nội tâm của bạn khao khát thay đổi, trải nghiệm, và sự linh hoạt.",
        6: "Mong muốn yêu thương và chăm sóc. Bộ mặt nội tâm của bạn muốn giúp đỡ, tạo tổ ấm, và xây dựng gia đình.",
        7: "Mong muốn tìm hiểu chân lý. Bộ mặt nội tâm của bạn khao khát hiểu biết sâu sắc, tâm linh, và sự bộc lộ.",
        8: "Mong muốn thành công vật chất. Bộ mặt nội tâm của bạn tìm kiếm sức mạnh, thành công, và kiểm soát.",
        9: "Mong muốn phục vụ nhân loại. Bộ mặt nội tâm của bạn muốn giúp đỡ, chữa lành, và nâng cao ý thức toàn cầu.",
        11: "Mong muốn truyền cảm hứng tâm linh. Bộ mặt nội tâm của bạn tìm kiếm sự sáng suốt cao, hành động có mục đích, và tác động toàn cầu.",
        22: "Mong muốn xây dựng di sản lớn. Bộ mặt nội tâm của bạn muốn thực hiện những dự án vĩ đại, lãnh đạo với quy mô lớn.",
        33: "Mong muốn yêu thương vô điều kiện. Bộ mặt nội tâm của bạn tìm kiếm sự tâm linh cao, dạy bảo, và chữa lành toàn diện.",
    },
    "personality": {
        1: "Ngoại hình độc lập, quyết đoán, mạnh mẽ. Người khác nhìn thấy bạn là lãnh đạo tự tin, người tiên phong.",
        2: "Ngoại hình hợp tác, dịu dàng, lắng nghe. Người khác nhìn thấy bạn là người hòa hợp, bạn tốt, người cân bằng.",
        3: "Ngoại hình sáng tạo, vui vẻ, hòa hoạt. Người khác nhìn thấy bạn là nghệ sĩ, người vui tính, người ngoại hướng.",
        4: "Ngoại hình thực tế, tin cậy, bền bỉ. Người khác nhìn thấy bạn là người làm việc chăm chỉ, đáng tin cậy.",
        5: "Ngoại hình linh hoạt, năng động, tò mò. Người khác nhìn thấy bạn là người khám phá, linh hoạt, hay tiếp xúc.",
        6: "Ngoại hình chăm sóc, trách nhiệm, bình yên. Người khác nhìn thấy bạn là người giúp đỡ, cha mẹ tốt, người tạo hòa bình.",
        7: "Ngoại hình tư duy, bí ẩn, tâm linh. Người khác nhìn thấy bạn là người sâu sắc, trí tuệ, bí ẩn.",
        8: "Ngoại hình quyền lực, tự tin, quản lý. Người khác nhìn thấy bạn là lãnh tụ, người có ảnh hưởng, thành công.",
        9: "Ngoại hình nhân ái, hiểu biết, hoàn toàn. Người khác nhìn thấy bạn là người khôn ngoan, từ bi, toàn diện.",
        11: "Ngoại hình truyền cảm hứng, cao cao, lãnh tụ. Người khác nhìn thấy bạn là người tiên phong tâm linh, truyền cảm hứng.",
        22: "Ngoại hình hoàn thành lớn, quyết đoán, lãnh đạo. Người khác nhìn thấy bạn là xây dựng di sản, tầm nhìn rộng.",
        33: "Ngoại hình tình yêu vô điều kiện, dạy bảo, chữa lành. Người khác nhìn thấy bạn là thầy tế, lãnh đạo tinh thần.",
    },
}


def getInterpretation(numberType: str, value: int, language: str = "vi") -> str:
    """
    Get Vietnamese interpretation for a numerology number.
    
    Args:
        numberType: Type of number ('life_path', 'destiny', 'soul_urge', 'personality')
        value: Numerology value (1-9, 11, 22, 33)
        language: Language code (currently only 'vi' for Vietnamese)
        
    Returns:
        Vietnamese interpretation text
        
    Raises:
        ValueError: If numberType or value is invalid
        
    Example:
        getInterpretation('life_path', 1, 'vi')
        -> "Lãnh đạo, độc lập, sáng tạo..."
    """
    if numberType not in INTERPRETATIONS:
        raise ValueError(f"Unknown number type: {numberType}. Must be one of {list(INTERPRETATIONS.keys())}")
    
    if value not in INTERPRETATIONS[numberType]:
        raise ValueError(f"Unknown value: {value}. Must be 1-9, 11, 22, or 33")
    
    if language != "vi":
        raise ValueError(f"Language {language} not supported. Only 'vi' (Vietnamese) is available")
    
    return INTERPRETATIONS[numberType][value]


def getAllInterpretations(numberType: str) -> Dict[int, str]:
    """
    Get all interpretations for a specific number type.
    
    Args:
        numberType: Type of number ('life_path', 'destiny', 'soul_urge', 'personality')
        
    Returns:
        Dictionary mapping number values to interpretations
    """
    if numberType not in INTERPRETATIONS:
        raise ValueError(f"Unknown number type: {numberType}. Must be one of {list(INTERPRETATIONS.keys())}")
    
    return INTERPRETATIONS[numberType]
