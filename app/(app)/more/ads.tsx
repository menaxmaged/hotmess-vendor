import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AdsScreen() {
  return (
    <PlaceholderScreen
      icon="megaphone.fill"
      title="Sponsored Ads"
      description="Buy placements to appear more prominently in the bride's experience. Sold directly by Hot Mess."
      bullets={[
        'Placements — Home banner, Community top/feed, Explore top, Task priority, Push campaign',
        'Campaign builder — pick placement, set details, upload creative, review & pay',
        'Campaigns go live immediately after payment — no admin review required',
        'Manage — edit, pause, or delete a running campaign',
      ]}
    />
  );
}
