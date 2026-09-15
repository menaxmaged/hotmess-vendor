import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useAuth } from '@/Modules/auth/context';
import { PasswordResetFlow } from '@/Modules/auth/components/PasswordResetFlow';

// The API has no authenticated change-password route — this is the emailed
// reset flow with the account's own address locked in.
export default function ChangePasswordScreen() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation(['more', 'common']);

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ gap: 16, padding: 16 }}
      bottomOffset={24}>
      <PasswordResetFlow
        initialEmail={user?.email ?? ''}
        lockEmail
        intro={t('changePassword.intro')}
        onDone={() =>
          Alert.alert(t('changePassword.doneTitle'), t('changePassword.doneBody'), [
            { text: t('common:actions.ok'), onPress: signOut },
          ])
        }
      />
    </KeyboardAwareScrollView>
  );
}
