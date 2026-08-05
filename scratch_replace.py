import re

with open('c:\\xampp\\htdocs\\GYM\\screens\\DashboardScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import NutritionWidget from '../components/NutritionWidget';",
    "import NutritionWidget from '../components/NutritionWidget';\nimport OfflineSyncBanner from '../components/OfflineSyncBanner';\nimport CustomRoutinesWidget from '../components/CustomRoutinesWidget';\nimport CommunitySocialFeedWidget from '../components/CommunitySocialFeedWidget';\nimport LeaderboardPreviewWidget from '../components/LeaderboardPreviewWidget';"
)

# 2. State
content = content.replace(
    "const [customRoutines, setCustomRoutines] = useState([]);\n  const [leaderboardData, setLeaderboardData] = useState([]);",
    "const [leaderboardData, setLeaderboardData] = useState([]);"
)

# 3. Logic: from "// Offline / Online Connectivity & Sync State" to "const fetchDashboardData = async () => {"
match = re.search(r'// Offline / Online Connectivity & Sync State.*?const fetchDashboardData = async \(\) => \{', content, re.DOTALL)
if match:
    replacement = """useEffect(() => {
    if (session?.user?.id) fetchDashboardData();

    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('activity_logged', () => {
      if (session?.user?.id) fetchDashboardData();
    });
    return () => sub.remove();
  }, [session, dbReady]);

  const fetchDashboardData = async () => {"""
    content = content.replace(match.group(0), replacement)
else:
    print("Could not find Logic block")

# 4. OfflineSync UI
match = re.search(r'\{\/\* Connection & Offline Sync Status Banner \*\/\}.*?\{\/\* DB Warning Banner \*\/\}', content, re.DOTALL)
if match:
    content = content.replace(match.group(0), "<OfflineSyncBanner session={session} onSyncComplete={fetchDashboardData} />\n\n        {/* DB Warning Banner */}")
else:
    print("Could not find OfflineSync UI block")

# 5. LeaderboardPreview UI
match = re.search(r'\{\/\* ═══ LEADERBOARD PREVIEW WIDGET ═══ \*\/\}.*?\{\/\* ═══ STATS OVERVIEW ═══ \*\/\}', content, re.DOTALL)
if match:
    content = content.replace(match.group(0), "<LeaderboardPreviewWidget leaderboardData={leaderboardData} onShowLeaderboard={() => setShowLeaderboard(true)} />\n\n        {/* ═══ STATS OVERVIEW ═══ */}")
else:
    print("Could not find LeaderboardPreview UI block")

# 6. Community Feed UI
match = re.search(r'\{\/\* ═══ COMMUNITY SOCIAL FEED ═══ \*\/\}.*?\{\/\* ═══ CUSTOM ROUTINES ═══ \*\/\}', content, re.DOTALL)
if match:
    content = content.replace(match.group(0), "<CommunitySocialFeedWidget leaderboardData={leaderboardData} />\n\n        {/* ═══ CUSTOM ROUTINES ═══ */}")
else:
    print("Could not find Community Feed UI block")

# 7. Custom Routines UI
match = re.search(r'\{\/\* ═══ CUSTOM ROUTINES ═══ \*\/\}.*?\{\/\* Floating AI Coach Chat Bubble \*\/\}', content, re.DOTALL)
if match:
    content = content.replace(match.group(0), "<CustomRoutinesWidget session={session} dbReady={dbReady} onStartRoutine={onStartRoutine} />\n\n      </MotiView>\n\n\n      </SmoothScrollView>\n\n      {/* Floating AI Coach Chat Bubble */}")
else:
    print("Could not find Custom Routines UI block")

with open('c:\\xampp\\htdocs\\GYM\\screens\\DashboardScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing.")
