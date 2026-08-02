const fs = require('fs');

let content = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

// 1. Trophy Cabinet
content = content.replace(
  />TROPHY CABINET<\/AppText>/g,
  `>{t('trophy_cabinet')}</AppText>`
);
content = content.replace(
  />Consistency King<\/AppText>/g,
  `>{t('trophy_consistency')}</AppText>`
);
content = content.replace(
  />10\+ Workouts<\/AppText>/g,
  `>{t('trophy_consistency_desc')}</AppText>`
);
content = content.replace(
  />The Elephant<\/AppText>/g,
  `>{t('trophy_elephant')}</AppText>`
);
content = content.replace(
  />Lift 10,000kg\+<\/AppText>/g,
  `>{t('trophy_elephant_desc')}</AppText>`
);
content = content.replace(
  />Night Owl<\/AppText>/g,
  `>{t('trophy_owl')}</AppText>`
);
content = content.replace(
  />First Workout<\/AppText>/g,
  `>{t('trophy_owl_desc')}</AppText>`
);

// 2. History section
content = content.replace(
  /\{language === 'id' \? 'Riwayat Latihan' : 'Workout History'\}/g,
  `{t('history_title')}`
);
content = content.replace(
  /\{language === 'id' \? 'Lihat semua sesi latihan Anda' : 'View all your past sessions'\}/g,
  `{t('history_desc')}`
);

// 3. Language Toast
content = content.replace(
  /showToast\('success', language === 'id' \? \`Bahasa diubah ke \$\{l\.label\}\` : \`Language changed to \$\{l\.label\}\`\);/g,
  `showToast('success', \`\${t('toast_lang_changed')} \${l.label}\`);`
);

// 4. Share to Socials
content = content.replace(
  /<AppText weight="bold" style=\{\{ fontSize: 18, color: textColor \}\}>Share to Socials<\/AppText>/g,
  `<AppText weight="bold" style={{ fontSize: 18, color: textColor }}>{t('share_to_socials')}</AppText>`
);

// 5. Add new languages to array
const langArray = `
            {[
              { code: 'en', label: 'English (US)', flag: '🇺🇸' },
              { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
              { code: 'es', label: 'Español', flag: '🇪🇸' },
              { code: 'fr', label: 'Français', flag: '🇫🇷' },
              { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
              { code: 'it', label: 'Italiano', flag: '🇮🇹' },
              { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
              { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
              { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
            ].map(l => (
`;

// we need to replace the old array mapping
const oldLangArrayRegex = /\{\[\s*\{ code: 'en'[\s\S]*?\]\.map\(l => \(/;
content = content.replace(oldLangArrayRegex, langArray.trim());

fs.writeFileSync('screens/ProfileScreen.js', content);
console.log('Language sync complete.');
