import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AutoAssignScreen() {
  return (
    <PlaceholderScreen
      icon="arrow.right.circle.fill"
      title="Auto-Assign Rules"
      description="Automatically route a chat to a team member when its status changes. Premium feature."
      bullets={[
        'Trigger — status becomes X (any of the 15 lead statuses)',
        'Action — assign to a chosen team member',
        'Rules can be toggled on/off without deleting them',
        'Each rule shows a "fired X times this month" count',
        'Multiple rules can fire on the same chat as its status changes',
      ]}
    />
  );
}
