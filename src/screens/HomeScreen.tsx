import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Input } from '../components';
import { useTheme } from '../theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { padding: theme.spacing.lg, gap: theme.spacing.lg },
      ]}
    >
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamily.rounded.extrabold,
          fontSize: theme.fontSize.xxl,
        }}
      >
        Havn
      </Text>

      <Card style={{ gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.rounded.semibold,
            fontSize: theme.fontSize.sm,
          }}
        >
          Saldo total
        </Text>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.tabular.bold,
            fontSize: theme.fontSize.xxl,
          }}
        >
          R$ 4.582,10
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Badge label="+ R$ 320,00" variant="success" />
          <Badge label="Âncoras" variant="accent" />
        </View>
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <Button label="Nova transação" variant="primary" onPress={() => {}} />
        <Button label="Nova âncora" variant="accent" onPress={() => {}} />
        <Button label="Ver relatório" variant="outline" onPress={() => {}} />
      </View>

      <Input label="Descrição" placeholder="Ex: Mercado" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});
