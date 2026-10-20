const bn = {
  "app.title": "ScamShield AI 2.0",
  "app.tagline": "শুধু প্রতারণা ধরবেন না, প্রমাণ তদন্ত করুন।",
  "ui.language": "ভাষা",

  "input.title": "সর্বজনীন ইনপুট",
  "input.placeholder":
    "সন্দেহজনক SMS, হোয়াটসঅ্যাপ বার্তা, ইমেল, লিংক বা ফোন নম্বর (+91) পেস্ট করুন। এখান থেকে কিছুই বাইরে যায় না; বিশ্লেষণ স্থানীয়ভাবে হয়।",
  "input.counter": "{count}/10000 অক্ষর।",
  "input.privacy": "আপনার লেখা ও ছবি কেবল স্থানীয় বিশ্লেষণ সেবায় যায়; সংরক্ষিত বা লগ হয় না।",
  "input.supported":
    "এখানে সমর্থিত: পেস্ট করা লেখা বা লিংক, ফোন নম্বর (+91), বা 2 MB পর্যন্ত PNG/JPEG স্ক্রিনশট (QR পেলোড ও দৃশ্যমান লেখা স্থানীয়ভাবে বিশ্লিষ্ট হয়)।",
  "input.attach": "ছবি যোগ করুন",
  "input.dropzone": "PNG/JPEG স্ক্রিনশট এখানে ছাড়ুন, বা নিচের বোতামে বাছুন।",
  "input.imageAlt": "বিশ্লেষণের জন্য সংযুক্ত স্ক্রিনশট",
  "input.remove": "ছবি সরান",
  "input.analyze": "বিশ্লেষণ করুন",
  "input.analyzing": "বিশ্লেষণ চলছে…",
  "input.clear": "মুছুন",
  "input.detected": "শনাক্ত ইনপুট: {type}",
  "input.error.read": "ফাইলটি পড়া যায়নি।",
  "input.error.oversize": "ছবি 2 MB সীমার চেয়ে বড়; ছোট স্ক্রিনশট বাছুন।",
  "input.invalidImage": "এই ফাইলটি বৈধ PNG বা JPEG ছবি নয়; কিছুই পাঠানো হয়নি।",
  "input.unsupportedFile":
    "এই ধরনের ফাইল এই অফলাইন বিল্ডে সমর্থিত নয় (অডিও, ভিডিও ইত্যাদির কোনো স্থানীয় বিশ্লেষণ ইঞ্জিন নেই)। কিছুই পাঠানো হয়নি।",

  "history.title": "কেস ইতিহাস",
  "history.clear": "সব মুছুন",
  "history.delete": "মুছুন",
  "history.empty":
    "বিশ্লিষ্ট কেসগুলো এখানে দেখা যাবে; সংরক্ষণ কেবল এই ব্রাউজারে। অন্য কোথাও কিছুই আপলোড হয় না।",
  "history.entry.pasted": "বার্তা / লিংক",
  "history.entry.image": "স্ক্রিনশট / QR",
  "history.entry.phone": "ফোন নম্বর",

  "verdict.highly_suspicious": "অত্যন্ত সন্দেহজনক",
  "verdict.suspicious": "সন্দেহজনক",
  "verdict.no_strong_warning_signs_found": "কোনো জোরালো সতর্কতা-সংকেত পাওয়া যায়নি",
  "verdict.unable_to_determine": "নির্ধারণ করা গেল না",
  "status.rule_match": "নিয়ম-মিল",
  "status.observed": "পর্যবেক্ষিত",
  "status.unverified": "অযাচাইকৃত",
  "status.check_failed": "যাচাই ব্যর্থ",
  "status.not_applicable": "প্রযোজ্য নয়",
  "source.submitted_input": "ইনপুট",
  "source.local_rule": "স্থানীয় নিয়ম",
  "source.external_intel": "বাহ্যিক তথ্য",
  "inputType.text": "বার্তা / লেখা",
  "inputType.url": "লিংক",
  "inputType.phone_number": "ফোন নম্বর",
  "inputType.image": "স্ক্রিনশট / ছবি",

  "category.bank_kyc_impersonation": "ব্যাংক KYC ভান",
  "category.account_suspension": "অ্যাকাউন্ট স্থগিতের হুমকি",
  "category.upi_collect_request": "UPI কালেক্ট রিকোয়েস্ট",
  "category.upi_pin_request": "UPI PIN-এর চাহিদা",
  "category.otp_credential_theft": "OTP লুণ্ঠন",
  "category.digital_arrest": "ডিজিটাল অ্যারেস্ট",
  "category.fake_job_task": "জাল চাকরি/টাস্ক",
  "category.investment_trading": "ইনভেস্টমেন্ট/ট্রেডিং খোঁচা",
  "category.fake_loan": "জাল ঋণ",
  "category.electricity_disconnection": "বিদ্যুৎ বিচ্ছিন্নকরণ",
  "category.malicious_apk": "ক্ষতিকর APK",
  "category.sextortion": "সেক্সটরশন",
  "category.url_anomaly": "URL অসঙ্গতি",
  "category.urgency_pressure": "জরুরি চাপ",
  "category.other": "অন্যান্য",

  "verdictreason.strong": "জোরালো প্রতারণা-সংকেত মিলেছে: {ids}।",
  "verdictreason.failed": "এক বা একাধিক যাচাই সম্পন্ন হয়নি, ফলে বিশ্লেষণ অসম্পূর্ণ।",
  "verdictreason.indiaMedium": "ভারত-বিশিষ্ট প্রতারণা প্যাটার্ন মিলেছে: {ids}।",
  "verdictreason.urlAnomalies": "{n}টি পৃথক URL অসঙ্গতি পাওয়া গেছে: {ids}।",
  "verdictreason.textSignals": "{n}টি পৃথক সহায়ক সংকেত পাওয়া গেছে: {ids}।",
  "verdictreason.weak": "শুধু দুর্বল, পরিণামঠিক নয় এমন সংকেত মিলেছে: {ids}।",
  "verdictreason.none": "কোনো নিয়মেই প্রতারণা-সংকেত মেলেনি।",

  "verdictdesc.highly_suspicious.headline": "জোরালো প্রতারণা-সংকেত পাওয়া গেছে",
  "verdictdesc.highly_suspicious.summary":
    "এই জমায় প্রতারণায় সাধারণত ব্যবহৃত এক বা একাধিক জোরালো সংকেত মিলেছে। আধিকারিক পথে যাচাইয়ের আগে প্রতারণামূলক ভাবুন।",
  "verdictdesc.suspicious.headline": "সতর্কতা-সংকেত পাওয়া গেছে",
  "verdictdesc.suspicious.summary":
    "এই জমায় পরিচিত প্রতারণা প্যাটার্নের সঙ্গে মেলে এমন সতর্কতা-সংকেত আছে। পদক্ষেপের আগে স্বতন্ত্রভাবে যাচাই করুন।",
  "verdictdesc.no_strong_warning_signs_found.headline": "কোনো জোরালো সতর্কতা-সংকেত পাওয়া যায়নি",
  "verdictdesc.no_strong_warning_signs_found.summary":
    "যাচাইয়ে জোরালো কোনো সতর্কতা-সংকেত মেলেনি। তাতে নিরাপদ প্রমাণ হয় না: প্রতারণা বদলে চলে ও কোনো তালিকা নিখুঁত নয়। সন্দেহ হলে আধিকারিক পথে যাচাই করুন।",
  "verdictdesc.unable_to_determine.headline": "নির্ধারণ করা গেল না",
  "verdictdesc.unable_to_determine.summary":
    "এক বা একাধিক যাচাই সম্পন্ন হয়নি, ফলে প্রমাণ অসম্পূর্ণ। ফৈসলা কেবল যা পরীক্ষা হয় তা-ই প্রতিফলিত করে।",

  "explain.untrustedEvidence": "উদ্ধৃত লেখা অযাচাইকৃত ইনপুট, প্রমাণিত তথ্য নয়",
  "actions.default.highly_suspicious": "টাকা দেওয়া, কোড ভাগ করা বা লিংকে ক্লিক করবেন না।",
  "actions.default.suspicious": "যাচাই না হওয়া পর্যন্ত এই বার্তায় পদক্ষেপ করবেন না।",
  "actions.default.no_strong_warning_signs_found":
    "সতর্ক থাকুন; প্রত্যাশিত বাইরের চাওয়া আধিকারিক পথে যাচাই করুন।",
  "actions.default.unable_to_determine":
    "আধিকারিক পথে নিজে যাচাই করুন; স্বয়ংক্রিয় বিশ্লেষণ অসম্পূর্ণ।",
  "reporting.indiaGuidance":
    "ভারতে সন্দেহজনক প্রতারণা রিপোর্ট করুন ন্যাশনাল সাইবার ক্রাইম রিপোর্টিং পোর্টালে (cybercrime.gov.in) বা সাইবার হেল্পলাইন 1930-এ। অর্থ সংক্রান্ত প্রতারণায় সঙ্গে-সঙ্গে ব্যাংককেও জানান।",

  "findings.title": "সাক্ষ্যের ফলাফল",
  "findings.empty":
    "বর্তমান নিয়মসেটে কোনো সংকেত মেলেনি। এর অর্থ বার্তাটি নিরাপদ — এমন প্রমাণ নয়।",
  "findings.supporting": "সহায়ক প্রমাণ",
  "findings.limitation": "সীমাবদ্ধতা:",
  "findings.action": "এটি করুন:",
  "i18n.fallbackEnglish": "(ইংরেজি — অনুবাদ নেই)",

  "summary.type": "ধরন:",
  "summary.findings": "{n}টি ফল",
  "summary.sha256": "sha256:",
  "unverified.title": "যা যাচাই করা যায়নি",
  "unverified.empty": "এই সরঞ্জামের প্রতিটি যাচাই সম্পন্ন; বাকি কিছু নেই।",
  "actions.title": "প্রস্তাবিত পরবর্তী পদক্ষেপ",
  "casefile.copy": "কেস JSON কপি করুন",
  "casefile.download": "কেস JSON ডাউনলোড করুন",
  "case.disclaimer":
    "এই রিপোর্টে স্থানীয় নিয়মে মিলে যাওয়া সংকেতগুলোর তালিকা আছে। বার্তাটি প্রতারণামূলক — এর প্রমাণ এটি নয়; সংকেত না থাকা বার্তা নিরাপদ — এরও প্রমাণ নয়। সর্বদা আধিকারিক, স্বতন্ত্র পথে যাচাই করুন।",
  "notes.dynamicEnglish":
    "ফলাফলের বিবরণ অনুবাদ থাকলে নির্বাচিত ভাষায় দেখায়; না থাকলে সেই ক্ষেত্রগুলো ইংরেজিতে থাকে।",
  "skeleton.loading": "এখানেই স্থানীয়ভাবে বিশ্লেষণ চলছে…",
  "errors.network":
    "বিশ্লেষণ সেবায় পৌঁছানো যায়নি। ব্যাকএন্ড 8765 পোর্টে চলছে কিনা দেখুন।",
  "errors.nothing": "বিশ্লেষণের কিছু নেই। বার্তা পেস্ট করুন বা স্ক্রিনশট যোগ করুন।",
  "errors.status": "অনুরোধ ব্যর্থ, স্ট্যাটাস {status}।",

  "rule.IN-SECRET-001.title.otp": "OTP বা গোপন তথ্য জমা/ভাগের চাহিদা",
  "rule.IN-SECRET-001.title.pin": "UPI PIN জমা/ভাগের চাহিদা",
  "rule.IN-SECRET-001.limitation": "এটি কেবল লেখা-প্যাটার্নের মিল; প্রেরকের পরিচয় নিশ্চিত করে না।",
  "rule.IN-SECRET-001.action":
    "টাকা পাওয়ার জন্য কখনোই UPI PIN লিখবেন না। অনুরোধ প্রত্যাখ্যান করুন এবং ব্যাংকের আধিকারিক চ্যানেলে যাচাই করুন।",
  "rule.IN-KYC-001.title": "KYC আপডেট বা মেয়াদের দাবি",
  "rule.IN-KYC-001.limitation": "ব্যাংক প্রকৃত KYC তাগাদও পাঠায়; নিয়মটি কেবল প্যাটার্ন নির্দেশ করে, প্রেরকে নয়।",
  "rule.IN-KYC-001.action":
    "বার্তার লিংক ব্যবহার করবেন না। ব্যাংকের আধিকারিক অ্যাপ খুলুন বা শাখায় গিয়ে KYC স্ট্যাটাস দেখুন।",
  "rule.IN-SUSPEND-001.title": "অ্যাকাউন্ট/সেবা স্থগিতের হুমকি",
  "rule.IN-SUSPEND-001.action":
    "ব্যাংক/সেবাদাতার অ্যাপ-সূত্রে দেওয়া নম্বরে ফোন করুন, বার্তার নম্বরে নয়।",
  "rule.IN-COLLECT-001.title": "UPI কালেক্ট বা পেমেন্ট রিকোয়েস্টের বর্ণনা",
  "rule.IN-COLLECT-001.limitation":
    "টাকা পেতে কালেক্ট রিকোয়েস্ট কখনো অনুমোদন করবেন না; অনুমোদনে আপনার অ্যাকাউন্ট থেকেই টাকা বেরোয়।",
  "rule.IN-COLLECT-001.action": "অপরিচিত পক্ষের UPI কালেক্ট রিকোয়েস্ট অনুমোদন করবেন না।",
  "rule.IN-ARREST-001.title": "পুলিশ বা 'ডিজিটাল অ্যারেস্ট' চাপ",
  "rule.IN-ARREST-001.limitation": "পুলিশ ও সংস্থারা টাকা চেয়ে কল-চ্যাটে তদন্ত করে না।",
  "rule.IN-ARREST-001.action":
    "টাকা দেবেন না। সংশ্লিষ্ট দপ্তর বা সাইবার হেল্পলাইন 1930-এ যোগাযোগ করে যাচাই করুন।",
  "rule.IN-JOB-001.title": "ঘরে বসে কাজ বা টাস্ক-ভিত্তিক চাকরির প্রস্তাব",
  "rule.IN-JOB-001.action":
    "প্রকৃত নিয়োগকর্তা রেজিস্ট্রেশন/নিরাপত্তা ফি চান না। চাকরি পেতে টাকা দেবেন না।",
  "rule.IN-INVEST-001.title": "ইনভেস্টমেন্ট বা ট্রেডিং রিটার্নের দাবি",
  "rule.IN-INVEST-001.limitation":
    "গ্যারান্টিড বা অস্বাভাবিক উঁচু রিটার্ন ইনভেস্টমেন্ট প্রতারণার পরিচয়; প্রকৃত বাজার রিটার্নের গ্যারান্টি দেয় না।",
  "rule.IN-INVEST-001.action": "টাকা লাগানোর আগে উপদেষ্টার SEBI নিবন্ধন যাচাই করুন।",
  "rule.IN-LOAN-001.title": "আগাম-ফি ঋণের প্রস্তাব",
  "rule.IN-LOAN-001.action":
    "প্রকৃত ঋণদাতা ব্যক্তিগত লিংক বা চ্যাট অ্যাপে আগাম ফি চান না।",
  "rule.IN-ELEC-001.title": "বিদ্যুৎ বিচ্ছিন্নকরণের হুমকি",
  "rule.IN-ELEC-001.action": "বিল দিন শুধু আপনার আধিকারিক বিদ্যুৎ বোর্ড অ্যাপ বা ওয়েবসাইটে।",
  "rule.IN-APK-001.title": "APK ফাইল বা অ্যাপ-ইনস্টলের অনুরোধ",
  "rule.IN-APK-001.limitation":
    "প্লে স্টোরের বাইরে ইনস্টল হওয়া APK ক্ষতিকর হতে পারে; নিয়মটি ফাইল নিজে বিশ্লেষণ করে না।",
  "rule.IN-APK-001.action":
    "চ্যাটে পাওয়া APK ইনস্টল করবেন না। অ্যাপ শুধু আধিকারিক স্টোর থেকে নিন।",
  "rule.IN-SEXTORT-001.title": "সেক্সটরশন বা ব্ল্যাকমেইলের কৌশল",
  "rule.IN-SEXTORT-001.action":
    "টাকা দেবেন না। প্রমাণ রেখে সাইবার হেল্পলাইন 1930 বা cybercrime.gov.in-এ রিপোর্ট করুন।",
  "rule.IN-QR-UPI-001.title": "UPI পেমেন্ট QR পেলোড (upi://)",
  "rule.IN-QR-UPI-001.limitation":
    "নিজে শুরু করা পেমেন্টের জন্য UPI QR বৈধ; প্রতারকরাও টাকা তোলার প্রবাহের জন্য QR পাঠায়।",
  "rule.IN-QR-UPI-001.action":
    "QR স্ক্যান করুন কেবল ব্যাংক অ্যাপের নিজস্ব স্ক্যানার দিয়ে, কেবল নিজের শুরু করা পেমেন্টের জন্য। বার্তায় পাঠানো QR স্ক্যান করবেন না।",
  "rule.IN-IMG-NO-CONTENT-001.title": "ছবিতে বিশ্লেষণযোগ্য কিছু পাওয়া যায়নি",
  "rule.IN-IMG-NO-CONTENT-001.limitation":
    "ছবিতে কোনো QR প্রতীক বা স্থানীয় OCR-এ পাঠযোগ্য লেখা (কেবল লাতিন) ছিল না। সেজন্য কিছুই বিশ্লেষণ করা যায়নি।",
  "rule.IN-PHONE-FMT-001.title.valid": "ভারতীয় মোবাইল নম্বর যাচাই হয়েছে (কেবল কাঠামো)",
  "rule.IN-PHONE-FMT-001.title.invalid": "নম্বর-সদৃশ জমা ভারতীয় মোবাইল কাঠামোয় মেলে না",
  "rule.IN-PHONE-FMT-001.limitation.valid":
    "স্থানীয়ভাবে কেবল কাঠামো যাচাই হয়েছে (6-9 দিয়ে 10 ডিজিট, ঐচ্ছিক +91/0091/0)। নম্বরের খ্যাতি যাচাই করা যায়নি: এই অফলাইন বিল্ডে কোনো ফোন-খ্যাতি উৎস নেই। বৈধ কাঠামো বিশ্বস্ততার প্রমাণ নয়; অপরিচিত নম্বরকে দোষী সাব্যস্ত করা হয়নি।",
  "rule.IN-PHONE-FMT-001.limitation.invalid":
    "জমা নম্বরের মতো দেখালেও ভারতীয় মোবাইল কাঠামোয় মেলে না (6-9 দিয়ে 10 ডিজিট, ঐচ্ছিক +91/0091/0)। নম্বরের খ্যাতি যাচাই করা যায়নি: এই অফলাইন বিল্ডে কোনো ফোন-খ্যাতি উৎস নেই।",
  "rule.IN-PHONE-FMT-001.action.valid":
    "কাঠামো বৈধ হলেও সাবধান থাকুন। প্রতিষ্ঠানের ওয়েবসাইটে প্রকাশিত নম্বরে ফোন করুন। সন্দেহজনক প্রতারণা জানান cybercrime.gov.in বা 1930-এ।",
  "rule.IN-PHONE-FMT-001.action.invalid":
    "জমাটি যাচাইহীন যোগাযোগ-তথ্য ভাবুন। ফোন নম্বর হলে কল বা ভরসার আগে উৎস পরীক্ষা করুন।",
  "rule.QR-IMG-001.title.decoded": "QR ছবি জমা হয়েছে; পেলোড ডিকোড হয়েছে",
  "rule.QR-IMG-001.title.noSymbol": "QR ছবি জমা হয়েছে; কোনো QR প্রতীক পাওয়া যায়নি",
  "rule.QR-IMG-001.title.failed": "QR চিত্র ডিকোড করা যায়নি",
  "rule.QR-IMG-001.limitation.decoded":
    "ডিকোড হওয়া লেখা প্রেরকের দেওয়া ছবি থেকে এসেছে; এর প্রামাণিকতা যাচাই করা হয়নি।",
  "rule.QR-IMG-001.limitation.noSymbol":
    "কোনো QR প্রতীক ধরা পড়েনি; ছবিতে সত্যিই QR আছে কিনা চোখে দেখে যাচাই করুন।",
  "rule.QR-IMG-001.limitation.failed":
    "স্থানীয় ডিকোডার এই ছবি পড়তে পারেনি; QR পেলোড বিশ্লিষ্ট হয়নি এবং ফৈসলা এই অসম্পূর্ণতা দেখায়।",
  "rule.URL-ERR-001.title": "URL পার্স করা গেল না",
  "rule.URL-IP-001.title": "URL ডোমেইনের বদলে কাঁচা IP ঠিকানা ব্যবহার করে",
  "rule.URL-SHORT-001.title": "URL লিংক-শর্টনার ব্যবহার করে",
  "rule.URL-TLD-001.title": "URL অতিরিক্ত অপব্যবহৃত TLD ব্যবহার করে",
  "rule.URL-USERINFO-001.title": "URL '@' তথ্য-টিকট দিয়ে প্রকৃত হোস্ট লুকায়",
  "rule.URL-HYPHEN-001.title": "URL হোস্টে অনেক হাইফেন আছে",
  "rule.URL-SUBDOMAIN-001.title": "URL-এ অস্বাভাবিক গভীর সাবডোমেইন শিকল আছে",
  "rule.URL-PUNYCODE-001.title": "URL হোস্ট পুনিকোড (আন্তর্জাতিক ডোমেইন) ব্যবহার করে",
  "rule.URL-KEYWORD-001.title": "URL-পথে সংবেদনশীল-কাজের কীওয়ার্ড আছে",
  "rule.URL-HTTP-001.title": "URL HTTPS ব্যবহার করছে না",
  "rule.TXT-URGENCY-001.title": "জরুরি বা চাপ সৃষ্টির ভাষা",
  "rule.TXT-THREAT-001.title": "হুমকি বা ভীতির ভাষা",
  "rule.TXT-MONEY-001.title": "পেমেন্ট বা টাকা-স্থানান্তরের নির্দেশনা",
  "rule.TXT-DATA-001.title": "সংবেদনশীল ব্যক্তিগত তথ্যের চাহিদা",
  "rule.TXT-SECRECY-001.title": "গোপনীয়তার অনুরোধ",
};

export default bn;
