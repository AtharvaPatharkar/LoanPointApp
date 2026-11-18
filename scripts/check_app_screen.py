with open('src/components/screens/ApplicationsScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

print('Has stageIndex:', 'const stageIndex = getStageIndex(app);' in text)
print('Has chevron-forward:', 'name="chevron-forward" size={18}' in text)
print('Has MILESTONES:', 'const MILESTONES' in text)
