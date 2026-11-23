import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYMBOLS: Record<string, string> = { Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓' };
const ELEMENTS: Record<string, string> = { Aries:'Fire',Leo:'Fire',Sagittarius:'Fire',Taurus:'Earth',Virgo:'Earth',Capricorn:'Earth',Gemini:'Air',Libra:'Air',Aquarius:'Air',Cancer:'Water',Scorpio:'Water',Pisces:'Water' };
const MODALITIES: Record<string, string> = { Aries:'Cardinal',Cancer:'Cardinal',Libra:'Cardinal',Capricorn:'Cardinal',Taurus:'Fixed',Leo:'Fixed',Scorpio:'Fixed',Aquarius:'Fixed',Gemini:'Mutable',Virgo:'Mutable',Sagittarius:'Mutable',Pisces:'Mutable' };

type CompatData = { love: number; friendship: number; communication: number; overall: number; summary: string; tip: string };

// Compatibility matrix — keyed by sorted pair
const COMPAT: Record<string, CompatData> = {
  'Aries-Aries': { love:72, friendship:80, communication:65, overall:72, summary:'Two Aries together create a passionate, high-energy bond. You understand each other\'s drive and ambition, but power struggles can arise when neither wants to back down.', tip:'Take turns leading. Your shared fire is your greatest strength — channel it together, not against each other.' },
  'Aries-Taurus': { love:58, friendship:62, communication:55, overall:58, summary:'Aries moves fast; Taurus moves deliberately. This pairing requires patience from both sides, but the stability Taurus offers can ground Aries\'s fire beautifully.', tip:'Aries: slow down and appreciate the journey. Taurus: embrace a little spontaneity.' },
  'Aries-Gemini': { love:82, friendship:88, communication:90, overall:85, summary:'A lively, intellectually stimulating match. Aries provides the spark and Gemini fans the flames with ideas. You keep each other endlessly entertained.', tip:'Make sure depth follows the excitement. Both of you can get bored — commit to going deeper.' },
  'Aries-Cancer': { love:60, friendship:55, communication:52, overall:56, summary:'Fire meets water in a complex dance. Aries\'s directness can wound Cancer\'s sensitivity, but Cancer\'s nurturing can soften Aries\'s edges in beautiful ways.', tip:'Aries: lead with gentleness. Cancer: communicate your needs directly rather than retreating.' },
  'Aries-Leo': { love:90, friendship:88, communication:85, overall:88, summary:'Two fire signs who truly see each other. You share passion, enthusiasm, and a love of life. This is a vibrant, warm, and mutually inspiring connection.', tip:'Watch for ego clashes — you both love the spotlight. Celebrate each other\'s wins generously.' },
  'Aries-Virgo': { love:55, friendship:60, communication:58, overall:57, summary:'An unlikely but potentially powerful pairing. Aries\'s boldness and Virgo\'s precision can complement each other — if you learn to appreciate your differences.', tip:'Aries: value Virgo\'s attention to detail. Virgo: trust Aries\'s instincts.' },
  'Aries-Libra': { love:78, friendship:72, communication:75, overall:75, summary:'Opposites on the zodiac wheel, you balance each other beautifully. Aries brings action; Libra brings harmony. Together you can achieve great things.', tip:'Aries: practice patience. Libra: be more decisive. Your differences are your greatest gifts.' },
  'Aries-Scorpio': { love:70, friendship:65, communication:60, overall:65, summary:'Intense and magnetic. Both are ruled by Mars, creating a powerful but potentially volatile connection. The passion is undeniable; the power struggles are real.', tip:'Channel your combined intensity into shared goals rather than battles of will.' },
  'Aries-Sagittarius': { love:92, friendship:95, communication:88, overall:92, summary:'A match made in fire-sign heaven. You share a love of adventure, freedom, and big ideas. This is one of the most naturally compatible pairings in the zodiac.', tip:'Make sure to build roots alongside your adventures. Freedom is beautiful — so is home.' },
  'Aries-Capricorn': { love:60, friendship:65, communication:58, overall:61, summary:'Cardinal signs who both want to lead. Aries is impulsive; Capricorn is strategic. With mutual respect, you can build something truly powerful together.', tip:'Aries: respect Capricorn\'s long game. Capricorn: let Aries inspire you to take bold leaps.' },
  'Aries-Aquarius': { love:80, friendship:85, communication:82, overall:82, summary:'A dynamic, forward-thinking pair. Aries provides the fire; Aquarius provides the vision. You inspire each other to think bigger and act bolder.', tip:'Give each other plenty of freedom. Both of you need space to be yourselves.' },
  'Aries-Pisces': { love:65, friendship:62, communication:58, overall:62, summary:'Fire and water in a tender dance. Aries can inspire Pisces to act on their dreams; Pisces can teach Aries the power of compassion and intuition.', tip:'Aries: be gentle with Pisces\'s sensitivity. Pisces: communicate your needs clearly.' },
  'Taurus-Taurus': { love:80, friendship:85, communication:72, overall:79, summary:'Two Taureans create a deeply stable, sensual, and loyal bond. You understand each other\'s need for security and comfort. The risk is getting too comfortable.', tip:'Challenge each other to grow. Comfort is beautiful — so is evolution.' },
  'Taurus-Gemini': { love:55, friendship:62, communication:65, overall:60, summary:'Earth meets air in a challenging but interesting match. Taurus craves stability; Gemini craves variety. Understanding is the key to making this work.', tip:'Taurus: embrace Gemini\'s need for mental stimulation. Gemini: honor Taurus\'s need for consistency.' },
  'Taurus-Cancer': { love:90, friendship:88, communication:82, overall:87, summary:'One of the most naturally compatible pairings. Both value home, security, and deep emotional bonds. You create a warm, nurturing sanctuary together.', tip:'Watch for emotional over-reliance. Your bond is beautiful — make sure you both maintain your individuality.' },
  'Taurus-Leo': { love:65, friendship:68, communication:60, overall:64, summary:'Both are fixed signs who know what they want. Taurus and Leo can clash over stubbornness, but mutual admiration and loyalty can create a lasting bond.', tip:'Taurus: appreciate Leo\'s need for recognition. Leo: honor Taurus\'s need for stability.' },
  'Taurus-Virgo': { love:88, friendship:90, communication:85, overall:88, summary:'Two earth signs who deeply understand each other. You share values of practicality, loyalty, and building something real. This is a grounded, enduring match.', tip:'Make space for spontaneity and romance. Your practical bond is strong — add some magic to it.' },
  'Taurus-Libra': { love:72, friendship:75, communication:70, overall:72, summary:'Both ruled by Venus, you share a love of beauty, harmony, and the finer things in life. Taurus\'s groundedness and Libra\'s social grace complement each other.', tip:'Taurus: embrace Libra\'s social world. Libra: honor Taurus\'s need for quiet intimacy.' },
  'Taurus-Scorpio': { love:82, friendship:75, communication:68, overall:75, summary:'Opposite signs with magnetic attraction. Taurus offers stability; Scorpio offers depth. Together you can create a profoundly transformative bond.', tip:'Trust is everything between you. Build it slowly and it will be unshakeable.' },
  'Taurus-Sagittarius': { love:55, friendship:62, communication:58, overall:58, summary:'Earth and fire in a challenging match. Taurus wants roots; Sagittarius wants wings. With compromise, you can offer each other what you each lack.', tip:'Taurus: allow Sagittarius their freedom. Sagittarius: show up consistently for Taurus.' },
  'Taurus-Capricorn': { love:90, friendship:88, communication:82, overall:87, summary:'Two earth signs building an empire together. You share ambition, loyalty, and a long-term vision. This is one of the most stable and enduring matches.', tip:'Remember to celebrate your achievements together. You work hard — play hard too.' },
  'Taurus-Aquarius': { love:52, friendship:58, communication:55, overall:55, summary:'Fixed signs from very different worlds. Taurus is traditional; Aquarius is revolutionary. This pairing requires genuine curiosity about your differences.', tip:'Taurus: open your mind to Aquarius\'s unconventional ideas. Aquarius: honor Taurus\'s need for stability.' },
  'Taurus-Pisces': { love:88, friendship:85, communication:80, overall:84, summary:'A beautifully tender and intuitive match. Taurus provides the grounding Pisces needs; Pisces brings the magic and romance Taurus secretly craves.', tip:'Taurus: protect Pisces\'s sensitive heart. Pisces: help Taurus dream bigger.' },
  'Gemini-Gemini': { love:75, friendship:88, communication:95, overall:85, summary:'Two Geminis create a whirlwind of ideas, laughter, and stimulation. You understand each other perfectly — sometimes too perfectly to challenge each other.', tip:'Create depth together. Your mental connection is extraordinary — build emotional roots to match.' },
  'Gemini-Cancer': { love:62, friendship:65, communication:68, overall:65, summary:'Air and water in a delicate dance. Gemini\'s lightness can feel detached to Cancer; Cancer\'s depth can feel heavy to Gemini. But the contrast can be beautiful.', tip:'Gemini: honor Cancer\'s emotional needs. Cancer: give Gemini the mental freedom they need.' },
  'Gemini-Leo': { love:85, friendship:88, communication:90, overall:87, summary:'A playful, vibrant, and mutually adoring match. Gemini keeps Leo intellectually stimulated; Leo gives Gemini the warmth and loyalty they secretly crave.', tip:'Keep the fun alive. Both of you thrive on excitement — make sure depth follows.' },
  'Gemini-Virgo': { love:60, friendship:65, communication:72, overall:65, summary:'Both ruled by Mercury, you share a love of communication and analysis. But Gemini\'s scattered energy can frustrate Virgo\'s need for order.', tip:'Gemini: follow through on your ideas. Virgo: embrace a little beautiful chaos.' },
  'Gemini-Libra': { love:90, friendship:92, communication:95, overall:92, summary:'Two air signs in perfect harmony. You share a love of ideas, beauty, and social connection. This is a naturally flowing, intellectually rich partnership.', tip:'Make sure decisions get made. Both of you can be indecisive — take turns being the one who commits.' },
  'Gemini-Scorpio': { love:62, friendship:60, communication:65, overall:62, summary:'A fascinating but challenging match. Gemini\'s lightness meets Scorpio\'s intensity. The attraction is real, but so is the potential for misunderstanding.', tip:'Gemini: honor Scorpio\'s need for depth and loyalty. Scorpio: give Gemini room to breathe.' },
  'Gemini-Sagittarius': { love:85, friendship:88, communication:90, overall:87, summary:'Opposite signs with natural chemistry. Both love freedom, ideas, and adventure. You inspire each other to think bigger and explore further.', tip:'Build some roots together. Your shared love of freedom is beautiful — so is having a home to return to.' },
  'Gemini-Capricorn': { love:55, friendship:60, communication:62, overall:58, summary:'Air and earth in a challenging but potentially rewarding match. Gemini\'s spontaneity meets Capricorn\'s structure. Mutual respect is essential.', tip:'Gemini: appreciate Capricorn\'s wisdom and discipline. Capricorn: let Gemini lighten your world.' },
  'Gemini-Aquarius': { love:88, friendship:92, communication:95, overall:91, summary:'Two air signs who truly get each other. You share a love of ideas, innovation, and intellectual freedom. This is a meeting of brilliant minds.', tip:'Make sure emotional intimacy keeps pace with intellectual connection.' },
  'Gemini-Pisces': { love:65, friendship:68, communication:70, overall:67, summary:'Mutable signs who are both adaptable and imaginative. Gemini brings ideas; Pisces brings dreams. Together you can create something truly magical.', tip:'Gemini: honor Pisces\'s emotional depth. Pisces: communicate your needs clearly.' },
  'Cancer-Cancer': { love:82, friendship:85, communication:78, overall:82, summary:'Two Cancers create a deeply nurturing, emotionally rich bond. You understand each other\'s moods intuitively. The risk is emotional overwhelm.', tip:'Make sure you both have outlets outside the relationship. Your bond is beautiful — keep your individuality too.' },
  'Cancer-Leo': { love:72, friendship:70, communication:68, overall:70, summary:'Water and fire in a warm, complex dance. Cancer\'s nurturing feeds Leo\'s need for appreciation; Leo\'s warmth melts Cancer\'s protective shell.', tip:'Cancer: celebrate Leo openly. Leo: be gentle with Cancer\'s sensitivity.' },
  'Cancer-Virgo': { love:85, friendship:82, communication:80, overall:82, summary:'A deeply caring and practical match. Cancer provides emotional depth; Virgo provides thoughtful support. You bring out the best in each other.', tip:'Cancer: appreciate Virgo\'s acts of service as love. Virgo: express your feelings more openly.' },
  'Cancer-Libra': { love:65, friendship:68, communication:65, overall:66, summary:'Cardinal signs who both want harmony but seek it differently. Cancer wants emotional security; Libra wants social balance. Understanding is key.', tip:'Cancer: give Libra social freedom. Libra: prioritize Cancer\'s emotional needs.' },
  'Cancer-Scorpio': { love:95, friendship:90, communication:85, overall:90, summary:'One of the most powerful water sign matches. You share emotional depth, intuition, and a profound understanding of each other\'s inner world. Deeply transformative.', tip:'Make sure your shared intensity doesn\'t become possessiveness. Trust each other completely.' },
  'Cancer-Sagittarius': { love:55, friendship:58, communication:55, overall:56, summary:'Water and fire in a challenging match. Cancer needs security; Sagittarius needs freedom. With genuine effort, you can offer each other what you lack.', tip:'Cancer: give Sagittarius room to roam. Sagittarius: come home consistently.' },
  'Cancer-Capricorn': { love:82, friendship:78, communication:72, overall:77, summary:'Opposite signs with powerful complementary energy. Cancer provides emotional warmth; Capricorn provides structure and security. A deeply supportive match.', tip:'Cancer: appreciate Capricorn\'s practical love. Capricorn: open your heart more freely.' },
  'Cancer-Aquarius': { love:52, friendship:55, communication:58, overall:55, summary:'Water and air in a challenging match. Cancer needs emotional closeness; Aquarius needs intellectual freedom. Genuine curiosity about each other is essential.', tip:'Cancer: give Aquarius space to be unconventional. Aquarius: show up emotionally for Cancer.' },
  'Cancer-Pisces': { love:95, friendship:92, communication:88, overall:92, summary:'Two water signs in a deeply intuitive, emotionally rich bond. You understand each other without words. This is a profoundly spiritual and loving connection.', tip:'Make sure you both stay grounded. Your emotional world is beautiful — keep one foot in practical reality.' },
  'Leo-Leo': { love:78, friendship:82, communication:80, overall:80, summary:'Two Leos create a dazzling, warm, and generous bond. You celebrate each other magnificently. The challenge is making sure both suns get to shine.', tip:'Take turns in the spotlight. Your combined warmth can light up the world — share it generously.' },
  'Leo-Virgo': { love:62, friendship:65, communication:65, overall:64, summary:'Fire and earth in a complex match. Leo\'s boldness meets Virgo\'s precision. With mutual respect, Leo\'s vision and Virgo\'s skill can create something extraordinary.', tip:'Leo: value Virgo\'s thoughtful feedback. Virgo: celebrate Leo\'s achievements enthusiastically.' },
  'Leo-Libra': { love:88, friendship:85, communication:88, overall:87, summary:'A glamorous, harmonious, and mutually adoring match. Leo provides passion; Libra provides elegance. Together you create beauty and joy wherever you go.', tip:'Make sure substance follows style. Your connection is beautiful — build depth to match.' },
  'Leo-Scorpio': { love:70, friendship:65, communication:62, overall:66, summary:'Two fixed signs with powerful wills. The attraction is magnetic; the power struggles are real. With mutual respect, this can be a deeply transformative bond.', tip:'Neither of you backs down easily. Choose your battles wisely and celebrate each other\'s strength.' },
  'Leo-Sagittarius': { love:92, friendship:95, communication:90, overall:92, summary:'Two fire signs in a joyful, adventurous, and deeply compatible match. You share enthusiasm, optimism, and a love of life. This is a naturally wonderful pairing.', tip:'Make sure to build some stability. Your shared fire is magnificent — give it a hearth to burn in.' },
  'Leo-Capricorn': { love:65, friendship:68, communication:62, overall:65, summary:'Fire and earth in a challenging but potentially powerful match. Leo\'s warmth can thaw Capricorn\'s reserve; Capricorn\'s ambition can inspire Leo to build something lasting.', tip:'Leo: respect Capricorn\'s work ethic. Capricorn: let Leo bring joy and warmth into your world.' },
  'Leo-Aquarius': { love:78, friendship:80, communication:82, overall:80, summary:'Opposite signs with magnetic attraction. Leo leads with heart; Aquarius leads with mind. Together you can inspire and uplift the world around you.', tip:'Leo: honor Aquarius\'s need for independence. Aquarius: show Leo the warmth they need.' },
  'Leo-Pisces': { love:70, friendship:68, communication:65, overall:68, summary:'Fire and water in a tender, creative match. Leo\'s warmth protects Pisces\'s sensitivity; Pisces\'s imagination inspires Leo\'s creativity.', tip:'Leo: be gentle with Pisces\'s feelings. Pisces: celebrate Leo\'s achievements openly.' },
  'Virgo-Virgo': { love:75, friendship:82, communication:85, overall:80, summary:'Two Virgos create a deeply thoughtful, organized, and mutually supportive bond. You understand each other\'s standards perfectly. Watch for over-criticism.', tip:'Practice appreciating each other as you are, not as you could be. Your shared standards are a gift — use them kindly.' },
  'Virgo-Libra': { love:68, friendship:72, communication:75, overall:71, summary:'Earth and air in a thoughtful match. Virgo\'s precision and Libra\'s harmony can create something beautifully balanced — if you appreciate your differences.', tip:'Virgo: embrace Libra\'s social grace. Libra: honor Virgo\'s need for order and routine.' },
  'Virgo-Scorpio': { love:85, friendship:82, communication:80, overall:82, summary:'A deeply perceptive and loyal match. Both are analytical and private. You understand each other\'s complexity and create a bond of profound trust.', tip:'Open up to each other gradually. Your shared depth is your greatest strength.' },
  'Virgo-Sagittarius': { love:58, friendship:62, communication:65, overall:61, summary:'Earth and fire in a challenging match. Virgo\'s attention to detail meets Sagittarius\'s big-picture thinking. With patience, you can complement each other beautifully.', tip:'Virgo: embrace Sagittarius\'s optimism. Sagittarius: appreciate Virgo\'s thoughtful approach.' },
  'Virgo-Capricorn': { love:90, friendship:88, communication:85, overall:88, summary:'Two earth signs in a deeply compatible, ambitious, and loyal match. You share values, work ethic, and a long-term vision. This is a profoundly stable pairing.', tip:'Remember to celebrate and enjoy life together. You build beautifully — make sure to live in what you build.' },
  'Virgo-Aquarius': { love:55, friendship:60, communication:65, overall:60, summary:'Earth and air in a challenging but intellectually stimulating match. Virgo\'s practicality meets Aquarius\'s idealism. Mutual respect for your differences is key.', tip:'Virgo: open your mind to Aquarius\'s unconventional ideas. Aquarius: appreciate Virgo\'s practical wisdom.' },
  'Virgo-Pisces': { love:82, friendship:80, communication:78, overall:80, summary:'Opposite signs with beautiful complementary energy. Virgo provides grounding; Pisces provides inspiration. Together you balance the practical and the magical.', tip:'Virgo: protect Pisces\'s dreams rather than analyzing them. Pisces: help Virgo trust their intuition.' },
  'Libra-Libra': { love:80, friendship:85, communication:88, overall:84, summary:'Two Libras create a harmonious, beautiful, and socially vibrant bond. You understand each other\'s need for balance perfectly. Watch for shared indecision.', tip:'Practice making decisions together. Your shared harmony is beautiful — give it direction.' },
  'Libra-Scorpio': { love:72, friendship:68, communication:70, overall:70, summary:'Air and water in a complex, magnetic match. Libra\'s lightness meets Scorpio\'s intensity. The attraction is real; the depth can be transformative.', tip:'Libra: honor Scorpio\'s need for depth and loyalty. Scorpio: give Libra the social freedom they need.' },
  'Libra-Sagittarius': { love:85, friendship:88, communication:90, overall:87, summary:'A joyful, intellectually rich, and socially vibrant match. Both love ideas, freedom, and beautiful experiences. You bring out each other\'s best.', tip:'Build some roots together. Your shared love of freedom is wonderful — create a home to return to.' },
  'Libra-Capricorn': { love:62, friendship:65, communication:65, overall:64, summary:'Cardinal signs who both want success but seek it differently. Libra seeks harmony; Capricorn seeks achievement. With mutual respect, you can build something lasting.', tip:'Libra: appreciate Capricorn\'s ambition. Capricorn: let Libra bring beauty and balance into your world.' },
  'Libra-Aquarius': { love:90, friendship:92, communication:95, overall:92, summary:'Two air signs in a beautifully compatible, intellectually stimulating match. You share a love of ideas, justice, and human connection. A truly inspired pairing.', tip:'Make sure emotional intimacy keeps pace with your intellectual bond.' },
  'Libra-Pisces': { love:75, friendship:72, communication:72, overall:73, summary:'A gentle, romantic, and creatively rich match. Both are idealistic and beauty-loving. You inspire each other\'s dreams and soften each other\'s edges.', tip:'Libra: honor Pisces\'s emotional depth. Pisces: help Libra make decisions with their heart.' },
  'Scorpio-Scorpio': { love:85, friendship:80, communication:75, overall:80, summary:'Two Scorpios create an intensely deep, loyal, and transformative bond. You understand each other\'s darkness and light. The intensity can be overwhelming.', tip:'Build trust slowly and completely. Your shared depth is extraordinary — use it to heal, not to wound.' },
  'Scorpio-Sagittarius': { love:62, friendship:65, communication:65, overall:64, summary:'Water and fire in a complex match. Scorpio\'s intensity meets Sagittarius\'s freedom-loving nature. With genuine effort, you can offer each other profound growth.', tip:'Scorpio: give Sagittarius freedom. Sagittarius: honor Scorpio\'s need for depth and loyalty.' },
  'Scorpio-Capricorn': { love:88, friendship:85, communication:80, overall:84, summary:'A powerfully ambitious and deeply loyal match. Both are determined, private, and long-term thinkers. You understand each other\'s drive and create an unshakeable bond.', tip:'Open up emotionally to each other. Your combined strength is formidable — let it include vulnerability.' },
  'Scorpio-Aquarius': { love:58, friendship:60, communication:62, overall:60, summary:'Two fixed signs from very different worlds. Scorpio\'s emotional intensity meets Aquarius\'s intellectual detachment. Genuine curiosity about each other is essential.', tip:'Scorpio: give Aquarius intellectual freedom. Aquarius: show up emotionally for Scorpio.' },
  'Scorpio-Pisces': { love:95, friendship:90, communication:85, overall:90, summary:'Two water signs in a profoundly deep, intuitive, and spiritually rich bond. You understand each other at a soul level. This is one of the most powerful matches.', tip:'Stay grounded together. Your emotional and spiritual connection is extraordinary — keep one foot in practical reality.' },
  'Sagittarius-Sagittarius': { love:80, friendship:90, communication:88, overall:85, summary:'Two Sagittarians create an adventurous, joyful, and freedom-loving bond. You understand each other\'s need for exploration perfectly. Watch for lack of commitment.', tip:'Build a shared vision together. Your combined optimism can move mountains — give it direction.' },
  'Sagittarius-Capricorn': { love:62, friendship:65, communication:62, overall:63, summary:'Fire and earth in a challenging but potentially powerful match. Sagittarius\'s optimism meets Capricorn\'s pragmatism. Together you can dream big and build it.', tip:'Sagittarius: appreciate Capricorn\'s long game. Capricorn: let Sagittarius inspire you to dream bigger.' },
  'Sagittarius-Aquarius': { love:88, friendship:92, communication:90, overall:90, summary:'A visionary, freedom-loving, and intellectually brilliant match. Both love ideas, independence, and making the world better. A truly inspired pairing.', tip:'Build some emotional depth together. Your shared vision is extraordinary — let it include your hearts.' },
  'Sagittarius-Pisces': { love:70, friendship:72, communication:70, overall:70, summary:'Two mutable signs who are both dreamers and seekers. Sagittarius seeks truth through experience; Pisces seeks truth through feeling. You inspire each other beautifully.', tip:'Sagittarius: honor Pisces\'s emotional sensitivity. Pisces: embrace Sagittarius\'s adventurous spirit.' },
  'Capricorn-Capricorn': { love:80, friendship:82, communication:78, overall:80, summary:'Two Capricorns create a deeply ambitious, loyal, and enduring bond. You understand each other\'s drive and build something truly lasting together.', tip:'Remember to play and celebrate. You build magnificently — make sure to enjoy what you create.' },
  'Capricorn-Aquarius': { love:58, friendship:62, communication:65, overall:61, summary:'Earth and air in a challenging but intellectually interesting match. Capricorn\'s tradition meets Aquarius\'s innovation. With mutual respect, you can change the world.', tip:'Capricorn: open your mind to Aquarius\'s unconventional vision. Aquarius: honor Capricorn\'s wisdom and experience.' },
  'Capricorn-Pisces': { love:82, friendship:80, communication:75, overall:79, summary:'A beautifully complementary match. Capricorn provides the structure Pisces needs; Pisces brings the magic and inspiration Capricorn secretly craves.', tip:'Capricorn: protect Pisces\'s dreams. Pisces: help Capricorn trust their intuition alongside their logic.' },
  'Aquarius-Aquarius': { love:80, friendship:90, communication:92, overall:87, summary:'Two Aquarians create a brilliantly innovative, freedom-loving, and intellectually rich bond. You understand each other\'s need for independence perfectly.', tip:'Build emotional intimacy alongside your intellectual connection. Your minds are perfectly matched — let your hearts follow.' },
  'Aquarius-Pisces': { love:68, friendship:70, communication:68, overall:68, summary:'Air and water in a gentle, creative match. Aquarius brings ideas; Pisces brings dreams. Together you can envision and create something truly beautiful.', tip:'Aquarius: honor Pisces\'s emotional depth. Pisces: give Aquarius the intellectual freedom they need.' },
  'Pisces-Pisces': { love:85, friendship:88, communication:82, overall:85, summary:'Two Pisces create a deeply intuitive, romantic, and spiritually rich bond. You understand each other without words. The risk is losing yourselves in each other.', tip:'Maintain your individual identities. Your shared sensitivity is a gift — keep some of it just for yourself.' },
};

function getCompat(a: string, b: string): CompatData {
  const key = [a, b].sort().join('-');
  // eslint-disable-next-line security/detect-object-injection
  return COMPAT[key] ?? { love:70, friendship:70, communication:70, overall:70, summary:'A unique and interesting pairing with much to discover together.', tip:'Approach each other with curiosity and openness.' };
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

export default function CompatibilityPage() {
  const [sign1, setSign1] = useState('');
  const [sign2, setSign2] = useState('');
  const [result, setResult] = useState<CompatData | null>(null);

  function calculate() {
    if (sign1 && sign2) setResult(getCompat(sign1, sign2));
  }

  const overallColor = result ? (result.overall >= 80 ? 'bg-success' : result.overall >= 65 ? 'bg-primary' : 'bg-warning') : '';

  return (
    <>
      <Helmet>
        <title>Zodiac Compatibility — Spellful</title>
        <meta name="description" content="Discover your zodiac compatibility. Check love, friendship, and communication scores for any two signs." />
        <meta property="og:title" content="Zodiac Compatibility — Spellful" />
        <meta property="og:description" content="Discover your zodiac compatibility. Check love, friendship, and communication scores for any two signs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/compatibility" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Zodiac Compatibility — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zodiac Compatibility — Spellful" />
        <meta name="twitter:description" content="Discover your zodiac compatibility. Check love, friendship, and communication scores for any two signs." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Zodiac Compatibility — Spellful" />
      </Helmet>
      <main className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <p className="text-4xl">♈ ♉ ♊ ♋ ♌ ♍</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Zodiac Compatibility</h1>
            <p className="text-muted-foreground">Discover the cosmic chemistry between any two signs</p>
          </motion.div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: 'First Sign', value: sign1, set: setSign1 }, { label: 'Second Sign', value: sign2, set: setSign2 }].map(({ label, value, set }) => (
                <div key={label} className="space-y-2">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SIGNS.map(s => (
                      <button key={s} onClick={() => set(s)}
                        className={`p-2 rounded-lg border text-xs transition-all flex flex-col items-center gap-0.5 ${value === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        {/* eslint-disable-next-line security/detect-object-injection */}
                        <span className="text-lg">{SYMBOLS[s]}</span>
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={calculate} disabled={!sign1 || !sign2}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40">
              <Heart className="w-4 h-4" /> Check Compatibility
            </button>
          </div>

          {result && sign1 && sign2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    <p className="text-4xl">{SYMBOLS[sign1]}</p>
                    <p className="text-sm font-medium text-foreground mt-1">{sign1}</p>
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    <p className="text-xs text-muted-foreground">{ELEMENTS[sign1]} · {MODALITIES[sign1]}</p>
                  </div>
                  <div className="text-center px-4">
                    <div className={`text-3xl font-bold font-serif ${result.overall >= 80 ? 'text-success' : result.overall >= 65 ? 'text-primary' : 'text-warning'}`}>{result.overall}%</div>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                  <div className="text-center flex-1">
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    <p className="text-4xl">{SYMBOLS[sign2]}</p>
                    <p className="text-sm font-medium text-foreground mt-1">{sign2}</p>
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    <p className="text-xs text-muted-foreground">{ELEMENTS[sign2]} · {MODALITIES[sign2]}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <ScoreBar label="Love & Romance" score={result.love} color={overallColor} />
                  <ScoreBar label="Friendship" score={result.friendship} color={overallColor} />
                  <ScoreBar label="Communication" score={result.communication} color={overallColor} />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-xs text-primary font-medium mb-1">✦ Cosmic Tip</p>
                  <p className="text-sm text-foreground">{result.tip}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}