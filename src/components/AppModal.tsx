import type { PropsWithChildren } from 'react';
import { Modal, View } from 'react-native';

import { useTheme } from '../theme';

export interface AppModalProps extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
}

export function AppModal({ visible, onRequestClose, children }: AppModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onRequestClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.overlay,
        }}
      >
        {children}
      </View>
    </Modal>
  );
}
