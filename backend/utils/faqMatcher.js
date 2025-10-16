const FAQ = require('../models/faq');

const findBestFAQMatch = async (userQuery) => {
  try {
    const cleanQuery = userQuery.toLowerCase().trim();
    
    console.log('🔍 Searching FAQ for:', cleanQuery);

    // 1. First try: Exact match or contains the entire query
    let faq = await FAQ.findOne({
      $or: [
        { question: { $regex: cleanQuery, $options: 'i' } },
        { answer: { $regex: cleanQuery, $options: 'i' } }
      ]
    });

    if (faq) {
      console.log('✅ FAQ found (direct match):', faq.question);
      return faq;
    }

    // 2. Second try: Split into keywords and search
    const keywords = cleanQuery.split(' ')
      .filter(word => word.length > 3) // Only words longer than 3 characters
      .slice(0, 5); // Maximum 5 keywords

    if (keywords.length > 0) {
      faq = await FAQ.findOne({
        $or: [
          { question: { $regex: keywords.join('|'), $options: 'i' } },
          { answer: { $regex: keywords.join('|'), $options: 'i' } },
          { tags: { $in: keywords } }
        ]
      });

      if (faq) {
        console.log('✅ FAQ found (keyword match):', faq.question);
        return faq;
      }
    }

    console.log('❌ No FAQ match found');
    return null;

  } catch (error) {
    console.error('FAQ matching error:', error);
    return null;
  }
};

module.exports = { findBestFAQMatch };