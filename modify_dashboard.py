import re
import sys

def main():
    try:
        with open('screens/DashboardScreen.js', 'r', encoding='utf-8') as f:
            code = f.read()

        # 1. Add imports
        code = code.replace(
            "import DummyAdBanner from '../components/DummyAdBanner';",
            "import DummyAdBanner from '../components/DummyAdBanner';\nimport WaterTrackerWidget from '../components/WaterTrackerWidget';\nimport NeuroGameWidget from '../components/NeuroGameWidget';"
        )

        # 2. State replacements
        code = re.sub(
            r'// Neuro Reaction Game State.*?const \[reactionProgress, setReactionProgress\] = useState\(0\);',
            'const [showReactionGame, setShowReactionGame] = useState(false);',
            code,
            flags=re.DOTALL
        )

        code = re.sub(
            r'const \[waterMl, setWaterMl\] = useState\(0\);\n\s*',
            '',
            code
        )
        
        code = re.sub(
            r'const \[showWaterInput, setShowWaterInput\] = useState\(false\);\n\s*const \[customWaterMl, setCustomWaterMl\] = useState\(\'\'\);\n',
            '',
            code
        )

        # 3. Remove water fetching in fetchDashboardData
        code = re.sub(
            r'\s*// Fetch Water.*?// Fetch Macro Target',
            '\n      // Fetch Macro Target',
            code,
            flags=re.DOTALL
        )

        # 4. Remove timer effect
        code = re.sub(
            r'\s*// Animations refactored to MotiView\n\s*useEffect\(\(\) => \{\n\s*return \(\) => \{\n\s*if \(reactionTimer\) clearTimeout\(reactionTimer\);\n\s*\};\n\s*\}, \[reactionTimer\]\);\n',
            '',
            code
        )

        # 5. Remove addWater
        code = re.sub(
            r'\s*const addWater = async \(amount\) => \{.*?DeviceEventEmitter\.emit\(\'activity_logged\'\);\n\s*\};\n',
            '',
            code,
            flags=re.DOTALL
        )

        # 6. Replace Neuro Tap Game Logic
        code = re.sub(
            r'\s*// Neuro Tap Game Logic.*?setShowReactionGame\(false\);\n\s*setReactionGameState\(\'idle\'\);\n\s*\};',
            '\n  const applyReactionResult = (score) => {\n    setSleep(score);\n    setSoreness(score);\n    setEnergy(score);\n    setShowReactionGame(false);\n  };\n',
            code,
            flags=re.DOTALL
        )

        with open('screens/DashboardScreen.js', 'w', encoding='utf-8') as f:
            f.write(code)

        print("Replacements done successfully.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
