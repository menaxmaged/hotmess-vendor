import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AutomationScreen() {
  return (
    <PlaceholderScreen
      icon="bolt.fill"
      title="Automation"
      description="Configure what happens the moment a bride sends her first message."
      bullets={[
        'Off — no auto-reply, manual response only (Free)',
        'Welcome only — greeting with merge fields like {bride_name}, {event}, {date} (Free max)',
        'Welcome + questions — up to 6 intake questions, draggable to reorder (Premium)',
        'Welcome + files — attaches a lookbook or deck (Premium)',
        'Full intake sequence — greeting + questions + files (Premium)',
      ]}
    />
  );
}
