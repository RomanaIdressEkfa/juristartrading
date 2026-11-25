// Site content. Every text is [English, Arabic]; build.js picks the current language with t().
// ⚠ PLACEHOLDERS — confirm with the client before go-live:
//   • price.from values ("from QAR")      • project entries + photos      • opening hours / email / socials

const site = {
  name: ['Juri Star Trading', 'جوري ستار للتجارة'],
  legal: ['Juri Star Trading, Contracting & Hospitality', 'جوري ستار للتجارة والمقاولات والضيافة'],
  short: 'Juri Star',
  domain: 'https://juristartrading.com',
  // Official company contact details (call and WhatsApp use the same number)
  phone: '+974 5115 3838',
  phoneHref: '+97451153838',
  whatsapp: '97451153838',
  whatsappDisplay: '+974 5115 3838',
  email: 'juristartrading@gmail.com',
  cr: '181956',
  poBox: '40096',
  address: ['Building 79, Street 578, Zone 55, Fereej Al Murra, Al Rayyan, Doha, Qatar', 'مبنى 79، شارع 578، منطقة 55، فريج آل مرة، الريان، الدوحة، قطر'],
  hours: ['Saturday – Thursday · 7:00 AM – 9:00 PM', 'السبت – الخميس · 7:00 ص – 9:00 م'],
  mapQuery: 'Fereej Al Murra, Al Rayyan, Qatar',
  social: { facebook: '', instagram: '', tiktok: '' },
  // Analytics — paste the real IDs to switch tracking on (left empty = no tracking scripts are loaded)
  analytics: {
    ga4: '', // e.g. 'G-XXXXXXXXXX'
    ads: '', // e.g. 'AW-123456789'
    adsLabels: { lead: '', call: '', whatsapp: '' }, // conversion labels from Google Ads
  },
};

const areas = [
  ['Doha', 'الدوحة'], ['Lusail', 'لوسيل'], ['Al Rayyan', 'الريان'], ['Al Wakrah', 'الوكرة'], ['Al Khor', 'الخور'],
  ['Umm Salal', 'أم صلال'], ['Al Daayen', 'الضعاين'], ['Mesaieed', 'مسيعيد'], ['The Pearl', 'اللؤلؤة'], ['Industrial Area', 'المنطقة الصناعية'],
];

const process = [
  { icon: 'chat', t: ['Call or WhatsApp', 'اتصل أو راسلنا واتساب'], d: ['Tell us what you need. Send photos or a location pin and we reply the same day.', 'أخبرنا بما تحتاجه. أرسل صوراً أو موقعك وسنرد عليك في نفس اليوم.'] },
  { icon: 'ruler', t: ['Free site visit', 'زيارة موقع مجانية'], d: ['Our technician measures, checks the existing setup and recommends the right system.', 'يقوم فنيّنا بالقياس وفحص الوضع الحالي واقتراح النظام المناسب.'] },
  { icon: 'file', t: ['Clear written quote', 'عرض سعر مكتوب وواضح'], d: ['Itemised price for supply and installation — no hidden extras.', 'سعر مفصّل للتوريد والتركيب — بدون تكاليف مخفية.'] },
  { icon: 'wrench', t: ['Install & handover', 'التركيب والتسليم'], d: ['Clean, on-schedule installation, testing and a walkthrough of your new system.', 'تركيب نظيف في الموعد، مع الاختبار وشرح النظام الجديد لك.'] },
];

const why = [
  { icon: 'store', t: ['Own trading shop', 'محل تجاري خاص بنا'], d: ['Pipes, fittings, pumps, heaters, paints and tools in stock — we supply and install.', 'أنابيب وتوصيلات ومضخات وسخانات ودهانات وعدد متوفرة لدينا — نورّد ونركّب.'] },
  { icon: 'badge', t: ['Licensed in Qatar', 'مرخّصون في قطر'], d: [`Registered company, CR No. ${site.cr}.`, `شركة مسجلة، سجل تجاري رقم ${site.cr}.`] },
  { icon: 'truck', t: ['Qatar-wide service', 'خدمة في جميع أنحاء قطر'], d: ['Villas, apartments, offices, majlis, warehouses and labour camps.', 'فلل وشقق ومكاتب ومجالس ومستودعات وسكن عمال.'] },
  { icon: 'chat', t: ['Arabic & English support', 'دعم بالعربية والإنجليزية'], d: ['Talk to us in your language by phone or WhatsApp.', 'تحدّث معنا بلغتك عبر الهاتف أو واتساب.'] },
];

const services = [
  {
    slug: 'central-water-heaters',
    icon: 'flame',
    scene: 'heater',
    ph: 'heater',
    img: '/assets/img/photos/heater-install.jpg',
    title: ['Central Water Heater System', 'نظام سخانات المياه المركزية'],
    menu: ['Supply, installation & maintenance', 'توريد وتركيب وصيانة'],
    tagline: ['Hot water in every bathroom and kitchen — instantly, at steady pressure.', 'مياه ساخنة في كل حمام ومطبخ — فوراً وبضغط ثابت.'],
    summary: ['Complete central hot water systems for villas, apartments and buildings: heater, circulation pump, filter and insulated piping, supplied and installed.', 'أنظمة مياه ساخنة مركزية متكاملة للفلل والشقق والمباني: سخان ومضخة تدوير وفلتر وتمديدات معزولة، توريد وتركيب.'],
    intro: [
      ['One central heater replaces several small bathroom heaters. Hot water reaches every tap quickly because a circulation pump keeps the line warm, and a pre-filter protects the tank and fittings from sediment.', 'سخان مركزي واحد يغني عن عدة سخانات صغيرة في الحمامات. تصل المياه الساخنة لكل حنفية بسرعة لأن مضخة التدوير تبقي الخط دافئاً، ويحمي الفلتر المسبق الخزان والتوصيلات من الرواسب.'],
      ['We size the system to your household or building, supply the equipment from our own shop and install everything with PPR insulated piping — one team, one warranty contact.', 'نحدد حجم النظام حسب منزلك أو مبناك، ونورد المعدات من محلنا ونركّب كل شيء بتمديدات PPR معزولة — فريق واحد وجهة ضمان واحدة.'],
    ],
    price: { from: 1450, unit: ['complete package', 'للباقة الكاملة'] },
    features: [
      ['Hot water at every tap in seconds', 'مياه ساخنة في كل حنفية خلال ثوانٍ'],
      ['Lower running cost than several small heaters', 'تكلفة تشغيل أقل من عدة سخانات صغيرة'],
      ['Steady temperature and pressure', 'حرارة وضغط ثابتان'],
      ['Sizes from 100 L to 1,000 L+', 'سعات من 100 لتر حتى أكثر من 1000 لتر'],
      ['Electric, gas or heat-pump options', 'خيارات كهربائية أو غاز أو مضخة حرارية'],
      ['Annual maintenance available', 'صيانة سنوية متاحة'],
    ],
    package: [
      { icon: 'flame', t: ['Central water heater', 'سخان مياه مركزي'], d: ['Glass-lined or stainless-steel storage tank sized to your demand.', 'خزان تخزين مبطن بالزجاج أو من الستانلس ستيل بحجم يناسب احتياجك.'] },
      { icon: 'pump', t: ['Circulation pump', 'مضخة تدوير'], d: ['Keeps hot water moving so it arrives instantly at far taps.', 'تبقي المياه الساخنة في حركة لتصل فوراً للحنفيات البعيدة.'] },
      { icon: 'filter', t: ['Water filter', 'فلتر مياه'], d: ['Sediment pre-filter protects the heater, valves and mixers.', 'فلتر رواسب يحمي السخان والمحابس والخلاطات.'] },
      { icon: 'pipe', t: ['Insulated piping', 'تمديدات معزولة'], d: ['PPR hot-water pipes, insulation, valves and fittings.', 'أنابيب PPR للمياه الساخنة مع العزل والمحابس والتوصيلات.'] },
    ],
    options: [
      { t: ['Villa systems', 'أنظمة الفلل'], d: ['200–500 L tanks serving all bathrooms and the kitchen.', 'خزانات 200–500 لتر تخدم جميع الحمامات والمطبخ.'] },
      { t: ['Apartment & building', 'الشقق والمباني'], d: ['Multi-heater or high-capacity plant rooms with return lines.', 'غرف سخانات متعددة أو بسعة عالية مع خطوط راجعة.'] },
      { t: ['Labour camps & hospitality', 'سكن العمال والضيافة'], d: ['Heavy-duty systems for high simultaneous demand.', 'أنظمة قوية للاستهلاك العالي المتزامن.'] },
    ],
    specs: [
      [['Capacity', 'السعة'], ['100 L – 1,000 L+ (single or multiple tanks)', '100 – أكثر من 1000 لتر (خزان واحد أو عدة خزانات)']],
      [['Heating', 'التسخين'], ['Electric 3–9 kW · Gas · Heat pump', 'كهرباء 3–9 كيلوواط · غاز · مضخة حرارية']],
      [['Tank', 'الخزان'], ['Glass-lined steel or stainless steel, PU insulated', 'حديد مبطن بالزجاج أو ستانلس ستيل، معزول بالبولي يوريثان']],
      [['Circulation pump', 'مضخة التدوير'], ['Hot-water rated, with timer / thermostat control', 'مخصصة للمياه الساخنة، مع مؤقت / ثرموستات']],
      [['Filter', 'الفلتر'], ['Sediment pre-filter, 20–50 micron', 'فلتر رواسب مسبق 20–50 ميكرون']],
      [['Piping', 'التمديدات'], ['PPR PN20 hot-water pipe, insulated', 'أنابيب PPR PN20 للمياه الساخنة، معزولة']],
      [['Installation time', 'مدة التركيب'], ['1–2 days for a typical villa', '1–2 يوم للفيلا عادةً']],
    ],
    faqs: [
      [['What size central water heater do I need?', 'ما حجم السخان المركزي الذي أحتاجه؟'], ['As a guide, 50–70 litres per person for a villa. A family of 6 with 4–5 bathrooms usually needs 300–500 L. We confirm the size during the free site visit.', 'كدليل عام، 50–70 لتراً لكل شخص في الفيلا. عائلة من 6 أفراد مع 4–5 حمامات تحتاج عادةً 300–500 لتر. نؤكد الحجم خلال الزيارة المجانية.']],
      [['Why do I need a circulation pump?', 'لماذا أحتاج مضخة تدوير؟'], ['Without it, cold water sitting in the pipe has to run out before hot water arrives. The pump keeps hot water moving so it arrives in seconds and you waste less water.', 'بدونها يجب أن تخرج المياه الباردة الموجودة في الأنبوب قبل وصول الساخنة. المضخة تبقي المياه الساخنة في حركة فتصل خلال ثوانٍ وتوفّر المياه.']],
      [['Can you replace my old bathroom heaters?', 'هل يمكنكم استبدال سخانات الحمامات القديمة؟'], ['Yes. We remove the old units, connect all bathrooms to the new central system and close off the old points neatly.', 'نعم. نزيل الوحدات القديمة ونوصل جميع الحمامات بالنظام المركزي الجديد ونغلق النقاط القديمة بشكل مرتب.']],
      [['Do you provide maintenance?', 'هل تقدمون الصيانة؟'], ['Yes — descaling, anode and element replacement, pump service and filter changes for any brand.', 'نعم — إزالة الترسبات واستبدال الأنود والسخان الكهربائي وصيانة المضخة وتغيير الفلاتر لجميع الماركات.']],
    ],
  },
  {
    slug: 'water-cooling-system',
    icon: 'snow',
    scene: 'chiller',
    ph: 'chiller',
    img: '/assets/img/photos/water-tank-roof.jpg',
    title: ['Water Cooling System', 'نظام تبريد المياه'],
    menu: ['Supply, installation & maintenance', 'توريد وتركيب وصيانة'],
    tagline: ['No more boiling tap water in summer.', 'وداعاً لمياه الحنفية الساخنة في الصيف.'],
    summary: ['Water tank chillers that cool your roof or ground tank so taps and showers run comfortably cool, even at 45 °C outside.', 'مبردات خزانات مياه تبرد خزان السطح أو الأرضي لتكون مياه الحنفيات والدش باردة ومريحة حتى مع حرارة 45 درجة.'],
    intro: [
      ['In Qatar summer, roof tanks heat the water so much that a cold shower is impossible. A tank chiller circulates the tank water through a compact refrigeration unit and brings it down to a set temperature.', 'في صيف قطر تسخن خزانات السطح المياه لدرجة يستحيل معها الاستحمام بماء بارد. يقوم مبرد الخزان بتدوير مياه الخزان عبر وحدة تبريد مدمجة ويخفض حرارتها إلى الدرجة المحددة.'],
      ['We supply and install chillers sized to your tank and usage, with the pump, piping, insulation and electrical connection — plus seasonal servicing.', 'نورد ونركب مبردات بحجم يناسب خزانك واستهلاكك، مع المضخة والتمديدات والعزل والتوصيل الكهربائي — بالإضافة إلى الصيانة الموسمية.'],
    ],
    price: { from: 2200, unit: ['supply & installation', 'توريد وتركيب'] },
    features: [
      ['Cool water at every tap and shower', 'مياه باردة في كل حنفية ودش'],
      ['Digital thermostat — set your temperature', 'ثرموستات رقمي — اختر درجة الحرارة'],
      ['Units for 1,000 – 10,000+ gallon tanks', 'وحدات لخزانات من 1000 إلى أكثر من 10000 جالون'],
      ['Outdoor-rated, corrosion-resistant', 'مقاومة للظروف الخارجية والتآكل'],
      ['Low-noise compressor', 'ضاغط منخفض الضوضاء'],
      ['Summer servicing & gas top-up', 'صيانة صيفية وتعبئة غاز'],
    ],
    options: [
      { t: ['Villa tank chillers', 'مبردات خزانات الفلل'], d: ['Compact units for roof or ground tanks.', 'وحدات مدمجة لخزانات السطح أو الأرضية.'] },
      { t: ['Building & camp chillers', 'مبردات المباني والسكن'], d: ['High-capacity units for large tanks and many users.', 'وحدات بسعة عالية للخزانات الكبيرة وعدد كبير من المستخدمين.'] },
      { t: ['Inline water coolers', 'مبردات المياه على الخط'], d: ['Cool a specific line such as the majlis or kitchen.', 'لتبريد خط معين مثل المجلس أو المطبخ.'] },
    ],
    specs: [
      [['Tank size', 'حجم الخزان'], ['1,000 – 10,000+ gallons', '1000 – أكثر من 10000 جالون']],
      [['Cooling capacity', 'قدرة التبريد'], ['1 – 10 TR (selected to tank volume)', '1 – 10 طن تبريد (حسب حجم الخزان)']],
      [['Temperature control', 'التحكم بالحرارة'], ['Digital thermostat, typically 18–25 °C', 'ثرموستات رقمي، عادةً 18–25 درجة']],
      [['Refrigerant', 'غاز التبريد'], ['R410A / R407C', 'R410A / R407C']],
      [['Power', 'الكهرباء'], ['230 V single phase or 415 V three phase', '230 فولت أحادي أو 415 فولت ثلاثي']],
      [['Heat exchanger', 'المبادل الحراري'], ['Titanium / stainless, corrosion resistant', 'تيتانيوم / ستانلس، مقاوم للتآكل']],
    ],
    faqs: [
      [['How cold will my water get?', 'إلى أي درجة ستبرد المياه؟'], ['Most customers set 20–24 °C, which feels cool and comfortable in summer. The thermostat lets you choose.', 'معظم العملاء يختارون 20–24 درجة، وهي باردة ومريحة في الصيف. يمكنك الاختيار عبر الثرموستات.']],
      [['Which chiller size do I need?', 'ما حجم المبرد المناسب؟'], ['It depends on tank volume, daily use and whether the tank is in the sun. We check this on site and recommend the right capacity.', 'يعتمد على حجم الخزان والاستهلاك اليومي وتعرض الخزان للشمس. نفحص ذلك في الموقع ونقترح السعة المناسبة.']],
      [['Does it use a lot of electricity?', 'هل يستهلك الكثير من الكهرباء؟'], ['A correctly sized unit with an insulated tank runs efficiently. The thermostat stops the compressor once the water reaches your set point.', 'الوحدة ذات الحجم الصحيح مع خزان معزول تعمل بكفاءة. ويوقف الثرموستات الضاغط عند وصول المياه للدرجة المحددة.']],
    ],
  },
  {
    slug: 'epoxy-zigzag-flooring',
    icon: 'layers',
    scene: 'epoxy',
    ph: 'epoxy zig',
    img: '/assets/img/photos/epoxy-gloss.jpg',
    title: ['Epoxy & Zigzag Flooring', 'أرضيات الإيبوكسي والزجزاج'],
    menu: ['Epoxy flooring & decorative zigzag flooring', 'أرضيات إيبوكسي وأرضيات زجزاج ديكورية'],
    tagline: ['Seamless, glossy floors — from zigzag chevron to 3D and metallic designs.', 'أرضيات لامعة بدون فواصل — من الزجزاج الشيفرون إلى التصاميم ثلاثية الأبعاد والمعدنية.'],
    summary: ['Decorative and industrial epoxy flooring: zigzag / chevron patterns, 3D floors, metallic marble effects, self-levelling and anti-slip coatings.', 'أرضيات إيبوكسي ديكورية وصناعية: نقشات زجزاج / شيفرون، أرضيات ثلاثية الأبعاد، تأثيرات رخامية معدنية، ذاتية التسوية ومضادة للانزلاق.'],
    intro: [
      ['Epoxy creates a seamless, hard-wearing surface that is easy to clean and resists stains, chemicals and heavy traffic. It is ideal for majlis, living areas, showrooms, garages, kitchens, warehouses and workshops.', 'يشكل الإيبوكسي سطحاً متصلاً بدون فواصل، متيناً وسهل التنظيف ومقاوماً للبقع والمواد الكيميائية والحركة الكثيفة. مثالي للمجالس وغرف المعيشة وصالات العرض والكراجات والمطابخ والمستودعات والورش.'],
      ['Our specialty is the zigzag (chevron) design — sharp, taped patterns in your choice of colours — plus 3D and metallic finishes that turn a floor into a feature.', 'تخصصنا هو تصميم الزجزاج (الشيفرون) — نقشات حادة ودقيقة بالألوان التي تختارها — بالإضافة إلى التشطيبات ثلاثية الأبعاد والمعدنية التي تجعل الأرضية قطعة فنية.'],
    ],
    price: { from: 45, unit: ['per m²', 'للمتر المربع'] },
    features: [
      ['Zigzag / chevron patterns in any colours', 'نقشات زجزاج / شيفرون بأي ألوان'],
      ['3D floor designs', 'تصاميم أرضيات ثلاثية الأبعاد'],
      ['Metallic marble-effect finishes', 'تشطيبات معدنية بتأثير الرخام'],
      ['Seamless, hygienic and easy to clean', 'بدون فواصل، صحية وسهلة التنظيف'],
      ['Anti-slip options for wet areas', 'خيارات مضادة للانزلاق للمناطق الرطبة'],
      ['Diamond grinding & crack repair prep', 'تجهيز بالجلخ الماسي وإصلاح الشقوق'],
    ],
    options: [
      { t: ['Zigzag / Chevron', 'زجزاج / شيفرون'], d: ['Precise taped chevron patterns — our signature design.', 'نقشات شيفرون دقيقة — تصميمنا المميز.'], ph: 'epoxy zig', img: '/assets/img/photos/zigzag-floor.jpg' },
      { t: ['3D Epoxy', 'إيبوكسي ثلاثي الأبعاد'], d: ['Printed 3D artwork sealed under clear epoxy.', 'رسومات ثلاثية الأبعاد مطبوعة ومغطاة بإيبوكسي شفاف.'], ph: 'epoxy3d' },
      { t: ['Metallic Epoxy', 'إيبوكسي معدني'], d: ['Pearl and metallic pigments for a liquid-marble look.', 'أصباغ لؤلؤية ومعدنية لمظهر رخام سائل.'], ph: 'metallic' },
      { t: ['Self-levelling', 'ذاتي التسوية'], d: ['Smooth high-gloss solid colour, 2–3 mm.', 'لون موحد لامع وأملس بسماكة 2–3 ملم.'], ph: 'epoxy', img: '/assets/img/photos/epoxy-gloss.jpg' },
      { t: ['Flake / Chip', 'رقائق ملونة'], d: ['Decorative flakes for garages and kitchens.', 'رقائق ديكورية للكراجات والمطابخ.'], ph: 'flake' },
      { t: ['Industrial & anti-slip', 'صناعي ومضاد للانزلاق'], d: ['Heavy-duty coating for warehouses and workshops.', 'طلاء قوي للمستودعات والورش.'], ph: 'epoxy', img: '/assets/img/photos/epoxy-install.jpg' },
    ],
    specs: [
      [['System', 'النظام'], ['Primer + body coat + top coat (epoxy / PU)', 'برايمر + طبقة أساسية + طبقة نهائية (إيبوكسي / بولي يوريثان)']],
      [['Thickness', 'السماكة'], ['0.5 mm coating – 3 mm self-levelling', '0.5 ملم طلاء – 3 ملم ذاتي التسوية']],
      [['Finish', 'التشطيب'], ['High gloss, satin or matte; anti-slip optional', 'لامع أو نصف لامع أو مطفي؛ مضاد للانزلاق اختياري']],
      [['Designs', 'التصاميم'], ['Zigzag / chevron, 3D, metallic, flake, solid', 'زجزاج / شيفرون، ثلاثي الأبعاد، معدني، رقائق، لون موحد']],
      [['Surface prep', 'تجهيز السطح'], ['Diamond grinding, crack & hole repair', 'جلخ ماسي، إصلاح الشقوق والحفر']],
      [['Foot traffic', 'المشي عليه'], ['24 hours · full cure 7 days', 'بعد 24 ساعة · المعالجة الكاملة 7 أيام']],
    ],
    faqs: [
      [['Can you apply epoxy over existing tiles?', 'هل يمكن تطبيق الإيبوكسي فوق البلاط الموجود؟'], ['Often yes. We grind the tiles, fill the grout lines and apply a primer so the epoxy bonds properly. We check the tiles for hollow spots first.', 'غالباً نعم. نقوم بجلخ البلاط وملء الفواصل ووضع برايمر لضمان الالتصاق. نفحص البلاط أولاً للتأكد من عدم وجود فراغات.']],
      [['How long does a zigzag floor take?', 'كم يستغرق تنفيذ أرضية الزجزاج؟'], ['A typical room takes 3–5 days: preparation, primer, each colour of the pattern and the clear top coat.', 'الغرفة العادية تستغرق 3–5 أيام: التجهيز والبرايمر وكل لون من النقشة والطبقة الشفافة النهائية.']],
      [['Is epoxy slippery?', 'هل الإيبوكسي زلق؟'], ['Gloss epoxy can be slippery when wet. For kitchens, bathrooms and outdoor areas we add an anti-slip grit to the top coat.', 'الإيبوكسي اللامع قد يكون زلقاً عند البلل. للمطابخ والحمامات والمناطق الخارجية نضيف حبيبات مانعة للانزلاق للطبقة النهائية.']],
      [['How do I clean an epoxy floor?', 'كيف أنظف أرضية الإيبوكسي؟'], ['Sweep and mop with a neutral cleaner. Avoid harsh acids. The seamless surface does not trap dirt.', 'اكنس وامسح بمنظف متعادل وتجنب الأحماض القوية. السطح المتصل لا يحبس الأوساخ.']],
    ],
  },
  {
    slug: 'interior-decoration',
    icon: 'sofa',
    scene: 'interior',
    ph: 'interior',
    img: '/assets/img/photos/interior-lounge.jpg',
    title: ['Interior Decoration', 'الديكور الداخلي'],
    menu: ['Interior design & decoration services', 'خدمات التصميم والديكور الداخلي'],
    tagline: ['Gypsum ceilings, feature walls, paint and fit-out — one team from idea to handover.', 'أسقف جبس، جدران مميزة، دهانات وتشطيبات — فريق واحد من الفكرة حتى التسليم.'],
    summary: ['Interior decoration and fit-out for villas, majlis, offices and shops: gypsum ceilings with lighting, wall panels, painting, wallpaper and flooring.', 'ديكور داخلي وتشطيبات للفلل والمجالس والمكاتب والمحلات: أسقف جبس مع الإضاءة، ألواح جدران، دهانات، ورق جدران وأرضيات.'],
    intro: [
      ['From a single feature wall to a full majlis makeover, we plan the design with you, supply the materials and handle every trade — gypsum, carpentry, painting, lighting and flooring.', 'من جدار مميز واحد إلى تجديد كامل للمجلس، نخطط التصميم معك ونورد المواد وننفذ جميع الأعمال — الجبس والنجارة والدهان والإضاءة والأرضيات.'],
      ['Because flooring (epoxy and PVC barkia) is part of our own work, the whole room is finished by one coordinated team.', 'ولأن الأرضيات (الإيبوكسي وباركيه PVC) من أعمالنا، تُنجز الغرفة بالكامل بواسطة فريق واحد منسق.'],
    ],
    price: { from: 55, unit: ['per m² (gypsum ceiling)', 'للمتر المربع (سقف جبس)'] },
    features: [
      ['Gypsum ceilings with cove & spot lighting', 'أسقف جبس مع إضاءة مخفية وسبوت'],
      ['WPC, PU & fluted wall panels', 'ألواح جدران WPC وPU ومضلعة'],
      ['Painting, texture & wallpaper', 'دهانات وتكسيرات وورق جدران'],
      ['Majlis & reception design', 'تصميم المجالس والاستقبال'],
      ['Office & shop fit-out', 'تشطيب المكاتب والمحلات'],
      ['Materials supplied from our shop', 'المواد من محلنا مباشرة'],
    ],
    options: [
      { t: ['Gypsum & false ceilings', 'الجبس والأسقف المستعارة'], d: ['Designer ceilings, bulkheads and lighting coves.', 'أسقف بتصاميم مميزة وبلكونات وإضاءة مخفية.'] },
      { t: ['Wall panels & cladding', 'ألواح وتكسيات الجدران'], d: ['WPC fluted panels, PU stone, TV walls.', 'ألواح WPC مضلعة، حجر PU، جدران التلفاز.'] },
      { t: ['Paint & wallpaper', 'الدهانات وورق الجدران'], d: ['Interior paint, textures and wallpaper hanging.', 'دهانات داخلية وتكسيرات وتركيب ورق جدران.'] },
      { t: ['Complete fit-out', 'تشطيب متكامل'], d: ['Majlis, villas, offices and retail.', 'مجالس وفلل ومكاتب ومحلات.'] },
    ],
    specs: [
      [['Ceilings', 'الأسقف'], ['Gypsum board, gypsum tiles, cove lighting', 'ألواح جبس، بلاطات جبس، إضاءة مخفية']],
      [['Walls', 'الجدران'], ['WPC / PU panels, paint, texture, wallpaper', 'ألواح WPC / PU، دهان، تكسير، ورق جدران']],
      [['Floors', 'الأرضيات'], ['Epoxy, PVC barkia, tiles', 'إيبوكسي، باركيه PVC، بلاط']],
      [['Design', 'التصميم'], ['Layout and finish selection with you', 'المخطط واختيار التشطيبات معك']],
      [['Project size', 'حجم المشروع'], ['Single rooms to full villas & offices', 'من غرفة واحدة إلى فلل ومكاتب كاملة']],
    ],
    faqs: [
      [['Do you provide the design?', 'هل تقدمون التصميم؟'], ['Yes. We discuss your style and budget, suggest finishes and show references before work begins.', 'نعم. نناقش ذوقك وميزانيتك ونقترح التشطيبات ونعرض نماذج قبل البدء.']],
      [['Can you work while we live in the villa?', 'هل يمكنكم العمل ونحن نسكن في الفيلا؟'], ['Yes. We work room by room, protect furniture and floors, and clean up at the end of each day.', 'نعم. نعمل غرفة بغرفة ونحمي الأثاث والأرضيات وننظف في نهاية كل يوم.']],
      [['How is the price calculated?', 'كيف يُحسب السعر؟'], ['Most work is priced per square metre or per item. After the site visit you get a written, itemised quote.', 'معظم الأعمال تُسعّر بالمتر المربع أو بالقطعة. بعد زيارة الموقع تحصل على عرض سعر مكتوب ومفصل.']],
    ],
  },
  {
    slug: 'automatic-water-pump-system',
    icon: 'pump',
    scene: 'pump',
    ph: 'spark',
    img: '/assets/img/photos/pump-room.jpg',
    title: ['Automatic Water Pump System', 'نظام مضخات المياه الأوتوماتيكي'],
    menu: ['Commercial building pumps, automatic control & installation', 'مضخات المباني التجارية، تحكم أوتوماتيكي وتركيب'],
    tagline: ['Steady water pressure on every floor — automatically.', 'ضغط مياه ثابت في كل طابق — تلقائياً.'],
    summary: ['Booster and transfer pump systems for villas, commercial and residential buildings, with automatic pressure control, control panels and installation.', 'أنظمة مضخات رفع ونقل للفلل والمباني التجارية والسكنية، مع تحكم أوتوماتيكي بالضغط ولوحات تحكم وتركيب.'],
    intro: [
      ['Weak pressure on upper floors, pumps that run all day and tanks that run dry are common problems in Qatar buildings. An automatic pump system keeps pressure steady and switches pumps on and off by itself.', 'ضعف الضغط في الطوابق العليا، والمضخات التي تعمل طوال اليوم، والخزانات التي تفرغ مشاكل شائعة في مباني قطر. نظام المضخات الأوتوماتيكي يحافظ على ضغط ثابت ويشغّل المضخات ويوقفها تلقائياً.'],
      ['We size the pumps to your building, install twin duty/standby sets with pressure vessels and control panels, and connect float switches between the ground and roof tanks.', 'نحدد حجم المضخات حسب مبناك، ونركّب مجموعات مزدوجة (تشغيل/احتياط) مع خزانات ضغط ولوحات تحكم، ونوصل عوامات المستوى بين الخزان الأرضي وخزان السطح.'],
    ],
    price: { from: 1800, unit: ['supply & installation', 'توريد وتركيب'] },
    features: [
      ['Constant pressure on every floor', 'ضغط ثابت في كل طابق'],
      ['Automatic start / stop control', 'تشغيل وإيقاف أوتوماتيكي'],
      ['Twin duty / standby pumps', 'مضخات مزدوجة تشغيل / احتياط'],
      ['Dry-run and overload protection', 'حماية من التشغيل الجاف والحمل الزائد'],
      ['Control panel with alarms', 'لوحة تحكم مع إنذارات'],
      ['Annual maintenance contracts', 'عقود صيانة سنوية'],
    ],
    options: [
      { t: ['Booster pump sets', 'مجموعات مضخات الرفع'], d: ['Pressure boosting for villas and buildings.', 'رفع الضغط للفلل والمباني.'] },
      { t: ['Transfer pumps', 'مضخات النقل'], d: ['Ground tank to roof tank, with float switches.', 'من الخزان الأرضي إلى خزان السطح مع العوامات.'] },
      { t: ['Variable-speed (VFD) systems', 'أنظمة السرعة المتغيرة'], d: ['Quiet, energy-saving constant pressure.', 'ضغط ثابت بهدوء وتوفير للطاقة.'] },
    ],
    specs: [
      [['Pump type', 'نوع المضخة'], ['Multistage centrifugal / booster', 'طرد مركزي متعدد المراحل / رفع']],
      [['Flow', 'التدفق'], ['1 – 30 m³/h', '1 – 30 م³/ساعة']],
      [['Head', 'الرفع'], ['Up to 80 m', 'حتى 80 متر']],
      [['Control', 'التحكم'], ['Pressure switch, float switch or VFD panel', 'مفتاح ضغط أو عوامة أو لوحة سرعة متغيرة']],
      [['Power', 'الكهرباء'], ['230 V single phase / 415 V three phase', '230 فولت أحادي / 415 فولت ثلاثي']],
      [['Materials', 'المواد'], ['Stainless-steel impellers, cast-iron or SS body', 'مراوح ستانلس ستيل، جسم حديد زهر أو ستانلس']],
    ],
    faqs: [
      [['Why is the pressure weak on my top floor?', 'لماذا الضغط ضعيف في الطابق العلوي؟'], ['Gravity from the roof tank is not enough for the highest floors. A booster set adds pressure automatically whenever a tap opens.', 'الجاذبية من خزان السطح لا تكفي للطوابق العليا. مجموعة الرفع تضيف الضغط تلقائياً عند فتح أي حنفية.']],
      [['Do I need two pumps?', 'هل أحتاج مضختين؟'], ['For buildings we recommend duty / standby: if one pump fails or is serviced, the other keeps the water running.', 'للمباني ننصح بنظام تشغيل / احتياط: إذا تعطلت مضخة أو كانت في الصيانة، تستمر الأخرى بالعمل.']],
      [['Can you service my existing pumps?', 'هل يمكنكم صيانة مضخاتي الحالية؟'], ['Yes — seals, bearings, pressure switches, panels and vessel recharge for any brand.', 'نعم — الأختام، الرولمانات، مفاتيح الضغط، اللوحات وإعادة شحن خزانات الضغط لجميع الماركات.']],
    ],
  },
  {
    slug: 'building-maintenance',
    icon: 'wrench',
    scene: 'maintenance',
    ph: 'spark',
    img: '/assets/img/photos/building-maintenance.jpg',
    title: ['Building Maintenance Services', 'خدمات صيانة المباني'],
    menu: ['Complete building maintenance, repair & renovation', 'صيانة شاملة للمباني وإصلاح وتجديد'],
    tagline: ['One call for repairs, renovation and planned maintenance.', 'اتصال واحد للإصلاحات والتجديد والصيانة الدورية.'],
    summary: ['Complete maintenance for villas, buildings, offices and shops: plumbing, electrical, painting, repairs and renovation.', 'صيانة متكاملة للفلل والمباني والمكاتب والمحلات: سباكة، كهرباء، دهانات، إصلاحات وتجديد.'],
    intro: [
      ['From a leaking pipe to a full renovation, our maintenance team handles every trade so you deal with one company only.', 'من تسريب في أنبوب إلى تجديد كامل، يتولى فريق الصيانة لدينا جميع الأعمال لتتعامل مع شركة واحدة فقط.'],
      ['Choose one-off repairs or an annual maintenance contract with planned visits and priority response.', 'اختر إصلاحات لمرة واحدة أو عقد صيانة سنوي بزيارات مجدولة واستجابة ذات أولوية.'],
    ],
    price: { from: 150, unit: ['per visit', 'للزيارة'] },
    features: [
      ['Plumbing & leak repairs', 'السباكة وإصلاح التسريبات'],
      ['Electrical repairs & lighting', 'إصلاحات الكهرباء والإضاءة'],
      ['Painting & wall repairs', 'الدهانات وإصلاح الجدران'],
      ['Renovation & fit-out', 'التجديد والتشطيبات'],
      ['Annual maintenance contracts', 'عقود صيانة سنوية'],
      ['Fast response across Qatar', 'استجابة سريعة في أنحاء قطر'],
    ],
    options: [
      { t: ['Repairs on call', 'إصلاحات عند الطلب'], d: ['Plumbing, electrical, carpentry and more.', 'سباكة وكهرباء ونجارة وغيرها.'] },
      { t: ['Annual maintenance contracts', 'عقود الصيانة السنوية'], d: ['Planned visits and priority response.', 'زيارات مجدولة واستجابة ذات أولوية.'] },
      { t: ['Renovation', 'التجديد'], d: ['Paint, gypsum, flooring and fit-out.', 'دهانات وجبس وأرضيات وتشطيبات.'] },
    ],
    specs: [
      [['Properties', 'العقارات'], ['Villas, buildings, offices, shops, accommodation', 'فلل، مباني، مكاتب، محلات، سكن']],
      [['Trades', 'الأعمال'], ['Plumbing, electrical, painting, carpentry, gypsum', 'سباكة، كهرباء، دهانات، نجارة، جبس']],
      [['Contracts', 'العقود'], ['One-off, monthly or annual', 'لمرة واحدة، شهري أو سنوي']],
      [['Response', 'الاستجابة'], ['Same or next day', 'في نفس اليوم أو اليوم التالي']],
      [['Materials', 'المواد'], ['Supplied from our own shop', 'من محلنا مباشرة']],
    ],
    faqs: [
      [['What does an annual maintenance contract include?', 'ماذا يشمل عقد الصيانة السنوي؟'], ['Planned inspection visits, minor repairs and priority call-outs. We agree the scope and visit frequency with you.', 'زيارات فحص مجدولة وإصلاحات بسيطة واستجابة ذات أولوية. نتفق معك على نطاق العمل وعدد الزيارات.']],
      [['How fast can you come?', 'متى يمكنكم الحضور؟'], ['Usually the same or next day. Urgent leaks and electrical faults are prioritised.', 'عادةً في نفس اليوم أو اليوم التالي. التسريبات والأعطال الكهربائية العاجلة لها الأولوية.']],
      [['Do you renovate occupied homes?', 'هل تجددون المنازل المأهولة؟'], ['Yes. We work room by room, protect furniture and clean up every day.', 'نعم. نعمل غرفة بغرفة ونحمي الأثاث وننظف يومياً.']],
    ],
  },
];

// Shop categories (the trading side of the business, as seen on the shopfront)
const categories = [
  { key: 'heaters', t: ['Water Heaters & Pumps', 'السخانات والمضخات'], service: 'central-water-heaters' },
  { key: 'chillers', t: ['Water Chillers', 'مبردات المياه'], service: 'water-cooling-system' },
  { key: 'flooring', t: ['Epoxy & Flooring', 'الإيبوكسي والأرضيات'], service: 'epoxy-zigzag-flooring' },
  { key: 'plumbing', t: ['Pumps, Pipes & Plumbing', 'المضخات والأنابيب والسباكة'], service: 'automatic-water-pump-system' },
  { key: 'paint', t: ['Paints & Decoration', 'الدهانات والديكور'], service: 'interior-decoration' },
  { key: 'tools', t: ['Tools & Electrical', 'العدد والكهرباء'], service: 'building-maintenance' },
];

const products = [
  { slug: 'central-water-heater-300l', cat: 'heaters', icon: 'flame', ph: 'heater', featured: true, price: 1150, unit: ['each', 'للقطعة'],
    name: ['Central Water Heater 300 L', 'سخان مياه مركزي 300 لتر'],
    excerpt: ['Floor-standing glass-lined storage heater for villas.', 'سخان تخزين أرضي مبطن بالزجاج للفلل.'],
    specs: [[['Capacity', 'السعة'], ['300 L', '300 لتر']], [['Power', 'القدرة'], ['3 – 6 kW electric', '3 – 6 كيلوواط كهرباء']], [['Tank', 'الخزان'], ['Glass-lined, PU insulated', 'مبطن بالزجاج، معزول']], [['Mounting', 'التركيب'], ['Floor standing', 'أرضي']]] },
  { slug: 'hot-water-circulation-pump', cat: 'heaters', icon: 'pump', ph: 'heater', featured: true, price: 320, unit: ['each', 'للقطعة'],
    name: ['Hot Water Circulation Pump', 'مضخة تدوير المياه الساخنة'],
    excerpt: ['Quiet in-line pump for instant hot water at every tap.', 'مضخة هادئة على الخط لمياه ساخنة فورية في كل حنفية.'],
    specs: [[['Connection', 'التوصيل'], ['1" / 1¼"', '1 / 1¼ إنش']], [['Max temp', 'أقصى حرارة'], ['95 °C', '95 درجة']], [['Control', 'التحكم'], ['3-speed / timer', '3 سرعات / مؤقت']]] },
  { slug: 'sediment-water-filter', cat: 'heaters', icon: 'filter', ph: 'chiller', price: 95, unit: ['each', 'للقطعة'],
    name: ['Sediment Water Filter Set', 'طقم فلتر مياه للرواسب'],
    excerpt: ['Whole-house pre-filter that protects heaters and mixers.', 'فلتر مسبق للمنزل يحمي السخانات والخلاطات.'],
    specs: [[['Size', 'المقاس'], ['10" / 20" housing', 'حاوية 10 / 20 إنش']], [['Rating', 'الدقة'], ['20 – 50 micron', '20 – 50 ميكرون']]] },
  { slug: 'water-tank-chiller-unit', cat: 'chillers', icon: 'snow', ph: 'chiller', featured: true, price: 1950, unit: ['each', 'للقطعة'],
    name: ['Water Tank Chiller Unit', 'وحدة تبريد خزان المياه'],
    excerpt: ['Outdoor chiller with digital thermostat for villa tanks.', 'مبرد خارجي مع ثرموستات رقمي لخزانات الفلل.'],
    specs: [[['Capacity', 'القدرة'], ['1.5 – 3 TR', '1.5 – 3 طن']], [['Tank', 'الخزان'], ['Up to 3,000 gallons', 'حتى 3000 جالون']], [['Power', 'الكهرباء'], ['230 V', '230 فولت']]] },
  { slug: 'epoxy-floor-kit', cat: 'flooring', icon: 'layers', ph: 'epoxy', featured: true, price: 260, unit: ['per kit', 'للطقم'],
    name: ['Epoxy Floor Coating Kit', 'طقم طلاء أرضيات الإيبوكسي'],
    excerpt: ['Two-part epoxy body coat in standard colours.', 'طبقة إيبوكسي من مكونين بألوان قياسية.'],
    specs: [[['Coverage', 'التغطية'], ['≈ 10 m² per kit', '≈ 10 م² لكل طقم']], [['Finish', 'التشطيب'], ['High gloss', 'لامع']]] },
  { slug: 'metallic-epoxy-pigment', cat: 'flooring', icon: 'spark', ph: 'metallic', price: 85, unit: ['per pack', 'للعبوة'],
    name: ['Metallic Epoxy Pigment', 'صبغة إيبوكسي معدنية'],
    excerpt: ['Pearl & metallic pigments for marble-effect floors.', 'أصباغ لؤلؤية ومعدنية لأرضيات بتأثير الرخام.'],
    specs: [[['Colours', 'الألوان'], ['Gold, silver, copper, pearl', 'ذهبي، فضي، نحاسي، لؤلؤي']]] },
  { slug: 'pvc-barkia-spc-plank', cat: 'flooring', icon: 'planks', ph: 'pvc', featured: true, price: 32, unit: ['per m²', 'للمتر المربع'],
    name: ['PVC Barkia SPC Plank', 'ألواح باركيه PVC نوع SPC'],
    excerpt: ['Waterproof click-lock wood-look planks.', 'ألواح بمظهر الخشب مقاومة للماء بنظام القفل.'],
    specs: [[['Thickness', 'السماكة'], ['4 – 6 mm', '4 – 6 ملم']], [['Wear layer', 'طبقة الحماية'], ['0.3 – 0.5 mm', '0.3 – 0.5 ملم']]] },
  { slug: 'ppr-pipes-fittings', cat: 'plumbing', icon: 'pipe', ph: 'spark', price: null,
    name: ['PPR Pipes & Fittings', 'أنابيب وتوصيلات PPR'],
    excerpt: ['PN20 hot & cold water pipes, elbows, tees and valves.', 'أنابيب PN20 للمياه الساخنة والباردة، أكواع وتيهات ومحابس.'],
    specs: [[['Sizes', 'المقاسات'], ['20 – 110 mm', '20 – 110 ملم']], [['Rating', 'الضغط'], ['PN16 / PN20', 'PN16 / PN20']]] },
  { slug: 'upvc-drainage-pipes', cat: 'plumbing', icon: 'pipe', ph: 'spark', price: null,
    name: ['uPVC Drainage Pipes', 'أنابيب صرف uPVC'],
    excerpt: ['Drainage pipes and fittings for building works.', 'أنابيب وتوصيلات صرف لأعمال البناء.'],
    specs: [[['Sizes', 'المقاسات'], ['1½" – 6"', '1½ – 6 إنش']]] },
  { slug: 'water-pumps', cat: 'plumbing', icon: 'pump', ph: 'chiller', price: null,
    name: ['Water Pumps', 'مضخات المياه'],
    excerpt: ['Booster, transfer and pressure pumps for tanks.', 'مضخات رفع ونقل وضغط للخزانات.'],
    specs: [[['Power', 'القدرة'], ['0.5 – 2 HP', '0.5 – 2 حصان']]] },
  { slug: 'interior-paints', cat: 'paint', icon: 'brush', ph: 'interior', price: null,
    name: ['Interior Paints & Primers', 'دهانات وبرايمر داخلية'],
    excerpt: ['Emulsion, primer and texture paints in all colours.', 'دهانات إيملشن وبرايمر وتكسير بجميع الألوان.'],
    specs: [[['Pack', 'العبوة'], ['1 L / 3.6 L / 18 L', '1 / 3.6 / 18 لتر']]] },
  { slug: 'wpc-fluted-wall-panels', cat: 'paint', icon: 'panels', ph: 'interior', price: 38, unit: ['per panel', 'للوح'],
    name: ['WPC Fluted Wall Panels', 'ألواح جدران WPC مضلعة'],
    excerpt: ['Modern fluted panels for feature and TV walls.', 'ألواح مضلعة حديثة للجدران المميزة وجدران التلفاز.'],
    specs: [[['Size', 'المقاس'], ['16 cm × 290 cm', '16 سم × 290 سم']]] },
  { slug: 'power-tools', cat: 'tools', icon: 'drill', ph: 'spark', price: null,
    name: ['Power Tools', 'العدد الكهربائية'],
    excerpt: ['Drills, grinders, saws and accessories.', 'دريلات وصواريخ ومناشير وملحقاتها.'],
    specs: [[['Range', 'التشكيلة'], ['Cordless & corded', 'لاسلكية وسلكية']]] },
  { slug: 'electrical-supplies', cat: 'tools', icon: 'bolt', ph: 'spark', price: null,
    name: ['Electrical Supplies', 'المستلزمات الكهربائية'],
    excerpt: ['Cables, switches, sockets, breakers and lighting.', 'كابلات ومفاتيح وأفياش وقواطع وإضاءة.'],
    specs: [[['Range', 'التشكيلة'], ['Residential & commercial', 'سكني وتجاري']]] },
];

// ⚠ SAMPLE project entries — replace with the client's real jobs and photos (img: '/assets/img/projects/…').
const projects = [
  { service: 'epoxy-zigzag-flooring', ph: 'epoxy zig', img: '', title: ['Zigzag epoxy majlis floor', 'أرضية مجلس إيبوكسي زجزاج'], place: ['Villa · Doha', 'فيلا · الدوحة'], text: ['Two-tone chevron epoxy with a clear high-gloss top coat.', 'إيبوكسي شيفرون بلونين مع طبقة نهائية شفافة لامعة.'] },
  { service: 'central-water-heaters', ph: 'heater', img: '', title: ['Villa central hot water system', 'نظام مياه ساخنة مركزي لفيلا'], place: ['Villa · Al Rayyan', 'فيلا · الريان'], text: ['Heater, circulation pump, filter and insulated PPR lines to 5 bathrooms.', 'سخان ومضخة تدوير وفلتر وخطوط PPR معزولة لخمسة حمامات.'] },
  { service: 'water-cooling-system', ph: 'chiller', img: '', title: ['Roof tank chiller installation', 'تركيب مبرد خزان السطح'], place: ['Villa · Al Wakrah', 'فيلا · الوكرة'], text: ['Chiller with digital thermostat for a 2,000-gallon roof tank.', 'مبرد مع ثرموستات رقمي لخزان سطح سعة 2000 جالون.'] },
  { service: 'interior-decoration', ph: 'pvc', img: '', title: ['Oak PVC barkia bedrooms', 'غرف نوم باركيه PVC بلون البلوط'], place: ['Apartment · Lusail', 'شقة · لوسيل'], text: ['SPC click planks installed over existing tiles with matching skirting.', 'ألواح SPC بالقفل فوق البلاط الموجود مع نعلات مطابقة.'] },
  { service: 'interior-decoration', ph: 'interior', img: '', title: ['Majlis gypsum ceiling & wall panels', 'سقف جبس وألواح جدران لمجلس'], place: ['Villa · Umm Salal', 'فيلا · أم صلال'], text: ['Gypsum ceiling with cove lighting and a fluted WPC feature wall.', 'سقف جبس بإضاءة مخفية وجدار مميز من ألواح WPC المضلعة.'] },
  { service: 'epoxy-zigzag-flooring', ph: 'metallic', img: '', title: ['Metallic epoxy showroom', 'صالة عرض بإيبوكسي معدني'], place: ['Showroom · Doha', 'صالة عرض · الدوحة'], text: ['Pearl-white metallic epoxy with a marble flow effect.', 'إيبوكسي معدني أبيض لؤلؤي بتأثير الرخام المتدفق.'] },
  { service: 'epoxy-zigzag-flooring', ph: 'epoxy', img: '', title: ['Warehouse anti-slip epoxy', 'إيبوكسي مضاد للانزلاق لمستودع'], place: ['Industrial Area', 'المنطقة الصناعية'], text: ['Heavy-duty epoxy with anti-slip grit and line marking.', 'إيبوكسي قوي بحبيبات مانعة للانزلاق وخطوط تحديد.'] },
  { service: 'water-cooling-system', ph: 'chiller', img: '', title: ['Labour accommodation chillers', 'مبردات لسكن العمال'], place: ['Accommodation · Mesaieed', 'سكن · مسيعيد'], text: ['High-capacity chillers for large ground tanks.', 'مبردات بسعة عالية لخزانات أرضية كبيرة.'] },
  { service: 'interior-decoration', ph: 'interior', img: '', title: ['Office fit-out & painting', 'تشطيب ودهان مكتب'], place: ['Office · West Bay', 'مكتب · الخليج الغربي'], text: ['Partition walls, gypsum ceiling, paint and PVC flooring.', 'جدران فاصلة وسقف جبس ودهان وأرضيات PVC.'] },
  { service: 'automatic-water-pump-system', ph: 'spark', img: '', title: ['Booster pump set for residential building', 'مجموعة مضخات رفع لمبنى سكني'], place: ['Building · Al Sadd', 'مبنى · السد'], text: ['Twin duty / standby pumps with pressure vessel and control panel.', 'مضختان تشغيل / احتياط مع خزان ضغط ولوحة تحكم.'] },
  { service: 'building-maintenance', ph: 'spark', img: '', title: ['Villa repaint & renovation', 'دهان وتجديد فيلا'], place: ['Villa · Al Gharrafa', 'فيلا · الغرافة'], text: ['Exterior repaint, plumbing repairs and new lighting.', 'دهان خارجي وإصلاحات سباكة وإضاءة جديدة.'] },
];

// Display order, as given by the client.
const ORDER = ['central-water-heaters', 'water-cooling-system', 'epoxy-zigzag-flooring', 'interior-decoration', 'automatic-water-pump-system', 'building-maintenance'];
services.sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));

// Stock photos (Unsplash licence) used until the client's own job photos arrive.
const photos = {
  hero: '/assets/img/photos/interior-living.jpg',
  interior: '/assets/img/photos/interior-lounge.jpg',
  zigzag: '/assets/img/photos/zigzag-floor.jpg',
  epoxyInstall: '/assets/img/photos/epoxy-install.jpg',
};

module.exports = { photos, site, areas, process, why, services, categories, products, projects };
