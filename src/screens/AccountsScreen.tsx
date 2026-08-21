import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Modal, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Input } from '../components';
import {
  type Account,
  type AccountType,
  type AccountWithBalance,
  createAccount,
  findAllAccountsWithBalance,
  removeAccount,
  updateAccount,
} from '../lib/db';
import { useTheme } from '../theme';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit', label: 'Cartão de crédito' },
];

function accountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPES.find((option) => option.value === type)?.label ?? type;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AccountsScreen() {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');

  const loadAccounts = useCallback(async () => {
    setAccounts(await findAllAccountsWithBalance());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts]),
  );

  function openCreateModal() {
    setEditingAccount(null);
    setName('');
    setType('checking');
    setBalance('');
    setModalVisible(true);
  }

  function openEditModal(account: Account) {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setBalance(String(account.balance));
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    const parsedBalance = Number(balance.replace(',', '.')) || 0;

    if (editingAccount) {
      await updateAccount(editingAccount.id, { name: name.trim(), type, balance: parsedBalance });
    } else {
      await createAccount({ name: name.trim(), type, balance: parsedBalance });
    }

    setModalVisible(false);
    await loadAccounts();
  }

  function handleDelete(account: Account) {
    Alert.alert('Excluir conta', `Deseja excluir "${account.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await removeAccount(account.id);
          await loadAccounts();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListHeaderComponent={
          <Button label="Nova conta" variant="primary" onPress={openCreateModal} />
        }
        ListHeaderComponentStyle={{ marginBottom: theme.spacing.md }}
        ListEmptyComponent={
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.rounded.regular,
              fontSize: theme.fontSize.sm,
              textAlign: 'center',
            }}
          >
            Nenhuma conta cadastrada.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.md,
                }}
              >
                {item.name}
              </Text>
              <Badge label={accountTypeLabel(item.type)} variant="neutral" />
            </View>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.fontFamily.tabular.bold,
                fontSize: theme.fontSize.xl,
              }}
            >
              {formatCurrency(item.currentBalance)}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button label="Editar" variant="outline" onPress={() => openEditModal(item)} />
              <Button label="Excluir" variant="outline" onPress={() => handleDelete(item)} />
            </View>
          </Card>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={{ gap: theme.spacing.md }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.fontFamily.rounded.bold,
                fontSize: theme.fontSize.lg,
              }}
            >
              {editingAccount ? 'Editar conta' : 'Nova conta'}
            </Text>

            <Input label="Nome" placeholder="Ex: Nubank" value={name} onChangeText={setName} />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {ACCOUNT_TYPES.map((option) => (
                <Button
                  key={option.value}
                  label={option.label}
                  variant={type === option.value ? 'primary' : 'outline'}
                  onPress={() => setType(option.value)}
                />
              ))}
            </View>

            <Input
              label="Saldo inicial"
              placeholder="0,00"
              keyboardType="numeric"
              value={balance}
              onChangeText={setBalance}
            />

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button label="Cancelar" variant="outline" onPress={() => setModalVisible(false)} />
              <Button label="Salvar" variant="primary" onPress={handleSave} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
