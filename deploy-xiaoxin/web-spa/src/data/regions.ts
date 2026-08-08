// 地区级联数据：省 → 市/州 → 区/县 → 乡/镇
// 后端 classes.region_key 使用每个省份的 key（与 server/app/constants.py 对齐）。

export type Town = string
export type County = { name: string; towns: string[] }
export type City = { name: string; counties: County[] }
export type Province = { name: string; key: string; cities: City[] }

export const REGIONS: Province[] = [
  {
    name: '云南省',
    key: 'yunnan',
    cities: [
      {
        name: '昭通市',
        counties: [
          {
            name: '鲁甸县',
            towns: ['龙头山镇', '水磨镇', '乐红镇', '小寨镇', '桃源回族乡'],
          },
          { name: '巧家县', towns: ['白鹤滩镇', '大寨镇', '金塘镇'] },
          { name: '彝良县', towns: ['角奎镇', '洛泽河镇', '牛街镇'] },
          { name: '镇雄县', towns: ['乌峰镇', '泼机镇', '塘房镇'] },
        ],
      },
      {
        name: '曲靖市',
        counties: [
          { name: '麒麟区', towns: ['南宁街道', '建宁街道', '沿江街道'] },
          { name: '宣威市', towns: ['宛水街道', '西宁街道', '来宾街道'] },
          { name: '会泽县', towns: ['金钟镇', '待补镇', '迤车镇'] },
        ],
      },
      {
        name: '大理州',
        counties: [
          { name: '大理市', towns: ['下关街道', '太和街道', '喜洲镇'] },
          { name: '祥云县', towns: ['祥城镇', '云南驿镇', '下庄镇'] },
        ],
      },
      {
        name: '文山州',
        counties: [
          { name: '文山市', towns: ['卧龙街道', '开化街道', '马塘镇'] },
          { name: '砚山县', towns: ['江那镇', '平远镇', '稼依镇'] },
        ],
      },
    ],
  },
  {
    name: '贵州省',
    key: 'guizhou',
    cities: [
      {
        name: '毕节市',
        counties: [
          { name: '七星关区', towns: ['市西街道', '碧阳街道', '小坝镇'] },
          { name: '大方县', towns: ['红旗街道', '东关乡', '理化乡'] },
          { name: '织金县', towns: ['双堰街道', '猫场镇', '化起镇'] },
        ],
      },
      {
        name: '黔东南州',
        counties: [
          { name: '凯里市', towns: ['大十字街道', '湾水镇', '旁海镇'] },
          { name: '黎平县', towns: ['德凤街道', '地坪镇', '肇兴镇'] },
        ],
      },
      {
        name: '遵义市',
        counties: [
          { name: '红花岗区', towns: ['中山路街道', '老城街道', '深溪镇'] },
          { name: '湄潭县', towns: ['湄江街道', '永兴镇', '黄家坝镇'] },
        ],
      },
    ],
  },
  {
    name: '四川省',
    key: 'sichuan',
    cities: [
      {
        name: '凉山州',
        counties: [
          { name: '西昌市', towns: ['北城街道', '东城街道', '礼州镇'] },
          { name: '冕宁县', towns: ['高阳街道', '泸沽镇', '彝海镇'] },
          { name: '雷波县', towns: ['锦城镇', '黄琅镇', '汶水镇'] },
        ],
      },
      {
        name: '宜宾市',
        counties: [
          { name: '翠屏区', towns: ['大观楼街道', '西郊街道', '李庄镇'] },
          { name: '屏山县', towns: ['屏山镇', '中都镇', '新市镇'] },
        ],
      },
      {
        name: '广元市',
        counties: [
          { name: '利州区', towns: ['嘉陵街道', '东坝街道', '宝轮镇'] },
          { name: '青川县', towns: ['乔庄镇', '青溪镇', '木鱼镇'] },
        ],
      },
    ],
  },
  {
    name: '甘肃省',
    key: 'gansu',
    cities: [
      {
        name: '陇南市',
        counties: [
          { name: '武都区', towns: ['城关镇', '安化镇', '马街镇'] },
          { name: '文县', towns: ['城关镇', '碧口镇', '临江镇'] },
          { name: '宕昌县', towns: ['城关镇', '哈达铺镇', '理川镇'] },
        ],
      },
      {
        name: '定西市',
        counties: [
          { name: '安定区', towns: ['永定路街道', '凤翔镇', '巉口镇'] },
          { name: '通渭县', towns: ['平襄镇', '马营镇', '榜罗镇'] },
        ],
      },
      {
        name: '临夏州',
        counties: [
          { name: '临夏市', towns: ['城南街道', '折桥镇', '南龙镇'] },
          { name: '积石山县', towns: ['吹麻滩镇', '大河家镇', '癿藏镇'] },
        ],
      },
    ],
  },
  {
    name: '陕西省',
    key: 'shaanxi',
    cities: [
      {
        name: '延安市',
        counties: [
          { name: '宝塔区', towns: ['宝塔街道', '柳林镇', '枣园镇'] },
          { name: '延川县', towns: ['大禹街道', '文安驿镇', '永坪镇'] },
          { name: '洛川县', towns: ['凤栖镇', '交口河镇', '旧县镇'] },
        ],
      },
      {
        name: '榆林市',
        counties: [
          { name: '榆阳区', towns: ['新明楼街道', '鱼河镇', '镇川镇'] },
          { name: '绥德县', towns: ['名州镇', '义合镇', '四十里铺镇'] },
        ],
      },
      {
        name: '商洛市',
        counties: [
          { name: '商州区', towns: ['城关街道', '沙河子镇', '大荆镇'] },
          { name: '丹凤县', towns: ['龙驹寨街道', '棣花镇', '商镇'] },
        ],
      },
    ],
  },
  {
    name: '广西壮族自治区',
    key: 'guangxi',
    cities: [
      {
        name: '百色市',
        counties: [
          { name: '右江区', towns: ['百城街道', '永乐镇', '四塘镇'] },
          { name: '靖西市', towns: ['新靖镇', '化峒镇', '湖润镇'] },
          { name: '凌云县', towns: ['泗城镇', '逻楼镇', '加尤镇'] },
        ],
      },
      {
        name: '河池市',
        counties: [
          { name: '金城江区', towns: ['金城江街道', '六圩镇', '拔贡镇'] },
          { name: '都安县', towns: ['安阳镇', '高岭镇', '地苏镇'] },
        ],
      },
      {
        name: '崇左市',
        counties: [
          { name: '江州区', towns: ['太平街道', '新和镇', '驮卢镇'] },
          { name: '龙州县', towns: ['龙州镇', '金龙镇', '响水镇'] },
        ],
      },
    ],
  },
]

function findProvince(province: string): Province | undefined {
  return REGIONS.find((p) => p.name === province)
}

/** 省份列表 */
export function getProvinces(): string[] {
  return REGIONS.map((p) => p.name)
}

/** 某省份下的市/州列表 */
export function getCities(province: string): string[] {
  const p = findProvince(province)
  return p ? p.cities.map((c) => c.name) : []
}

/** 某省份 + 市/州 下的区/县列表 */
export function getCounties(province: string, city: string): string[] {
  const p = findProvince(province)
  const c = p?.cities.find((x) => x.name === city)
  return c ? c.counties.map((x) => x.name) : []
}

/** 某省份 + 市/州 + 区/县 下的乡/镇列表 */
export function getTowns(province: string, city: string, county: string): string[] {
  const p = findProvince(province)
  const c = p?.cities.find((x) => x.name === city)
  const ct = c?.counties.find((x) => x.name === county)
  return ct ? ct.towns : []
}

/** 省份对应的 region_key（用于后端建班） */
export function getRegionKey(province: string): string {
  return findProvince(province)?.key ?? ''
}