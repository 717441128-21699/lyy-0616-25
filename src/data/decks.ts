import type { Deck, Word } from '../types';

const generateId = (): string => Math.random().toString(36).substr(2, 9);

const cet4Words: Word[] = [
  { id: generateId(), word: 'abandon', phonetic: '/əˈbændən/', definition: 'v. 放弃，抛弃', example: 'He abandoned his car in the snow.', exampleTranslation: '他在雪中抛弃了他的车。' },
  { id: generateId(), word: 'ability', phonetic: '/əˈbɪləti/', definition: 'n. 能力，才能', example: 'She has the ability to solve complex problems.', exampleTranslation: '她有能力解决复杂的问题。' },
  { id: generateId(), word: 'absolute', phonetic: '/ˈæbsəluːt/', definition: 'adj. 绝对的，完全的', example: 'I have absolute confidence in her.', exampleTranslation: '我对她有绝对的信心。' },
  { id: generateId(), word: 'absorb', phonetic: '/əbˈzɔːrb/', definition: 'v. 吸收，理解', example: 'Plants absorb water from the soil.', exampleTranslation: '植物从土壤中吸收水分。' },
  { id: generateId(), word: 'abstract', phonetic: '/ˈæbstrækt/', definition: 'adj. 抽象的 n. 摘要', example: 'Abstract art can be difficult to understand.', exampleTranslation: '抽象艺术可能很难理解。' },
  { id: generateId(), word: 'academy', phonetic: '/əˈkædəmi/', definition: 'n. 学院，研究院', example: 'He studied at the military academy.', exampleTranslation: '他在军事学院学习。' },
  { id: generateId(), word: 'accelerate', phonetic: '/əkˈseləreɪt/', definition: 'v. 加速，促进', example: 'The car accelerated quickly.', exampleTranslation: '汽车迅速加速。' },
  { id: generateId(), word: 'access', phonetic: '/ˈækses/', definition: 'n. 通道，使用权 v. 访问', example: 'Students have free access to the library.', exampleTranslation: '学生可以免费使用图书馆。' },
  { id: generateId(), word: 'accomplish', phonetic: '/əˈkɑːmplɪʃ/', definition: 'v. 完成，实现', example: 'We accomplished our goal ahead of schedule.', exampleTranslation: '我们提前完成了目标。' },
  { id: generateId(), word: 'accurate', phonetic: '/ˈækjərət/', definition: 'adj. 准确的，精确的', example: 'The data must be accurate.', exampleTranslation: '数据必须准确。' },
  { id: generateId(), word: 'achieve', phonetic: '/əˈtʃiːv/', definition: 'v. 实现，达到', example: 'She worked hard to achieve her dreams.', exampleTranslation: '她努力工作以实现她的梦想。' },
  { id: generateId(), word: 'acknowledge', phonetic: '/əkˈnɑːlɪdʒ/', definition: 'v. 承认，感谢', example: 'He acknowledged his mistake.', exampleTranslation: '他承认了自己的错误。' },
  { id: generateId(), word: 'acquire', phonetic: '/əˈkwaɪər/', definition: 'v. 获得，习得', example: 'He acquired a taste for classical music.', exampleTranslation: '他培养了对古典音乐的品味。' },
  { id: generateId(), word: 'adapt', phonetic: '/əˈdæpt/', definition: 'v. 适应，改编', example: 'Animals adapt to their environment.', exampleTranslation: '动物适应它们的环境。' },
  { id: generateId(), word: 'adequate', phonetic: '/ˈædɪkwət/', definition: 'adj. 足够的，适当的', example: 'The food supply is adequate for the trip.', exampleTranslation: '食物供应足够这次旅行。' },
  { id: generateId(), word: 'adjust', phonetic: '/əˈdʒʌst/', definition: 'v. 调整，适应', example: 'You need to adjust to the new schedule.', exampleTranslation: '你需要适应新的时间表。' },
  { id: generateId(), word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', definition: 'n. 管理，行政', example: 'The administration of the company changed.', exampleTranslation: '公司的管理层变了。' },
  { id: generateId(), word: 'admire', phonetic: '/ədˈmaɪər/', definition: 'v. 钦佩，羡慕', example: 'I admire her courage.', exampleTranslation: '我钦佩她的勇气。' },
  { id: generateId(), word: 'admission', phonetic: '/ədˈmɪʃn/', definition: 'n. 承认，入场费', example: 'Admission to the museum is free.', exampleTranslation: '博物馆入场免费。' },
  { id: generateId(), word: 'adopt', phonetic: '/əˈdɑːpt/', definition: 'v. 采用，收养', example: 'They adopted a new policy.', exampleTranslation: '他们采用了一项新政策。' },
];

const cet6Words: Word[] = [
  { id: generateId(), word: 'abolish', phonetic: '/əˈbɑːlɪʃ/', definition: 'v. 废除，取消', example: 'The government decided to abolish the tax.', exampleTranslation: '政府决定取消这项税收。' },
  { id: generateId(), word: 'abrupt', phonetic: '/əˈbrʌpt/', definition: 'adj. 突然的，唐突的', example: 'The meeting came to an abrupt end.', exampleTranslation: '会议突然结束了。' },
  { id: generateId(), word: 'absurd', phonetic: '/əbˈsɜːrd/', definition: 'adj. 荒谬的，可笑的', example: 'It would be absurd to blame him.', exampleTranslation: '责怪他是荒谬的。' },
  { id: generateId(), word: 'abundant', phonetic: '/əˈbʌndənt/', definition: 'adj. 丰富的，充裕的', example: 'The region has abundant natural resources.', exampleTranslation: '该地区有丰富的自然资源。' },
  { id: generateId(), word: 'accommodate', phonetic: '/əˈkɑːmədeɪt/', definition: 'v. 容纳，使适应', example: 'The hotel can accommodate 200 guests.', exampleTranslation: '这家酒店可容纳200位客人。' },
  { id: generateId(), word: 'acquaint', phonetic: '/əˈkweɪnt/', definition: 'v. 使熟悉，使了解', example: 'Please acquaint me with the facts.', exampleTranslation: '请让我了解事实。' },
  { id: generateId(), word: 'acquisition', phonetic: '/ˌækwɪˈzɪʃn/', definition: 'n. 获得，收购', example: 'The company made a major acquisition.', exampleTranslation: '公司进行了一次重大收购。' },
  { id: generateId(), word: 'adhere', phonetic: '/ədˈhɪr/', definition: 'v. 粘附，坚持', example: 'We must adhere to the rules.', exampleTranslation: '我们必须遵守规则。' },
  { id: generateId(), word: 'adjacent', phonetic: '/əˈdʒeɪsnt/', definition: 'adj. 邻近的，毗连的', example: 'The adjacent buildings were damaged.', exampleTranslation: '邻近的建筑物受损了。' },
  { id: generateId(), word: 'administer', phonetic: '/ədˈmɪnɪstər/', definition: 'v. 管理，执行', example: 'She administers the program efficiently.', exampleTranslation: '她有效地管理这个项目。' },
  { id: generateId(), word: 'adolescent', phonetic: '/ˌædəˈlesnt/', definition: 'n./adj. 青少年（的）', example: 'Adolescent health is important.', exampleTranslation: '青少年健康很重要。' },
  { id: generateId(), word: 'advent', phonetic: '/ˈædvent/', definition: 'n. 到来，出现', example: 'The advent of technology changed everything.', exampleTranslation: '技术的出现改变了一切。' },
  { id: generateId(), word: 'adverse', phonetic: '/ədˈvɜːrs/', definition: 'adj. 不利的，有害的', example: 'The adverse weather affected the crops.', exampleTranslation: '恶劣的天气影响了庄稼。' },
  { id: generateId(), word: 'advocate', phonetic: '/ˈædvəkeɪt/', definition: 'v. 提倡 n. 倡导者', example: 'She advocates for animal rights.', exampleTranslation: '她倡导动物权利。' },
  { id: generateId(), word: 'aesthetic', phonetic: '/esˈθetɪk/', definition: 'adj. 美学的，审美的', example: 'The room has aesthetic appeal.', exampleTranslation: '这个房间有美学吸引力。' },
  { id: generateId(), word: 'affiliate', phonetic: '/əˈfɪlieɪt/', definition: 'v. 使隶属 n. 分支机构', example: 'The university affiliates with several colleges.', exampleTranslation: '这所大学附属有几所学院。' },
  { id: generateId(), word: 'affirm', phonetic: '/əˈfɜːrm/', definition: 'v. 断言，确认', example: 'He affirmed his commitment to the project.', exampleTranslation: '他确认了对这个项目的承诺。' },
  { id: generateId(), word: 'afflict', phonetic: '/əˈflɪkt/', definition: 'v. 折磨，使痛苦', example: 'The disease afflicts many people.', exampleTranslation: '这种疾病折磨着许多人。' },
  { id: generateId(), word: 'aggregate', phonetic: '/ˈæɡɡrɪɡeɪt/', definition: 'v. 聚集 n. 总计', example: 'The data aggregate shows a clear trend.', exampleTranslation: '汇总数据显示了一个明显的趋势。' },
  { id: generateId(), word: 'allegation', phonetic: '/ˌæləˈɡeɪʃn/', definition: 'n. 指控，断言', example: 'He denied the allegations against him.', exampleTranslation: '他否认了对他的指控。' },
];

const ieltsWords: Word[] = [
  { id: generateId(), word: 'accommodation', phonetic: '/əˌkɑːməˈdeɪʃn/', definition: 'n. 住宿，住处', example: 'We need to find accommodation for the night.', exampleTranslation: '我们需要找到今晚的住处。' },
  { id: generateId(), word: 'accomplishment', phonetic: '/əˈkɑːmplɪʃmənt/', definition: 'n. 成就，完成', example: 'Winning the award was a great accomplishment.', exampleTranslation: '赢得这个奖项是一项伟大的成就。' },
  { id: generateId(), word: 'accountable', phonetic: '/əˈkaʊntəbl/', definition: 'adj. 有责任的，可解释的', example: 'Managers are accountable for their decisions.', exampleTranslation: '管理者要对他们的决定负责。' },
  { id: generateId(), word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', definition: 'v. 积累，积聚', example: 'Wealth accumulates over time.', exampleTranslation: '财富是随着时间积累的。' },
  { id: generateId(), word: 'acknowledgement', phonetic: '/əkˈnɑːlɪdʒmənt/', definition: 'n. 承认，感谢', example: 'She received an acknowledgement for her work.', exampleTranslation: '她的工作得到了认可。' },
  { id: generateId(), word: 'acquisition', phonetic: '/ˌækwɪˈzɪʃn/', definition: 'n. 习得，获得物', example: 'Language acquisition takes time.', exampleTranslation: '语言习得需要时间。' },
  { id: generateId(), word: 'adequately', phonetic: '/ˈædɪkwətli/', definition: 'adv. 充分地，适当地', example: 'The problem was adequately addressed.', exampleTranslation: '这个问题得到了充分解决。' },
  { id: generateId(), word: 'administrative', phonetic: '/ədˈmɪnɪstreɪtɪv/', definition: 'adj. 行政的，管理的', example: 'She has administrative experience.', exampleTranslation: '她有行政管理经验。' },
  { id: generateId(), word: 'advantageous', phonetic: '/ˌædvənˈteɪdʒəs/', definition: 'adj. 有利的，有益的', example: 'The location is advantageous for business.', exampleTranslation: '这个位置对商业有利。' },
  { id: generateId(), word: 'advisable', phonetic: '/ədˈvaɪzəbl/', definition: 'adj. 明智的，可取的', example: 'It is advisable to book early.', exampleTranslation: '提前预订是明智的。' },
  { id: generateId(), word: 'aesthetically', phonetic: '/esˈθetɪkli/', definition: 'adv. 审美地，美学地', example: 'The building is aesthetically pleasing.', exampleTranslation: '这座建筑在美学上令人愉悦。' },
  { id: generateId(), word: 'affordability', phonetic: '/əˌfɔːrdəˈbɪləti/', definition: 'n. 可负担性', example: 'Affordability is a key concern.', exampleTranslation: '可负担性是一个关键问题。' },
  { id: generateId(), word: 'aggression', phonetic: '/əˈɡreʃn/', definition: 'n. 侵略，攻击', example: 'The aggression was condemned internationally.', exampleTranslation: '这种侵略行为受到国际谴责。' },
  { id: generateId(), word: 'alienation', phonetic: '/ˌeɪliəˈneɪʃn/', definition: 'n. 异化，疏远', example: 'Social alienation is a growing problem.', exampleTranslation: '社会疏远是一个日益严重的问题。' },
  { id: generateId(), word: 'allegiance', phonetic: '/əˈliːdʒəns/', definition: 'n. 忠诚，效忠', example: 'He pledged allegiance to the country.', exampleTranslation: '他宣誓效忠国家。' },
  { id: generateId(), word: 'alleviate', phonetic: '/əˈliːvieɪt/', definition: 'v. 减轻，缓解', example: 'The medicine helped alleviate the pain.', exampleTranslation: '药物有助于减轻疼痛。' },
  { id: generateId(), word: 'amalgamate', phonetic: '/əˈmælɡəmeɪt/', definition: 'v. 合并，混合', example: 'The two companies decided to amalgamate.', exampleTranslation: '两家公司决定合并。' },
  { id: generateId(), word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', definition: 'adj. 模糊的，有歧义的', example: 'The statement was ambiguous.', exampleTranslation: '这个陈述是模糊的。' },
  { id: generateId(), word: 'amendment', phonetic: '/əˈmendmənt/', definition: 'n. 修正案，修改', example: 'The amendment was approved by parliament.', exampleTranslation: '修正案获得议会批准。' },
  { id: generateId(), word: 'analogous', phonetic: '/əˈnæləɡəs/', definition: 'adj. 类似的，相似的', example: 'The situation is analogous to last year.', exampleTranslation: '这种情况与去年类似。' },
];

const toeflWords: Word[] = [
  { id: generateId(), word: 'abstruse', phonetic: '/æbˈstruːs/', definition: 'adj. 深奥的，难懂的', example: 'The theory is too abstruse for most people.', exampleTranslation: '这个理论对大多数人来说太深奥了。' },
  { id: generateId(), word: 'accede', phonetic: '/əkˈsiːd/', definition: 'v. 同意，就职', example: 'She acceded to the request.', exampleTranslation: '她同意了这个请求。' },
  { id: generateId(), word: 'acclimatize', phonetic: '/əˈklaɪmətaɪz/', definition: 'v. 使适应气候', example: 'It takes time to acclimatize to high altitudes.', exampleTranslation: '适应高海拔需要时间。' },
  { id: generateId(), word: 'accolade', phonetic: '/ˈækəleɪd/', definition: 'n. 荣誉，赞美', example: 'The scientist received many accolades.', exampleTranslation: '这位科学家获得了许多荣誉。' },
  { id: generateId(), word: 'accomplice', phonetic: '/əˈkɑːmplɪs/', definition: 'n. 同谋，共犯', example: 'The police arrested the thief and his accomplice.', exampleTranslation: '警察逮捕了小偷和他的同谋。' },
  { id: generateId(), word: 'accost', phonetic: '/əˈkɔːst/', definition: 'v. 搭讪，勾引', example: 'A stranger accosted her on the street.', exampleTranslation: '一个陌生人在街上搭讪她。' },
  { id: generateId(), word: 'accretion', phonetic: '/əˈkriːʃn/', definition: 'n. 堆积，自然增长', example: 'The accretion of sediment formed the island.', exampleTranslation: '沉积物的堆积形成了这个岛屿。' },
  { id: generateId(), word: 'acculturate', phonetic: '/əˈkʌltʃəreɪt/', definition: 'v. 使文化适应', example: 'Immigrants must acculturate to the new society.', exampleTranslation: '移民必须适应新社会的文化。' },
  { id: generateId(), word: 'acquiesce', phonetic: '/ˌækwiˈes/', definition: 'v. 默许，勉强同意', example: 'He acquiesced to their demands.', exampleTranslation: '他默许了他们的要求。' },
  { id: generateId(), word: 'acrimonious', phonetic: '/ˌækrɪˈmoʊniəs/', definition: 'adj. 尖刻的，激烈的', example: 'The debate became acrimonious.', exampleTranslation: '辩论变得激烈起来。' },
  { id: generateId(), word: 'acumen', phonetic: '/ˈækjəmən/', definition: 'n. 敏锐，聪明', example: 'Her business acumen made her successful.', exampleTranslation: '她的商业头脑使她成功。' },
  { id: generateId(), word: 'adage', phonetic: '/ˈædɪdʒ/', definition: 'n. 格言，谚语', example: 'As the old adage says, time is money.', exampleTranslation: '正如古老的谚语所说，时间就是金钱。' },
  { id: generateId(), word: 'adamant', phonetic: '/ˈædəmənt/', definition: 'adj. 坚决的，固执的', example: 'She was adamant about her decision.', exampleTranslation: '她对自己的决定很坚决。' },
  { id: generateId(), word: 'adduce', phonetic: '/əˈduːs/', definition: 'v. 引证，举出', example: 'He adduced evidence to support his claim.', exampleTranslation: '他举出证据支持他的主张。' },
  { id: generateId(), word: 'admonish', phonetic: '/ədˈmɑːnɪʃ/', definition: 'v. 告诫，劝告', example: 'The teacher admonished the students for being late.', exampleTranslation: '老师告诫学生不要迟到。' },
  { id: generateId(), word: 'adulterate', phonetic: '/əˈdʌltəreɪt/', definition: 'v. 掺杂，掺假', example: 'The milk was adulterated with water.', exampleTranslation: '牛奶被掺了水。' },
  { id: generateId(), word: 'adumbrate', phonetic: '/ˈædəmbreɪt/', definition: 'v. 预示，勾画', example: 'The report adumbrates future developments.', exampleTranslation: '这份报告预示了未来的发展。' },
  { id: generateId(), word: 'aegis', phonetic: '/ˈiːdʒɪs/', definition: 'n. 保护，支持', example: 'The project was under the aegis of the government.', exampleTranslation: '这个项目得到了政府的支持。' },
  { id: generateId(), word: 'affable', phonetic: '/ˈæfəbl/', definition: 'adj. 和蔼的，友善的', example: 'She has an affable personality.', exampleTranslation: '她性格和蔼。' },
  { id: generateId(), word: 'affinity', phonetic: '/əˈfɪnəti/', definition: 'n. 亲和力，相似性', example: 'There is a strong affinity between the two languages.', exampleTranslation: '这两种语言之间有很强的相似性。' },
];

export const builtinDecks: Deck[] = [
  {
    id: 'cet4',
    name: '大学英语四级',
    description: '大学英语四级考试核心词汇，共20个示例词',
    wordCount: cet4Words.length,
    category: 'cet4',
    words: cet4Words,
  },
  {
    id: 'cet6',
    name: '大学英语六级',
    description: '大学英语六级考试核心词汇，共20个示例词',
    wordCount: cet6Words.length,
    category: 'cet6',
    words: cet6Words,
  },
  {
    id: 'ielts',
    name: '雅思核心词汇',
    description: '雅思考试高频词汇，共20个示例词',
    wordCount: ieltsWords.length,
    category: 'ielts',
    words: ieltsWords,
  },
  {
    id: 'toefl',
    name: '托福核心词汇',
    description: '托福考试高频词汇，共20个示例词',
    wordCount: toeflWords.length,
    category: 'toefl',
    words: toeflWords,
  },
];

export const parseCustomDeck = (content: string): Word[] => {
  const words: Word[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length >= 3) {
      words.push({
        id: generateId(),
        word: parts[0] || '',
        phonetic: parts[1] || '',
        definition: parts[2] || '',
        example: parts[3] || '',
        exampleTranslation: parts[4] || '',
      });
    }
  }
  
  return words;
};

export const createCustomDeck = (name: string, words: Word[]): Deck => {
  return {
    id: `custom-${generateId()}`,
    name,
    description: `自定义词库 - ${words.length} 个单词`,
    wordCount: words.length,
    category: 'custom',
    words,
  };
};
